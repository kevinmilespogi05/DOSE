-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 14, 2025 at 11:06 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `project_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 3, '2025-03-13 07:20:21', '2025-03-13 07:20:21'),
(2, 5, '2025-03-13 07:49:45', '2025-03-13 07:49:45'),
(3, 4, '2025-03-13 08:04:06', '2025-03-13 08:04:06');

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`id`, `cart_id`, `medicine_id`, `quantity`, `created_at`, `updated_at`) VALUES
(7, 2, 5, 1, '2025-03-13 07:55:01', '2025-03-13 07:55:01'),
(8, 2, 6, 1, '2025-03-13 07:55:02', '2025-03-13 07:55:02'),
(14, 1, 15, 1, '2025-03-14 09:20:21', '2025-03-14 09:20:21'),
(15, 1, 1, 1, '2025-03-14 09:20:23', '2025-03-14 09:20:23'),
(16, 1, 2, 1, '2025-03-14 09:20:24', '2025-03-14 09:20:24'),
(17, 1, 3, 1, '2025-03-14 09:20:24', '2025-03-14 09:20:24'),
(18, 1, 4, 1, '2025-03-14 09:20:25', '2025-03-14 09:20:25'),
(19, 1, 5, 1, '2025-03-14 09:20:27', '2025-03-14 09:20:27');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `type` enum('IN','OUT') NOT NULL,
  `quantity` int(11) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`id`, `medicine_id`, `type`, `quantity`, `batch_number`, `transaction_date`, `user_id`, `supplier_id`, `unit_price`) VALUES
(1, 14, 'IN', 4, NULL, '2025-03-13 08:26:29', 4, 3, 22.50),
(2, 15, 'IN', 23, NULL, '2025-03-14 09:20:04', 4, 2, 24.94);

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `generic_name` varchar(100) DEFAULT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `unit` varchar(20) NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `supplier_id` int(11) DEFAULT NULL,
  `requires_prescription` tinyint(1) DEFAULT 0,
  `min_stock_level` int(11) DEFAULT 10,
  `max_stock_level` int(11) DEFAULT 100,
  `category_id` int(11) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT 'https://via.placeholder.com/400x300?text=Medicine+Image'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`id`, `name`, `generic_name`, `brand`, `category`, `description`, `price`, `stock_quantity`, `unit`, `expiry_date`, `created_at`, `updated_at`, `supplier_id`, `requires_prescription`, `min_stock_level`, `max_stock_level`, `category_id`, `image_url`) VALUES
(1, 'Paracetamol 500mg', 'Paracetamol', 'Tylenol', 'Pain Relief', 'For fever and mild pain', 5.99, 100, 'tablets', '2025-12-31', '2025-03-13 04:34:22', '2025-03-13 04:34:22', NULL, 0, 10, 100, NULL, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(2, 'Amoxicillin 250mg', 'Amoxicillin', 'Amoxil', 'Antibiotics', 'Broad-spectrum antibiotic', 12.99, 50, 'capsules', '2025-06-30', '2025-03-13 04:34:22', '2025-03-13 04:34:22', NULL, 0, 10, 100, NULL, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(3, 'Omeprazole 20mg', 'Omeprazole', 'Prilosec', 'Antacid', 'For acid reflux and ulcers', 15.99, 75, 'tablets', '2025-09-30', '2025-03-13 04:34:22', '2025-03-13 04:34:22', NULL, 0, 10, 100, NULL, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(4, 'Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', NULL, 'Strong antibiotic for bacterial infections', 15.99, 100, 'tablets', '2025-06-30', '2025-03-13 04:34:44', '2025-03-13 04:34:44', 1, 1, 20, 200, 1, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(5, 'Ibuprofen 200mg', 'Ibuprofen', 'Advil', NULL, 'Anti-inflammatory pain reliever', 8.99, 150, 'tablets', '2025-12-31', '2025-03-13 04:34:44', '2025-03-13 04:34:44', 2, 0, 30, 300, 2, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(6, 'Cetirizine 10mg', 'Cetirizine', 'Zyrtec', NULL, 'Antihistamine for allergies', 12.99, 80, 'tablets', '2025-09-30', '2025-03-13 04:34:44', '2025-03-13 04:34:44', 3, 0, 15, 150, 4, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(7, 'Vitamin C 500mg', 'Ascorbic Acid', 'VitaC', NULL, 'Immune system support', 9.99, 200, 'tablets', '2026-01-31', '2025-03-13 04:34:44', '2025-03-13 04:34:44', 2, 0, 40, 400, 5, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(8, 'Lisinopril 10mg', 'Lisinopril', 'Zestril', NULL, 'ACE inhibitor for blood pressure', 25.99, 60, 'tablets', '2025-08-31', '2025-03-13 04:34:44', '2025-03-13 04:34:44', 1, 1, 10, 100, 6, 'https://via.placeholder.com/400x300?text=Medicine+Image'),
(14, 'asdasdas', 'asdasd', 'asdasd', NULL, 'asdas', 22.50, 4, 'capsules', '2045-05-11', '2025-03-13 08:26:29', '2025-03-13 08:26:29', 3, 0, 10, 100, 3, NULL),
(15, 'parasatukmol', 'sa baliw', 'pang tanga', NULL, 'pang pogi lang', 24.94, 23, 'mg', '2025-03-15', '2025-03-14 09:20:04', '2025-03-14 09:20:04', 2, 0, 10, 100, 5, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `medicine_categories`
--

CREATE TABLE `medicine_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicine_categories`
--

INSERT INTO `medicine_categories` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'Antibiotics', 'Medicines that fight bacterial infections', '2025-03-13 04:34:44'),
(2, 'Pain Relief', 'For managing pain and fever', '2025-03-13 04:34:44'),
(3, 'Antacids', 'For digestive problems and acid reflux', '2025-03-13 04:34:44'),
(4, 'Antihistamines', 'For allergies and allergic reactions', '2025-03-13 04:34:44'),
(5, 'Vitamins', 'Nutritional supplements', '2025-03-13 04:34:44'),
(6, 'Cardiovascular', 'Heart and blood pressure medications', '2025-03-13 04:34:44');

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL,
  `patient_name` varchar(100) NOT NULL,
  `doctor_name` varchar(100) NOT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` enum('ACTIVE','COMPLETED','EXPIRED') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescription_items`
--

CREATE TABLE `prescription_items` (
  `id` int(11) NOT NULL,
  `prescription_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `instructions` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `email`, `phone`, `address`, `created_at`, `updated_at`) VALUES
