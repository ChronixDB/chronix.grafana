'use strict';

System.register(['lodash'], function (_export, _context) {
    "use strict";

    var _, _createClass, requiredFields, ChronixDbDatasource;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function escapeTag(name) {
        return name.indexOf('.') !== -1 ? '"' + name + '"' : name;
    }

    function toTagQueryString(tag, tagName) {
        return tagName + ':(' + tag.map(escapeTag).join(' OR ') + ')';
    }

    function toTargetQueryString(target) {
        if (!target.tags || Object.keys(target.tags).length === 0) {
            // simple name-only
            return target.name;
        }

        // create strings for each tag
        var targetQueryStrings = _(target.tags).map(toTagQueryString);

        return '(' + target.name + ' AND ' + targetQueryStrings.join(' AND ') + ')';
    }

    function toTargetJoinString(target) {
        if (!target.attributes || Object.keys(target.attributes).length === 0) {
            return "name";
        }
        // create strings for each tag
        return _(target.attributes).join(',') + ",name,type";
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

            requiredFields = ["data", "start", "end", "_version_", "id", "name", "type"];

            _export('ChronixDbDatasource', ChronixDbDatasource = function () {
                function ChronixDbDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    _classCallCheck(this, ChronixDbDatasource);

                    this.type = instanceSettings.type;
                    this.url = instanceSettings.url;
                    this.name = instanceSettings.name;
                    this.$q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                }

                //region Required Grafana Datasource methods

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
                    key: 'testDatasource',
                    value: function testDatasource() {
                        var options = {
                            url: this.url + '/select?q=%7B!lucene%7D*%3A*&rows=0',
                            method: 'GET'
                        };
                        var successMessage = {
                            status: "success",
                            message: "Connection to Chronix established",
                            title: "Success"
                        };
                        var errorMessage = this.$q.reject({
                            status: "error",
                            message: "Connection to Chronix failed",
                            title: "Error"
                        });

                        // perform the actual call...
                        return this.backendSrv.datasourceRequest(options)
                        // ... check if the response is technically successful ...
                        .then(function (response) {
                            return response && response.status === 200;
                        })
                        // ... and respond appropriately
                        .then(function (success) {
                            return success ? successMessage : errorMessage;
                        })
                        // ... and react appropriately, too, when the call somehow didn't work
                        .catch(function (error) {
                            return errorMessage;
                        });
                    }
                }, {
                    key: 'findTimeSeriesByNames',
                    value: function findTimeSeriesByNames(tsName) {
                        var emptyResult = this.$q.when([]);

                        if (!tsName || tsName === '*') {
                            // no "*" accepted from the user
                            return emptyResult;
                        }

                        if (tsName.indexOf('*') === -1) {
                            // append an "*" at the end if the user didn't already provide one
                            tsName = tsName + '*';
                        }

                        var options = {
                            //do a facet query
                            url: this.url + '/select?facet.field=name&facet=on&facet.mincount=1&q=name:' + tsName + '&rows=0&wt=json',
                            method: 'GET'
                        };

                        return this.backendSrv.datasourceRequest(options).then(function (response) {
                            return response && response.data && response.data.facet_counts && response.data.facet_counts.facet_fields && response.data.facet_counts.facet_fields.name;
                        }).then(function (nameFields) {
                            // somehow no valid response => empty array
                            if (!nameFields) {
                                console.log('could not find any matching time series for "' + tsName + '"');
                                return emptyResult;
                            }

                            // take only the names, not the counts
                            return nameFields.filter(function (unused, index) {
                                return index % 2 === 0;
                            })
                            // and provide them as objects with the "text" property
                            .map(function (text) {
                                return { text: text };
                            });
                        })
                        // if the request itself failed
                        .catch(function (error) {
                            return emptyResult;
                        });
                    }
                }, {
                    key: 'rawQuery',
                    value: function rawQuery(targets, start, end) {
                        // create strings for each target
                        var targetsQueryStrings = _(targets).map(toTargetQueryString);

                        var query = 'name:(' + targetsQueryStrings.join(' OR ') + ')' + ' AND start:' + start + ' AND end:' + end;

                        var joinquery = _(targets).map(toTargetJoinString);

                        //At this point we have to query chronix
                        var RAW_QUERY_BASE = '/select?fl=dataAsJson&wt=json';
                        var RAW_QUERY_JOIN = '&cj=' + joinquery;
                        var RAW_QUERY_FILTER_FUNCTION = ''; //'&cf=metric{vector:0.1}';
                        var RAW_QUERY_BASE_WITH_FILTER = RAW_QUERY_BASE + RAW_QUERY_FILTER_FUNCTION + RAW_QUERY_JOIN + '&q=';

                        console.log("Chronix Query: " + RAW_QUERY_BASE_WITH_FILTER + query);

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
                            var currentTimeSeries = currentDataSet.name;

                            if (!(currentTimeSeries in tsPoints)) {
                                tsPoints[currentTimeSeries] = [];
                            }

                            var jsonData = JSON.parse(currentDataSet.dataAsJson);

                            var timestamps = jsonData[0];
                            var values = jsonData[1];

                            //add them
                            for (var j = 0; j < timestamps.length; j++) {
                                tsPoints[currentTimeSeries].push([values[j], timestamps[j]]);
                            }
                        }

                        var ret = [];
                        for (var key in tsPoints) {
                            ret.push({ target: key, datapoints: tsPoints[key] });
                        }
                        return { data: ret };
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
                    value: function suggestAttributesValues(name, attribute) {
                        var options = {
                            method: 'GET',
                            url: this.url + '/select?facet.field=' + attribute + '&facet=on&q=name:' + name + '&rows=0&wt=json'
                        };

                        return this.backendSrv.datasourceRequest(options).then(this.mapValueToText);
                    }
                }, {
                    key: 'mapValueToText',
                    value: function mapValueToText(result) {
                        var fields = result.data.facet_counts.facet_fields;

                        var field;
                        //Iterate over the returned fields
                        for (var property in fields) {
                            if (fields.hasOwnProperty(property)) {
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
