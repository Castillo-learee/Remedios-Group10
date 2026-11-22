import pool from '../config/db.js';

// Retrieve
export const fetch = async () => {
  const [rows] = await pool.query("SELECT * FROM inventory ORDER BY id");
  return rows;
};

export const findProductById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM inventory WHERE id = ?", [id]);
  return rows;
};

export const findProductByNameAndCategory = async (name, category) => {
  const [rows] = await pool.query(
    "SELECT * FROM inventory WHERE name = ? AND category = ?",
    [name, category]
  );
  return rows;
};

// insert
export const insert = async (product) => {
  const [result] = await pool.query(
    "INSERT INTO inventory (name, category, price, stock) VALUES (?, ?, ?, ?)",
    [product.name, product.category, product.price, product.stock]
  );
  return result.insertId;
};

// update
export const update = async (product) => {
  const [result] = await pool.query(
    "UPDATE inventory SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?",
    [product.name, product.category, product.price, product.stock, product.id]
  );
  return result.affectedRows;
};

// delete
export const remove = async (id) => {
  const [result] = await pool.query("DELETE FROM inventory WHERE id = ?", [id]);
  return result.affectedRows;
};

// summary counts for the dashboard cards
export const summary = async () => {
  const [[row]] = await pool.query(`
    SELECT
      COUNT(*)                          AS totalProducts,
      COALESCE(SUM(stock), 0)           AS totalUnits,
      SUM(stock > 0 AND stock <= reorder_level) AS lowStock,
      SUM(stock = 0)                    AS outOfStock
    FROM inventory
  `);
  return {
    totalProducts: Number(row.totalProducts),
    totalUnits:    Number(row.totalUnits),
    lowStock:      Number(row.lowStock),
    outOfStock:    Number(row.outOfStock),
  };
};

// products whose stock is at or below their reorder level
export const fetchLowStock = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM inventory WHERE stock <= reorder_level ORDER BY stock ASC"
  );
  return rows;
};