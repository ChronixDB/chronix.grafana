import _ from 'lodash';

function escapeTag(name) {
    return name.indexOf('.') !== -1 ? `"${name}"` : name;
}

function toTagQueryString(tag, tagName) {
    return tagName + ':(' + tag.map(escapeTag).join(' OR ') + ')'
}

function toTargetQueryString(target) {
    if (!target.tags || Object.keys(target.tags).length === 0) {
        // simple name-only
        return target.name;
    }

    // create strings for each tag
    const targetQueryStrings = _(target.tags).map(toTagQueryString);

    return '(' + target.name + ' AND ' + targetQueryStrings.join(' AND ') + ')';
}

function toTargetJoinString(target) {
    if (!target.attributes || Object.keys(target.attributes).length === 0) {
        return "name";
    }
    // create strings for each tag
    return _(target.attributes).join(',') + ",name,type";
}

var requiredFields = ["data", "start", "end", "_version_", "id", "name", "type"];

export class ChronixDbDatasource {

    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.url = instanceSettings.url;
        this.name = instanceSettings.name;
        this.$q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;
    }

    //region Required Grafana Datasource methods

    query(options) {
        // get the start and the end and multiply it with 1000 to get millis since 1970
        var start = options.range.from.unix() * 1000;
        var end = options.range.to.unix() * 1000;
        var targets = options.targets;

        return this.rawQuery(targets, start, end).then(this.extractTimeSeries);
    }

    /**
     * Attempts to connect to the URL entered by the user and responds with a promise to either a "success" or an
     * "error" message.
     */
    testDatasource() {
        const options = {
            url: `${this.url}/select?q=%7B!lucene%7D*%3A*&rows=0`,
            method: 'GET'
        };
        const successMessage = {
            status: "success",
            message: "Connection to Chronix established",
            title: "Success"
        };
        const errorMessage = this.$q.reject({
            status: "error",
            message: "Connection to Chronix failed",
            title: "Error"
        });

        // perform the actual call...
        return this.backendSrv.datasourceRequest(options)
        // ... check if the response is technically successful ...
            .then(response => response && response.status === 200)
            // ... and respond appropriately
            .then(success => success ? successMessage : errorMessage)
            // ... and react appropriately, too, when the call somehow didn't work
            .catch(error => errorMessage);
    }

    /**
     *
     */
    findTimeSeriesByNames(tsName) {
        const emptyResult = this.$q.when([]);

        if (!tsName || tsName === '*') {
            // no "*" accepted from the user
            return emptyResult;
        }

        if (tsName.indexOf('*') === -1) {
            // append an "*" at the end if the user didn't already provide one
            tsName = tsName + '*';
        }

        const options = {
            //do a facet query
            url: `${this.url}/select?facet.field=name&facet=on&facet.mincount=1&q=name:${tsName}&rows=0&wt=json`,
            method: 'GET'
        };

        return this.backendSrv.datasourceRequest(options)
            .then(response => response && response.data && response.data.facet_counts && response.data.facet_counts.facet_fields && response.data.facet_counts.facet_fields.name)
            .then((nameFields) => {
                // somehow no valid response => empty array
                if (!nameFields) {
                    console.log(`could not find any matching time series for "${tsName}"`);
                    return emptyResult;
                }

                // take only the names, not the counts
                return nameFields
                    .filter((unused, index) => index % 2 === 0)
                    // and provide them as objects with the "text" property
                    .map(text => ({text}));
            })
            // if the request itself failed
            .catch(error => emptyResult);
    }

    //endregion

    rawQuery(targets, start, end) {
        // create strings for each target
        var targetsQueryStrings = _(targets).map(toTargetQueryString);

        var query = 'name:(' + targetsQueryStrings.join(' OR ') + ')'
            + ' AND start:' + start
            + ' AND end:' + end;

        var joinquery = _(targets).map(toTargetJoinString);

        //At this point we have to query chronix
        var RAW_QUERY_BASE = '/select?fl=dataAsJson&wt=json';
        var RAW_QUERY_JOIN = '&cj=' + joinquery;
        var RAW_QUERY_FILTER_FUNCTION = '';//'&cf=metric{vector:0.1}';
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

    extractTimeSeries(targetsResponse) {
        var response = targetsResponse[1];

        if (response.data === undefined) {
            return {data: []};
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
            ret.push({target: key, datapoints: tsPoints[key]});
        }
        return {data: ret};
    }

    /**
     * Gets the available fields / attributes
     */
    suggestAttributes() {
        var options = {
            method: 'GET',
            url: this.url + '/admin/luke?numTerms=0&wt=json'
        };

        return this.backendSrv.datasourceRequest(options).then(this.mapToTextValue);
    }

    mapToTextValue(result) {
        var fields = result.data.fields;

        var stringFields = [];
        //Iterate over the returned fields
        for (var property in fields) {
            if (fields.hasOwnProperty(property)) {
                if (requiredFields.indexOf(property.toLowerCase()) == -1) {
                    stringFields.push(property)
                }
            }
        }
        return _.map(stringFields, (name) => {
            return {text: name};
        });
    }

    /**
     * Gets the available values for the attributes.
     *
     * @param name The name to get the available attributes.
     * @param attribute The attribute.
     */
    suggestAttributesValues(name, attribute) {
        var options = {
            method: 'GET',
            url: this.url + '/select?facet.field=' + attribute + '&facet=on&q=name:' + name + '&rows=0&wt=json'
        };

        return this.backendSrv.datasourceRequest(options).then(this.mapValueToText);
    }

    mapValueToText(result) {
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

        return _.map(pairs, (pair) => {
            return {text: pair[0], value: pair[1]};
        });
    }

}
