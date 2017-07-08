import {parseCoinbaseLedger} from 'src/parsers/parseCoinbaseLedger'; 
import {parseKrakenLedger} from 'src/parsers/parseKrakenLedger'; 
import {parsePoloniexLedger} from 'src/parsers/parsePoloniexLedger';
import {parseCustomCVS} from 'src/parsers/parseCustomCVS';
import * as fs from 'fs';
import db from 'src/services/db';
import {Transaction} from 'src/dao/Transaction';
import * as R from 'ramda';

export const parseFiles = async (files: File[], body) => {
    return R.pipe(
        R.map<File, Promise<any>>(file => {
            const rawData = fs.readFileSync(file.path, 'utf-8');
            switch (body.source) {
                case 'custom':
                    return parseCustomCVS(rawData);
                case 'kraken':
                    return parseKrakenLedger(rawData);
                case 'coinbase':
                    return parseCoinbaseLedger(rawData);
                case 'poloniex':
                    return parsePoloniexLedger(rawData, body.type);
            }
            throw new Error('Source not handled.');
        }),
        async all => R.flatten(await Promise.all(all)),
    )(files);
};
