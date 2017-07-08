import * as request from 'superagent';
import * as redis from 'ioredis';
import * as moment from 'moment';
import * as R from 'ramda';

export default class BlockCypherApi {
    baseUrl: string;
    version: string;
    sleepTime: Number;
    token: string;
    redis: redis.Redis;

    constructor() {
        this.baseUrl = 'https://api.blockcypher.com';
        this.version = 'v1';
        this.sleepTime = 1000;
        this.token = '7ef21afd06c846fd85166bf64a5b1dd3';
        this.redis = new redis({ keyPrefix: 'block_cypher:' })
    }
    async sleep(): Promise<{}> {
        return new Promise(r => setTimeout(r, this.sleepTime));
    }
    async fetchAddress(asset: string, address: string, disableCache = false): Promise<any> {
        const key = R.join(':', [ 'address', asset, address ]);
        
        const fromApi = async () => {
            const url = `${this.baseUrl}/${this.version}/${R.toLower(asset)}/main/addrs/${address}`;
            let count = 0;
            while (count < 5) {
                try {
                    const resp = await request(url).query({ token: this.token });
                    await this.redis.set(key, JSON.stringify(resp.body));
                    await this.redis.expireat(key, moment().add(moment.duration(10, 'm')).unix());
                    return resp.body;
                } catch (err) {
                    if (err.status === 429) {
                        count++;
                    } else {
                        throw err;
                    }
                }
                await this.sleep();
            }
            throw new Error('Too many attemps!');
        }

        const fromCache = async (fallback) => {
            const result = await this.redis.get(key);
            return result ? JSON.parse(result) : fallback();
        };

        return !disableCache ? fromCache(fromApi) : fromApi();
    }
}