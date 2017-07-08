import * as R from 'ramda';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import * as Decimal from 'decimal.js';

import { Transaction } from 'src/dao/Transaction';

import { md5 } from 'src/tools/hash';

export const parseCustomCVS = async (cvsString: string): Promise<Transaction[]> => {
    const papaResults = await Papa.parse(R.trim(cvsString), { header: true });

    const result = R.pipe(
        R.map((input: any): Transaction => {
            return new Transaction({
                id: input.id || md5(JSON.stringify(input)),
                ref_id: input.ref_id,
                asset: input.asset,
                time: moment(input.time || moment()),
                amount: Decimal(input.amount || 0),
                fee: Decimal(input.fee || 0),
                location: input.location,
                type: input.type,
            });
        }),
    )(papaResults.data);

    return result;
};
