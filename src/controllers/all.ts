import * as express from 'express';
import transactionController from 'src/controllers/transactionController';
import importController from 'src/controllers/importController';

const ctrls = express.Router();

ctrls.use('/transaction', transactionController);
ctrls.use('/import', importController);

export default ctrls;