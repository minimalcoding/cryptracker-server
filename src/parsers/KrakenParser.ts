import * as R from 'ramda';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import * as Decimal from 'decimal.js';

import {Transaction} from 'src/dao/Transaction';
import {md5} from 'src/tools/hash';
import normalizeAsset from 'src/services/normalizeAsset';

const TXID = 0;
const REFID = 1;
const TIME = 2;
const TYPE = 3;
const ACLASS = 4;
const ASSET = 5;
const AMOUNT = 6;
const FEE = 7;
const BALANCE = 8;

export default class KrakenParser {
    parse(rows: string[][]): Transaction[] {
        const parseType = krakenType => {
            switch (krakenType) {
                case 'trade':
                    return 'trade';
                case 'adjustment':
                case 'rollover':
                case 'margin':
                    return 'margin';
                case 'settled':
                case 'deposit':
                case 'withdrawal':
                    return 'move';
            }
            throw new Error(`Kraken type '${krakenType}' is unkown`)
        }

        return R.pipe(
            R.drop(1), // Header
            R.map((input: string[]): Transaction => {
                return new Transaction({
                    id: md5(input[TXID]),
                    ref_id: input[TYPE] === 'trade' ? md5(input[REFID]) : null,
                    asset: normalizeAsset(input[ASSET]),
                    time: moment(input[TIME]),
                    amount: Decimal(input[AMOUNT]).sub(input[FEE]),
                    fee: Decimal(input[FEE]),
                    location: 'kraken',
                    type: parseType(input[TYPE]),
                });
            }),
        )(rows);
    };
}


