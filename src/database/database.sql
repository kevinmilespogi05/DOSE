-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 13, 2025 at 07:04 PM
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
(1, 2, '2025-05-12 11:52:17', '2025-05-12 11:52:17'),
(2, 3, '2025-05-12 11:52:28', '2025-05-12 11:52:28'),
(3, 7, '2025-05-13 02:05:45', '2025-05-13 02:05:45'),
(4, 8, '2025-05-13 16:12:40', '2025-05-13 16:12:40');

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
(1, 2, 27, 1, '2025-05-12 17:03:06', '2025-05-12 17:03:06');

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase_amount` decimal(10,2) DEFAULT NULL,
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `generic_name` varchar(100) DEFAULT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `unit` varchar(20) NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `requires_prescription` tinyint(1) DEFAULT 0,
  `min_stock_level` int(11) DEFAULT 10,
  `max_stock_level` int(11) DEFAULT 100,
  `reorder_point` int(11) DEFAULT 20,
  `image_url` varchar(255) DEFAULT 'https://via.placeholder.com/400x300?text=Medicine+Image',
  `barcode` varchar(50) DEFAULT NULL,
  `stock_status` enum('in_stock','low_stock','out_of_stock') GENERATED ALWAYS AS (
    CASE 
      WHEN stock_quantity = 0 THEN 'out_of_stock'
      WHEN stock_quantity <= min_stock_level THEN 'low_stock'
      ELSE 'in_stock'
    END
  ) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`id`, `name`, `generic_name`, `brand`, `category_id`, `description`, `price`, `stock_quantity`, `unit`, `expiry_date`, `supplier_id`, `requires_prescription`, `min_stock_level`, `max_stock_level`, `reorder_point`, `image_url`, `barcode`, `stock_status`, `created_at`, `updated_at`) VALUES
(16, 'Cetirizine', 'Cetirizine', 'AllerCare', 4, NULL, 10.00, 27, 'tablets', '2027-11-15', 1, 1, 10, 100, 20, '/images/medicines/medicine-1742266313085.png', NULL, 'in_stock', '2025-03-18 02:51:17', '2025-03-18 07:22:52'),
(17, 'Omeprazole', 'Omeprazole', 'Omezol', 3, NULL, 15.00, 50, 'tablets', '2026-12-12', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267049716.png', NULL, 'in_stock', '2025-03-18 03:04:09', '2025-03-18 03:05:16'),
(18, 'Amoxicillin', 'Amoxicillin', 'AmoCare', 1, NULL, 25.00, 72, 'capsules', '2025-09-05', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742267157362.png', NULL, 'in_stock', '2025-03-18 03:05:57', '2025-03-18 07:22:52'),
(19, 'Losartan', 'Losartan Potassium', 'CardioSafe', 6, NULL, 20.00, 40, 'tablets', '2027-11-15', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267241910.png', NULL, 'in_stock', '2025-03-18 03:06:41', '2025-03-18 03:07:22'),
(20, 'Paracetamol', 'Paracetamol', 'PainAway', 2, NULL, 5.00, 90, 'tablets', '2026-03-22', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742267302037.png', NULL, 'in_stock', '2025-03-18 03:08:22', '2025-03-18 03:08:22'),
(21, 'Ascorbic Acid', 'Vitamin C', 'VitaBoost', 5, NULL, 12.00, 60, 'tablets', '2027-10-30', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742267346487.png', NULL, 'in_stock', '2025-03-18 03:09:06', '2025-03-18 03:09:06'),
(22, 'Multivitamins', 'Multivitamins', 'VitaComplete', 5, NULL, 20.00, 75, 'tablets', '2027-03-14', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267845660.png', NULL, 'in_stock', '2025-03-18 03:17:25', '2025-03-18 03:17:25'),
(23, 'Ferrous Sulfate', 'Iron Supplement', 'FerroStrong', 5, NULL, 18.00, 45, 'capsules', '2026-12-28', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742267882304.png', NULL, 'in_stock', '2025-03-18 03:18:02', '2025-03-18 03:18:02'),
(24, 'Mefenamic Acid', 'Mefenamic Acid', 'Mefenax', 2, NULL, 12.00, 80, 'capsules', '2025-07-05', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742267932238.png', NULL, 'in_stock', '2025-03-18 03:18:52', '2025-03-18 03:18:52'),
(25, 'Ibuprofen', 'Ibuprofen', 'IbuRelief', 2, NULL, 8.00, 70, 'tablets', '2026-10-11', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267991905.png', NULL, 'in_stock', '2025-03-18 03:19:52', '2025-03-18 03:19:52'),
(26, 'Metoprolol', 'Metoprolol', 'BetaCare', 6, NULL, 18.00, 48, 'tablets', '2027-09-22', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742268044871.png', NULL, 'in_stock', '2025-03-18 03:20:44', '2025-03-18 03:20:44'),
(27, 'Amlodipine', 'Amlodipine', 'CardioTone', 6, NULL, 22.00, 47, 'tablets', '2026-05-10', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742268082971.png', NULL, 'in_stock', '2025-03-18 03:21:23', '2025-03-18 07:22:52'),
(28, 'Loratadine', 'Loratadine', 'LoraFast', 4, NULL, 12.00, 35, 'tablets', '2026-11-15', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742268137814.png', NULL, 'in_stock', '2025-03-18 03:22:18', '2025-03-18 03:22:18'),
(29, 'Cefalexin', 'Cefalexin', 'CefaPlus', 1, NULL, 28.00, 55, 'capsules', '2026-04-02', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742268186917.png', NULL, 'in_stock', '2025-03-18 03:23:07', '2025-03-18 03:23:07'),
(30, 'Azithromycin', 'Azithromycin', 'AzitroMed', 1, NULL, 30.00, 60, 'tablets', '2027-06-18', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742268241000.png', NULL, 'in_stock', '2025-03-18 03:24:01', '2025-03-18 03:24:01'),
(31, 'Ranitidine', 'Ranitidine', 'RaniRelief', 3, NULL, 18.00, 45, 'tablets', '2025-08-20', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742268298639.png', NULL, 'in_stock', '2025-03-18 03:24:58', '2025-03-18 03:24:58');

--
-- Update existing medicines to recalculate their stock status
UPDATE medicines SET stock_quantity = stock_quantity;

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
(1, 'Antibiotics', 'Medicines that inhibit the growth of or destroy microorganisms', '2025-05-12 11:51:48'),
(2, 'Pain Relievers', 'Medicines used to relieve pain and reduce fever', '2025-05-12 11:51:48'),
(3, 'Gastrointestinal', 'Medicines for digestive system disorders', '2025-05-12 11:51:48'),
(4, 'Antihistamines', 'Medicines that treat allergy symptoms', '2025-05-12 11:51:48'),
(5, 'Vitamins and Supplements', 'Nutritional supplements and vitamins', '2025-05-12 11:51:48'),
(6, 'Cardiovascular', 'Medicines for heart and blood vessel conditions', '2025-05-12 11:51:48');

-- --------------------------------------------------------

--
-- Table structure for table `mfa_settings`
--

CREATE TABLE `mfa_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `mfa_type` enum('email','sms','authenticator') NOT NULL,
  `mfa_secret` varchar(255) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending_payment','payment_submitted','payment_approved','processing','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
  `payment_method` varchar(20) DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_state` varchar(100) DEFAULT NULL,
  `shipping_country` varchar(100) DEFAULT NULL,
  `shipping_postal_code` varchar(20) DEFAULT NULL,
  `shipping_method_id` int(11) DEFAULT NULL,
  `shipping_cost` decimal(10,2) DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_coupons`
