import * as saleModel from '../models/saleModel.js';
import * as inventoryModel from '../models/inventoryModel.js';

const SALE_TYPES = ['order', 'direct'];

// which status changes are allowed
const TRANSITIONS = {
  Pending: ['Completed', 'Cancelled'],
  Completed: ['Cancelled'],
  Cancelled: [],
};

const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// rejects dates like 2026-02-31 (JavaScript would quietly turn them into March)
const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

export const fetchAllSales = async (saleType) => {
  if (saleType && !SALE_TYPES.includes(saleType)) {
    throw new Error('Invalid sale type!');
  }
  const sales = await saleModel.fetch(saleType || null);
  return sales;
};

export const fetchSaleById = async (id) => {
  const sale = await saleModel.findSaleById(id);
  if (sale.length === 0) {
    throw new Error('Sale does not exist!');
  }
  const items = await saleModel.fetchItems(id);
  return { ...sale[0], items };
};

// insert
// Direct purchases are Completed right away. Customer orders start Pending
// (or Completed). Completed sales deduct stock, and fail if stock is not enough.
export const createSale = async (data) => {
  if (!SALE_TYPES.includes(data.saleType)) {
    throw new Error('Invalid sale type!');
  }

  const customerName = String(data.customerName ?? '').trim();
  if (!customerName) {
    throw new Error('Customer name is required!');
  }
  if (customerName.length > 100) {
    throw new Error('Customer name must be 100 characters or less!');
  }

  const saleDate = data.saleDate || todayString();
  if (!isValidDate(saleDate)) {
    throw new Error('Date is not valid!');
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Add at least one product!');
  }

  // the same product on two rows is added together
  const quantities = new Map();
  for (const item of data.items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!productId) {
      throw new Error('Select a product for every row!');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be a whole number, 1 or more!');
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  let status = 'Completed';
  if (data.saleType === 'order') {
    status = data.status || 'Pending';
    if (!['Pending', 'Completed'].includes(status)) {
      throw new Error('A new order can only be Pending or Completed!');
    }
  }

  // prices come from the database, never from the browser
  const items = [];
  let totalCents = 0;
  for (const productId of [...quantities.keys()].sort((a, b) => a - b)) {
    const product = await inventoryModel.findProductById(productId);
    if (product.length === 0) {
      throw new Error('Product does not exist!');
    }
    const unitPrice = Number(product[0].price);
    const quantity = quantities.get(productId);
    items.push({ productId, quantity, unitPrice });
    totalCents += Math.round(unitPrice * 100) * quantity;
  }

  const saleId = await saleModel.insert(
    { saleType: data.saleType, customerName, saleDate, status, total: totalCents / 100 },
    items
  );
  return { saleId, status };
};

// update status
export const updateSaleStatus = async (id, newStatus) => {
  const found = await saleModel.findSaleById(id);
  if (found.length === 0) {
    throw new Error('Sale does not exist!');
  }
  const sale = found[0];

  if (sale.sale_type !== 'order') {
    throw new Error('Only customer orders can change status!');
  }
  if (!(TRANSITIONS[sale.status] || []).includes(newStatus)) {
    throw new Error(`An order that is ${sale.status} cannot be marked ${newStatus}!`);
  }

  await saleModel.updateStatus(id, sale.status, newStatus);
  return newStatus;
};