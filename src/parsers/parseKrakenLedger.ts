import * as R from 'ramda';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import * as Decimal from 'decimal.js';

import { Transaction } from 'src/dao/Transaction';

import { md5 } from 'src/tools/hash';
import normalizeAsset from 'src/services/normalizeAsset';
import { handlePromises } from 'src/parsers/utils';

export const parseKrakenLedger = async (cvsString: string): Promise<Transaction[]> => {
    const papaResults = await Papa.parse(R.trim(cvsString), { header: true });

    const parseType = krakenType => {
        switch (krakenType) {
            case 'trade':
                return 'trade';
            case 'adjustment':
            case 'rollover':
            case 'margin':
                return 'margin';
            case 'deposit':
            case 'withdrawal':            
                return 'move';
        }
        return null;
    }

    const result = R.pipe(
        R.map(R.tap(({ txid }) => {
            if (!txid) throw new Error('Transaction id not found, CVS data are not a Kraken ledger\'s export.');
        })),
        R.map(({ txid, asset, time, amount, fee, refid, type, aclass }): Transaction => {
            return new Transaction({
                id: md5(txid),
                ref_id: type === 'trade' ? md5(refid) : null,
                asset: normalizeAsset(asset.slice(1)),
                time: moment(time),
                amount: Decimal(amount).sub(fee),
                fee: Decimal(fee),
                location: 'kraken',
                type: parseType(type),
            });
        }),
    )(papaResults.data);

    return result;
};
