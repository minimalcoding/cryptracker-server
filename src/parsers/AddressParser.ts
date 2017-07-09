import * as R from 'ramda';
import * as moment from 'moment';
import * as request from 'superagent';
import * as Decimal from 'decimal.js';

import BlockCypherApi from 'src/vendors/BlockCypherApi';
import { md5 } from 'src/tools/hash';
import { handlePromises } from 'src/parsers/utils';
import { Transaction } from 'src/dao/Transaction';

const blockCypherAddressParser = async (asset, address, location): Promise<Transaction[]> => {
    const bc = new BlockCypherApi();
    const { n_tx, txrefs } = await bc.fetchAddress(asset, address);
    if (n_tx > 200) {
        throw new Error('Addresses with more than 200 transactions can not be parsed yet.');
    }
    // Empty addresses
    if (n_tx == 0) { return []; }

    const normalizeAmount = v => {
        switch (asset) {
            case 'BTC':
            case 'DASH':
            case 'LTC': return Decimal(v).div("1e+8");
            case 'ETH': return Decimal(v).div("1e+18");
        }
    }
    return R.pipe(
        R.map((t: any) => ({
            tx_hash: t.tx_hash,
            amount: Decimal(t.tx_input_n < 0 ? t.value : -t.value),
        })),
        R.groupBy((t: any) => t.tx_hash), R.values,
        R.map(R.reduce((acc: any, t: any) => ({
            ...t,
            amount: acc.amount.add(t.amount),
        }), { amount: Decimal(0) })),
        // Format for database
        R.map((t: any): Transaction => {
            const mTime = moment(t.confirmed);
            const amount = normalizeAmount(t.amount);
            const id = md5(JSON.stringify([ mTime.unix(), asset, address, amount ]));
            return new Transaction({
                id,
                asset: asset,
                ref_id: null,
                time: mTime,
                fee: Decimal(0),
                location,
                amount,
                type: 'move',

                address,
                transaction_hash: t.tx_hash,
            });
        }),
    )(txrefs);    
}

const parseAddress = (asset, address, location): Promise<Transaction[]> => {
    switch (asset) {
        case 'BTC':
        case 'LTC':
        case 'ETH':
        case 'DASH':
            return blockCypherAddressParser(asset, address, location);
    }
    throw new Error(`${asset} are not compatible with address import... yet :)`)
}

export default class AddressParser {
    async parseAddresses(data: any[]): Promise<Transaction[]> {
        let result: Transaction[] = [];
        for (var key in data) {
            const item = data[key];
            const trList = await parseAddress(item.asset, item.address, item.location);
            result = R.concat(result, trList);
        }
        return result;
    }
}


