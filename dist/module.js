'use strict';

System.register(['./config-controller', './query-options-controller', './datasource', './query-controller'], function (_export, _context) {
    "use strict";

    var ChronixConfigController, ChronixDBQueryOptionsCtrl, ChronixDbDatasource, ChronixDbQueryController;
    return {
        setters: [function (_configController) {
            ChronixConfigController = _configController.ChronixConfigController;
        }, function (_queryOptionsController) {
            ChronixDBQueryOptionsCtrl = _queryOptionsController.ChronixDBQueryOptionsCtrl;
        }, function (_datasource) {
            ChronixDbDatasource = _datasource.ChronixDbDatasource;
        }, function (_queryController) {
            ChronixDbQueryController = _queryController.ChronixDbQueryController;
        }],
        execute: function () {
            _export('ConfigCtrl', ChronixConfigController);

            _export('QueryOptionsCtrl', ChronixDBQueryOptionsCtrl);

            _export('Datasource', ChronixDbDatasource);

            _export('QueryCtrl', ChronixDbQueryController);
        }
    };
});
//# sourceMappingURL=module.js.map
