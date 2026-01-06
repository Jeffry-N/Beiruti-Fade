CREATE DATABASE beirutifade;
USE beirutifade;

-- 1. Customer Table
CREATE TABLE customer (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Username VARCHAR(100) UNIQUE NOT NULL,
    Email VARCHAR(100),
    Password VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Barber Table
CREATE TABLE barber (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Username VARCHAR(100) UNIQUE NOT NULL,
    Email VARCHAR(100),
    Password VARCHAR(255) NOT NULL,
    Bio TEXT,
    ImageUrl TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Service Table
CREATE TABLE service (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    Price DECIMAL(10, 2) NOT NULL,
    ImageUrl TEXT
);

-- 4. Product Table
CREATE TABLE product (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    Price DECIMAL(10, 2) NOT NULL,
    StockQuantity INT DEFAULT 0
);

-- 5. Appointment Table
CREATE TABLE appointment (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CustomerId INT NOT NULL,
    BarberId INT NOT NULL,
    ServiceId INT NOT NULL,
    AppointmentDate DATE NOT NULL,
    AppointmentTime TIME NOT NULL,
    Status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    
    -- Foreign Key Constraints
    CONSTRAINT fk_appointment_customer FOREIGN KEY (CustomerId) REFERENCES customer(Id),
    CONSTRAINT fk_appointment_barber FOREIGN KEY (BarberId) REFERENCES barber(Id),
    CONSTRAINT fk_appointment_service FOREIGN KEY (ServiceId) REFERENCES service(Id)
);

-- 6. Product Order Table (For Onsite Orders)
CREATE TABLE product_order (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CustomerId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT DEFAULT 1,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('ordered', 'picked_up', 'cancelled') DEFAULT 'ordered',
    
    -- Foreign Key Constraints
    CONSTRAINT fk_order_customer FOREIGN KEY (CustomerId) REFERENCES customer(Id),
    CONSTRAINT fk_order_product FOREIGN KEY (ProductId) REFERENCES product(Id)
);