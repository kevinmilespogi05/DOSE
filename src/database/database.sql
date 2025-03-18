-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 18, 2025 at 04:28 AM
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
(34, 1, 16, 1, '2025-03-18 02:59:53', '2025-03-18 02:59:53');

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
(3, 16, 'IN', 30, NULL, '2025-03-18 02:51:17', 4, 1, 10.00),
(4, 17, 'IN', 75, NULL, '2025-03-18 03:04:09', 4, 2, 25.00),
(5, 18, 'IN', 75, NULL, '2025-03-18 03:05:57', 4, 2, 25.00),
(6, 19, 'IN', 40, NULL, '2025-03-18 03:06:41', 4, 3, 20.00),
(7, 20, 'IN', 90, NULL, '2025-03-18 03:08:22', 4, 2, 5.00),
(8, 21, 'IN', 60, NULL, '2025-03-18 03:09:06', 4, 1, 12.00),
(9, 22, 'IN', 75, NULL, '2025-03-18 03:17:25', 4, 3, 20.00),
(10, 23, 'IN', 45, NULL, '2025-03-18 03:18:02', 4, 2, 18.00),
(11, 24, 'IN', 80, NULL, '2025-03-18 03:18:52', 4, 1, 12.00),
(12, 25, 'IN', 70, NULL, '2025-03-18 03:19:52', 4, 3, 8.00),
(13, 26, 'IN', 48, NULL, '2025-03-18 03:20:44', 4, 1, 18.00),
(14, 27, 'IN', 50, NULL, '2025-03-18 03:21:23', 4, 2, 22.00),
(15, 28, 'IN', 35, NULL, '2025-03-18 03:22:18', 4, 3, 12.00),
(16, 29, 'IN', 55, NULL, '2025-03-18 03:23:07', 4, 2, 28.00),
(17, 30, 'IN', 60, NULL, '2025-03-18 03:24:01', 4, 3, 30.00),
(18, 31, 'IN', 45, NULL, '2025-03-18 03:24:58', 4, 1, 18.00);

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
(16, 'Cetirizine', 'Cetirizine', 'AllerCare', NULL, NULL, 10.00, 30, 'tablets', '2027-11-15', '2025-03-18 02:51:17', '2025-03-18 03:02:56', 1, 1, 10, 100, 4, '/images/medicines/medicine-1742266313085.png'),
(17, 'Omeprazole', 'Omeprazole', 'Omezol', NULL, NULL, 15.00, 50, 'tablets', '2026-12-12', '2025-03-18 03:04:09', '2025-03-18 03:05:16', 3, 0, 10, 100, 3, '/images/medicines/medicine-1742267049716.png'),
(18, 'Amoxicillin', 'Amoxicillin', 'AmoCare', NULL, NULL, 25.00, 75, 'capsules', '2025-09-05', '2025-03-18 03:05:57', '2025-03-18 03:05:57', 2, 0, 10, 100, 1, '/images/medicines/medicine-1742267157362.png'),
(19, 'Losartan', 'Losartan Potassium', 'CardioSafe', NULL, NULL, 20.00, 40, 'tablets', '2027-11-15', '2025-03-18 03:06:41', '2025-03-18 03:07:22', 3, 0, 10, 100, 6, '/images/medicines/medicine-1742267241910.png'),
(20, 'Paracetamol', 'Paracetamol', 'PainAway', NULL, NULL, 5.00, 90, 'tablets', '2026-03-22', '2025-03-18 03:08:22', '2025-03-18 03:08:22', 2, 0, 10, 100, 2, '/images/medicines/medicine-1742267302037.png'),
(21, 'Ascorbic Acid', 'Vitamin C', 'VitaBoost', NULL, NULL, 12.00, 60, 'tablets', '2027-10-30', '2025-03-18 03:09:06', '2025-03-18 03:09:06', 1, 0, 10, 100, 5, '/images/medicines/medicine-1742267346487.png'),
(22, 'Multivitamins', 'Multivitamins', 'VitaComplete', NULL, NULL, 20.00, 75, 'tablets', '2027-03-14', '2025-03-18 03:17:25', '2025-03-18 03:17:25', 3, 0, 10, 100, 5, '/images/medicines/medicine-1742267845660.png'),
(23, 'Ferrous Sulfate', 'Iron Supplement', 'FerroStrong', NULL, NULL, 18.00, 45, 'capsules', '2026-12-28', '2025-03-18 03:18:02', '2025-03-18 03:18:02', 2, 0, 10, 100, 5, '/images/medicines/medicine-1742267882304.png'),
(24, 'Mefenamic Acid', 'Mefenamic Acid', 'Mefenax', NULL, NULL, 12.00, 80, 'capsules', '2025-07-05', '2025-03-18 03:18:52', '2025-03-18 03:18:52', 1, 0, 10, 100, 2, '/images/medicines/medicine-1742267932238.png'),
(25, 'Ibuprofen', 'Ibuprofen', 'IbuRelief', NULL, NULL, 8.00, 70, 'tablets', '2026-10-11', '2025-03-18 03:19:52', '2025-03-18 03:19:52', 3, 0, 10, 100, 2, '/images/medicines/medicine-1742267991905.png'),
(26, 'Metoprolol', 'Metoprolol', 'BetaCare', NULL, NULL, 18.00, 48, 'tablets', '2027-09-22', '2025-03-18 03:20:44', '2025-03-18 03:20:44', 1, 0, 10, 100, 6, '/images/medicines/medicine-1742268044871.png'),
(27, 'Amlodipine', 'Amlodipine', 'CardioTone', NULL, NULL, 22.00, 50, 'tablets', '2026-05-10', '2025-03-18 03:21:23', '2025-03-18 03:21:23', 2, 0, 10, 100, 6, '/images/medicines/medicine-1742268082971.png'),
(28, 'Loratadine', 'Loratadine', 'LoraFast', NULL, NULL, 12.00, 35, 'tablets', '2026-11-15', '2025-03-18 03:22:18', '2025-03-18 03:22:18', 3, 0, 10, 100, 4, '/images/medicines/medicine-1742268137814.png'),
(29, 'Cefalexin', 'Cefalexin', 'CefaPlus', NULL, NULL, 28.00, 55, 'capsules', '2026-04-02', '2025-03-18 03:23:07', '2025-03-18 03:23:07', 2, 0, 10, 100, 1, '/images/medicines/medicine-1742268186917.png'),
(30, 'Azithromycin', 'Azithromycin', 'AzitroMed', NULL, NULL, 30.00, 60, 'tablets', '2027-06-18', '2025-03-18 03:24:01', '2025-03-18 03:24:01', 3, 0, 10, 100, 1, '/images/medicines/medicine-1742268241000.png'),
(31, 'Ranitidine', 'Ranitidine', 'RaniRelief', NULL, NULL, 18.00, 45, 'tablets', '2025-08-20', '2025-03-18 03:24:58', '2025-03-18 03:24:58', 1, 0, 10, 100, 3, '/images/medicines/medicine-1742268298639.png');

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
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending_payment','payment_submitted','payment_approved','processing','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `status`, `created_at`, `updated_at`) VALUES
('1742011632839', 3, 84.89, 'pending_payment', '2025-03-15 04:07:12', '2025-03-15 04:07:12'),
('1742011639855', 3, 84.89, 'pending_payment', '2025-03-15 04:07:19', '2025-03-15 04:07:19'),
('1742011844590', 3, 12.99, 'pending_payment', '2025-03-15 04:10:44', '2025-03-15 04:10:44'),
('1742011890404', 3, 28.98, 'pending_payment', '2025-03-15 04:11:30', '2025-03-15 04:11:30'),
('1742011909428', 3, 64.47, 'pending_payment', '2025-03-15 04:11:49', '2025-03-15 04:11:49'),
('1742012041521', 3, 73.46, 'pending_payment', '2025-03-15 04:14:01', '2025-03-15 04:14:01'),
('1742012046729', 3, 73.46, 'pending_payment', '2025-03-15 04:14:06', '2025-03-15 04:14:06'),
('1742012058107', 3, 73.46, 'payment_submitted', '2025-03-15 04:14:18', '2025-03-15 04:14:30'),
('1742012144585', 3, 28.98, 'pending_payment', '2025-03-15 04:15:44', '2025-03-15 04:15:44'),
('1742184237378', 3, 28.98, 'pending_payment', '2025-03-17 04:03:57', '2025-03-17 04:03:57'),
('1742184608001', 3, 28.98, 'pending_payment', '2025-03-17 04:10:08', '2025-03-17 04:10:08'),
('1742184695362', 3, 28.98, 'pending_payment', '2025-03-17 04:11:35', '2025-03-17 04:11:35'),
('1742185101316', 3, 28.98, 'payment_submitted', '2025-03-17 04:18:21', '2025-03-17 04:18:27'),
('1742198052147', 3, 28.98, 'payment_submitted', '2025-03-17 07:54:12', '2025-03-17 07:54:22');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('gcash','grab_pay') NOT NULL,
  `source_id` varchar(100) DEFAULT NULL,
  `payment_intent_id` varchar(100) DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `payment_proof_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','processing','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `amount`, `payment_method`, `source_id`, `payment_intent_id`, `reference_number`, `payment_proof_url`, `status`, `created_at`, `updated_at`) VALUES
('1742185107679', '1742185101316', 28.98, 'gcash', 'src_1a3dCbA5H3F9Pu6stTfYHBrg', NULL, NULL, NULL, 'processing', '2025-03-17 04:18:27', '2025-03-17 04:18:27'),
('1742185107684', '1742185101316', 28.98, 'gcash', 'src_1a3dCbA5H3F9Pu6stTfYHBrg', NULL, NULL, NULL, 'processing', '2025-03-17 04:18:27', '2025-03-17 04:18:27'),
('1742198062365', '1742198052147', 28.98, 'gcash', 'src_UpcQ3EXK8TcJKGH1s32RYmeZ', NULL, NULL, NULL, 'processing', '2025-03-17 07:54:22', '2025-03-17 07:54:22'),
('1742198062366', '1742198052147', 28.98, 'gcash', 'src_UpcQ3EXK8TcJKGH1s32RYmeZ', NULL, NULL, NULL, 'processing', '2025-03-17 07:54:22', '2025-03-17 07:54:22');

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
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

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
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_medicine_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `order_items_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

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
