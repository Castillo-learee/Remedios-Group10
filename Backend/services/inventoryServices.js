import * as inventoryModel from '../models/inventoryModel.js';

// validates and cleans the incoming product data
const cleanProduct = (product) => {
  const name = String(product.name ?? '').trim();
  const category = String(product.category ?? '').trim();

  if (!name || !category) {
    throw new Error('Name and Category are required!');
  }
  if (product.price === undefined || product.price === null || product.price === '') {
    throw new Error('Price is required!');
  }

  const price = Number(product.price);
  const stock = Number(product.stock ?? 0);

  if (Number.isNaN(price) || price < 0) {
    throw new Error('Price must be 0 or more!');
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('Stock must be a whole number, 0 or more!');
  }

  return { ...product, name, category, price, stock };
};

const doesProductExist = async (id) => {
  const existing = await inventoryModel.findProductById(id);
  return existing.length > 0;
};

export const fetchAllProducts = async () => {
  const products = await inventoryModel.fetch();
  return products;
};

// insert
export const createProduct = async (data) => {
  const product = cleanProduct(data);

  const duplicate = await inventoryModel.findProductByNameAndCategory(product.name, product.category);
  if (duplicate.length > 0) {
    throw new Error('Product already exists!');
  }

  const productId = await inventoryModel.insert(product);
  return productId;
};

// update
export const updateProduct = async (data) => {
  const product = cleanProduct(data);

  const existing = await doesProductExist(product.id);
  if (!existing) {
    throw new Error('Product does not exist!');
  }

  // another product with the same name and category is not allowed
  const duplicate = await inventoryModel.findProductByNameAndCategory(product.name, product.category);
  if (duplicate.some((p) => p.id !== product.id)) {
    throw new Error('Product already exists!');
  }

  const updatedProduct = await inventoryModel.update(product);
  return updatedProduct;
};

// delete
export const deleteProduct = async (id) => {
  const existing = await doesProductExist(id);
  if (!existing) {
    throw new Error('Product does not exist!');
  }

  const deletedProduct = await inventoryModel.remove(id);
  return deletedProduct;
};

export const fetchSummary = async () => {
  return await inventoryModel.summary();
};

export const fetchLowStock = async () => {
  return await inventoryModel.fetchLowStock();
};