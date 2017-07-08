import * as R from 'ramda';
import * as moment from 'moment';

export const handlePromises = list => R.pipe(
    R.map((p: Promise<any>) => p.catch(err => { console.error(err); throw err; })),
    promises => Promise.all(promises),
)(list);