CREATE DATABASE IF NOT EXISTS remedios;
USE remedios;

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inventory_name_category (name, category)
);

INSERT INTO inventory (name, category, price, stock, reorder_level) VALUES
  ('Native Hat', 'Native Products', 180.00, 24, 10),
  ('Plastic Basin', 'Plasticware', 180.00, 6, 10);

-- quantity_change is signed: + when stock goes up, - when it goes down
CREATE TABLE IF NOT EXISTS stock_movement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  movement_type ENUM('stock_in', 'adjustment', 'sale') NOT NULL DEFAULT 'stock_in',
  previous_stock INT NOT NULL,
  quantity_change INT NOT NULL,
  updated_stock INT NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES inventory(id) ON DELETE RESTRICT
);

INSERT INTO stock_movement (product_id, movement_type, previous_stock, quantity_change, updated_stock, reason, created_at) VALUES
  (1, 'stock_in', 10, 14, 24, 'Supplier delivery', '2026-10-21 09:00:00');