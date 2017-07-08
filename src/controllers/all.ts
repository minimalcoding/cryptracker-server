import * as express from 'express';
import transactionController from 'src/controllers/transactionController';

const ctrls = express.Router();

ctrls.use('/transaction', transactionController);

export default ctrls;