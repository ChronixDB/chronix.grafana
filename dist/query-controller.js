'use strict';

System.register(['app/plugins/sdk', 'lodash'], function (_export, _context) {
    "use strict";

    var QueryCtrl, _, _createClass, ChronixDbQueryController;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    function isInt(n) {
        return parseInt(n) % 1 === 0;
    }

    return {
        setters: [function (_appPluginsSdk) {
            QueryCtrl = _appPluginsSdk.QueryCtrl;
        }, function (_lodash) {
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

            _export('ChronixDbQueryController', ChronixDbQueryController = function (_QueryCtrl) {
                _inherits(ChronixDbQueryController, _QueryCtrl);

                function ChronixDbQueryController($scope, $injector) {
                    _classCallCheck(this, ChronixDbQueryController);

                    var _this = _possibleConstructorReturn(this, (ChronixDbQueryController.__proto__ || Object.getPrototypeOf(ChronixDbQueryController)).call(this, $scope, $injector));

                    _this.panel.stack = false;

                    if (!_this.panel.downsampling) {
                        _this.panel.downsampling = 'avg';
                    }

                    if (!_this.target.downsampling) {
                        _this.target.downsampling = _this.panel.downsampling;
                        _this.target.sampling = _this.panel.sampling;
                    }

                    /**
                     * Is called if someone types something into a key field of an attribute.
                     */
                    _this.suggestAttributes = function (query, callback) {
                        _this.datasource.suggestAttributes().then(_this.getTextValues.bind(_this)).then(callback);
                    };

                    /**
                     * Is called if someone types something into a value field of an attribute.
                     */
                    _this.suggestTagValues = function (query, callback) {
                        _this.datasource.suggestAttributesValues(_this.target.metric, _this.target.currentTagKey).then(_this.getTextValues.bind(_this)).then(callback);
                    };

                    /**
                     * Is called if someone types something into a key field of an attribute.
                     */
                    _this.suggestTagAttributes = function (query, callback) {
                        _this.datasource.suggestAttributes(query).then(_this.getTextValues.bind(_this)).then(callback);
                    };

                    _this.suggestMetrics = function (query, callback) {
                        _this.datasource.metricFindQuery(query).then(_this.getTextValues.bind(_this)).then(callback);
                    };

                    _this.validateTarget();
                    return _this;
                }

                _createClass(ChronixDbQueryController, [{
                    key: 'validateTarget',
                    value: function validateTarget() {
                        var errs = {};

                        if (!this.target.metric) {
                            errs.metric = "You must supply a metric name.";
                        }

                        try {
                            if (this.target.sampling) {
                                this.datasource.convertToChronixInterval(this.target.sampling);
                            }
                        } catch (err) {
                            errs.sampling = err.message;
                        }

                        this.target.errors = errs;
                    }
                }, {
                    key: 'targetBlur',
                    value: function targetBlur() {
                        this.validateTarget();

                        if (!_.isEqual(this.oldTarget, this.target) && _.isEmpty(this.target.errors)) {
                            this.oldTarget = angular.copy(this.target);
                            this.panelCtrl.refresh();
                        }
                    }
                }, {
                    key: 'getTextValues',
                    value: function getTextValues(metricFindResult) {
                        return _.map(metricFindResult, function (value) {
                            return value.text;
                        });
                    }
                }, {
                    key: 'addJoinByAttribute',
                    value: function addJoinByAttribute(query, callback) {
                        console.info("add join by attribute is called for " + query);

                        this.datasource.suggestAttributes(query).then(this.getTextValues.bind(this)).then(callback);
                    }
                }, {
                    key: 'validateJoinAttributes',
                    value: function validateJoinAttributes() {
                        console.info("validateJoinAttributes is called");
                        this.target.errors.attributes = null;
                        if (!this.target.currentAttributeKey) {
                            this.target.errors.attributes = "You must specify a tag name and value.";
                        }
                    }
                }, {
                    key: 'removeJoinByAttribute',
                    value: function removeJoinByAttribute(attribute) {
                        console.info("removeJoinByAttribute is called for " + attribute);

                        var index = this.target.attributes.indexOf(attribute);

                        this.target.attributes.splice(index, 1);

                        if (_.size(this.target.attributes) === 0) {
                            this.target.attributes = null;
                        }
                        this.targetBlur();
                    }
                }, {
                    key: 'addJoinByAttribute',
                    value: function addJoinByAttribute() {
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
                    }
                }, {
                    key: 'addFilterTag',
                    value: function addFilterTag() {
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
                    }
                }, {
                    key: 'removeFilterTag',
                    value: function removeFilterTag(key) {
                        delete this.target.tags[key];
                        if (_.size(this.target.tags) === 0) {
                            this.target.tags = null;
                        }
                        this.targetBlur();
                    }
                }, {
                    key: 'validateFilterTag',
                    value: function validateFilterTag() {
                        this.target.errors.tags = null;
                        if (!this.target.currentTagKey || !this.target.currentTagValue) {
                            this.target.errors.tags = "You must specify a tag name and value.";
                        }
                    }
                }, {
                    key: 'addGroupBy',
                    value: function addGroupBy() {
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
                            } else {
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
                    }
                }, {
                    key: 'removeGroupByTag',
                    value: function removeGroupByTag(index) {
                        this.target.groupByTags.splice(index, 1);
                        if (_.size(this.target.groupByTags) === 0) {
                            this.target.groupByTags = null;
                        }
                        this.targetBlur();
                    }
                }, {
                    key: 'removeNonTagGroupBy',
                    value: function removeNonTagGroupBy(index) {
                        this.target.nonTagGroupBys.splice(index, 1);
                        if (_.size(this.target.nonTagGroupBys) === 0) {
                            this.target.nonTagGroupBys = null;
                        }
                        this.targetBlur();
                    }
                }, {
                    key: 'changeGroupByInput',
                    value: function changeGroupByInput() {
                        this.panel.isTagGroupBy = this.target.currentGroupByType === 'tag';
                        this.panel.isValueGroupBy = this.target.currentGroupByType === 'value';
                        this.panel.isTimeGroupBy = this.target.currentGroupByType === 'time';
                        this.validateGroupBy();
                    }
                }, {
                    key: 'getValuesOfGroupBy',
                    value: function getValuesOfGroupBy(groupBy) {
                        return _.values(groupBy);
                    }
                }, {
                    key: 'validateGroupBy',
                    value: function validateGroupBy() {
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
                    }
                }, {
                    key: 'addHorizontalAggregator',
                    value: function addHorizontalAggregator() {
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
                    }
                }, {
                    key: 'removeHorizontalAggregator',
                    value: function removeHorizontalAggregator(index) {
                        this.target.horizontalAggregators.splice(index, 1);
                        if (_.size(this.target.horizontalAggregators) === 0) {
                            this.target.horizontalAggregators = null;
                        }

                        this.targetBlur();
                    }
                }, {
                    key: 'changeHorAggregationInput',
                    value: function changeHorAggregationInput() {
                        this.panel.hasSamplingRate = _.contains(['avg', 'dev', 'max', 'min', 'sum', 'least_squares', 'count', 'percentile'], this.target.currentHorizontalAggregatorName);
                        this.panel.hasUnit = _.contains(['sampler', 'rate'], this.target.currentHorizontalAggregatorName);
                        this.panel.hasFactor = _.contains(['div', 'scale'], this.target.currentHorizontalAggregatorName);
                        this.panel.hasPercentile = 'percentile' === this.target.currentHorizontalAggregatorName;
                        this.validateHorizontalAggregator();
                    }
                }, {
                    key: 'validateHorizontalAggregator',
                    value: function validateHorizontalAggregator() {
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
                            } else if (parseInt(this.target.horAggregator.factor) === 0 && this.target.currentHorizontalAggregatorName === 'div') {
                                errors.factor = 'Cannot divide by 0';
                                this.panel.isAggregatorValid = false;
                            }
                        }

                        if (this.panel.hasPercentile) {
                            if (!this.target.horAggregator.percentile || this.target.horAggregator.percentile <= 0 || this.target.horAggregator.percentile > 1) {
                                errors.percentile = 'Percentile must be between 0 and 1';
                                this.panel.isAggregatorValid = false;
                            }
                        }

                        if (!_.isEmpty(errors)) {
                            this.target.errors.horAggregator = errors;
                        }
                    }
                }, {
                    key: 'alert',
                    value: function (_alert) {
                        function alert(_x) {
                            return _alert.apply(this, arguments);
                        }

                        alert.toString = function () {
                            return _alert.toString();
                        };

                        return alert;
                    }(function (message) {
                        alert(message);
                    })
                }]);

                return ChronixDbQueryController;
            }(QueryCtrl));

            _export('ChronixDbQueryController', ChronixDbQueryController);

            ChronixDbQueryController.templateUrl = 'partials/query.editor.html';
        }
    };
});
//# sourceMappingURL=query-controller.js.map
