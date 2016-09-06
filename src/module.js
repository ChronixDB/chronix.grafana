import {ChronixConfigController} from './config-controller';
import {ChronixDBQueryOptionsCtrl} from './query-options-controller';
import {ChronixDbDatasource} from 'datasource';

export {
    // default stuff
    ChronixConfigController as ConfigCtrl,
    ChronixDBQueryOptionsCtrl as QueryOptionsCtrl,

    // actual chronix stuff
    ChronixDbDatasource as Datasource,
    ChronixDbQueryController as QueryCtrl
};
