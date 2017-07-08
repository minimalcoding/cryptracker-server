import * as R from 'ramda';
export default fn => (...args) => fn(...args).catch(R.last(args));
