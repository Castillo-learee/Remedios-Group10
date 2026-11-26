import * as saleController from '../controllers/saleController.js';
import express from "express";

const saleRoute = express.Router();

saleRoute.get('/', saleController.fetchAllSales);
saleRoute.get('/:id', saleController.fetchSale);
saleRoute.post('/', saleController.createSale);
saleRoute.put('/:id/status', saleController.updateSaleStatus);

export default saleRoute;