(1, 'PharmaCorp Ltd', 'John Smith', 'john@pharmacorp.com', '123-456-7890', '123 Supplier St, City', '2025-03-13 04:34:44', '2025-03-13 04:34:44'),
(2, 'MediSupply Inc', 'Jane Doe', 'jane@medisupply.com', '098-765-4321', '456 Vendor Ave, Town', '2025-03-13 04:34:44', '2025-03-13 04:34:44'),
(3, 'GlobalMeds', 'Bob Wilson', 'bob@globalmeds.com', '555-123-4567', '789 Distribution Rd, State', '2025-03-13 04:34:44', '2025-03-13 04:34:44');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES
(2, 'superadmin', 'superadmin@example.com', '$2y$10$PQD.Y8OPwoKV2TlHOYVxeOJaZAZKhHyXXhvZ5tqUGtxYsG0Ej4wPm', 'admin', '2025-03-13 04:13:17', '2025-03-13 04:13:17'),
(3, 'kevin', 'kevin@gmail.com', '$2a$10$5Qtp8f0AziT5MNo3fwOPzuWC2YMXxQaCWZutR/YDj8igsgNRg.iV2', 'user', '2025-03-13 04:25:12', '2025-03-13 04:25:12'),
(4, 'admin', 'admin@example.com', '$2a$10$ohXuuCfIS1UK6.ycVvAxcO2OlBAPSIOzVwbnnDDR0l4eBPR95xiMG', 'admin', '2025-03-13 04:32:01', '2025-03-13 04:32:01'),
(5, 'lebron', 'lebron@gmail.com', '$2a$10$LQIpAd/VjX7b/H5eL1KhguT/wxh/hsdFyUhug.Bz5CgHNkn5FPNRe', 'user', '2025-03-13 07:49:35', '2025-03-13 07:49:35');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `idx_inventory_medicine` (`medicine_id`),
  ADD KEY `idx_inventory_date` (`transaction_date`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_medicine_name` (`name`),
  ADD KEY `idx_medicine_category` (`category`),
  ADD KEY `idx_medicine_brand` (`brand`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_medicine_expiry` (`expiry_date`);

--
-- Indexes for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prescription_status` (`status`);

--
-- Indexes for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_sessions_token` (`session_token`),
  ADD KEY `idx_sessions_expiry` (`expires_at`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_setting` (`user_id`,`setting_key`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prescription_items`
--
ALTER TABLE `prescription_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_cart_fk` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_medicine_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`);

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `inventory_transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `inventory_transactions_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `medicines`
--
ALTER TABLE `medicines`
  ADD CONSTRAINT `medicines_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `medicines_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `medicine_categories` (`id`);

--
-- Constraints for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD CONSTRAINT `prescription_items_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`),
  ADD CONSTRAINT `prescription_items_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`);

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
