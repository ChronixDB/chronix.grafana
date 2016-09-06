import {ChronixConfigController} from './config-controller';
import {ChronixDBQueryOptionsCtrl} from './query-options-controller';
import {ChronixDbDatasource} from 'datasource';
import {ChronixDbQueryController} from './query-controller';

export {
    // default stuff
    ChronixConfigController as ConfigCtrl,

    // actual chronix stuff
    ChronixDBQueryOptionsCtrl as QueryOptionsCtrl,
    ChronixDbDatasource as Datasource,
    ChronixDbQueryController as QueryCtrl
};
