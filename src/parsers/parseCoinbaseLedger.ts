import * as R from 'ramda';
import * as Papa from 'papaparse';
import * as Decimal from 'decimal.js';
import * as moment from 'moment';

import { Transaction } from 'src/dao/Transaction';
import { handlePromises } from 'src/parsers/utils';
import { md5 } from 'src/tools/hash';

const TIME = 0;
const BALANCE = 1;
const AMOUNT = 2;
const CURRENCY = 3;
const TO = 4;
const NOTES = 5;
const INSTANTLY_EXCHANGED = 6;
const TRANSFER_TOTAL = 7;
const TRANSFER_TOTAL_CURRENCY = 8;
const TRANSFER_FEE = 9;
const TRANSFER_FEE_CURRENCY = 10;
const TRANSFER_PAYMENT_METHOD = 11;
const TRANSFER_ID = 12;
const ORDER_PRICE = 13;
const ORDER_CURRENCY = 14;
const ORDER_BTC = 15;
const ORDER_TRACKING_CODE = 16;
const ORDER_CUSTOM_PARAMETER = 17;
const ORDER_PAID_OUT = 18;
const RECURRING_PAYMENT_ID = 19;
const COINBASE_ID = 20;
const BITCOIN_HASH = 21;

export const parseCoinbaseLedger = async (cvsString: string): Promise<Transaction[]> => {
    const raw = Papa.parse(R.trim(cvsString));
    const json = raw.data;
    if (R.pipe(R.head, R.head)(json) !== 'Transactions') {
        throw new Error('This is not a proper Coinbase Transactions export file.');
    }

    // Four first lines are just useless metadata.
    const rows = R.drop(5, json);

    const toDecimal = v => new Decimal(R.isEmpty(v) ? 0 : v);

    return await R.pipe(
        R.reduce((acc: Transaction[], row: any): Transaction[] => {
            const coinbaseId = md5(JSON.stringify(row[COINBASE_ID]));
            const feeIsTransfer = row[TRANSFER_FEE_CURRENCY] === row[TRANSFER_TOTAL_CURRENCY];
            const commonPart = {
                time: moment(row[TIME], "YYYY-MM-DD HH:mm:ss Z"),
                location: 'coinbase',
                ref_id: null,
                type: 'move',
            };
            if (row[TRANSFER_ID]) {
                const transferId = md5(JSON.stringify(row[TRANSFER_ID]));
                commonPart.ref_id = md5(JSON.stringify([ coinbaseId, transferId ]));
                commonPart.type = 'trade';
                // We make the deposit first.
                acc.push(new Transaction({
                    ref_id: null,
                    time: commonPart.time,
                    location: commonPart.location,
                    id: md5(JSON.stringify([transferId, 'move'])),
                    amount: toDecimal(row[TRANSFER_TOTAL]),
                    fee: Decimal(0),
                    type: 'move',
                    asset: row[TRANSFER_TOTAL_CURRENCY],
                }));
                // Then we record the fiat part of the trade.
                acc.push(new Transaction({
                    ...commonPart,
                    id: transferId,
                    amount: toDecimal(row[TRANSFER_TOTAL]).negated(),
                    fee: feeIsTransfer ? toDecimal(row[TRANSFER_FEE]) : Decimal(0),
                    asset: row[TRANSFER_TOTAL_CURRENCY],
                }));
            }
            // Then the Crypto part.
            acc.push(new Transaction({
                ...commonPart,
                id: md5(row[COINBASE_ID]),
                fee: feeIsTransfer ? Decimal(0) : toDecimal(row[TRANSFER_FEE]),
                amount: toDecimal(row[AMOUNT]),
                asset: row[CURRENCY],
            }));
            return acc;
        }, []),
    )(rows);
};
