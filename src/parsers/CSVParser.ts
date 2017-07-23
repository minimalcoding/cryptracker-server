import * as R from 'ramda';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import * as Decimal from 'decimal.js';
import { Transaction } from 'src/dao/Transaction';
import { md5 } from 'src/tools/hash';

const ID = 0;
const REF_ID = 1;
const TYPE = 2;
const TIME = 3;
const AMOUNT = 4;
const FEE = 5;
const RATE = 6;
const ASSET = 7;
const LOCATION = 8;
const ADDRESS = 9;
const TX_HASH = 10;

const nullGuard = (v: string) => {
    if (R.is(String, v) && v === '') return null;
    return v;
};

export default class CSVParser {
    parse(rows: string[][]): Transaction[] {
        return R.pipe(
            R.drop(1),
            R.map((row: string[]): Transaction => {
                return new Transaction({
                    id: row[ID] || md5(JSON.stringify(row)),
                    ref_id: nullGuard(row[REF_ID]),
                    asset: nullGuard(row[ASSET]),
                    time: moment(row[TIME] || moment()),
                    amount: Decimal(row[AMOUNT] || 0),
                    fee: Decimal(row[FEE] || 0),
                    location: nullGuard(row[LOCATION]),
                    type: nullGuard(row[TYPE]),
                    address: nullGuard(row[ADDRESS]),
                    transaction_hash: nullGuard(row[TX_HASH]),
                });
            }),
        )(rows);
    }
}