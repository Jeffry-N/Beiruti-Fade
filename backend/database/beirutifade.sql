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
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Service Table
CREATE TABLE service (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    Price DECIMAL(10, 2) NOT NULL
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

-- Insert Default Services
INSERT INTO service (Name, Description, Price) VALUES
('HAIRCUT', 'Classic professional haircut with styling', 25.00),
('SHAVING', 'Premium shaving service with beard treatment', 20.00),
('TREATMENT', 'Hair treatment and conditioning service', 35.00),
('BEARD CARE', 'Beard trimming and grooming service', 18.00),
('HAIR STYLE', 'Advanced hair styling and design', 30.00);

-- Insert Sample Barbers
INSERT INTO barber (FullName, Username, Email, Password, Bio) VALUES
('Steve Johnson', 'steve', 'steve@beirutifade.com', 'password123', 'Expert barber with 10 years experience'),
('Mike Davis', 'mike', 'mike@beirutifade.com', 'password123', 'Specialist in modern cuts and designs'),
('Alex Martinez', 'alex', 'alex@beirutifade.com', 'password123', 'Master of traditional and contemporary styles');

-- Insert Sample Customer
INSERT INTO customer (FullName, Username, Email, Password) VALUES
('John Doe', 'john', 'john@example.com', 'password123');