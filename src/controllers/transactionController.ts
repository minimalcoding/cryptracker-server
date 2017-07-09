import * as express from 'express';
import piper from 'src/tools/piper';
import { Transaction } from 'src/dao/Transaction';

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

export default router;
