const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const dbConfig = {
  host: "127.0.0.1",
  user: "root",
  password: "password",
  database: "pdb",
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and tables (normalized schema)
async function initDatabase() {
  try {
    const connection = await pool.getConnection();

    // Customer: split Address into area & city
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Customer (
        Cust_ID INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Gender ENUM('Male','Female','Other') NOT NULL,
        Age INT,
        Area VARCHAR(100),
        City VARCHAR(100),
        Phone VARCHAR(15)
      );
    `);

    // Employee: remove phone, salary stays
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Employee (
        Emp_ID INT AUTO_INCREMENT PRIMARY KEY,
        Emp_Name VARCHAR(100) NOT NULL,
        Gender ENUM('Male','Female','Other') NOT NULL,
        Age INT,
        Start_Date DATE,
        Role VARCHAR(50),
        Salary DECIMAL(10,2)
      );
    `);

    // Employee phone in separate table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Emp_Phone (
        Emp_ID INT,
        Emp_phone VARCHAR(15),
        PRIMARY KEY (Emp_ID, Emp_phone),
        FOREIGN KEY (Emp_ID) REFERENCES Employee(Emp_ID) ON DELETE CASCADE
      );
    `);

    // Medicine unchanged
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Medicine (
      Med_ID INT AUTO_INCREMENT PRIMARY KEY,
      Med_Name VARCHAR(100) NOT NULL,
      Manufacturer VARCHAR(100),
      Expiry_date DATE,
      cost_price DECIMAL(10,2)
      );
    `);

    // Stock: composite key (Med_ID, Batch_no)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Stock (
        Med_ID INT,
        Batch_no INT,
        Med_Name VARCHAR(100) NOT NULL,
        Quantity INT DEFAULT 0,
        Exp_date DATE,
        Category VARCHAR(50),
        Batch_price DECIMAL(10,2),
        PRIMARY KEY (Med_ID, Batch_no),
        FOREIGN KEY (Med_ID) REFERENCES Medicine(Med_ID) ON DELETE CASCADE
      );
    `);

    // Company unchanged
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Company (
        Name VARCHAR(100) PRIMARY KEY,
        Country VARCHAR(50),
        Phone VARCHAR(15),
        Email VARCHAR(100)
      );
    `);

    // Disposal: Med_ID as PK
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Disposal (
        Med_ID INT PRIMARY KEY,
        Quantity INT,
        FOREIGN KEY (Med_ID) REFERENCES Medicine(Med_ID) ON DELETE CASCADE
      );
    `);

    // Bill unchanged
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Bill (
        Bill_no INT AUTO_INCREMENT PRIMARY KEY,
        Cust_ID INT,
        Total_amount DECIMAL(10,2),
        Bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        Emp_ID INT,
        FOREIGN KEY (Cust_ID) REFERENCES Customer(Cust_ID) ON DELETE CASCADE,
        FOREIGN KEY (Emp_ID) REFERENCES Employee(Emp_ID) ON DELETE CASCADE
      );
    `);

    // Bill_details unchanged
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Bill_details (
        Bill_no INT,
        Med_ID INT,
        Quantity INT,
        PRIMARY KEY (Bill_no, Med_ID),
        FOREIGN KEY (Bill_no) REFERENCES Bill(Bill_no) ON DELETE CASCADE,
        FOREIGN KEY (Med_ID) REFERENCES Medicine(Med_ID) ON DELETE CASCADE
      );
    `);

    // Sample data (adjusted)
    await connection.query(`
      INSERT IGNORE INTO Medicine (Med_ID, Med_Name, Manufacturer, Expiry_date, cost_price)
      VALUES
        (1,'Paracetamol','ABC Pharma','2025-12-31',5.00),
        (2,'Amoxicillin','XYZ Pharmaceuticals','2024-06-30',12.50),
        (3,'Ibuprofen','Medico Labs','2023-12-31',8.75);
    `);

    await connection.query(`
      INSERT IGNORE INTO Stock (Med_ID, Batch_no, Med_Name, Quantity, Exp_date, Category, Batch_price)
      VALUES
        (1,101,'Paracetamol',100,'2025-12-31','Pain Relief',4.50),
        (2,201,'Amoxicillin',50,'2024-06-30','Antibiotic',10.00),
        (3,301,'Ibuprofen',30,'2023-12-31','Anti-inflammatory',7.25);
    `);

    await connection.query(`
      INSERT IGNORE INTO Employee (Emp_ID, Emp_Name, Gender, Age, Start_Date, Role, Salary)
      VALUES
        (1,'John Doe','Male',30,'2020-01-15','Pharmacist',50000),
        (2,'Jane Smith','Female',28,'2021-03-10','Cashier',35000);
    `);
    await connection.query(`
      INSERT IGNORE INTO Emp_Phone (Emp_ID, Emp_phone)
      VALUES
        (1,'1234567890'),
        (2,'0987654321');
    `);

    // Function get_employee_salary
    await connection.query(`DROP FUNCTION IF EXISTS get_employee_salary;`);
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

    // Trigger for expired stock
    await connection.query(`DROP TRIGGER IF EXISTS dispose_expired_stock;`);
    await connection.query(`
      CREATE TRIGGER dispose_expired_stock
      AFTER UPDATE ON Stock
      FOR EACH ROW
      BEGIN
        IF NEW.Exp_date < CURRENT_DATE() THEN
          INSERT INTO Disposal (Med_ID, Quantity)
          VALUES (NEW.Med_ID, NEW.Quantity)
          ON DUPLICATE KEY UPDATE Quantity = NEW.Quantity;
        END IF;
      END;
    `);

    // Stored procedure: updated for area & city
    await connection.query(`DROP PROCEDURE IF EXISTS place_order_full;`);
    await connection.query(`
      CREATE PROCEDURE place_order_full(
        IN p_name VARCHAR(100),
        IN p_gender ENUM('Male','Female','Other'),
        IN p_age INT,
        IN p_area VARCHAR(100),
        IN p_city VARCHAR(100),
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
        DECLARE i INT DEFAULT 0;
        DECLARE cnt INT;
        SET cnt = JSON_LENGTH(p_orderItems);
        START TRANSACTION;
        SELECT Cust_ID INTO v_customerId FROM Customer WHERE Phone = p_phone LIMIT 1;
        IF v_customerId IS NULL THEN
          INSERT INTO Customer (Name,Gender,Age,Area,City,Phone)
          VALUES (p_name,p_gender,p_age,p_area,p_city,p_phone);
          SET v_customerId = LAST_INSERT_ID();
        END IF;
        INSERT INTO Bill (Cust_ID,Total_amount,Emp_ID) VALUES (v_customerId,0.00,p_employeeId);
        SET v_billNo = LAST_INSERT_ID();
        WHILE i < cnt DO
          SET v_medId = JSON_UNQUOTE(JSON_EXTRACT(p_orderItems, CONCAT('$[',i,'].Med_ID')));
          SET v_quantity = JSON_UNQUOTE(JSON_EXTRACT(p_orderItems, CONCAT('$[',i,'].Quantity')));
          SELECT cost_price INTO v_price FROM Medicine WHERE Med_ID = v_medId;
          IF v_price IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Medicine not found'; END IF;
          SELECT Quantity INTO v_stock FROM Stock WHERE Med_ID = v_medId LIMIT 1;
          IF v_stock < v_quantity THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Insufficient stock'; END IF;
          INSERT INTO Bill_details (Bill_no,Med_ID,Quantity) VALUES (v_billNo,v_medId,v_quantity);
          UPDATE Stock SET Quantity = Quantity - v_quantity WHERE Med_ID = v_medId;
          SET v_totalAmount = v_totalAmount + (v_price * v_quantity);
          SET i = i + 1;
        END WHILE;
        UPDATE Bill SET Total_amount = v_totalAmount WHERE Bill_no = v_billNo;
        COMMIT;
      END;
    `);

    connection.release();
    console.log("Database initialized (normalized)");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

initDatabase();

// API Routes

// Get all medicines
app.get("/api/medicines", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.Med_ID, m.Med_Name, m.Manufacturer, m.Expiry_date, m.cost_price,
             s.Batch_no, s.Quantity, s.Category, s.Exp_date
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get expired medicines
// Get expired medicines
app.get("/api/medicines/expired", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await pool.query(
      `SELECT m.Med_ID, m.Med_Name, s.Batch_no, s.Quantity, s.Exp_date
       FROM Medicine m
       JOIN Stock s ON m.Med_ID = s.Med_ID
       WHERE s.Exp_date < ?`,
      [today]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching expired medicines:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Check medicine availability
app.get("/api/medicines/:medId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT m.Med_ID, m.Med_Name, s.Batch_no, s.Quantity, s.Exp_date
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
      WHERE m.Med_ID = ?
    `,
      [req.params.medId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Medicine not found" });
    res.json(rows[0]); // Return only the first result since React component expects a single object
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get salary of an employee
app.get("/api/employee/:empId/salary", async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT get_employee_salary(?) AS salary`, [req.params.empId]);
    if (rows.length === 0 || rows[0].salary === null)
      return res.status(404).json({ error: "Employee not found or salary missing" });
    res.json({ salary: rows[0].salary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add new medicine
app.post("/api/medicines", async (req, res) => {
  const { Med_Name, Manufacturer, Expiry_date, cost_price, Batch_no, Quantity, Category, Batch_price } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      "INSERT INTO Medicine (Med_Name, Manufacturer, Expiry_date, cost_price) VALUES (?, ?, ?, ?)",
      [Med_Name, Manufacturer, Expiry_date, cost_price]
    );
    const medId = result.insertId;
    await connection.query(
      "INSERT INTO Stock (Med_ID, Batch_no, Med_Name, Quantity, Exp_date, Category, Batch_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [medId, Batch_no, Med_Name, Quantity, Expiry_date, Category, Batch_price]
    );
    await connection.commit();
    res.status(201).json({ message: "Medicine added successfully", medId });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding medicine:", err);
    res.status(500).json({ error: "Error adding medicine" });
  } finally {
    connection.release();
  }
});

// Place order
app.post("/api/createOrder", async (req, res) => {
  const { customerDetails, orderItems, employeeId } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if customer exists by phone number
    const [existingCustomer] = await connection.query(
      "SELECT Cust_ID FROM Customer WHERE Phone = ?",
      [customerDetails.Phone]
    );
    
    let customerId;
    
    if (existingCustomer.length > 0) {
      // Use existing customer
      customerId = existingCustomer[0].Cust_ID;
    } else {
      // Create new customer - split Address into Area and City
      const addressParts = customerDetails.Address ? customerDetails.Address.split(',') : ['', ''];
      const area = addressParts[0]?.trim() || '';
      const city = addressParts.length > 1 ? addressParts[1].trim() : '';
      
      const [result] = await connection.query(
        "INSERT INTO Customer (Name, Gender, Age, Area, City, Phone) VALUES (?, ?, ?, ?, ?, ?)",
        [customerDetails.Name, customerDetails.Gender, customerDetails.Age, area, city, customerDetails.Phone]
      );
      
      customerId = result.insertId;
    }
    
    // Create bill
    const [billResult] = await connection.query(
      "INSERT INTO Bill (Cust_ID, Total_amount, Emp_ID) VALUES (?, 0, ?)",
      [customerId, employeeId]
    );
    
    const billNo = billResult.insertId;
    
    // Add bill details and calculate total
    let totalAmount = 0;
    
    for (const item of orderItems) {
      // Get medicine price
      const [medicineResult] = await connection.query(
        "SELECT cost_price FROM Medicine WHERE Med_ID = ?",
        [item.Med_ID]
      );
      
      if (medicineResult.length === 0) {
        throw new Error(`Medicine with ID ${item.Med_ID} not found`);
      }
      
      const price = medicineResult[0].cost_price;
      
      // Check stock
      const [stockResult] = await connection.query(
        "SELECT Quantity FROM Stock WHERE Med_ID = ?",
        [item.Med_ID]
      );
      
      if (stockResult.length === 0 || stockResult[0].Quantity < item.Quantity) {
        throw new Error(`Insufficient stock for medicine with ID ${item.Med_ID}`);
      }
      
      // Add to bill details
      await connection.query(
        "INSERT INTO Bill_details (Bill_no, Med_ID, Quantity) VALUES (?, ?, ?)",
        [billNo, item.Med_ID, item.Quantity]
      );
      
      // Update stock
      await connection.query(
        "UPDATE Stock SET Quantity = Quantity - ? WHERE Med_ID = ?",
        [item.Quantity, item.Med_ID]
      );
      
      // Calculate subtotal
      const subtotal = price * item.Quantity;
      totalAmount += subtotal;
    }
    
    // Update bill with total amount
    await connection.query(
      "UPDATE Bill SET Total_amount = ? WHERE Bill_no = ?",
      [totalAmount, billNo]
    );
    
    await connection.commit();
    res.status(200).json({ billNo });
    
  } catch (error) {
    await connection.rollback();
    console.error("Order creation failed:", error);
    res.status(500).json({ error: error.message || "Order creation failed" });
  } finally {
    connection.release();
  }
});

// Get all employees with their phones
app.get("/api/employees", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.Emp_ID, e.Emp_Name, e.Gender, e.Age, e.Start_Date, e.Role, e.Salary,
             GROUP_CONCAT(p.Emp_phone) AS Phone_Numbers
      FROM Employee e
      LEFT JOIN Emp_Phone p ON e.Emp_ID = p.Emp_ID
      GROUP BY e.Emp_ID
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all customers
app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT Cust_ID, Name, Gender, Age, 
             CONCAT(Area, ', ', City) AS Address, 
             Phone
      FROM Customer
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get bills with customer and employee details
app.get("/api/bills", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.Bill_no, b.Total_amount, b.Bill_date,
             c.Name AS Customer_Name, c.Phone AS Customer_Phone,
             e.Emp_Name AS Employee_Name
      FROM Bill b
      JOIN Customer c ON b.Cust_ID = c.Cust_ID
      JOIN Employee e ON b.Emp_ID = e.Emp_ID
      ORDER BY b.Bill_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Add these API endpoints to your Express server file

// Update medicine stock (add or dispose)
app.put("/api/medicines/:medId/stock", async (req, res) => {
  const { Batch_no, Quantity, action } = req.body;
  const medId = parseInt(req.params.medId);
  
  if (!medId || !Batch_no || !Quantity || !action) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  if (!['add', 'dispose'].includes(action)) {
    return res.status(400).json({ error: "Invalid action type" });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // First, check if medicine exists and get current quantity
    const [medResult] = await connection.query(
      "SELECT s.Quantity FROM Stock s WHERE s.Med_ID = ? AND s.Batch_no = ?",
      [medId, Batch_no]
    );
    
    if (medResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Medicine batch not found" });
    }
    
    const currentQuantity = medResult[0].Quantity;
    
    if (action === 'dispose' && currentQuantity < Quantity) {
      await connection.rollback();
      return res.status(400).json({ error: "Cannot dispose more than available stock" });
    }
    
    // Update stock quantity
    let newQuantity;
    if (action === 'add') {
      newQuantity = currentQuantity + parseInt(Quantity);
    } else { // dispose
      newQuantity = currentQuantity - parseInt(Quantity);
    }
    
    await connection.query(
      "UPDATE Stock SET Quantity = ? WHERE Med_ID = ? AND Batch_no = ?",
      [newQuantity, medId, Batch_no]
    );
    
    // If disposing, add to Disposal table
    if (action === 'dispose') {
      // Check if exists in Disposal table
      const [disposalResult] = await connection.query(
        "SELECT * FROM Disposal WHERE Med_ID = ?",
        [medId]
      );
      
      if (disposalResult.length > 0) {
        // Update existing disposal record
        await connection.query(
          "UPDATE Disposal SET Quantity = Quantity + ? WHERE Med_ID = ?",
          [parseInt(Quantity), medId]
        );
      } else {
        // Create new disposal record
        await connection.query(
          "INSERT INTO Disposal (Med_ID, Quantity) VALUES (?, ?)",
          [medId, parseInt(Quantity)]
        );
      }
    }
    
    await connection.commit();
    res.status(200).json({ 
      message: `Stock ${action === 'add' ? 'increased' : 'disposed'} successfully`,
      newQuantity 
    });
    
  } catch (err) {
    await connection.rollback();
    console.error("Error updating stock:", err);
    res.status(500).json({ error: "Error updating stock" });
  } finally {
    connection.release();
  }
});

// Get all medicines with batch info (updated for composite key)
app.get("/api/medicines", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.Med_ID, m.Med_Name, m.Manufacturer, m.Expiry_date, m.cost_price,
             s.Batch_no, s.Quantity, s.Category, s.Exp_date
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get expired medicines (updated)
app.get("/api/medicines/expired", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await pool.query(
      `
      SELECT m.Med_ID, m.Med_Name, m.Manufacturer, m.Expiry_date, m.cost_price,
             s.Batch_no, s.Quantity, s.Category, s.Exp_date
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
      WHERE s.Exp_date < ?
    `,
      [today]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Check medicine availability with batch info
app.get("/api/medicines/:medId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT m.Med_ID, m.Med_Name, s.Batch_no, s.Quantity, s.Exp_date
      FROM Medicine m
      JOIN Stock s ON m.Med_ID = s.Med_ID
      WHERE m.Med_ID = ?
    `,
      [req.params.medId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Medicine not found" });
    
    // If multiple batches exist, return them all
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add new medicine with batch info
app.post("/api/medicines", async (req, res) => {
  const { Med_Name, Manufacturer, Expiry_date, cost_price, Batch_no, Quantity, Category, Batch_price } = req.body;
  
  // Validate required fields
  if (!Med_Name || !Manufacturer || !Expiry_date || !cost_price || 
      !Batch_no || !Quantity || !Category || !Batch_price) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // First check if medicine with this name already exists
    const [existingMed] = await connection.query(
      "SELECT Med_ID FROM Medicine WHERE Med_Name = ?",
      [Med_Name]
    );
    
    let medId;
    
    if (existingMed.length > 0) {
      // Use existing medicine ID
      medId = existingMed[0].Med_ID;
      
      // Update medicine details if needed
      await connection.query(
        "UPDATE Medicine SET Manufacturer = ?, Expiry_date = ?, cost_price = ? WHERE Med_ID = ?",
        [Manufacturer, Expiry_date, cost_price, medId]
      );
    } else {
      // Insert new medicine
      const [result] = await connection.query(
        "INSERT INTO Medicine (Med_Name, Manufacturer, Expiry_date, cost_price) VALUES (?, ?, ?, ?)",
        [Med_Name, Manufacturer, Expiry_date, cost_price]
      );
      medId = result.insertId;
    }
    
    // Check if this batch already exists
    const [existingBatch] = await connection.query(
      "SELECT * FROM Stock WHERE Med_ID = ? AND Batch_no = ?",
      [medId, Batch_no]
    );
    
    if (existingBatch.length > 0) {
      // Update existing batch
      await connection.query(
        "UPDATE Stock SET Quantity = Quantity + ?, Exp_date = ?, Category = ?, Batch_price = ? WHERE Med_ID = ? AND Batch_no = ?",
        [Quantity, Expiry_date, Category, Batch_price, medId, Batch_no]
      );
    } else {
      // Add new batch
      await connection.query(
        "INSERT INTO Stock (Med_ID, Batch_no, Med_Name, Quantity, Exp_date, Category, Batch_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [medId, Batch_no, Med_Name, Quantity, Expiry_date, Category, Batch_price]
      );
    }
    
    await connection.commit();
    res.status(201).json({ 
      message: "Medicine added successfully", 
      medId,
      batchNo: Batch_no 
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding medicine:", err);
    res.status(500).json({ error: "Error adding medicine" });
  } finally {
    connection.release();
  }
});

// Get disposal information
app.get("/api/disposal", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.Med_ID, m.Med_Name, d.Quantity
      FROM Disposal d
      JOIN Medicine m ON d.Med_ID = m.Med_ID
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Get bill details
app.get("/api/bills/:billNo", async (req, res) => {
  try {
    // Get bill header
    const [billHeader] = await pool.query(`
      SELECT b.Bill_no, b.Total_amount, b.Bill_date,
             c.Name AS Customer_Name, c.Phone AS Customer_Phone,
             e.Emp_Name AS Employee_Name
      FROM Bill b
      JOIN Customer c ON b.Cust_ID = c.Cust_ID
      JOIN Employee e ON b.Emp_ID = e.Emp_ID
      WHERE b.Bill_no = ?
    `, [req.params.billNo]);
    
    if (billHeader.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }
    
    // Get bill items
    const [billItems] = await pool.query(`
      SELECT bd.Med_ID, m.Med_Name, bd.Quantity, m.cost_price,
             (bd.Quantity * m.cost_price) AS Subtotal
      FROM Bill_details bd
      JOIN Medicine m ON bd.Med_ID = m.Med_ID
      WHERE bd.Bill_no = ?
    `, [req.params.billNo]);
    
    res.json({
      bill: billHeader[0],
      items: billItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Server start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));