import * as promotionService from '../services/promotionService.js';

export const fetchAll = async (req, res) => {
    try {
        const rows = await promotionService.fetchAll(req.query);
        res.status(200).json(rows);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const fetchOne = async (req, res) => {
    const { id } = req.params;

    try {
        const row = await promotionService.fetchById(parseInt(id));
        res.status(200).json(row);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const create = async (req, res) => {
    const data = req.body;

    try {
        const id = await promotionService.create(data);
        res.status(200).json({
            success: true,
            message: id
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const update = async (req, res) => {
    const { id } = req.params;

    try {
        await promotionService.update(parseInt(id), req.body);
        res.status(200).json({ success: true });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const toggleEnabled = async (req, res) => {
    const { id }      = req.params;
    const { enabled } = req.body;

    try {
        await promotionService.toggleEnabled(parseInt(id), enabled !== false && enabled !== 0);
        res.status(200).json({ success: true });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const remove = async (req, res) => {
    const { id } = req.params;

    try {
        await promotionService.remove(parseInt(id));
        res.status(200).json({ success: true });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}
