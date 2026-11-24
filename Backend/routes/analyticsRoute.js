import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';

const analyticsRoute = express.Router();

analyticsRoute.get('/summary', analyticsController.getSalesSummary);
analyticsRoute.get('/trend', analyticsController.getSalesTrend);
analyticsRoute.get('/order-status', analyticsController.getOrderStatus);
analyticsRoute.get('/top-products', analyticsController.getTopProducts);
analyticsRoute.get('/products', analyticsController.getProductAnalytics);

export default analyticsRoute;
