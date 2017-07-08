import * as express from 'express';
import * as multer from 'multer';
import * as fs from 'fs';
import * as R from 'ramda';
import * as Papa from 'papaparse';

import { parseAddresses } from 'src/parsers/parseAddresses';
import { parseFiles } from 'src/parsers/parseFiles';
import piper from 'src/tools/piper';
import * as Hash from 'src/tools/hash';
import db from 'src/services/db';

import { Transaction } from 'src/dao/Transaction';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

type File = {path: string};

router.get('/', piper(async (req, res) => {
    return res.send(await Transaction.all());
}));

router.delete('/:id', piper(async (req, res) => {
    if (await Transaction.remove(req.params.id)) {
        return res.sendStatus(204);
    }
    return res.sendStatus(404);
}));

router.post('/', piper(async (req, res) => {
    const transaction = Transaction.fromJS(req.body);
    return res.send(await transaction.save());
}));

router.post('/import-file', upload.array('import'), piper(async (req, res) => {
    await Transaction.createAll(await parseFiles(req.files, req.body));
    return res.sendStatus(200);
}));

router.post('/parse-file', upload.array('import'), piper(async (req, res) => {
    return res.send(R.map((t: Transaction) => t.toJson(), await parseFiles(req.files, req.body)));
}));

router.post('/import-address', piper(async (req, res) => {
    await Transaction.createAll(await parseAddresses(req.body));
    return res.sendStatus(200);
}));

router.post('/parse-address', piper(async (req, res) => {
    const t2 = R.map((t: Transaction) => t.toJson(), await parseAddresses(req.body));
    return res.send(t2);
}));

export default router;
