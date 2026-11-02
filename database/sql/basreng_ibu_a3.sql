-- Basreng Ibu A3 – skema + data awal MySQL (alternatif dari php artisan migrate --seed)
-- Import lewat phpMyAdmin atau: mysql -u root -p < basreng_ibu_a3.sql
CREATE DATABASE IF NOT EXISTS basreng_ibu_a3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE basreng_ibu_a3;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE personal_access_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id BIGINT UNSIGNED NOT NULL,
  name TEXT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  abilities TEXT NULL,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  KEY pat_tokenable (tokenable_type, tokenable_id),
  KEY pat_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT fk_products_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_sizes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(30) NOT NULL,
  price INT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT fk_sizes_prod FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE carts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT UNSIGNED NOT NULL,
  product_size_id BIGINT UNSIGNED NOT NULL,
  flavor VARCHAR(40) NOT NULL,
  qty INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_cart_item (cart_id, product_size_id, flavor),
  CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_size FOREIGN KEY (product_size_id) REFERENCES product_sizes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  status ENUM('Pending','Diproses','Dikirim','Selesai','Dibatalkan') NOT NULL DEFAULT 'Pending',
  total BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_size_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(255) NOT NULL,
  size_label VARCHAR(30) NOT NULL,
  flavor VARCHAR(40) NOT NULL,
  qty INT UNSIGNED NOT NULL,
  price INT UNSIGNED NOT NULL,
  subtotal BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_size FOREIGN KEY (product_size_id) REFERENCES product_sizes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL UNIQUE,
  method VARCHAR(40) NOT NULL,
  amount BIGINT UNSIGNED NOT NULL,
  status ENUM('Belum Dibayar','Dibayar') NOT NULL DEFAULT 'Belum Dibayar',
  paid_at TIMESTAMP NULL,
  proof VARCHAR(255) NULL,
  delivery_proof VARCHAR(255) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS=1;

-- Data awal
INSERT INTO users (name,email,phone,role,password,created_at,updated_at)
VALUES ('Admin Ibu A3','admin@basrengibua3.com','085267567133','admin','$2y$10$7RG/.Lh.FqWA3vjqrxf74u9jhrmgvaaSxjo17CR0KKUDuWrqP8lxe',NOW(),NOW());

INSERT INTO categories (id,name,slug,created_at,updated_at) VALUES
 (1,'Basreng','basreng',NOW(),NOW()),(2,'Pangsit','pangsit',NOW(),NOW());

INSERT INTO products (id,category_id,name,description,image,is_active,created_at,updated_at) VALUES
 (1,1,'Basreng Balok','Basreng potongan balok panjang, renyah di luar, gurih sampai ke dalam. Digoreng kering dan dibumbui.','/media/foto-1.jpg',1,NOW(),NOW()),
 (2,1,'Basreng Bulat','Basreng irisan bulat tipis, garing, mudah dikunyah dan cocok untuk semua umur.','/media/foto-2.jpg',1,NOW(),NOW()),
 (3,2,'Keripik Pangsit','Keripik pangsit garing dengan bumbu gurih. Teman ngemil paling pas.','/media/pangsit-1.jpg',1,NOW(),NOW());

INSERT INTO product_sizes (product_id,label,price,stock,created_at,updated_at) VALUES
 (1,'Pack 5K',5000,100,NOW(),NOW()),(1,'Pack 10K',10000,100,NOW(),NOW()),(1,'1/2 Kg',45000,100,NOW(),NOW()),(1,'1 Kg',90000,100,NOW(),NOW()),
 (2,'Pack 5K',5000,100,NOW(),NOW()),(2,'Pack 10K',10000,100,NOW(),NOW()),(2,'1/2 Kg',45000,100,NOW(),NOW()),(2,'1 Kg',90000,100,NOW(),NOW()),
 (3,'Pack 5K',5000,100,NOW(),NOW()),(3,'Pack 10K',10000,100,NOW(),NOW()),(3,'1/2 Kg',45000,100,NOW(),NOW()),(3,'1 Kg',90000,100,NOW(),NOW());
