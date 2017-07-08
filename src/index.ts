import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as R from 'ramda';

import { Exception } from 'src/errors';
import ctrls from 'src/controllers/all';

const PORT = 56432;

const app = express();

app.use(bodyParser.json());
app.use('/api', ctrls);

// Errors handling.
app.use((err, req, res, next) => {
    if (err instanceof Exception) {
        return res.status(err.code).send(err);
    }
    console.error(err);
    return res.sendStatus(500);
});

// Starts the server.
app.listen(PORT, () => {
    console.log('API started on port 56432');
});
