import * as req from 'superagent';
import * as R from 'ramda';
import * as redis from 'ioredis';

class CoinCapApi {
    baseUrl: string;
    redis: redis.Redis;

    constructor() {
        this.baseUrl = 'https://coincap.io';
        this.redis = new redis({ keyPrefix: 'coin_cap:' })
    }

    async getAssetHistory(asset: string): Promise<any> {
        const key = `history:${asset}`;
        const fromApi = async (): Promise<any> => {
            const response = await req(`${this.baseUrl}/history/${asset}`);
            this.redis.set(key, JSON.stringify(response.body));
            return response.body;
        };
        const fromCache = async (fallback: () => Promise<any>) => {
            const result = await this.redis.get(key);
            return result ? JSON.parse(result) : fallback();
        };
        return fromCache(fromApi);
    }

    async isAssetSupported(asset: string): Promise<Boolean> {
        const response = await req(`${this.baseUrl}/coins`);
        return R.contains(asset, response.body);
    }
}

export default CoinCapApi;