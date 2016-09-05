'use strict';

System.register(['./config-controller', './query-options-controller', 'datasource'], function (_export, _context) {
    "use strict";

    var ChronixConfigController, ChronixDBQueryOptionsCtrl, ChronixDbDatasource;
    return {
        setters: [function (_configController) {
            ChronixConfigController = _configController.ChronixConfigController;
        }, function (_queryOptionsController) {
            ChronixDBQueryOptionsCtrl = _queryOptionsController.ChronixDBQueryOptionsCtrl;
        }, function (_datasource) {
            ChronixDbDatasource = _datasource.ChronixDbDatasource;
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
