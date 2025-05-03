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
    
    // Create SQL function for getting employee salary
    await connection.query(`
      DROP FUNCTION IF EXISTS get_employee_salary;
    `);
    await connection.query(`
      CREATE FUNCTION get_employee_salary(empId INT) 
      RETURNS DECIMAL(10,2)
      DETERMINISTIC
      READS SQL DATA
      BEGIN
        DECLARE empSalary DECIMAL(10,2);
        SELECT Salary INTO empSalary FROM Employee WHERE Emp_ID = empId;
        RETURN empSalary;
      END;
    `);

    // Create trigger for expired stock
    await connection.query(`
      DROP TRIGGER IF EXISTS dispose_expired_stock;
    `);
    await connection.query(`
      CREATE TRIGGER dispose_expired_stock
      AFTER UPDATE ON Stock
      FOR EACH ROW
      BEGIN
        IF NEW.Exp_date < CURRENT_DATE() THEN
          INSERT INTO Disposal (Med_ID, Quantity)
          VALUES (NEW.Med_ID, NEW.Quantity);
        END IF;
      END;
    `);

    // Create stored procedure for order placement
    await connection.query(`
      DROP PROCEDURE IF EXISTS place_order_full;
    `);
    await connection.query(`
      CREATE PROCEDURE place_order_full (
        IN p_name VARCHAR(100),
        IN p_gender ENUM('Male', 'Female', 'Other'),
        IN p_age INT,
        IN p_address TEXT,
        IN p_phone VARCHAR(15),
        IN p_employeeId INT,
        IN p_orderItems JSON
      )
      BEGIN
        DECLARE v_customerId INT;
        DECLARE v_totalAmount DECIMAL(10,2) DEFAULT 0.0;
        DECLARE v_billNo INT;
        DECLARE v_medId INT;
        DECLARE v_quantity INT;
        DECLARE v_price DECIMAL(10,2);
        DECLARE v_stock INT;
        DECLARE done INT DEFAULT FALSE;
        DECLARE cur CURSOR FOR 
          SELECT JSON_UNQUOTE(JSON_EXTRACT(item, '$.Med_ID')),
                 JSON_UNQUOTE(JSON_EXTRACT(item, '$.Quantity'))
          FROM JSON_TABLE(p_orderItems, "$[*]"
            COLUMNS (
              item JSON PATH "$"
            )
          ) AS items;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        START TRANSACTION;
        
        -- Check if customer already exists
        SELECT Cust_ID INTO v_customerId FROM Customer WHERE Phone = p_phone LIMIT 1;
        
        IF v_customerId IS NULL THEN
          INSERT INTO Customer (Name, Gender, Age, Address, Phone)
          VALUES (p_name, p_gender, p_age, p_address, p_phone);
          SET v_customerId = LAST_INSERT_ID();
        END IF;
        
        -- Create bill first (will update amount later)
        INSERT INTO Bill (Cust_ID, Total_amount, Emp_ID)
        VALUES (v_customerId, 0.00, p_employeeId);
        
        SET v_billNo = LAST_INSERT_ID();

        -- Loop through order items
        OPEN cur;
        read_loop: LOOP
          FETCH cur INTO v_medId, v_quantity;
          IF done THEN
            LEAVE read_loop;
          END IF;
          
          -- Get medicine price
          SELECT cost_price INTO v_price FROM Medicine WHERE Med_ID = v_medId;
          
          IF v_price IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Medicine not found';
          END IF;
          
          -- Check stock
          SELECT Quantity INTO v_stock FROM Stock WHERE Med_ID = v_medId;
          
          IF v_stock IS NULL OR v_stock < v_quantity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
          END IF;
          
          -- Insert into Bill_details
          INSERT INTO Bill_details (Bill_no, Med_ID, Quantity)
          VALUES (v_billNo, v_medId, v_quantity);
          
          -- Update stock
          UPDATE Stock
          SET Quantity = Quantity - v_quantity
          WHERE Med_ID = v_medId;
          
          -- Add to total amount
          SET v_totalAmount = v_totalAmount + (v_price * v_quantity);
        END LOOP;
        
        CLOSE cur;
        
        -- Update bill with total amount
        UPDATE Bill
        SET Total_amount = v_totalAmount
        WHERE Bill_no = v_billNo;
        
        COMMIT;
      END;
    `);
    
    connection.release();
    console.log('Database initialized with functions, triggers, and procedures');
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

// Get salary of an employee
app.get('/api/employee/:empId/salary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT get_employee_salary(?) AS Salary
    `, [req.params.empId]);

    if (rows.length === 0 || rows[0].Salary === null) {
      return res.status(404).json({ error: 'Employee not found or salary missing' });
    }

    res.json({ salary: rows[0].Salary });
  } catch (error) {
    console.error('Error fetching employee salary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { customerDetails, orderItems, employeeId } = req.body;

    await connection.query(`
      CALL place_order_full(?, ?, ?, ?, ?, ?, ?)
    `, [
      customerDetails.Name,
      customerDetails.Gender,
      customerDetails.Age,
      customerDetails.Address,
      customerDetails.Phone,
      employeeId,
      JSON.stringify(orderItems) // pass orderItems as JSON
    ]);

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Error placing order:', error);
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