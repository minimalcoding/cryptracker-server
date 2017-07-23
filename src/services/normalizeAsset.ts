export default (a: string): string => {
    switch (a) {
        case 'XXBT': return 'BTC';
        case 'XETH': return 'ETH';
        case 'XXRP': return 'XRP';
        case 'XDAO': return 'DAO';
        case 'XLTC': return 'LTC';
        case 'ZEUR': return 'EUR';
        case 'STR': return 'XLM';
        case 'STRAT': return 'STR';
    }
    return a;
};