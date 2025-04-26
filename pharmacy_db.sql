-- EMPLOYEE table
CREATE TABLE EMPLOYEE (
    Emp_ID INT(5) NOT NULL,
    Emp_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    age INT(5) NOT NULL,
    start_date DATE NOT NULL,
    role VARCHAR(255) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Emp_ID)
);

INSERT INTO EMPLOYEE VALUES (10, 'Arjun', 'male', 25, STR_TO_DATE('18-Oct-1997', '%d-%b-%Y'), 'Worker', 10000);
INSERT INTO EMPLOYEE VALUES (20, 'Sheetal', 'female', 32, STR_TO_DATE('07-Jun-1998', '%d-%b-%Y'), 'Admin', 40000);
INSERT INTO EMPLOYEE VALUES (30, 'Rihaan', 'male', 35, STR_TO_DATE('07-Sep-2003', '%d-%b-%Y'), 'Cashier', 35000);
INSERT INTO EMPLOYEE VALUES (40, 'Riya', 'female', 28, STR_TO_DATE('15-Feb-2023', '%d-%b-%Y'), 'Worker', 12000);
INSERT INTO EMPLOYEE VALUES (50, 'Priya', 'female', 40, STR_TO_DATE('23-Aug-2002', '%d-%b-%Y'), 'Admin', 45000);

-- EMP_PHONE table
CREATE TABLE EMP_PHONE (
    Emp_ID INT(5),
    Emp_phone BIGINT(10),
    PRIMARY KEY (Emp_ID, Emp_phone),
    FOREIGN KEY (Emp_ID) REFERENCES EMPLOYEE(Emp_ID) ON DELETE CASCADE
);

INSERT INTO EMP_PHONE VALUES (10, 8865321940);
INSERT INTO EMP_PHONE VALUES (20, 7889231780);
INSERT INTO EMP_PHONE VALUES (30, 9115623480);
INSERT INTO EMP_PHONE VALUES (40, 7338926130);
INSERT INTO EMP_PHONE VALUES (50, 7930270450);

-- MEDICINE table (create before STOCK due to foreign key)
CREATE TABLE MEDICINE (
    Med_ID INT(5),
    Med_name VARCHAR(255) NOT NULL,
    Manufacturer VARCHAR(255) NOT NULL,
    expiry_date DATE NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Med_ID)
);

INSERT INTO MEDICINE VALUES (101, 'Paracetamol', 'Cipla', STR_TO_DATE('29-Oct-2023', '%d-%b-%Y'), 24);
INSERT INTO MEDICINE VALUES (102, 'Amlokind-AT', 'Mankind Pharma', STR_TO_DATE('25-Dec-2024', '%d-%b-%Y'), 40);
INSERT INTO MEDICINE VALUES (103, 'Albendazole', 'Cadila Healthcare', STR_TO_DATE('04-Nov-2025', '%d-%b-%Y'), 8);
INSERT INTO MEDICINE VALUES (104, 'Betnovate', 'Glaxo SmithKline', STR_TO_DATE('06-Mar-2026', '%d-%b-%Y'), 45);
INSERT INTO MEDICINE VALUES (105, 'Benadryl', 'Johnson & Johnson', STR_TO_DATE('16-Apr-2025', '%d-%b-%Y'), 110);
INSERT INTO MEDICINE VALUES (106, 'Librium 10 tablet', 'Abbott Laboratories', STR_TO_DATE('18-Dec-2024', '%d-%b-%Y'), 100);

-- STOCK table
CREATE TABLE STOCK (
    Med_ID INT(5) NOT NULL,
    Med_Name VARCHAR(255) NOT NULL,
    Gender VARCHAR(10),
    Quantity INT(5) NOT NULL,
    Exp_Date DATE NOT NULL,
    Category VARCHAR(100),
    Batch_No VARCHAR(20) NOT NULL,
    Batch_Price DECIMAL(8,2),
    PRIMARY KEY (Med_ID, Batch_No),
    FOREIGN KEY (Med_ID) REFERENCES MEDICINE(Med_ID) ON DELETE CASCADE
);

-- Insert into STOCK (sample data)
INSERT INTO STOCK VALUES (101, 'Paracetamol', 'Any', 100, STR_TO_DATE('29-Oct-2023', '%d-%b-%Y'), 'Pain Relief', 'B001', 20.00);
INSERT INTO STOCK VALUES (102, 'Amlokind-AT', 'Any', 50, STR_TO_DATE('25-Dec-2024', '%d-%b-%Y'), 'Blood Pressure', 'B002', 35.00);
INSERT INTO STOCK VALUES (103, 'Albendazole', 'Any', 75, STR_TO_DATE('04-Nov-2025', '%d-%b-%Y'), 'Antiparasitic', 'B003', 6.50);

-- CUSTOMER table
CREATE TABLE CUSTOMER (
    Cust_ID INT(5) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    Age INT(3) NOT NULL,
    Address VARCHAR(255),
    Phone BIGINT(10),
    PRIMARY KEY (Cust_ID)
);

INSERT INTO CUSTOMER VALUES (21, 'Sudha', 'Female', 35, 'Mylapore, Chennai', 9876543210);
INSERT INTO CUSTOMER VALUES (25, 'Rahul', 'Male', 29, 'Andheri, Mumbai', 9123456780);
INSERT INTO CUSTOMER VALUES (32, 'Sneha', 'Female', 31, 'Koramangala, Bangalore', 9988776655);
INSERT INTO CUSTOMER VALUES (45, 'Ajay', 'Male', 42, 'Salt Lake, Kolkata', 9090909090);
INSERT INTO CUSTOMER VALUES (50, 'Nikita', 'Female', 27, 'Baner, Pune', 8899776655);

