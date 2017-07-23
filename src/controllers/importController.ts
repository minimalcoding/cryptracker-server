import * as express from 'express';
import * as multer from 'multer';
import * as R from 'ramda';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import piper from 'src/tools/piper';
import PoloniexParser from 'src/parsers/PoloniexParser';
import CoinbaseParser from 'src/parsers/CoinbaseParser';
import BitfinexParser from 'src/parsers/BitfinexParser';
import KrakenParser from 'src/parsers/KrakenParser';
import AddressParser from 'src/parsers/AddressParser';
import CSVParser from 'src/parsers/CSVParser';
import {Transaction} from 'src/dao/Transaction';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

interface File { path: string };
interface UploadResult {[key: string]: File[]};

const filesUpload = upload.fields([
    { name: 'exports' },
]);

const processDataFiles = async (path: string): Promise<string[][]> => {
    return (await Papa.parse(R.trim(await fs.readFileSync(path, 'utf-8')))).data;
};

const loadFiles = (files: UploadResult): Promise<string[][]>[] => {
    const paths = R.map(f => f.path, files.exports);
    return R.map(p => processDataFiles(p), paths);
};

const fromFiles = async (Parser: new() => {parse: (input: string[][]) => Transaction[]}, data) => {
    return R.flatten<Transaction>(R.map(f => new Parser().parse(f), await Promise.all(loadFiles(data))));
}

router.post('/coinbase', filesUpload, piper(async (req, res) => {
    Transaction.createAll(await fromFiles(CoinbaseParser, req.files));
    return res.sendStatus(204);
}));

router.post('/kraken', filesUpload, piper(async (req, res) => {
    Transaction.createAll(await fromFiles(KrakenParser, req.files));
    return res.sendStatus(204);
}));

router.post('/csv', filesUpload, piper(async (req, res) => {
    Transaction.createAll(await fromFiles(CSVParser, req.files));
    return res.sendStatus(204);
}));

// Addresses
router.post('/address', piper(async (req, res) => {
    var parser = new AddressParser();
    Transaction.createAll(await parser.parse(req.body));
    return res.sendStatus(204);
}));

// Bitfinex is specific.
const loadMultipleFiles = (files: UploadResult): { [key: string]: Promise<string[][]> } => {
    return R.mapObjIndexed(imports => processDataFiles(R.head(imports).path), files);
};

const multipleUpload = upload.fields([
    { name: 'trades', maxCount: 1, },
    { name: 'deposits', maxCount: 1, },
    { name: 'withdrawals', maxCount: 1, },
    { name: 'fundings', maxCount: 1, },
]);

router.post('/poloniex', multipleUpload, piper(async (req, res) => {
    const parser = new PoloniexParser();
    const { deposits, withdrawals, trades } = loadMultipleFiles(req.files);
    Transaction.createAll(parser.parseDeposits(await deposits));
    Transaction.createAll(parser.parseWithdrawals(await withdrawals));
    Transaction.createAll(parser.parseTrades(await trades));
    return res.sendStatus(204);
}));

router.post('/bitfinex', multipleUpload, piper(async (req, res) => {
    const parser = new BitfinexParser();
    const { trades } = loadMultipleFiles(req.files);
    console.log(parser.parseTrades(await trades));
    return res.sendStatus(204);
}));

export default router;
