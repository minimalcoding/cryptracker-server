import * as request from 'superagent';
import * as R from 'ramda';
import * as Decimal from 'decimal.js';
import * as moment from 'moment';
import * as redis from 'ioredis';

import * as hash from 'src/tools/hash';

export default class CryptoCompareApi {
    url: string;
    noCache: boolean;
    redis: redis.Redis;
    currentRatesUpdateTTL: moment.Duration;

    constructor(noCache: boolean = false) {
        this.url = 'https://min-api.cryptocompare.com';
        this.redis = new redis({ keyPrefix: 'crypto_compare:' });
        this.currentRatesUpdateTTL = moment.duration(15, 'm');
        this.noCache = noCache;
    }
    async getCurrentRates(from: string, to: Array<string>, markets: Array<string>): Promise<any> {
        const key = `current_rates:${hash.md5(JSON.stringify([ from, to, markets ]))}`;
        
        if (!this.noCache) {
            const cachedResult = await this.redis.get(key);
            if (cachedResult) {
                return JSON.parse(cachedResult);
            }
        }

        const res = await request(`${this.url}/data/price`)
            .query({
                fsym: from,
                tsyms: R.join(',', to),
                markets,
                extraParams: 'cryptracker'
            });
        
        const rates = R.map((r: number) => new Decimal(r).toString())(res.body);
        await this.redis.set(key, JSON.stringify(rates));
        await this.redis.expireat(key, moment().add(this.currentRatesUpdateTTL).unix());
        return rates;
    }
    async getHistoricalRate(from: string, to: string, market: string, timestamp: Number) {
        const redisKey = R.join(':', [ 'historical', from, to, market ]);

        if (!this.noCache) {
            const cachedRate = await this.redis.hget(redisKey, timestamp);
            if (cachedRate) {
                return new Decimal(cachedRate).toString();
            }
        }

        const resp = (await request(`${this.url}/data/pricehistorical`).query({
            fsym: from,
            tsyms: [to],
            markets: [market],
            ts: timestamp,
            extraParams: 'cryptracker',
        }));
        const rate = new Decimal(resp.body[from][to]).toString();
        await this.redis.hset(redisKey, timestamp, rate);
        return rate;
    }
}