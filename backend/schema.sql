-- -- Drop existing tables in reverse order of dependencies
-- DROP TABLE IF EXISTS inventory_transactions;
-- DROP TABLE IF EXISTS inventory;
-- DROP TABLE IF EXISTS prescriptions;
-- DROP TABLE IF EXISTS medications;
-- DROP TABLE IF EXISTS symptom_history;
-- DROP TABLE IF EXISTS patient_medical_history;
-- DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    role ENUM('patient', 'doctor', 'pharmacist', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create patient medical history table
CREATE TABLE IF NOT EXISTS patient_medical_history (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    allergies JSON,
    conditions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

-- Create symptom history table
CREATE TABLE IF NOT EXISTS symptom_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    symptoms TEXT NOT NULL,
    severity ENUM('mild', 'moderate', 'severe') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    description TEXT,
    dosage TEXT,
    frequency VARCHAR(100),
    price DECIMAL(10,2) DEFAULT 0.00,
    unit VARCHAR(50) DEFAULT 'tablets',
    expiry_date DATE,
    reorder_point INT DEFAULT 20,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id VARCHAR(36) NOT NULL,
    medication_id INT NOT NULL,
    prescribed_by VARCHAR(36) NOT NULL,
    dosage TEXT NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('pending', 'active', 'completed', 'cancelled', 'approved') DEFAULT 'pending',
    generic_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantity INT,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    approved_by VARCHAR(36) NULL,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (medication_id) REFERENCES medications(id),
    FOREIGN KEY (prescribed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY,
    medication_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    last_restocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
);

-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id VARCHAR(36) PRIMARY KEY,
    inventory_id VARCHAR(36) NOT NULL,
    transaction_type ENUM('restock', 'dispense') NOT NULL,
    quantity INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- Ensure id field in patient_medical_history has a default value
ALTER TABLE patient_medical_history MODIFY COLUMN id INT AUTO_INCREMENT;

-- Remove the triggers that enforce doctor-only prescriptions
-- DELIMITER //
-- CREATE TRIGGER validate_prescriber_role
-- BEFORE INSERT ON prescriptions
-- FOR EACH ROW
-- BEGIN
--     DECLARE prescriber_role VARCHAR(20);
--     SELECT role INTO prescriber_role FROM users WHERE id = NEW.prescribed_by;
--     IF prescriber_role != 'doctor' THEN
--         SIGNAL SQLSTATE '45000' 
--         SET MESSAGE_TEXT = 'Only doctors can prescribe medications';
--     END IF;
-- END;//

-- CREATE TRIGGER validate_prescriber_role_update
-- BEFORE UPDATE ON prescriptions
-- FOR EACH ROW
-- BEGIN
--     DECLARE prescriber_role VARCHAR(20);
--     IF NEW.prescribed_by != OLD.prescribed_by THEN
--         SELECT role INTO prescriber_role FROM users WHERE id = NEW.prescribed_by;
--         IF prescriber_role != 'doctor' THEN
--             SIGNAL SQLSTATE '45000' 
--             SET MESSAGE_TEXT = 'Only doctors can prescribe medications';
--         END IF;
--     END IF;
-- END;//
-- DELIMITER ; 