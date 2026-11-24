import * as analyticsService from '../services/analyticsService.js';

export const getSalesSummary = async (req, res) => {
    try {
        const data = await analyticsService.getSalesSummary(req.query.year, req.query.month);
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const getSalesTrend = async (req, res) => {
    try {
        const data = await analyticsService.getSalesTrend(req.query.year, req.query.month);
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const getOrderStatus = async (req, res) => {
    try {
        const data = await analyticsService.getOrderStatusCounts();
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const getTopProducts = async (req, res) => {
    try {
        const data = await analyticsService.getTopProducts();
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const getProductAnalytics = async (req, res) => {
    try {
        const data = await analyticsService.getProductAnalytics();
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}
