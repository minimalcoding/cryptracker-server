import * as R from 'ramda';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import * as Decimal from 'decimal.js';

import { Transaction } from 'src/dao/Transaction';
import { handlePromises } from 'src/parsers/utils';
import { md5 } from 'src/tools/hash'
import normalizeAsset from 'src/services/normalizeAsset';

// For trades
const TR_DATE = 0;
const TR_MARKET = 1;
const TR_CATEGORY = 2;
const TR_TYPE = 3;
const TR_PRICE = 4;
const TR_AMOUNT = 5;
const TR_TOTAL = 6;
const TR_FEE = 7;
const TR_ORDER_NUMBER = 8;
const TR_BASE_TOTAL_LESS_FEE = 9;
const TR_QUOTE_TOTAL_LESS_FEE = 10;

// For movements
const DW_DATE = 0;
const DW_CURRENCY = 1;
const DW_AMOUNT = 2;
const DW_ADDRESS = 3;
const DW_STATUS = 4;

const parseMarket = (market: string): { source: string, target: string } => {
    const values = market.split('/');
    return { source: normalizeAsset(values[0]), target: normalizeAsset(values[1]) };
}

const parseMove = (cvsString: string, type: string) => {
    const fixAmountSign = amount => {
        if (type === 'withdrawal') {
            return Decimal(amount).negated();
        } else if (type === 'deposit') {
            return Decimal(amount);
        }
        throw new Error('Type not found.');
    }

    return R.pipe(
        R.drop(1),
        R.map((line: any): Transaction => new Transaction({
            id: md5(JSON.stringify(line)),
            ref_id: null,
            time: moment(line[DW_DATE]),
            amount: fixAmountSign(line[DW_AMOUNT]),
            asset: line[DW_CURRENCY],
            fee: new Decimal(0),
            location: 'poloniex',
            type: 'move',
        })),
    )(cvsString);
};

const parseTrades = R.pipe(
    R.drop(1), // Drop headers
    R.reduce((acc: Transaction[], item: any): Transaction[] => {
        const assets = parseMarket(item[TR_MARKET]);
        const absD = v => Decimal(v).abs();
        const idTarget = md5(JSON.stringify([
            'target',
            item[TR_ORDER_NUMBER],
            item[TR_DATE],
            item[TR_TOTAL],
        ]));
        const idSource = md5(JSON.stringify([
            'source',
            item[TR_ORDER_NUMBER],
            item[TR_DATE],
            item[TR_AMOUNT],
        ]));
        const commonPart = {
            time: moment(item[TR_DATE]),
            ref_id: md5(JSON.stringify([ idTarget, idSource ])),
            type: 'trade',
            location: 'poloniex',
        };
        const target = new Transaction({
            ...commonPart,
            id: idTarget,
            asset: assets.target,
            amount: absD(item[TR_BASE_TOTAL_LESS_FEE]),
            fee: absD(item[TR_TOTAL]).sub(absD(item[TR_BASE_TOTAL_LESS_FEE])),
        });
        const source = new Transaction({
            ...commonPart,
            id: idSource,
            asset: assets.source,
            amount: absD(item[TR_QUOTE_TOTAL_LESS_FEE]),
            fee: absD(item[TR_AMOUNT]).sub(absD(item[TR_QUOTE_TOTAL_LESS_FEE])),
        });
        if (item[TR_TYPE] === 'Sell') {
            source.amount = source.amount.negated();
        } else if (item[TR_TYPE] === 'Buy') {
            target.amount = target.amount.negated();
        } else {
            throw new Error('Poloniex transaction type not recognized.');
        }
        return [
            ...acc,
            source,
            target,
        ];
    }, []),
);

export const parsePoloniexLedger = async (cvsString: string, type: string): Promise<Transaction[]> => {
    const papaResults = await Papa.parse(R.trim(cvsString));
    const rows = papaResults.data;
    switch (type) {
        case 'trades':
            return parseTrades(rows);
        case 'deposit':
        case 'withdrawal':
            return parseMove(rows, type);
    }
    throw new Error('Type unknown.');
};
