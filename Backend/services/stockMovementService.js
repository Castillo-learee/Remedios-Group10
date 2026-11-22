import * as stockMovementModel from '../models/stockMovementModel.js';
import * as inventoryModel from '../models/inventoryModel.js';

const VALID_TYPES = ['stock_in', 'adjustment_increase', 'adjustment_decrease'];

export const fetchAllStockMovements = async () => {
  return await stockMovementModel.fetch();
};

export const createStockMovement = async (movement) => {
  const productId = Number(movement.productId);
  const quantity  = Number(movement.quantity);
  const type      = String(movement.type ?? '').trim();
  const reason    = String(movement.reason ?? '').trim() || null;

  if (!productId) {
    throw new Error('Product is required!');
  }
  if (!movement.quantity) {
    throw new Error('Quantity is required!');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a whole number, 1 or more!');
  }
  if (!VALID_TYPES.includes(type)) {
    throw new Error('Invalid movement type!');
  }
  if (type.startsWith('adjustment') && !reason) {
    throw new Error('Reason is required for adjustments!');
  }

  const product = await inventoryModel.findProductById(productId);
  if (product.length === 0) {
    throw new Error('Product does not exist!');
  }

  return await stockMovementModel.insert(productId, quantity, type, reason);
};
