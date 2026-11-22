import * as saleService from '../services/saleServices.js';

// GET /sale?type=order  or  /sale?type=direct
export const fetchAllSales = async (req, res) => {
    try {
        const sales = await saleService.fetchAllSales(req.query.type);
        res.status(200).json(sales);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// view one sale with its items
export const fetchSale = async (req, res) => {
    const { id } = req.params;

    try {
        const sale = await saleService.fetchSaleById(parseInt(id));
        res.status(200).json(sale);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// insert
export const createSale = async (req, res) => {
    const { saleType, customerName, saleDate, status, items } = req.body;
    const sale = { saleType, customerName, saleDate, status, items };

    try {
        const saved = await saleService.createSale(sale);
        res.status(200).json({
            success: true,
            message: saved.saleId,
            status: saved.status
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// update status (Complete or Cancel an order)
export const updateSaleStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        const newStatus = await saleService.updateSaleStatus(parseInt(id), status);
        res.status(200).json({
            success: true,
            message: newStatus
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}