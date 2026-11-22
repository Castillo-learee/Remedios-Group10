import pool from '../config/db.js';

// Retrieve all movements with the product name joined in
export const fetch = async () => {
  const [rows] = await pool.query(
    `SELECT sm.id, sm.product_id, i.name AS product_name,
            sm.movement_type, sm.previous_stock,
            sm.quantity_change, sm.updated_stock,
            sm.reason, sm.created_at
     FROM stock_movement sm
     JOIN inventory i ON i.id = sm.product_id
     ORDER BY sm.created_at DESC, sm.id DESC`
  );
  return rows;
};

/**
 * Records a stock movement and updates inventory.stock in one transaction.
 *
 * movementType: 'stock_in' | 'adjustment_increase' | 'adjustment_decrease'
 * quantity:     positive integer — always the absolute amount
 * reason:       optional string
 */
export const insert = async (productId, quantity, movementType, reason) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT stock FROM inventory WHERE id = ? FOR UPDATE",
      [productId]
    );
    const previousStock = rows[0].stock;

    // quantity_change is signed: positive for in/increase, negative for decrease
    const isDecrease = movementType === 'adjustment_decrease';
    const quantityChange = isDecrease ? -quantity : quantity;
    const updatedStock = previousStock + quantityChange;

    if (updatedStock < 0) {
      throw new Error('Stock cannot go below zero.');
    }

    // Map the two adjustment sub-types to the DB enum value 'adjustment'
    const dbMovementType =
      movementType === 'stock_in' ? 'stock_in' : 'adjustment';

    await connection.query(
      "UPDATE inventory SET stock = ? WHERE id = ?",
      [updatedStock, productId]
    );

    const [result] = await connection.query(
      `INSERT INTO stock_movement
         (product_id, movement_type, previous_stock, quantity_change, updated_stock, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, dbMovementType, previousStock, quantityChange, updatedStock, reason || null]
    );

    await connection.commit();
    return result.insertId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};
