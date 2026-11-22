import pool from '../config/db.js';
import * as stockMovementModel from './stockMovementModel.js';

// ORD-001 for customer orders, RD-001 for direct purchases
const saleLabel = (saleType, id) =>
  `${saleType === 'order' ? 'ORD' : 'RD'}-${String(id).padStart(3, '0')}`;

const SALE_COLUMNS = `s.id, s.sale_type, s.customer_name,
  DATE_FORMAT(s.sale_date, '%Y-%m-%d') AS sale_date, s.status, s.total, s.created_at`;

//Retrieve (saleType is 'order', 'direct' or null for all)
export const fetch = async (saleType) => {
  const [rows] = await pool.query(
    `SELECT ${SALE_COLUMNS},
            CAST((SELECT COALESCE(SUM(si.quantity), 0) FROM sale_item si WHERE si.sale_id = s.id) AS SIGNED) AS item_count
     FROM sale s
     WHERE (? IS NULL OR s.sale_type = ?)
     ORDER BY s.sale_date DESC, s.id DESC`,
    [saleType, saleType]
  );
  return rows;
};

export const findSaleById = async (id) => {
  const [rows] = await pool.query(`SELECT ${SALE_COLUMNS} FROM sale s WHERE s.id = ?`, [id]);
  return rows;
};

export const fetchItems = async (saleId) => {
  const [rows] = await pool.query(
    `SELECT si.id, si.product_id, i.name AS product_name, si.quantity, si.unit_price
     FROM sale_item si
     JOIN inventory i ON i.id = si.product_id
     WHERE si.sale_id = ?
     ORDER BY si.id`,
    [saleId]
  );
  return rows;
};

// insert
// Saves the sale and its items. If the sale is Completed, the stock is deducted
// in the same transaction. If any product does not have enough stock,
// everything is rolled back and nothing is saved.
// items must already be sorted by productId (keeps locking order the same for every sale).
export const insert = async (sale, items) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO sale (sale_type, customer_name, sale_date, status, total) VALUES (?, ?, ?, ?, ?)",
      [sale.saleType, sale.customerName, sale.saleDate, sale.status, sale.total]
    );
    const saleId = result.insertId;

    for (const item of items) {
      await connection.query(
        "INSERT INTO sale_item (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [saleId, item.productId, item.quantity, item.unitPrice]
      );
    }

    if (sale.status === 'Completed') {
      for (const item of items) {
        await stockMovementModel.applyMovement(
          connection, item.productId, -item.quantity, 'sale', `Sale ${saleLabel(sale.saleType, saleId)}`
        );
      }
    }

    await connection.commit();
    return saleId;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

// update status
// Pending -> Completed deducts the stock.
// Completed -> Cancelled returns the stock.
// expectedStatus protects against two people changing the same sale at once.
export const updateStatus = async (id, expectedStatus, newStatus) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT sale_type, status FROM sale WHERE id = ? FOR UPDATE", [id]
    );
    if (rows.length === 0) {
      throw new Error('Sale does not exist!');
    }
    if (rows[0].status !== expectedStatus) {
      throw new Error('This sale was changed by someone else. Please refresh the page.');
    }

    const label = saleLabel(rows[0].sale_type, id);
    const [items] = await connection.query(
      "SELECT product_id, quantity FROM sale_item WHERE sale_id = ? ORDER BY product_id", [id]
    );

    if (expectedStatus === 'Pending' && newStatus === 'Completed') {
      for (const item of items) {
        await stockMovementModel.applyMovement(
          connection, item.product_id, -item.quantity, 'sale', `Sale ${label}`
        );
      }
    }
    if (expectedStatus === 'Completed' && newStatus === 'Cancelled') {
      for (const item of items) {
        await stockMovementModel.applyMovement(
          connection, item.product_id, item.quantity, 'sale', `Sale ${label} cancelled, stock returned`
        );
      }
    }

    await connection.query("UPDATE sale SET status = ? WHERE id = ?", [newStatus, id]);
    await connection.commit();
    return true;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};