-- COMPANY table
CREATE TABLE COMPANY (
    NAME VARCHAR(50) PRIMARY KEY,
    COUNTRY VARCHAR(50) NOT NULL,
    PHONE VARCHAR(20),
    EMAIL VARCHAR(255)
);

INSERT INTO COMPANY VALUES ('Cipla', 'India', '+91-22-23082891', 'info@cipla.com');
INSERT INTO COMPANY VALUES ('Mankind Pharma', 'India', '+91-11-46581000', 'contactus@mankindpharma.com');
INSERT INTO COMPANY VALUES ('Cadila Healthcare', 'India', '+91-79-26852484', 'info@cadilapharma.co.in');
INSERT INTO COMPANY VALUES ('Glaxo SmithKline', 'UK', '+44-20-80475000', 'ukcustomerservices@gsk.com');
INSERT INTO COMPANY VALUES ('Johnson & Johnson', 'USA', '+1-732-524-0400', 'jnj@jnj.com');
INSERT INTO COMPANY VALUES ('Abbott Laboratories', 'USA', '+1-224-667-6100', 'corpcomm@abbott.com');

-- DISPOSAL Table
CREATE TABLE DISPOSAL (
    Med_id INT(5) NOT NULL,
    Quantity INT(10) NOT NULL,
    PRIMARY KEY (Med_id),
    FOREIGN KEY (Med_id) REFERENCES MEDICINE(Med_ID) ON DELETE CASCADE
);

INSERT INTO DISPOSAL VALUES (102, 10);
INSERT INTO DISPOSAL VALUES (106, 1);
INSERT INTO DISPOSAL VALUES (103, 3);
INSERT INTO DISPOSAL VALUES (101, 5);
INSERT INTO DISPOSAL VALUES (105, 7);
INSERT INTO DISPOSAL VALUES (104, 2);

-- BILL Table
CREATE TABLE BILL (
    bill_no INT(10) NOT NULL,
    Customer_id INT(10) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    bill_date DATE NOT NULL,
    e_id INT(10) NOT NULL,
    PRIMARY KEY (bill_no),
    FOREIGN KEY (Customer_id) REFERENCES CUSTOMER(Cust_ID) ON DELETE CASCADE,
    FOREIGN KEY (e_id) REFERENCES EMPLOYEE(Emp_ID) ON DELETE CASCADE
);

INSERT INTO BILL VALUES (123456, 25, 350, STR_TO_DATE('11-Jan-2023', '%d-%b-%Y'), 10);
INSERT INTO BILL VALUES (983210, 32, 475, STR_TO_DATE('13-Jan-2023', '%d-%b-%Y'), 30);
INSERT INTO BILL VALUES (789012, 21, 225, STR_TO_DATE('15-Mar-2023', '%d-%b-%Y'), 30);
INSERT INTO BILL VALUES (901234, 45, 800, STR_TO_DATE('17-Apr-2023', '%d-%b-%Y'), 50);
INSERT INTO BILL VALUES (345678, 50, 175, STR_TO_DATE('23-Apr-2023', '%d-%b-%Y'), 40);

-- BILL_DETAILS Table
CREATE TABLE BILL_DETAILS (
    bill_no INT(10) NOT NULL,
    med_id INT(10) NOT NULL,
    Quantity INT(10) NOT NULL,
    PRIMARY KEY (bill_no, med_id),
    FOREIGN KEY (bill_no) REFERENCES BILL(bill_no) ON DELETE CASCADE,
    FOREIGN KEY (med_id) REFERENCES MEDICINE(Med_ID) ON DELETE CASCADE
);

INSERT INTO BILL_DETAILS VALUES (123456, 105, 3);
INSERT INTO BILL_DETAILS VALUES (983210, 106, 4);
INSERT INTO BILL_DETAILS VALUES (789012, 103, 5);
INSERT INTO BILL_DETAILS VALUES (789012, 102, 8);
INSERT INTO BILL_DETAILS VALUES (345678, 105, 10);

-- Add foreign key between MEDICINE and COMPANY (optional based on your needs)
ALTER TABLE MEDICINE 
ADD FOREIGN KEY (Manufacturer) REFERENCES COMPANY(NAME) ON DELETE CASCADE;

-- MySQL equivalent of the PL/SQL functionality:
-- Function to get employee salary
DELIMITER //
CREATE FUNCTION get_employee_salary(emp_id INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE sal DECIMAL(10,2);
    SELECT salary INTO sal FROM employee WHERE Emp_ID = emp_id;
    RETURN sal;
END //
DELIMITER ;

-- Trigger to validate employee salary
DELIMITER //
CREATE TRIGGER employee_salary_trigger
BEFORE INSERT OR UPDATE ON EMPLOYEE
FOR EACH ROW
BEGIN
    IF NEW.salary < 10000 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Employee salary must be at least 10000';
    END IF;
END //
DELIMITER ;

-- Trigger to update expiry date after inserting into STOCK
DELIMITER //
CREATE TRIGGER update_expiry_date
AFTER INSERT ON STOCK
FOR EACH ROW
BEGIN
    UPDATE MEDICINE
    SET expiry_date = NEW.Exp_Date
    WHERE Med_ID = NEW.Med_ID;
END //
DELIMITER ;