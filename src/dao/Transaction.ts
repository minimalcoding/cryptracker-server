import * as moment from 'moment';
import { Decimal } from 'decimal.js';
import { Record } from 'immutable';
import { ValidationResult } from 'src/errors';
import Model, { DSO } from './Model';
import CoinCapApi from 'src/vendors/CoinCapApi';
import * as R from 'ramda';

export type TransactionDSO = {
    id: string;
    ref_id: string;
    asset: string;
    time: moment.Moment;
    fee: Decimal;
    rate: Decimal;
    location: string;
    amount: Decimal;
    type: string;

    from_address?: string;
    to_address?: string;
    transaction_hash?: string;
};

export class Transaction extends Model<TransactionDSO> {
    static tableName = 'transactions';
    coinCap: CoinCapApi;

    static fromJS(input: {[key: string]: string}): Transaction {
        return new Transaction({
            ...input,
            time: moment(input.time || moment()),
            fee: Decimal(input.fee || 0),
            amount: Decimal(input.amount || 0),
            rate: input.rate && Decimal(input.rate),
        });
    }

    get amount() { return this.record.amount; }
    set amount(value: Decimal) { this.set({ amount: value }); }

    get asset() { return this.record.asset; }
    get time() { return this.record.time; }

    constructor(input: any) {
        super(input, (input: any) => input);
        this.coinCap = new CoinCapApi();
    }

    toJson() {
        return {
            ...this.record,
            time: this.record.time.format(),
            fee: this.record.fee.toString(),
            amount: this.record.amount.toString(),
            rate: this.record.rate && this.record.rate.toString(),
        };
    }

    async validate(): Promise<ValidationResult> {
        const errors = new ValidationResult();
        if (this.record.id === '') {
            return errors.push({id: 'This property is required.'});
        }
        return errors;
    }

    async beforeSave() {
        if (!this.record.rate) {
            const history = await this.coinCap.getAssetHistory(this.asset);
            console.log(this.time.unix());
            const parseTS = v => Decimal(v).div(1000);
            const historyDic = R.reduce((a, p) => ({...a, [parseTS(p[0])]: p[1]}), {}, history.price);
            console.log(R.aperture(2, R.keys(historyDic)));
        }
    }
};
