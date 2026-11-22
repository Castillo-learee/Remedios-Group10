import * as inventoryService from '../services/inventoryServices.js';

export const fetchAllProducts = async (req, res) => {
    try {
        const products = await inventoryService.fetchAllProducts();
        res.status(200).json(products);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// insert
export const createProduct = async (req, res) => {
    const { name, category, price, stock } = req.body;
    const product = { name, category, price, stock };

    try {
        const productId = await inventoryService.createProduct(product);
        res.status(200).json({
            success: true,
            message: productId
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// update
export const editProduct = async (req, res) => {
    const { name, category, price, stock } = req.body;
    const { id } = req.params;
    const product = { id: parseInt(id), name, category, price, stock };

    try {
        const updatedProduct = await inventoryService.updateProduct(product);
        res.status(200).json({
            success: true,
            message: updatedProduct
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// delete
export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedProduct = await inventoryService.deleteProduct(parseInt(id));
        res.status(200).json({
            success: true,
            message: deletedProduct
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const getSummary = async (req, res) => {
    try {
        const data = await inventoryService.fetchSummary();
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: `${e.message || 'Internal Server Error'}` });
    }
}

export const getLowStock = async (req, res) => {
    try {
        const data = await inventoryService.fetchLowStock();
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: `${e.message || 'Internal Server Error'}` });
    }
}