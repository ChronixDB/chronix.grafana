'use strict';

System.register(['./datasource', './query-controller', './config-controller'], function (_export, _context) {
    "use strict";

    var ChronixDbDatasource, ChronixDbQueryController, ChronixConfigController;
    return {
        setters: [function (_datasource) {
            ChronixDbDatasource = _datasource.ChronixDbDatasource;
        }, function (_queryController) {
            ChronixDbQueryController = _queryController.ChronixDbQueryController;
        }, function (_configController) {
            ChronixConfigController = _configController.ChronixConfigController;
        }],
        execute: function () {
            _export('Datasource', ChronixDbDatasource);

            _export('QueryCtrl', ChronixDbQueryController);

            _export('ConfigCtrl', ChronixConfigController);
        }
    };
});
//# sourceMappingURL=module.js.map
