export default (a: string): string => {
    if (a === 'XBT') return 'BTC';
    if (a === 'STR') return 'XLM';
    if (a === 'STRAT') return 'STR';
    return a;
};