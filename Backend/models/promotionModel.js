import pool from '../config/db.js';

const COLS = `promotion_id, owner_id, promotion_name, description,
  discount_type, discount_value, voucher_code,
  DATE_FORMAT(start_date,'%Y-%m-%d') AS start_date,
  DATE_FORMAT(end_date,'%Y-%m-%d')   AS end_date,
  usage_limit, usage_count, promotion_status, created_at`;

export const fetch = async () => {
  const [rows] = await pool.query(`SELECT ${COLS} FROM promotion ORDER BY promotion_id DESC`);
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.query(`SELECT ${COLS} FROM promotion WHERE promotion_id = ?`, [id]);
  return rows;
};

export const findByVoucherCode = async (code) => {
  const [rows] = await pool.query(`SELECT ${COLS} FROM promotion WHERE voucher_code = ?`, [code]);
  return rows;
};

export const insert = async (p) => {
  const [result] = await pool.query(
    `INSERT INTO promotion
       (owner_id, promotion_name, description, discount_type, discount_value,
        voucher_code, start_date, end_date, usage_limit, promotion_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [p.ownerId, p.name, p.description || null,
     p.discountType, p.discountValue,
     p.voucherCode || null,
     p.startDate || null, p.endDate || null,
     p.usageLimit || null]
  );
  return result.insertId;
};

export const update = async (p) => {
  const [result] = await pool.query(
    `UPDATE promotion SET
       promotion_name = ?, description = ?,
       discount_type = ?, discount_value = ?,
       voucher_code = ?, start_date = ?, end_date = ?, usage_limit = ?
     WHERE promotion_id = ?`,
    [p.name, p.description || null,
     p.discountType, p.discountValue,
     p.voucherCode || null,
     p.startDate || null, p.endDate || null,
     p.usageLimit || null, p.id]
  );
  return result.affectedRows;
};

export const setStatus = async (id, status) => {
  const [result] = await pool.query(
    "UPDATE promotion SET promotion_status = ? WHERE promotion_id = ?", [status, id]
  );
  return result.affectedRows;
};

export const remove = async (id) => {
  const [result] = await pool.query("DELETE FROM promotion WHERE promotion_id = ?", [id]);
  return result.affectedRows;
};