--

CREATE TABLE `order_coupons` (
  `id` int(11) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `unit` varchar(50) NOT NULL,
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

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `review_text` text DEFAULT NULL,
  `is_verified_purchase` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `returns`
--

CREATE TABLE `returns` (
  `id` int(11) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  `reason` text DEFAULT NULL,
  `total_refund_amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `return_items`
--

CREATE TABLE `return_items` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `condition` enum('new','opened','damaged') NOT NULL,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
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
-- Table structure for table `shipping_methods`
--

CREATE TABLE `shipping_methods` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `base_cost` decimal(10,2) NOT NULL,
  `estimated_days` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
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
(1, 'MediSupply Co.', 'John Smith', 'contact@medisupply.com', '+1234567890', '123 Medical Plaza, Healthcare City', '2025-05-12 11:51:48', '2025-05-12 11:51:48'),
(2, 'PharmaDist Inc.', 'Sarah Johnson', 'info@pharmadist.com', '+1987654321', '456 Pharma Street, Medical District', '2025-05-12 11:51:48', '2025-05-12 11:51:48'),
(3, 'HealthCare Suppliers', 'Michael Brown', 'sales@healthcaresuppliers.com', '+1122334455', '789 Wellness Avenue, Health Zone', '2025-05-12 11:51:48', '2025-05-12 11:51:48');

-- --------------------------------------------------------

--
-- Table structure for table `tax_rates`
--

CREATE TABLE `tax_rates` (
  `id` int(11) NOT NULL,
  `country` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `rate` decimal(5,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `mfa_secret` varchar(255) DEFAULT NULL,
  `mfa_enabled` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`, `mfa_secret`, `mfa_enabled`) VALUES
(2, 'superadmin', 'superadmin@example.com', '$2y$10$PQD.Y8OPwoKV2TlHOYVxeOJaZAZKhHyXXhvZ5tqUGtxYsG0Ej4wPm', 'admin', NULL, NULL, '2025-03-13 04:13:17', '2025-03-13 04:13:17', NULL, 0),
(3, 'kevin', 'kevin@gmail.com', '$2a$10$5Qtp8f0AziT5MNo3fwOPzuWC2YMXxQaCWZutR/YDj8igsgNRg.iV2', 'user', 'a4173a1f-a6c2-41f7-ab4c-be5d9917feb7', '2025-05-13 10:43:10', '2025-03-13 04:25:12', '2025-05-13 01:43:10', NULL, 0),
(4, 'admin', 'admin@gmail.com', '$2a$10$ohXuuCfIS1UK6.ycVvAxcO2OlBAPSIOzVwbnnDDR0l4eBPR95xiMG', 'admin', NULL, NULL, '2025-03-13 04:32:01', '2025-03-13 04:32:01', NULL, 0),
(5, 'lebron', 'lebron@gmail.com', '$2a$10$LQIpAd/VjX7b/H5eL1KhguT/wxh/hsdFyUhug.Bz5CgHNkn5FPNRe', 'user', NULL, NULL, '2025-03-13 07:49:35', '2025-03-13 07:49:35', NULL, 0),
(6, 'edgar', 'edgar@gmail.com', '$2a$10$HvRjBsEArICXNNaMwfOB/OtQ4STe6ceY3hX7Iav9PXidEL6ahc/aS', 'user', NULL, NULL, '2025-04-01 05:23:14', '2025-04-01 05:23:14', NULL, 0),
(7, 'kevinmilesjulhusin99', 'kevinmilesjulhusin99@gmail.com', '$2b$10$m8mJypp08l43Fbdq5TurA.1XJeBNXYT7tIVfHuK4.yuEJV5tLOgtO', 'user', NULL, NULL, '2025-05-13 01:31:55', '2025-05-13 02:05:24', NULL, 0),
(8, 'kevin123', 'kevin123@gmail.com', '$2a$10$7ETpIpW/dw7EV1BkV7qia.hUhVeXolAnKk68GnBp.7WlKnoPuOxKq', 'user', NULL, NULL, '2025-05-13 16:11:55', '2025-05-13 16:11:55', NULL, 0);

--
-- Triggers `users`
--
DROP TRIGGER IF EXISTS after_user_insert;
DELIMITER $$
CREATE TRIGGER after_user_insert AFTER INSERT ON users FOR EACH ROW 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = NEW.id) THEN
        INSERT INTO user_profiles (user_id, created_at, updated_at)
        VALUES (NEW.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_mfa`
--

CREATE TABLE `user_mfa` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `mfa_secret` varchar(255) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 0,
  `backup_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`backup_codes`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_mfa`
--

INSERT INTO `user_mfa` (`id`, `user_id`, `mfa_secret`, `is_enabled`, `backup_codes`, `created_at`, `updated_at`) VALUES
(1, 7, 'FY4EGRJUKV4VCJR6EFTTC2BRJNRVIR2LGYZVUI2TGEZCSQSOO5XQ', 1, '[\"1732VT3S\",\"7RQWICEZ\",\"OPJAKMCA\",\"Y1Z64MXM\",\"GHBZ4FDB\",\"BHV9XJC6\",\"OGO67JJP\",\"7EMZB58A\",\"3AARFJP3\",\"TF1DEYU0\"]', '2025-05-13 14:44:48', '2025-05-13 14:45:06');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state_province` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

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
  ADD KEY `idx_medicine_category` (`category_id`),
  ADD KEY `idx_medicine_brand` (`brand`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `idx_medicine_expiry` (`expiry_date`),
  ADD KEY `barcode` (`barcode`);

--
-- Indexes for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `mfa_settings`
--
ALTER TABLE `mfa_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_mfa_user_id` (`user_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_orders_user_status` (`user_id`,`status`),
  ADD KEY `idx_orders_created_at` (`created_at`),
  ADD KEY `orders_shipping_method_fk` (`shipping_method_id`);

--
-- Indexes for table `order_coupons`
--
ALTER TABLE `order_coupons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `coupon_id` (`coupon_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `medicine_id` (`medicine_id`),
  ADD KEY `idx_order_items_medicine` (`medicine_id`);

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
  ADD KEY `idx_prescriptions_user` (`user_id`),
  ADD KEY `idx_prescriptions_status` (`status`);

--
-- Indexes for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- Indexes for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `medicine_id` (`medicine_id`),
  ADD KEY `idx_reviews_status` (`status`);

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`),
  ADD KEY `idx_refunds_status` (`status`);

--
-- Indexes for table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_returns_user_id` (`user_id`),
  ADD KEY `idx_returns_order_id` (`order_id`),
  ADD KEY `idx_returns_status` (`status`);

--
-- Indexes for table `return_items`
--
ALTER TABLE `return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`),
  ADD KEY `order_item_id` (`order_item_id`);

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
-- Indexes for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tax_rates`
--
ALTER TABLE `tax_rates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `country_state` (`country`,`state`);

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
-- Indexes for table `user_mfa`
--
ALTER TABLE `user_mfa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_mfa` (`user_id`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_profile` (`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `