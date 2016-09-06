import {QueryCtrl} from 'app/plugins/sdk';
import _ from 'lodash';

function isInt (n) {
    return parseInt(n) % 1 === 0;
}

export class ChronixDbQueryController extends QueryCtrl {

    constructor ($scope, $injector) {
        super($scope, $injector);

        this.panel.stack = false;

        if (!this.panel.downsampling) {
            this.panel.downsampling = 'avg';
        }

        if (!this.target.downsampling) {
            this.target.downsampling = this.panel.downsampling;
            this.target.sampling = this.panel.sampling;
        }

        this.validateTarget();
    }

    validateTarget () {
        var errs = {};

        if (!target.metric) {
            errs.metric = "You must supply a metric name.";
        }

        try {
            if (target.sampling) {
                this.datasource.convertToChronixInterval(target.sampling);
            }
        } catch (err) {
            errs.sampling = err.message;
        }

        this.target.errors = errs;
    }

    targetBlur () {
        this.validateTarget();

        if (!_.isEqual(this.oldTarget, this.target) && _.isEmpty(this.target.errors)) {
            this.oldTarget = angular.copy(this.target);
            this.panelCtrl.refresh();
        }
    };

    getTextValues (metricFindResult) {
        return _.map(metricFindResult, function (value) {
            return value.text;
        });
    };

    suggestMetrics (query, callback) {
        this.datasource.metricFindQuery('metrics(' + query + ')')
            .then(this.getTextValues.bind(this))
            .then(callback);
    };

    /**
     * =========================================================================
     *
     *  Join section
     *
     * =========================================================================
     */

    /**
     * Is called if someone types something into the join by box
     * @param query
     * @param callback
     */
    addJoinByAttribute (query, callback) {
        console.info("add join by attribute is called for " + query);

        this.datasource.suggestAttributes(query)
            .then(this.getTextValues.bind(this))
            .then(callback);
    };

    /**
     * Is called if someone types something into a key field of an attribute
     * @param query
     * @param callback
     */
    suggestTagAttributes (query, callback) {
        console.log("suggestTagAttributes is called for " + query);

        this.datasource.suggestAttributes(query)
            .then(this.getTextValues.bind(this))
            .then(callback);
    };

    validateJoinAttributes () {
        console.info("validateJoinAttributes is called");
        this.target.errors.attributes = null;
        if (!this.target.currentAttributeKey) {
            this.target.errors.attributes = "You must specify a tag name and value.";
        }
    };

    /**
     * Is calls if someone removes a group by tag
     * @param attribute
     */
    removeJoinByAttribute (attribute) {
        console.info("removeJoinByAttribute is called for " + attribute);

        var index = this.target.attributes.indexOf(attribute);

        this.target.attributes.splice(index, 1);

        if (_.size(this.target.attributes) === 0) {
            this.target.attributes = null;
        }
        this.targetBlur();
    };

    /**
     * Add join by attribute
     */
    addJoinByAttribute () {
        console.info("addJoinByAttribute is called");
        if (!this.panel.addJoinAttributeMode) {
            this.panel.addJoinAttributeMode = true;
            this.validateJoinAttributes();
            return;
        }

        if (!this.target.attributes) {
            this.target.attributes = [];
        }

        this.validateJoinAttributes();
        if (!this.target.errors.attributes) {
            this.target.attributes.push(this.target.currentAttributeKey);
            this.target.currentAttributeKey = '';

            this.targetBlur();
        }

        this.panel.addJoinAttributeMode = false;
    };

    /**
     * Is called if someone types something into a key field of an attribute
     * @param query
     * @param callback
     */
    suggestAttributes (query, callback) {
        console.log("Suggest tag key is called");

        this.datasource.suggestAttributes()
            .then(this.getTextValues.bind(this))
            .then(callback);
    };

    /**
     * Is called if someone types something into a value field of an attribute
     * @param query
     * @param callback
     */
    suggestTagValues (query, callback) {
        console.log("Suggest available attribute values");

        this.datasource.suggestAttributesValues(this.target.metric, this.target.currentTagKey)
            .then(this.getTextValues.bind(this))
            .then(callback);
    };

    // Filter metric by tag
    addFilterTag () {
        if (!this.panel.addFilterTagMode) {
            this.panel.addFilterTagMode = true;
            this.validateFilterTag();
            return;
        }

        if (!this.target.tags) {
            this.target.tags = {};
        }

        this.validateFilterTag();
        if (!this.target.errors.tags) {
            if (!_.has(this.target.tags, this.target.currentTagKey)) {
                this.target.tags[this.target.currentTagKey] = [];
            }
            this.target.tags[this.target.currentTagKey].push(this.target.currentTagValue);
            this.target.currentTagKey = '';
            this.target.currentTagValue = '';
            this.targetBlur();
        }

        this.panel.addFilterTagMode = false;
    };

    removeFilterTag (key) {
        delete this.target.tags[key];
        if (_.size(this.target.tags) === 0) {
            this.target.tags = null;
        }
        this.targetBlur();
    };

    validateFilterTag () {
        this.target.errors.tags = null;
        if (!this.target.currentTagKey || !this.target.currentTagValue) {
            this.target.errors.tags = "You must specify a tag name and value.";
        }
    };

    //////////////////////////////
    // GROUP BY
    //////////////////////////////
    addGroupBy () {
        if (!this.panel.addGroupByMode) {
            this.target.currentGroupByType = 'tag';
            this.panel.addGroupByMode = true;
            this.panel.isTagGroupBy = true;
            this.validateGroupBy();
            return;
        }
        this.validateGroupBy();
        // nb: if error is found, means that user clicked on cross : cancels input

        if (_.isEmpty(this.target.errors.groupBy)) {
            if (this.panel.isTagGroupBy) {
                if (!this.target.groupByTags) {
                    this.target.groupByTags = [];
                }
                if (!_.contains(this.target.groupByTags, this.target.groupBy.tagKey)) {
                    this.target.groupByTags.push(this.target.groupBy.tagKey);
                    this.targetBlur();
                }
                this.target.groupBy.tagKey = '';
            }
            else {
                if (!this.target.nonTagGroupBys) {
                    this.target.nonTagGroupBys = [];
                }
                var groupBy = {
                    name: this.target.currentGroupByType
                };
                if (this.panel.isValueGroupBy) {
                    groupBy.range_size = this.target.groupBy.valueRange;
                } else if (this.panel.isTimeGroupBy) {
                    groupBy.range_size = this.target.groupBy.timeInterval;
                    groupBy.group_count = this.target.groupBy.groupCount;
                }
                this.target.nonTagGroupBys.push(groupBy);
            }
            this.targetBlur();
        }

        this.panel.isTagGroupBy = false;
        this.panel.isValueGroupBy = false;
        this.panel.isTimeGroupBy = false;
        this.panel.addGroupByMode = false;
    };

    removeGroupByTag (index) {
        this.target.groupByTags.splice(index, 1);
        if (_.size(this.target.groupByTags) === 0) {
            this.target.groupByTags = null;
        }
        this.targetBlur();
    };

    removeNonTagGroupBy (index) {
        this.target.nonTagGroupBys.splice(index, 1);
        if (_.size(this.target.nonTagGroupBys) === 0) {
            this.target.nonTagGroupBys = null;
        }
        this.targetBlur();
    };

    changeGroupByInput () {
        this.panel.isTagGroupBy = this.target.currentGroupByType === 'tag';
        this.panel.isValueGroupBy = this.target.currentGroupByType === 'value';
        this.panel.isTimeGroupBy = this.target.currentGroupByType === 'time';
        this.validateGroupBy();
    };

    getValuesOfGroupBy (groupBy) {
        return _.values(groupBy);
    };

    validateGroupBy () {
        delete this.target.errors.groupBy;
        var errors = {};
        this.panel.isGroupByValid = true;
        if (this.panel.isTagGroupBy) {
            if (!this.target.groupBy.tagKey) {
                this.panel.isGroupByValid = false;
                errors.tagKey = 'You must supply a tag name';
            }
        }

        if (this.panel.isValueGroupBy) {
            if (!this.target.groupBy.valueRange || !isInt(this.target.groupBy.valueRange)) {
                errors.valueRange = "Range must be an integer";
                this.isGroupByValid = false;
            }
        }

        if (this.panel.isTimeGroupBy) {
            try {
                this.datasource.convertToChronixInterval(this.target.groupBy.timeInterval);
            } catch (err) {
                errors.timeInterval = err.message;
                this.isGroupByValid = false;
            }
            if (!this.target.groupBy.groupCount || !isInt(this.target.groupBy.groupCount)) {
                errors.groupCount = "Group count must be an integer";
                this.isGroupByValid = false;
            }
        }

        if (!_.isEmpty(errors)) {
            this.target.errors.groupBy = errors;
        }
    };

