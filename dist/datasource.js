'use strict';

System.register(['lodash'], function (_export, _context) {
    "use strict";

    var _, _createClass, requiredFields, ChronixDbDatasource;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function toTagQueryString(tag, tagName) {
        return tagName + ':(' + tag.join(' OR ') + ')';
    }

    function toTargetQueryString(target) {
        if (!target.tags || Object.keys(target.tags).length === 0) {
            // simple metric-only
            return target.metric;
        }

        // create strings for each tag
        var targetQueryStrings = _(target.tags).map(toTagQueryString);

        return '(' + target.metric + ' AND ' + targetQueryStrings.join(' AND ') + ')';
    }

    function toTargetJoinString(target) {
        if (!target.attributes || Object.keys(target.attributes).length === 0) {
            return "metric";
        }
        // create strings for each tag
        return _(target.attributes).join(',') + ",metric";
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            requiredFields = ["data", "start", "end", "_version_", "id", "metric"];

            _export('ChronixDbDatasource', ChronixDbDatasource = function () {
                function ChronixDbDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    _classCallCheck(this, ChronixDbDatasource);

                    this.type = instanceSettings.type;
                    this.url = instanceSettings.url;
                    this.name = instanceSettings.name;
                    this.q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                }

                // Called once per panel (graph)


                _createClass(ChronixDbDatasource, [{
                    key: 'query',
                    value: function query(options) {
                        // get the start and the end and multiply it with 1000 to get millis since 1970
                        var start = options.range.from.unix() * 1000;
                        var end = options.range.to.unix() * 1000;
                        var targets = options.targets;

                        return this.rawQuery(targets, start, end).then(this.extractTimeSeries);
                    }
                }, {
                    key: 'rawQuery',
                    value: function rawQuery(targets, start, end) {
                        // create strings for each target
                        var targetsQueryStrings = _(targets).map(toTargetQueryString);

                        var query = 'metric:(' + targetsQueryStrings.join(' OR ') + ')' + ' AND start:' + start + ' AND end:' + end;

                        var joinquery = _(targets).map(toTargetJoinString);

                        //At this point we have to query chronix
                        var RAW_QUERY_BASE = '/select?fl=dataAsJson&wt=json';
                        var RAW_QUERY_JOIN = '&fq=join=' + joinquery;
                        var RAW_QUERY_FILTER_FUNCTION = ''; //'&fq=function=vector:0.1';
                        var RAW_QUERY_BASE_WITH_FILTER = RAW_QUERY_BASE + RAW_QUERY_FILTER_FUNCTION + RAW_QUERY_JOIN + '&q=';

                        console.log("Query: " + RAW_QUERY_BASE_WITH_FILTER + query);

                        var options = {
                            method: 'GET',
                            url: this.url + RAW_QUERY_BASE_WITH_FILTER + query
                        };

                        return this.backendSrv.datasourceRequest(options).then(function (response) {
                            return [targets, response];
                        });
                    }
                }, {
                    key: 'extractTimeSeries',
                    value: function extractTimeSeries(targetsResponse) {
                        var response = targetsResponse[1];

                        if (response.data === undefined) {
                            return { data: [] };
                        }
                        var dataset = response.data.response.docs;

                        var tsPoints = {};

                        for (var i = 0; i < dataset.length; i++) {
                            var currentDataSet = dataset[i];
                            var currentMetric = currentDataSet.metric;

                            if (!(currentMetric in tsPoints)) {
                                tsPoints[currentMetric] = [];
                            }

                            var jsonData = JSON.parse(currentDataSet.dataAsJson);

                            var timestamps = jsonData[0];
                            var values = jsonData[1];

                            //add them
                            for (var j = 0; j < timestamps.length; j++) {
                                tsPoints[currentMetric].push([values[j], timestamps[j]]);
                            }
                        }

                        var ret = [];
                        for (var key in tsPoints) {
                            ret.push({ target: key, datapoints: tsPoints[key] });
                        }
                        return { data: ret };
                    }
                }, {
                    key: 'testDatasource',
                    value: function testDatasource() {
                        return this.backendSrv.datasourceRequest({
                            url: this.url + '/select?q=%7B!lucene%7D*%3A*&rows=0',
                            method: 'GET'
                        }).then(function (response) {
                            if (response.status === 200) {
                                return { status: "success", message: "Data source is working", title: "Success" };
                            }
                        });
                    }
                }, {
                    key: '_performMetricSuggestQuery',
                    value: function _performMetricSuggestQuery(metric) {
                        var options = {
                            //do a facet query
                            url: this.url + '/select?facet.field=metric&facet=on&q=metric:*&rows=0&wt=json',
                            method: 'GET'
                        };

                        return this.backendSrv.datasourceRequest(options).then(function (response) {
                            if (!response.data) {
                                return this.q.when([]);
                            }
                            var metrics = [];
                            _.each(response.data.results, function (r) {
                                if (r.indexOf(metric) >= 0) {
                                    metrics.push(r);
                                }
                            });
                            return metrics;
                        });
                    }
                }, {
                    key: 'suggestAttributes',
                    value: function suggestAttributes() {
                        var options = {
                            method: 'GET',
                            url: this.url + '/admin/luke?numTerms=0&wt=json'
                        };

                        return this.backendSrv.datasourceRequest(options).then(this.mapToTextValue);
                    }
                }, {
                    key: 'mapToTextValue',
                    value: function mapToTextValue(result) {
                        var fields = result.data.fields;

                        var stringFields = [];
                        //Iterate over the returned fields
                        for (var property in fields) {
                            if (fields.hasOwnProperty(property)) {
                                if (requiredFields.indexOf(property.toLowerCase()) == -1) {
                                    stringFields.push(property);
                                }
                            }
                        }
                        return _.map(stringFields, function (name) {
                            return { text: name };
                        });
                    }
                }, {
                    key: 'suggestAttributesValues',
                    value: function suggestAttributesValues(metric, attribute) {
                        console.log("Metric is " + metric + " Attribute is " + attribute);

                        var options = {
                            method: 'GET',
                            url: this.url + '/select?facet.field=' + attribute + '&facet=on&q=metric:' + metric + '&rows=0&wt=json'
                        };

                        return this.backendSrv.datasourceRequest(options).then(this.mapValueToText);
                    }
                }, {
                    key: 'mapValueToText',
                    value: function mapValueToText(result) {
                        console.log("Evaluating available attribute values.");

                        var fields = result.data.facet_counts.facet_fields;

                        var field;
                        //Iterate over the returned fields
                        for (var property in fields) {
                            if (fields.hasOwnProperty(property)) {
                                console.log("Field: " + property);
                                field = property;
                            }
                        }

                        var pairs = [];
                        var values = fields[field];

                        //Build pairs
                        for (var i = 0; i < values.length; i++) {
                            pairs.push([values[i], values[++i]]);
                        }

                        return _.map(pairs, function (pair) {
                            return { text: pair[0], value: pair[1] };
                        });
                    }
                }]);

                return ChronixDbDatasource;
            }());

            _export('ChronixDbDatasource', ChronixDbDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
