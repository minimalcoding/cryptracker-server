import CoinCapApi from 'src/vendors/CoinCapApi';

class AssetService {
    coinCap: CoinCapApi;
    constructor() {
        this.coinCap = new CoinCapApi();
    }

    isSupported(asset: string): Promise<Boolean> {
        return this.coinCap.isAssetSupported(asset);
    }
}

export default AssetService;