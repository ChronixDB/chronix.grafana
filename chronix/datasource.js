define([
        'angular',
        'lodash',
        'app/plugins/sdk',
        'app/core/utils/datemath',
        'app/core/utils/kbn',
        './query_ctrl'
    ],
    function (angular, _, dateMath, kbn) {
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

        ChronixDBDatasource.prototype.rawQuery = function (targets, start, end) {

            var metrics = "";
            for (var qi = 0; qi < targets.length; qi++) {

                var currentTarget = targets[qi];
                if (qi == targets.length - 1) {
                    metrics += currentTarget.metric;
                } else {
                    metrics += currentTarget.metric + " OR "
                }
            }

            var q = metrics;//+ " AND start:" + start + " AND end:" + end;

            //At this point we have to query chronix
            var options = {
                method: 'GET',
                url: this.url + '/select?fl=dataAsJson:[dataAsJson]&indent=on&rows=4000&sort=start%20asc&wt=json&q=' + q
            };
            return this.backendSrv.datasourceRequest(options).then(function (response) {
                return [targets, response];
            });
        };


        ChronixDBDatasource.prototype.extractTimeSeries = function (targetsResponse) {
            var response = targetsResponse[1];

            if (response.data === undefined) {
                return {data: []};
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
                    if (j % 1000 == 0) {
                        tsPoints[currentMetric].push([values[j], timestamps[j]]);
                    }
                }

            }

            var ret = [];
            for (var key in tsPoints) {
                ret.push({target: key, datapoints: tsPoints[key]});
            }

            return {data: ret};
        };

        /**
         * Test if chronix is available
         * @returns {*}
         */
        ChronixDBDatasource.prototype.testDatasource = function () {
            return this._request('GET', 'select?q=%7B!lucene%7D*%3A*&wt=json&indent=true').then(function () {
                return {status: 'success', message: 'Data source is working', title: 'Success'};
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

        ChronixDBDatasource.prototype.metricFindQuery = function (query) {
            if (!query) {
                return this.q.when([]);
            }

            var interpolated;
            try {
                interpolated = this.templateSrv.replace(query);
            }
            catch (err) {
                return this.q.reject(err);
            }

            var responseTransform = function (result) {
                return _.map(result, function (value) {
                    return {text: value};
                });
            };

            var metrics_regex = /metrics\((.*)\)/;
            var tag_names_regex = /tag_names\((.*)\)/;
            var tag_values_regex = /tag_values\((.*),\s?(.*?)\)/;

            var metrics_query = interpolated.match(metrics_regex);
            if (metrics_query) {
                return this._performMetricSuggestQuery(metrics_query[1]).then(responseTransform);
            }

            var tag_names_query = interpolated.match(tag_names_regex);
            if (tag_names_query) {
                return this._performMetricKeyLookup(tag_names_query[1]).then(responseTransform);
            }

            var tag_values_query = interpolated.match(tag_values_regex);
            if (tag_values_query) {
                return this._performMetricKeyValueLookup(tag_values_query[1], tag_values_query[2]).then(responseTransform);
            }

            return this.q.when([]);
        };


        return ChronixDBDatasource;
    }
)
;
