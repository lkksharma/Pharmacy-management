// Backend Structure (server.js)
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  database: 'pdb',
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and tables
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Customer (
        Cust_ID INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Gender ENUM('Male', 'Female', 'Other') NOT NULL,
        Age INT,
        Address TEXT,
        Phone VARCHAR(15)
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Employee (
        Emp_ID INT AUTO_INCREMENT PRIMARY KEY,
        Emp_Name VARCHAR(100) NOT NULL,
        Gender ENUM('Male', 'Female', 'Other') NOT NULL,
        Age INT,
        Start_Date DATE,
        Role VARCHAR(50),
        Phone_number VARCHAR(15),
        Salary DECIMAL(10, 2)
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Medicine (
        Med_ID INT AUTO_INCREMENT PRIMARY KEY,
        Med_Name VARCHAR(100) NOT NULL,
        Manufacturer VARCHAR(100),
        Expiry_date DATE,
        cost_price DECIMAL(10, 2)
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Stock (
        Med_ID INT,
        Med_Name VARCHAR(100) NOT NULL,
        Gender VARCHAR(20),
        Quantity INT DEFAULT 0,
        Exp_date DATE,
        Category VARCHAR(50),
        Batch_price DECIMAL(10, 2),
        FOREIGN KEY (Med_ID) REFERENCES Medicine(Med_ID)
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Company (
        Name VARCHAR(100) PRIMARY KEY,
        Country VARCHAR(50),
        Phone VARCHAR(15),
        Email VARCHAR(100)
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Disposal (
        Med_ID INT,
        Quantity INT,
        FOREIGN KEY (Med_ID) REFERENCES Medicine(Med_ID)
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Bill (
        Bill_no INT AUTO_INCREMENT PRIMARY KEY,
        Cust_ID INT,
        Total_amount DECIMAL(10, 2),
        Bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        Emp_ID INT,
        FOREIGN KEY (Cust_ID) REFERENCES Customer(Cust_ID),
        FOREIGN KEY (Emp_ID) REFERENCES Employee(Emp_ID)
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Bill_details (
        Bill_no INT,
        Med_ID INT,
        Quantity INT,
        FOREIGN KEY (Bill_no) REFERENCES Bill(Bill_no),
        FOREIGN KEY (Med_ID) REFERENCES Medicine(Med_ID),
        PRIMARY KEY (Bill_no, Med_ID)
      );
    `);
    
    // Insert sample data
    await connection.query(`
      INSERT IGNORE INTO Medicine (Med_ID, Med_Name, Manufacturer, Expiry_date, cost_price)
      VALUES 
        (1, 'Paracetamol', 'ABC Pharma', '2025-12-31', 5.00),
        (2, 'Amoxicillin', 'XYZ Pharmaceuticals', '2024-06-30', 12.50),
        (3, 'Ibuprofen', 'Medico Labs', '2023-12-31', 8.75);
    `);
    
    await connection.query(`
      INSERT IGNORE INTO Stock (Med_ID, Med_Name, Gender, Quantity, Exp_date, Category, Batch_price)
      VALUES 
        (1, 'Paracetamol', 'Any', 100, '2025-12-31', 'Pain Relief', 4.50),
        (2, 'Amoxicillin', 'Any', 50, '2024-06-30', 'Antibiotic', 10.00),
        (3, 'Ibuprofen', 'Any', 30, '2023-12-31', 'Anti-inflammatory', 7.25);
    `);
    
    await connection.query(`
      INSERT IGNORE INTO Employee (Emp_ID, Emp_Name, Gender, Age, Start_Date, Role, Phone_number, Salary)
      VALUES 
        (1, 'John Doe', 'Male', 30, '2020-01-15', 'Pharmacist', '1234567890', 50000),
        (2, 'Jane Smith', 'Female', 28, '2021-03-10', 'Cashier', '0987654321', 35000);
    `);
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initDatabase();

// API Routes
// Get all medicines
app.get('/api/medicines', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.Med_ID, m.Med_Name, m.Manufacturer, m.Expiry_date, m.cost_price, 
             s.Quantity, s.Category, s.Exp_date 
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get expired medicines
app.get('/api/medicines/expired', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(`
      SELECT m.Med_ID, m.Med_Name, m.Manufacturer, m.Expiry_date, m.cost_price, 
             s.Quantity, s.Category 
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
      WHERE s.Exp_date < ?
    `, [today]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching expired medicines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check medicine availability
app.get('/api/medicines/:medId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.Med_ID, m.Med_Name, s.Quantity, s.Exp_date 
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
      WHERE m.Med_ID = ?
    `, [req.params.medId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error checking medicine availability:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { customerDetails, orderItems, employeeId } = req.body;
    
    // Insert or update customer
    let customerId;
    if (customerDetails.Cust_ID) {
      // Update existing customer
      customerId = customerDetails.Cust_ID;
      await connection.query(`
        UPDATE Customer
        SET Name = ?, Gender = ?, Age = ?, Address = ?, Phone = ?
        WHERE Cust_ID = ?
      `, [
        customerDetails.Name, 
        customerDetails.Gender, 
        customerDetails.Age, 
        customerDetails.Address, 
        customerDetails.Phone,
        customerId
      ]);
    } else {
      // Insert new customer
      const [customerResult] = await connection.query(`
        INSERT INTO Customer (Name, Gender, Age, Address, Phone)
        VALUES (?, ?, ?, ?, ?)
      `, [
        customerDetails.Name, 
        customerDetails.Gender, 
        customerDetails.Age, 
        customerDetails.Address, 
        customerDetails.Phone
      ]);
      customerId = customerResult.insertId;
    }
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of orderItems) {
      const [priceRows] = await connection.query(`
        SELECT cost_price FROM Medicine WHERE Med_ID = ?
      `, [item.Med_ID]);
      
      if (priceRows.length === 0) {
        throw new Error(`Medicine with ID ${item.Med_ID} not found`);
      }
      
      totalAmount += priceRows[0].cost_price * item.Quantity;
      
      // Check stock availability
      const [stockRows] = await connection.query(`
        SELECT Quantity FROM Stock WHERE Med_ID = ?
      `, [item.Med_ID]);
      
      if (stockRows.length === 0 || stockRows[0].Quantity < item.Quantity) {
        throw new Error(`Insufficient stock for medicine ID ${item.Med_ID}`);
      }
    }
    
    // Create bill
    const [billResult] = await connection.query(`
      INSERT INTO Bill (Cust_ID, Total_amount, Emp_ID)
      VALUES (?, ?, ?)
    `, [customerId, totalAmount, employeeId]);
    
    const billNo = billResult.insertId;
    
    // Create bill details and update stock
    for (const item of orderItems) {
      await connection.query(`
        INSERT INTO Bill_details (Bill_no, Med_ID, Quantity)
        VALUES (?, ?, ?)
      `, [billNo, item.Med_ID, item.Quantity]);
      
      await connection.query(`
        UPDATE Stock
        SET Quantity = Quantity - ?
        WHERE Med_ID = ?
      `, [item.Quantity, item.Med_ID]);
    }
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Order created successfully',
      billNo,
      customerId,
      totalAmount
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  } finally {
    connection.release();
  }
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});