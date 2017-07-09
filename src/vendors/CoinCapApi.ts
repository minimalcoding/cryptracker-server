import * as req from 'superagent';
import * as R from 'ramda';
import * as Redis from 'ioredis';

const redis = new Redis({ keyPrefix: 'coin_cap:' })

class CoinCapApi {
    baseUrl: string;

    constructor() {
        this.baseUrl = 'https://coincap.io';
    }
    async getAssetHistory(asset: string): Promise<any> {
        const key = `history:${asset}`;
        const fromApi = async (): Promise<any> => {
            const response = await req(`${this.baseUrl}/history/${asset}`);
            redis.set(key, JSON.stringify(response.body));
            return response.body;
        };
        const fromCache = async (fallback: () => Promise<any>) => {
            const result = await redis.get(key);
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