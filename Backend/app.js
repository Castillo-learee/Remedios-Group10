import express from "express";
import cors from 'cors';

import inventoryRoute from './routes/inventoryRoute.js';
import stockMovementRoute from './routes/stockMovementRoute.js';

let corsOptions = {
    origin: 'http://localhost:5173',
}

const app = express();

app.use(express.json());
app.use(cors(corsOptions));

app.use('/inventory', inventoryRoute);
app.use('/stock-movement', stockMovementRoute);

try {
    const port = 3001;
    app.listen(port, () => {
        console.log(`listening to port ${port}...`);
    });
} catch (e) {
    console.log(e);
}