    //////////////////////////////
    // HORIZONTAL AGGREGATION
    //////////////////////////////

    addHorizontalAggregator () {
        if (!this.panel.addHorizontalAggregatorMode) {
            this.panel.addHorizontalAggregatorMode = true;
            this.target.currentHorizontalAggregatorName = 'avg';
            this.panel.hasSamplingRate = true;
            this.validateHorizontalAggregator();
            return;
        }

        this.validateHorizontalAggregator();
        // nb: if error is found, means that user clicked on cross : cancels input
        if (_.isEmpty(this.target.errors.horAggregator)) {
            if (!this.target.horizontalAggregators) {
                this.target.horizontalAggregators = [];
            }
            var aggregator = {
                name: this.target.currentHorizontalAggregatorName
            };
            if (this.panel.hasSamplingRate) {
                aggregator.sampling_rate = this.target.horAggregator.samplingRate;
            }
            if (this.panel.hasUnit) {
                aggregator.unit = this.target.horAggregator.unit;
            }
            if (this.panel.hasFactor) {
                aggregator.factor = this.target.horAggregator.factor;
            }
            if (this.panel.hasPercentile) {
                aggregator.percentile = this.target.horAggregator.percentile;
            }
            this.target.horizontalAggregators.push(aggregator);
            this.targetBlur();
        }

        this.panel.addHorizontalAggregatorMode = false;
        this.panel.hasSamplingRate = false;
        this.panel.hasUnit = false;
        this.panel.hasFactor = false;
        this.panel.hasPercentile = false;
    };

    removeHorizontalAggregator (index) {
        this.target.horizontalAggregators.splice(index, 1);
        if (_.size(this.target.horizontalAggregators) === 0) {
            this.target.horizontalAggregators = null;
        }

        this.targetBlur();
    };

    changeHorAggregationInput () {
        this.panel.hasSamplingRate = _.contains(['avg', 'dev', 'max', 'min', 'sum', 'least_squares', 'count', 'percentile'],
            this.target.currentHorizontalAggregatorName);
        this.panel.hasUnit = _.contains(['sampler', 'rate'], this.target.currentHorizontalAggregatorName);
        this.panel.hasFactor = _.contains(['div', 'scale'], this.target.currentHorizontalAggregatorName);
        this.panel.hasPercentile = 'percentile' === this.target.currentHorizontalAggregatorName;
        this.validateHorizontalAggregator();
    };

    validateHorizontalAggregator () {
        delete this.target.errors.horAggregator;
        var errors = {};
        this.panel.isAggregatorValid = true;

        if (this.panel.hasSamplingRate) {
            try {
                this.datasource.convertToChronixInterval(this.target.horAggregator.samplingRate);
            } catch (err) {
                errors.samplingRate = err.message;
                this.panel.isAggregatorValid = false;
            }
        }

        if (this.hasFactor) {
            if (!this.target.horAggregator.factor) {
                errors.factor = 'You must supply a numeric value for this aggregator';
                this.panel.isAggregatorValid = false;
            }
            else if (parseInt(this.target.horAggregator.factor) === 0 && this.target.currentHorizontalAggregatorName === 'div') {
                errors.factor = 'Cannot divide by 0';
                this.panel.isAggregatorValid = false;
            }
        }

        if (this.panel.hasPercentile) {
            if (!this.target.horAggregator.percentile ||
                this.target.horAggregator.percentile <= 0 ||
                this.target.horAggregator.percentile > 1) {
                errors.percentile = 'Percentile must be between 0 and 1';
                this.panel.isAggregatorValid = false;
            }
        }

        if (!_.isEmpty(errors)) {
            this.target.errors.horAggregator = errors;
        }
    };

    alert (message) {
        alert(message);
    };

}

ChronixDbQueryController.templateUrl = 'partials/query.editor.html';
