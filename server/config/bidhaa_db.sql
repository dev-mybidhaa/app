-- Active: 1743164076293@@127.0.0.1@3306@bidhaa_db
USE bidhaa_db;

-- Safely drop tables if they exist (disable foreign key checks first)
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS admins;
-- DROP TABLE IF EXISTS books;
-- DROP TABLE IF EXISTS stationeries;
-- DROP TABLE IF EXISTS suppliers;
-- DROP TABLE IF EXISTS products;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Users table (for students, tutors, and shoppers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'tutor', 'shopper', 'school', 'parent_student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    admin_role ENUM('super_admin', 'manager', 'support', 'sales', 'finance') NOT NULL DEFAULT 'support',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);
-- Books table
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT,
    image_url VARCHAR(255),
    local_image_path VARCHAR(255),
    book_title VARCHAR(255) NOT NULL,
    book_code VARCHAR(50),
    price DECIMAL(10,2),
    publishers VARCHAR(255),
    grade_level VARCHAR(50),
    category VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop existing table if it exists
-- DROP TABLE IF EXISTS stationeries;

-- Create stationeries table
CREATE TABLE IF NOT EXISTS stationeries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stationery_id VARCHAR(50),
    image_url VARCHAR(255),
    stationery_name VARCHAR(255) NOT NULL,
    stationery_code VARCHAR(50),
    price DECIMAL(10,2),
    category VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_stationery_id (stationery_id)
);

-- -- Drop existing table if it exists
-- DROP TABLE IF EXISTS suppliers;

-- Create suppliers table with the correct columns
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplierID VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    commission DECIMAL(10,2),
    partner VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    quantity INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS playground_equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assistive_technology (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Assistive.csv'
INTO TABLE assistive_technology
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3, @col4, @col5, @col6, @col7)
SET 
    image_url = @col2,
    name = @col3,
    description = @col4,
    price = CASE
        WHEN @col5 IS NULL OR @col5 = '' THEN 0.00
        ELSE CAST(REPLACE(REPLACE(TRIM(@col5), 'KES', ''), ',', '') AS DECIMAL(10,2))
    END,
    category = @col6,
    stock_quantity = COALESCE(@col7, 0);

-- Create view for assistive technology
CREATE OR REPLACE VIEW assistive_technology_view AS
SELECT 
    id,
    name,
    image_url,
    description,
    price,
    category,
    stock_quantity,
    created_at,
    updated_at
FROM assistive_technology;


LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Playground.csv'
INTO TABLE playground_equipment
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3, @col4, @col5, @col6)
SET 
    id = @col1,
    image_url = @col2,
    name = @col3,
    price = CASE 
        WHEN @col4 IS NULL OR @col4 = '' THEN 0.00
        ELSE CAST(REPLACE(REPLACE(TRIM(@col4), 'KES', ''), ',', '') AS DECIMAL(10,2))
    END;

LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Books.csv'
INTO TABLE books
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3, @col4, @col5, @col6, @col7, @col8, @col9, @col10)
SET 
    book_id = @col2,
    image_url = @col3,
    local_image_path = @col4,
    book_title = @col5,
    book_code = @col6,
    price = NULLIF(TRIM(REPLACE(@col7, 'KES', '')), ''),
    publishers = @col8,
    grade_level = @col9,
    category = @col10;

-- Test query to verify table
SELECT * FROM books LIMIT 5;

-- Load stationeries data
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Stationeries.csv'
INTO TABLE stationeries
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3, @col4)
SET 
    image_url = @col1,
    stationery_name = @col2,
    price = @col3,
    stock_quantity = @col4;

-- First, drop the unique constraint
ALTER TABLE suppliers DROP INDEX unique_supplier_id;

-- Then load the data
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Suppliers.csv'
INTO TABLE suppliers
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3, @col4, @col5, @col6)
SET 
    supplierID = @col1,
    name = @col2,
    phone_number = @col3,
    email = @col4,
    commission = @col5,
    partner = UPPER(@col6);

-- Create science apparatus table
CREATE TABLE IF NOT EXISTS science_apparatus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

drop table if exists electronics;
CREATE TABLE IF NOT EXISTS electronics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Load electronics data --
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Electronics.csv'
INTO TABLE electronics
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3)
SET 
    image_url = @col1,
    name = @col2,
    price = CASE 
        WHEN @col3 IS NULL OR @col3 = '' THEN 0.00
        ELSE CAST(REPLACE(REPLACE(TRIM(@col3), 'KES', ''), ',', '') AS DECIMAL(10,2))
    END;

-- Load science apparatus data
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Apparatus.csv'
INTO TABLE science_apparatus
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(@col1, @col2, @col3)
SET 
    name = @col1,
    image_url = @col2,
    price = CAST(REPLACE(REPLACE(TRIM(@col3), 'KES', ''), ',', '') AS DECIMAL(10,2));

-- Load products data
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/Products.csv'
INTO TABLE products
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(@col1, @col2, @col3, @col4, @col5)
SET 
    image_url = @col1,
    name = @col2,
    price = @col3,
    quantity = @col4,
    created_by = (SELECT id FROM admins WHERE username = @col5 LIMIT 1);  -- Convert username to admin ID

-- Insert some test data
INSERT INTO users (username, email, password) 
VALUES ('testuser', 'test@example.com', 'password123')
ON DUPLICATE KEY UPDATE username=username;

insert into admins (username, email, password, admin_role)
values ('admin', 'admin@example.com', 'password123', 'super_admin')
ON DUPLICATE KEY UPDATE username=username;

-- Test query to verify table
SELECT * FROM users;

select * from admins;

-- Modify users table to ensure username uniqueness
ALTER TABLE users ADD UNIQUE (username);

SELECT * FROM users WHERE email = 'test@example.com';

SELECT * FROM admins WHERE admin_role = 'super_admin';

-- Test if we have any admins
SELECT * FROM admins;

-- If no super_admin exists, create one with a properly hashed password
INSERT INTO admins (username, email, password, admin_role)
VALUES (
    'super_admin',
    'admin@example.com',
    '$2b$10$8MzHhU5YMiVHzwc1yP.WqOxgkCWAUh4G9yEBcVaWzRf5n.WVxKLbC', -- Hashed 'password123'
    'super_admin'
) ON DUPLICATE KEY UPDATE username = username;

ALTER TABLE books ADD COLUMN local_image_path VARCHAR(255);

-- Verify super_admin exists
SELECT * FROM admins WHERE admin_role = 'super_admin';

select * from books;

select * from publishers;

select * from stationeries;

ALTER TABLE products MODIFY created_by INT NULL;

UPDATE books 
SET image_url = REPLACE(image_url, '/images/books', '/books');

show tables;

select * from books limit 10;

select * from stationeries;

select * from products;

select * from suppliers;

select * from publishers;

select * from science_apparatus;

select * from playground_equipment;

select * from electronics;

select * from assistive_technology;

select * from assistive_technology_view;