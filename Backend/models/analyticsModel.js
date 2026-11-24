import pool from '../config/db.js';

export const fetchRevenueSummary = async (year, month) => {
  const [rows] = await pool.query(
    `SELECT
       COALESCE(SUM(s.total_amount), 0)   AS revenue,
       COALESCE(SUM(sd.quantity), 0)      AS unitsSold
     FROM sale s
     JOIN sale_details sd ON sd.sale_id = s.sale_id
     WHERE YEAR(s.sale_date) = ? AND MONTH(s.sale_date) = ?`,
    [year, month]
  );
  return rows[0];
};

export const fetchDailyRevenue = async (year, month) => {
  const [rows] = await pool.query(
    `SELECT DAY(s.sale_date) AS day, COALESCE(SUM(s.total_amount), 0) AS revenue
     FROM sale s
     WHERE YEAR(s.sale_date) = ? AND MONTH(s.sale_date) = ?
     GROUP BY DAY(s.sale_date)
     ORDER BY day`,
    [year, month]
  );
  return rows;
};

export const fetchOrderStatusCounts = async () => {
  const [rows] = await pool.query(
    `SELECT order_status AS status, COUNT(*) AS count
     FROM customer_order
     GROUP BY order_status`
  );
  return rows;
};

export const fetchTopProducts = async (limit = 5) => {
  const [rows] = await pool.query(
    `SELECT p.product_id AS id, p.product_name AS name, p.category, p.image,
            COALESCE(SUM(sd.quantity), 0) AS totalSold
     FROM product p
     LEFT JOIN sale_details sd ON sd.product_id = p.product_id
     WHERE p.status = 'active'
     GROUP BY p.product_id, p.product_name, p.category, p.image
     ORDER BY totalSold DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

export const fetchProductAnalytics = async () => {
  const [rows] = await pool.query(
    `SELECT p.product_id AS id, p.product_name AS name, p.category,
            p.price, p.stock_quantity AS stock, p.reorder_level,
            COALESCE(SUM(sd.quantity), 0) AS totalSold
     FROM product p
     LEFT JOIN sale_details sd ON sd.product_id = p.product_id
     WHERE p.status = 'active'
     GROUP BY p.product_id, p.product_name, p.category,
              p.price, p.stock_quantity, p.reorder_level
     ORDER BY p.product_name`
  );
  return rows;
};
