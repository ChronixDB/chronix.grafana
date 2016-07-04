define([
        './datasource',
        './query_ctrl'
    ],
    function (ChronixDBDatasource, ChronixDBQueryCtrl) {
        'use strict';

        var ChronixDBConfigCtrl = function () {
        };
        ChronixDBConfigCtrl.templateUrl = "partials/config.html";

        var ChronixDBQueryOptionsCtrl = function () {
        };

        return {
            'Datasource': ChronixDBDatasource,
            'QueryCtrl': ChronixDBQueryCtrl,
            'ConfigCtrl': ChronixDBConfigCtrl,
            'QueryOptionsCtrl': ChronixDBQueryOptionsCtrl
        };
    });