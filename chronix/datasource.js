define([
        'angular',
        'lodash',
        './query_ctrl'
    ],
    function (angular, _) {
        'use strict';

        var self;

        function ChronixDBDatasource(instanceSettings, $q, backendSrv, templateSrv) {
            this.type = instanceSettings.type;
            this.url = instanceSettings.url;
            this.name = instanceSettings.name;
            this.supportMetrics = true;
            this.q = $q;
            this.backendSrv = backendSrv;
            this.templateSrv = templateSrv;

            self = this;
        }

        // Called once per panel (graph)
        ChronixDBDatasource.prototype.query = function (options) {
            //var start = options.rangeRaw.from;
            //var end = options.rangeRaw.to;

            //get the start and the end as unix time
            var start = options.range.from.unix() * 1000;
            var end = options.range.to.unix() * 1000;
            var targets = options.targets;

            return this.rawQuery(targets, start, end).then(this.extractTimeSeries);
        };

        function toTagQueryString(tag, tagName) {
            return tagName + ':(' + tag.join(' OR ') + ')'
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
            // create strings for each tag
            return _(target.attributes).join(',') + ",metric";
        }

        ChronixDBDatasource.prototype.rawQuery = function (targets, start, end) {
            // create strings for each target
            var targetsQueryStrings = _(targets).map(toTargetQueryString);

            var query = '(' + targetsQueryStrings.join(' OR ') + ')'
                + ' AND start:' + start
                + ' AND end:' + end;

            var joinquery = _(targets).map(toTargetJoinString);

            console.log("Query: " + query);

            //At this point we have to query chronix
            var RAW_QUERY_BASE = '/select?fl=dataAsJson&wt=json';
            var RAW_QUERY_JOIN = '&fq=join=' + joinquery;
            var RAW_QUERY_FILTER_FUNCTION = '';//'&fq=function=vector:0.1';
            var RAW_QUERY_BASE_WITH_FILTER = RAW_QUERY_BASE + RAW_QUERY_FILTER_FUNCTION + RAW_QUERY_JOIN + '&q=';

            var options = {
                method: 'GET',
                url: this.url + RAW_QUERY_BASE_WITH_FILTER + query
            };

            return this.backendSrv.datasourceRequest(options).then(function (response) {
                return [targets, response];
            });
        };


        ChronixDBDatasource.prototype.extractTimeSeries = function (targetsResponse) {
            console.time("parse and convert solr result");

            var response = targetsResponse[1];

            if (response.data === undefined) {
                return {data: []};
            }
            var dataset = response.data.response.docs;

            var tsPoints = {};

            for (var i = 0; i < dataset.length; i++) {
                var currentDataSet = dataset[i];
                var currentMetric = currentDataSet.metric;
                console.log("Working with metric: " + currentMetric);


                if (!(currentMetric in tsPoints)) {
                    tsPoints[currentMetric] = [];
                }

                console.time("json parse");
                var jsonData = JSON.parse(currentDataSet.dataAsJson);
                console.timeEnd("json parse");

                var timestamps = jsonData[0];
                var values = jsonData[1];

                //add them
                for (var j = 0; j < timestamps.length; j++) {
                    tsPoints[currentMetric].push([values[j], timestamps[j]]);
                }

            }

            var ret = [];
            for (var key in tsPoints) {
                ret.push({target: key, datapoints: tsPoints[key]});
            }
            console.timeEnd("parse and convert solr result");
            return {data: ret};
        };

        /**
         * Test true if chronix is available.
         * @returns {*}
         */
        ChronixDBDatasource.prototype.testDatasource = function () {
            return this.backendSrv.datasourceRequest({
                url: this.url + '/select?q=%7B!lucene%7D*%3A*&rows=0',
                method: 'GET'
            }).then(response => {
                if (response.status === 200) {
                    return {status: "success", message: "Data source is working", title: "Success"};
                }
            });
        };

        /**
         * Gets the list of metrics
         * @returns {*|Promise}
         */
        ChronixDBDatasource.prototype._performMetricSuggestQuery = function (metric) {
            var options = {
                //do a facet query
                //url: this.url + '/api/v1/metricnames',
                //an example query call
                //http://localhost:8983/solr/chronix/select?facet.field=metric&facet=on&indent=on&q=metric:*Co*&rows=0&wt=json
                url: this.url + '/select?facet.field=metric&facet=on&indent=on&q=metric:*&rows=0&wt=json',
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
        };

        ChronixDBDatasource.prototype._performMetricKeyLookup = function (metric) {
            if (!metric) {
                return this.q.when([]);
            }

            var options = {
                method: 'POST',
                url: this.url + '/select?facet.field=metric&facet=on&indent=on&q=metric:*&rows=0&wt=json',
                data: {
                    metrics: [{name: metric}],
                    cache_time: 0,
                    start_absolute: 0
                }
            };

            return this.backendSrv.datasourceRequest(options).then(function (result) {
                if (!result.data) {
                    return this.q.when([]);
                }
                var tagks = [];
                _.each(result.data.queries[0].results[0].tags, function (tagv, tagk) {
                    if (tagks.indexOf(tagk) === -1) {
                        tagks.push(tagk);
                    }
                });
                return tagks;
            });
        };

        ChronixDBDatasource.prototype._performMetricKeyValueLookup = function (metric, key) {
            if (!metric || !key) {
                return this.q.when([]);
            }

            var options = {
                method: 'POST',
                url: this.url + '/api/v1/datapoints/query/tags',
                data: {
                    metrics: [{name: metric}],
                    cache_time: 0,
                    start_absolute: 0
                }
            };

            return this.backendSrv.datasourceRequest(options).then(function (result) {
                if (!result.data) {
                    return this.q.when([]);
                }
                return result.data.queries[0].results[0].tags[key];
            });
        };

        ChronixDBDatasource.prototype.performTagSuggestQuery = function (metric) {
            var options = {
                url: this.url + '/api/v1/datapoints/query/tags',
                method: 'POST',
                data: {
                    metrics: [{name: metric}],
                    cache_time: 0,
                    start_absolute: 0
                }
            };

            return this.backendSrv.datasourceRequest(options).then(function (response) {
                if (!response.data) {
                    return [];
                }
                else {
                    return response.data.queries[0].results[0];
                }
            });
        };

        /**
         * Gets the available fields / attributes
         * @param query the query to filter the fields
         * @returns {*}
         */
        ChronixDBDatasource.prototype.suggestAttributes = function (query) {
            console.log("Query is " + query);
            var options = {
                method: 'GET',
                url: this.url + '/admin/luke?numTerms=0&wt=json'
            };

            return this.backendSrv.datasourceRequest(options).then(this.mapToTextValue);
        };


        var requiredFields = ["data", "start", "end", "_version_", "id", "metric"];
        ChronixDBDatasource.prototype.mapToTextValue = function (result) {
            console.log("Evaluating available fields.");

            var fields = result.data.fields;

            var stringFields = [];
            //Iterate over the returned fields
            for (var property in fields) {
                if (fields.hasOwnProperty(property)) {
                    if (requiredFields.indexOf(property.toLowerCase()) == -1) {
                        console.log("Field: " + property);
                        stringFields.push(property)
                    }
                }
            }
            return _.map(stringFields, (name) => {
                return {text: name, value: "hans"};
            });
        };


        /**
         * Gets the available values for the attributes
         * @param metric the metric to get the available attributes
         * @param attribute the attribute
         * @returns {*}
         */
        ChronixDBDatasource.prototype.suggestAttributesValues = function (metric, attribute) {

            console.log("Metric is " + metric + " Attribute is " + attribute);

            var options = {
                method: 'GET',
                url: this.url + '/select?facet.field=' + attribute + '&facet=on&q=' + metric + '&rows=0&wt=json'
            };

            return this.backendSrv.datasourceRequest(options).then(this.mapValueToText);
        };

        ChronixDBDatasource.prototype.mapValueToText = function (result) {
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

            return _.map(pairs, (pair) => {
                return {text: pair[0], value: pair[1]};
            });
        };

        return ChronixDBDatasource;
    }
);
