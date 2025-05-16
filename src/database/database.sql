-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 16, 2025 at 05:27 AM
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
(4, 8, '2025-05-13 16:12:40', '2025-05-13 16:12:40'),
(5, 4, '2025-05-13 18:04:23', '2025-05-13 18:04:23'),
(6, 9, '2025-05-16 02:40:08', '2025-05-16 02:40:08'),
(7, 10, '2025-05-16 03:01:33', '2025-05-16 03:01:33');

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
(1, 2, 27, 1, '2025-05-12 17:03:06', '2025-05-12 17:03:06'),
(9, 3, 18, 1, '2025-05-15 15:22:46', '2025-05-15 15:22:46'),
(10, 4, 18, 1, '2025-05-15 17:22:49', '2025-05-15 17:22:49'),
(11, 4, 21, 1, '2025-05-15 17:34:39', '2025-05-15 17:34:39'),
(12, 6, 27, 1, '2025-05-16 02:40:20', '2025-05-16 02:40:20'),
(13, 6, 18, 1, '2025-05-16 02:40:21', '2025-05-16 02:40:21');

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

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `min_purchase_amount`, `max_discount_amount`, `start_date`, `end_date`, `usage_limit`, `used_count`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'AAAA', 'percentage', 99.00, 1.00, 1.00, '2025-05-15 00:00:00', '2025-05-16 00:00:00', 1, 1, 1, '2025-05-14 17:19:51', '2025-05-15 15:12:49');

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
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` varchar(255) NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `pdf_data` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
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
  `stock_status` enum('in_stock','low_stock','out_of_stock') GENERATED ALWAYS AS (case when `stock_quantity` = 0 then 'out_of_stock' when `stock_quantity` <= `min_stock_level` then 'low_stock' else 'in_stock' end) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `average_rating` decimal(3,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`id`, `name`, `generic_name`, `brand`, `category_id`, `description`, `price`, `stock_quantity`, `unit`, `expiry_date`, `supplier_id`, `requires_prescription`, `min_stock_level`, `max_stock_level`, `reorder_point`, `image_url`, `barcode`, `created_at`, `updated_at`, `average_rating`) VALUES
(16, 'Cetirizine', 'Cetirizine', 'AllerCare', 4, NULL, 10.00, 27, 'tablets', '2027-11-15', 1, 1, 10, 100, 20, '/images/medicines/medicine-1742266313085.png', NULL, '2025-03-18 02:51:17', '2025-03-18 07:22:52', 0.00),
(17, 'Omeprazole', 'Omeprazole', 'Omezol', 3, NULL, 15.00, 50, 'tablets', '2026-12-12', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267049716.png', NULL, '2025-03-18 03:04:09', '2025-03-18 03:05:16', 0.00),
(18, 'Amoxicillin', 'Amoxicillin', 'AmoCare', 1, NULL, 25.00, 19, 'capsules', '2025-09-05', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742267157362.png', NULL, '2025-03-18 03:05:57', '2025-05-16 02:40:29', 0.00),
(19, 'Losartan', 'Losartan Potassium', 'CardioSafe', 6, NULL, 20.00, 40, 'tablets', '2027-11-15', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267241910.png', NULL, '2025-03-18 03:06:41', '2025-03-18 03:07:22', 0.00),
(20, 'Paracetamol', 'Paracetamol', 'PainAway', 2, NULL, 5.00, 90, 'tablets', '2026-03-22', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742267302037.png', NULL, '2025-03-18 03:08:22', '2025-03-18 03:08:22', 0.00),
(21, 'Ascorbic Acid', 'Vitamin C', 'VitaBoost', 5, NULL, 12.00, 46, 'tablets', '2027-10-30', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742267346487.png', NULL, '2025-03-18 03:09:06', '2025-05-16 02:10:15', 0.00),
(22, 'Multivitamins', 'Multivitamins', 'VitaComplete', 5, NULL, 20.00, 75, 'tablets', '2027-03-14', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267845660.png', NULL, '2025-03-18 03:17:25', '2025-03-18 03:17:25', 0.00),
(23, 'Ferrous Sulfate', 'Iron Supplement', 'FerroStrong', 5, NULL, 18.00, 45, 'capsules', '2026-12-28', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742267882304.png', NULL, '2025-03-18 03:18:02', '2025-03-18 03:18:02', 0.00),
(24, 'Mefenamic Acid', 'Mefenamic Acid', 'Mefenax', 2, NULL, 12.00, 80, 'capsules', '2025-07-05', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742267932238.png', NULL, '2025-03-18 03:18:52', '2025-03-18 03:18:52', 0.00),
(25, 'Ibuprofen', 'Ibuprofen', 'IbuRelief', 2, NULL, 8.00, 70, 'tablets', '2026-10-11', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742267991905.png', NULL, '2025-03-18 03:19:52', '2025-03-18 03:19:52', 0.00),
(26, 'Metoprolol', 'Metoprolol', 'BetaCare', 6, NULL, 18.00, 48, 'tablets', '2027-09-22', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742268044871.png', NULL, '2025-03-18 03:20:44', '2025-03-18 03:20:44', 0.00),
(27, 'Amlodipine', 'Amlodipine', 'CardioTone', 4, NULL, 22.00, 0, 'capsules', '2003-05-11', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742268082971.png', NULL, '2025-03-18 03:21:23', '2025-05-16 02:40:29', 4.25),
(28, 'Loratadine', 'Loratadine', 'LoraFast', 4, NULL, 12.00, 35, 'tablets', '2026-11-15', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742268137814.png', NULL, '2025-03-18 03:22:18', '2025-03-18 03:22:18', 0.00),
(29, 'Cefalexin', 'Cefalexin', 'CefaPlus', 1, NULL, 28.00, 55, 'capsules', '2026-04-02', 2, 0, 10, 100, 20, '/images/medicines/medicine-1742268186917.png', NULL, '2025-03-18 03:23:07', '2025-03-18 03:23:07', 0.00),
(30, 'Azithromycin', 'Azithromycin', 'AzitroMed', 1, NULL, 30.00, 60, 'tablets', '2027-06-18', 3, 0, 10, 100, 20, '/images/medicines/medicine-1742268241000.png', NULL, '2025-03-18 03:24:01', '2025-03-18 03:24:01', 0.00),
(31, 'Ranitidine', 'Ranitidine', 'RaniRelief', 3, NULL, 18.00, 45, 'tablets', '2025-08-20', 1, 0, 10, 100, 20, '/images/medicines/medicine-1742268298639.png', NULL, '2025-03-18 03:24:58', '2025-03-18 03:24:58', 0.00);

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

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `status`, `payment_method`, `shipping_address`, `shipping_city`, `shipping_state`, `shipping_country`, `shipping_postal_code`, `shipping_method_id`, `shipping_cost`, `tax_amount`, `tracking_number`, `created_at`, `updated_at`) VALUES
('04d2cd12-4f90-4f7e-b6b9-538afc99fc6d', 7, 25100.00, 'completed', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-15 15:22:51', '2025-05-15 15:52:39'),
('077ae5ce-df5c-4d2a-914c-621a7d7e620e', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:42:58', '2025-05-14 16:42:58'),
('0b811ec7-c59a-4e1a-a061-a8540ffa4315', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:34:47', '2025-05-15 17:59:51'),
('0fa38b63-7a0c-45a8-b034-8cd56ac8f68f', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:46:12', '2025-05-14 16:46:12'),
('0fda86aa-d9bc-4441-84ae-2e8e25923982', 8, 25100.01, 'pending_payment', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 502.00, NULL, '2025-05-15 17:23:49', '2025-05-15 17:23:49'),
('1192cb53-919b-4bd2-addc-f07ba974a170', 8, 47.00, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-14 04:37:28', '2025-05-15 17:59:51'),
('14f9f93c-de45-4cc5-bbaa-64f7aa9db283', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:40:19', '2025-05-14 16:40:19'),
('19b28264-2537-491a-9d2f-ada330b67883', 8, 50100.00, 'pending_payment', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 1002.00, NULL, '2025-05-15 17:13:17', '2025-05-15 17:13:17'),
('1b23e79a-690b-433f-b9fe-7a017108e87a', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:50:17', '2025-05-15 17:59:51'),
('1fac3243-e091-4899-ae65-9670165723cd', 8, 50100.00, 'completed', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-15 15:20:14', '2025-05-15 15:53:55'),
('28f35942-cb43-4aef-9ead-0e934ee56b42', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:40:39', '2025-05-14 16:40:39'),
('2c3fb0a1-af92-419b-80a6-14e9d6cbec08', 8, 50099.00, 'completed', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-15 15:12:49', '2025-05-15 15:54:05'),
('31f7270f-87bb-4bc6-9623-e506cb2e54af', 8, 50100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 1002.00, NULL, '2025-05-15 17:19:37', '2025-05-15 17:19:37'),
('3406d021-4f9f-4d0d-87c3-dcd71c46d834', 8, 140.00, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:56:25', '2025-05-15 17:59:51'),
('42e9e8bd-ba53-407f-bd77-dea2a781a9f3', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:41:01', '2025-05-14 16:41:01'),
('4894d43a-95c1-4449-801f-ec79ef952547', 8, 50100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 1002.00, NULL, '2025-05-15 17:20:06', '2025-05-15 17:20:06'),
('4acf4613-7008-44ea-b3d5-3e4587f87761', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:43:43', '2025-05-14 16:43:43'),
('53882391-c98f-43aa-93d8-2884e2099784', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:40:05', '2025-05-14 16:40:05'),
('579fbc01-24b2-4c30-8d27-503a71778ee9', 7, 25100.00, 'completed', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-15 15:27:46', '2025-05-15 15:52:34'),
('5849cb66-93d0-4236-b111-997ca391ba6c', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:38:05', '2025-05-14 16:38:05'),
('67af2a34-e8d7-431d-aeb1-c0cee9903177', 8, 42.00, 'pending_payment', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-14 04:30:49', '2025-05-14 04:30:49'),
('67c5a565-0b88-44ff-988a-8ab4f46f54ce', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:53:35', '2025-05-14 16:53:35'),
('6b8b03d4-caf6-4f6c-a4d0-d865846a6069', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:48:29', '2025-05-15 17:59:51'),
('71cf4e37-a1f8-43c4-b8d0-ca096d74b8df', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 2.74, NULL, '2025-05-15 18:21:11', '2025-05-15 18:21:14'),
('7e2a80f8-1c6d-4a48-836a-67da2b706bed', 8, 42.00, 'completed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-14 04:32:50', '2025-05-15 17:59:51'),
('86207ba8-b804-43af-8122-abad2852f952', 8, 50100.00, 'pending_payment', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 1002.00, NULL, '2025-05-15 17:10:44', '2025-05-15 17:10:44'),
('87829297-d547-4962-9552-972a43e8c235', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 2.74, NULL, '2025-05-15 18:17:44', '2025-05-15 18:17:48'),
('89899126-1fcb-4e15-805c-6913b793f159', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:39:54', '2025-05-15 17:59:51'),
('8ab6a4aa-befb-4781-95c8-50707a0ad5a3', 8, 37100.01, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 18:00:18', '2025-05-15 18:00:23'),
('90612f9a-bec2-4330-9fd3-b5341641c579', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 2.74, NULL, '2025-05-16 02:10:15', '2025-05-16 02:10:20'),
('96bf31b2-4f47-4fb8-9127-c8992b065bc3', 8, 127.50, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 502.00, NULL, '2025-05-15 17:32:10', '2025-05-15 17:59:51'),
('af3669b1-a2b7-45dd-9386-31e33abf7705', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:47:28', '2025-05-15 17:59:51'),
('afcfe5e0-afee-42fc-b53f-da1c36040c78', 8, 50100.00, 'completed', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-15 15:13:24', '2025-05-15 15:54:00'),
('b27f6b1e-8593-4510-89b3-6fe70de2d24a', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:44:44', '2025-05-14 16:44:44'),
('b637fea4-5288-4b5a-91e3-53ddd391bc1e', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:35:06', '2025-05-14 16:35:06'),
('bdae65c6-01df-4426-b6cc-8fd03711b68c', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:41:39', '2025-05-14 16:41:39'),
('be7e73b7-f720-4765-b736-8e787d8a20a8', 9, 149.94, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 2.94, NULL, '2025-05-16 02:40:29', '2025-05-16 02:40:34'),
('c3533cdb-a366-425a-9d0f-033049cffd7f', 8, 50100.00, 'pending_payment', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 1002.00, NULL, '2025-05-15 17:16:13', '2025-05-15 17:16:13'),
('cb2fad97-91ec-4174-b3ff-ef106bcb1fd6', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:44:55', '2025-05-15 17:59:51'),
('d077e12b-4783-41ca-8275-7d3e77e9c5b5', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:48:49', '2025-05-14 16:48:49'),
('d10f2a67-832f-4cc3-902f-e88bc3c05e06', 8, 44100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:31:10', '2025-05-14 16:31:10'),
('d7583680-e118-4b46-9dab-5127f8b61197', 8, 50100.00, 'pending_payment', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 1002.00, NULL, '2025-05-15 17:17:55', '2025-05-15 17:17:55'),
('d83faf12-5e30-47b6-996e-dd450e1ecc49', 8, 139.74, 'pending_payment', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 2.74, NULL, '2025-05-15 18:20:20', '2025-05-15 18:20:20'),
('db578a0f-2153-477f-8e13-6ca3f9949802', 8, 25100.00, 'pending_payment', NULL, 'Purok 5A ', 'Castillejos', 'Zambales', 'Philippines', '2208', 1, 100.00, 0.00, NULL, '2025-05-14 16:46:27', '2025-05-14 16:46:27'),
('dbae05cb-5902-44be-8dbf-22dd0c33f086', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:41:32', '2025-05-15 17:59:51'),
('e23f4379-dec2-4d1e-8805-9dfe8418208a', 8, 139.74, 'payment_submitted', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 742.00, NULL, '2025-05-15 17:38:16', '2025-05-15 17:59:51'),
('f4aa7833-bad3-483b-83a1-0780b27b42e8', 8, 25100.01, 'pending_payment', NULL, 'San Pablo', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 502.00, NULL, '2025-05-15 17:22:55', '2025-05-15 17:22:55'),
('feae1e07-910a-48f5-8c43-a18abfde46af', 8, 25100.01, 'pending_payment', NULL, '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 1, 100.00, 502.00, NULL, '2025-05-15 17:27:38', '2025-05-15 17:27:38');

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

--
-- Dumping data for table `order_coupons`
--

INSERT INTO `order_coupons` (`id`, `order_id`, `coupon_id`, `discount_amount`, `created_at`) VALUES
(2, '2c3fb0a1-af92-419b-80a6-14e9d6cbec08', 1, 1.00, '2025-05-15 15:12:49');

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

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `medicine_id`, `name`, `unit`, `quantity`, `unit_price`, `created_at`) VALUES
(1, '67af2a34-e8d7-431d-aeb1-c0cee9903177', 30, '', '', 1, 30.00, '2025-05-14 04:30:49'),
(2, '67af2a34-e8d7-431d-aeb1-c0cee9903177', 21, '', '', 1, 12.00, '2025-05-14 04:30:49'),
(3, '7e2a80f8-1c6d-4a48-836a-67da2b706bed', 30, '', '', 1, 30.00, '2025-05-14 04:32:50'),
(4, '7e2a80f8-1c6d-4a48-836a-67da2b706bed', 21, '', '', 1, 12.00, '2025-05-14 04:32:50'),
(5, '1192cb53-919b-4bd2-addc-f07ba974a170', 27, '', '', 1, 22.00, '2025-05-14 04:37:28'),
(6, '1192cb53-919b-4bd2-addc-f07ba974a170', 18, '', '', 1, 25.00, '2025-05-14 04:37:28'),
(7, 'd10f2a67-832f-4cc3-902f-e88bc3c05e06', 27, 'Amlodipine', 'capsules', 2, 22.00, '2025-05-14 16:31:10'),
(8, 'b637fea4-5288-4b5a-91e3-53ddd391bc1e', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:35:06'),
(9, '5849cb66-93d0-4236-b111-997ca391ba6c', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:38:05'),
(10, '53882391-c98f-43aa-93d8-2884e2099784', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:40:05'),
(11, '14f9f93c-de45-4cc5-bbaa-64f7aa9db283', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:40:19'),
(12, '28f35942-cb43-4aef-9ead-0e934ee56b42', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:40:39'),
(13, '42e9e8bd-ba53-407f-bd77-dea2a781a9f3', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:41:01'),
(14, 'bdae65c6-01df-4426-b6cc-8fd03711b68c', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:41:39'),
(15, '077ae5ce-df5c-4d2a-914c-621a7d7e620e', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:42:58'),
(16, '4acf4613-7008-44ea-b3d5-3e4587f87761', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:43:43'),
(17, 'b27f6b1e-8593-4510-89b3-6fe70de2d24a', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:44:44'),
(18, '0fa38b63-7a0c-45a8-b034-8cd56ac8f68f', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:46:12'),
(19, 'db578a0f-2153-477f-8e13-6ca3f9949802', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:46:27'),
(20, 'd077e12b-4783-41ca-8275-7d3e77e9c5b5', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:48:49'),
(21, '67c5a565-0b88-44ff-988a-8ab4f46f54ce', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-14 16:53:35'),
(22, '2c3fb0a1-af92-419b-80a6-14e9d6cbec08', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 15:12:49'),
(23, 'afcfe5e0-afee-42fc-b53f-da1c36040c78', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 15:13:24'),
(24, '1fac3243-e091-4899-ae65-9670165723cd', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 15:20:14'),
(25, '04d2cd12-4f90-4f7e-b6b9-538afc99fc6d', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 15:22:51'),
(26, '579fbc01-24b2-4c30-8d27-503a71778ee9', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 15:27:46'),
(27, '86207ba8-b804-43af-8122-abad2852f952', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 17:10:44'),
(28, '19b28264-2537-491a-9d2f-ada330b67883', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 17:13:17'),
(29, 'c3533cdb-a366-425a-9d0f-033049cffd7f', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 17:16:13'),
(30, 'd7583680-e118-4b46-9dab-5127f8b61197', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 17:17:55'),
(31, '31f7270f-87bb-4bc6-9623-e506cb2e54af', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 17:19:37'),
(32, '4894d43a-95c1-4449-801f-ec79ef952547', 18, 'Amoxicillin', 'capsules', 2, 25.00, '2025-05-15 17:20:06'),
(33, 'f4aa7833-bad3-483b-83a1-0780b27b42e8', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:22:55'),
(34, '0fda86aa-d9bc-4441-84ae-2e8e25923982', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:23:49'),
(35, 'feae1e07-910a-48f5-8c43-a18abfde46af', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:27:38'),
(36, '96bf31b2-4f47-4fb8-9127-c8992b065bc3', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:32:10'),
(37, '0b811ec7-c59a-4e1a-a061-a8540ffa4315', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:34:47'),
(38, '0b811ec7-c59a-4e1a-a061-a8540ffa4315', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:34:47'),
(39, 'e23f4379-dec2-4d1e-8805-9dfe8418208a', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:38:16'),
(40, 'e23f4379-dec2-4d1e-8805-9dfe8418208a', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:38:16'),
(41, '89899126-1fcb-4e15-805c-6913b793f159', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:39:54'),
(42, '89899126-1fcb-4e15-805c-6913b793f159', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:39:54'),
(43, 'dbae05cb-5902-44be-8dbf-22dd0c33f086', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:41:32'),
(44, 'dbae05cb-5902-44be-8dbf-22dd0c33f086', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:41:32'),
(45, 'cb2fad97-91ec-4174-b3ff-ef106bcb1fd6', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:44:55'),
(46, 'cb2fad97-91ec-4174-b3ff-ef106bcb1fd6', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:44:55'),
(47, 'af3669b1-a2b7-45dd-9386-31e33abf7705', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:47:28'),
(48, 'af3669b1-a2b7-45dd-9386-31e33abf7705', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:47:28'),
(49, '6b8b03d4-caf6-4f6c-a4d0-d865846a6069', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:48:29'),
(50, '6b8b03d4-caf6-4f6c-a4d0-d865846a6069', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:48:29'),
(51, '1b23e79a-690b-433f-b9fe-7a017108e87a', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:50:17'),
(52, '1b23e79a-690b-433f-b9fe-7a017108e87a', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:50:17'),
(53, '3406d021-4f9f-4d0d-87c3-dcd71c46d834', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 17:56:25'),
(54, '3406d021-4f9f-4d0d-87c3-dcd71c46d834', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 17:56:25'),
(55, '8ab6a4aa-befb-4781-95c8-50707a0ad5a3', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 18:00:18'),
(56, '8ab6a4aa-befb-4781-95c8-50707a0ad5a3', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 18:00:18'),
(57, '87829297-d547-4962-9552-972a43e8c235', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 18:17:44'),
(58, '87829297-d547-4962-9552-972a43e8c235', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 18:17:44'),
(59, 'd83faf12-5e30-47b6-996e-dd450e1ecc49', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 18:20:20'),
(60, 'd83faf12-5e30-47b6-996e-dd450e1ecc49', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 18:20:20'),
(61, '71cf4e37-a1f8-43c4-b8d0-ca096d74b8df', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-15 18:21:11'),
(62, '71cf4e37-a1f8-43c4-b8d0-ca096d74b8df', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-15 18:21:11'),
(63, '90612f9a-bec2-4330-9fd3-b5341641c579', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-16 02:10:15'),
(64, '90612f9a-bec2-4330-9fd3-b5341641c579', 21, 'Ascorbic Acid', 'tablets', 1, 12.00, '2025-05-16 02:10:15'),
(65, 'be7e73b7-f720-4765-b736-8e787d8a20a8', 27, 'Amlodipine', 'capsules', 1, 22.00, '2025-05-16 02:40:29'),
(66, 'be7e73b7-f720-4765-b736-8e787d8a20a8', 18, 'Amoxicillin', 'capsules', 1, 25.00, '2025-05-16 02:40:29');

-- --------------------------------------------------------

--
-- Table structure for table `order_tracking`
--

CREATE TABLE `order_tracking` (
  `id` varchar(255) NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_tracking`
--

INSERT INTO `order_tracking` (`id`, `order_id`, `status`, `description`, `location`, `created_at`) VALUES
('1747198825493', '1192cb53-919b-4bd2-addc-f07ba974a170', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-14 05:00:25'),
('1747198825498', '1192cb53-919b-4bd2-addc-f07ba974a170', 'shipping', 'Your order is on the way!', 'Dispatch Center', '2025-05-14 05:00:25'),
('1747330334172', '96bf31b2-4f47-4fb8-9127-c8992b065bc3', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:32:14'),
('1747330491639', '0b811ec7-c59a-4e1a-a061-a8540ffa4315', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:34:51'),
('1747330700483', 'e23f4379-dec2-4d1e-8805-9dfe8418208a', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:38:20'),
('1747330797865', '89899126-1fcb-4e15-805c-6913b793f159', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:39:57'),
('1747330896160', 'dbae05cb-5902-44be-8dbf-22dd0c33f086', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:41:36'),
('1747331099030', 'cb2fad97-91ec-4174-b3ff-ef106bcb1fd6', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:44:59'),
('1747331253018', 'af3669b1-a2b7-45dd-9386-31e33abf7705', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:47:33'),
('1747331314026', '6b8b03d4-caf6-4f6c-a4d0-d865846a6069', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:48:34'),
('1747331421266', '1b23e79a-690b-433f-b9fe-7a017108e87a', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:50:21'),
('1747331790064', '3406d021-4f9f-4d0d-87c3-dcd71c46d834', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 17:56:30'),
('1747332023669', '8ab6a4aa-befb-4781-95c8-50707a0ad5a3', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 18:00:23'),
('1747333068804', '87829297-d547-4962-9552-972a43e8c235', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 18:17:48'),
('1747333274853', '71cf4e37-a1f8-43c4-b8d0-ca096d74b8df', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-15 18:21:14'),
('1747361420774', '90612f9a-bec2-4330-9fd3-b5341641c579', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-16 02:10:20'),
('1747363234245', 'be7e73b7-f720-4765-b736-8e787d8a20a8', 'processing', 'Payment submitted and being verified.', NULL, '2025-05-16 02:40:34'),
('67af2a34-e8d7-431d-aeb1-c0cee9903177-1747197370', '67af2a34-e8d7-431d-aeb1-c0cee9903177', 'pending', 'Order is pending payment', NULL, '2025-05-14 04:36:10'),
('7e2a80f8-1c6d-4a48-836a-67da2b706bed-1747197370', '7e2a80f8-1c6d-4a48-836a-67da2b706bed', 'delivered', 'Order has been delivered successfully', NULL, '2025-05-14 04:36:10');

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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `invoice_number` varchar(50) DEFAULT NULL,
  `invoice_generated_at` timestamp NULL DEFAULT NULL,
  `invoice_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `amount`, `payment_method`, `source_id`, `payment_intent_id`, `reference_number`, `payment_proof_url`, `status`, `created_at`, `updated_at`, `invoice_number`, `invoice_generated_at`, `invoice_path`) VALUES
('1747197177590', '7e2a80f8-1c6d-4a48-836a-67da2b706bed', 42.00, 'gcash', 'src_tVX1MV61V7u2AiseY24H5sEh', NULL, NULL, NULL, 'paid', '2025-05-14 04:32:57', '2025-05-15 17:59:51', 'INV-202505-1747197177590', '2025-05-14 06:05:06', 'C:\\Users\\kevin\\Desktop\\DOSE\\uploads\\invoices\\invoice-INV-202505-1747197177590.pdf'),
('1747197177600', '7e2a80f8-1c6d-4a48-836a-67da2b706bed', 42.00, 'gcash', 'src_tVX1MV61V7u2AiseY24H5sEh', NULL, NULL, NULL, 'processing', '2025-05-14 04:32:57', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747197455156', '1192cb53-919b-4bd2-addc-f07ba974a170', 47.00, 'gcash', 'src_FNsJooz87aFFTkyTwtyyKf9Y', NULL, NULL, NULL, 'paid', '2025-05-14 04:37:35', '2025-05-15 17:59:51', 'INV-202505-1747197455156', '2025-05-14 06:08:11', 'C:\\Users\\kevin\\Desktop\\DOSE\\uploads\\invoices\\invoice-INV-202505-1747197455156.pdf'),
('1747197455164', '1192cb53-919b-4bd2-addc-f07ba974a170', 47.00, 'gcash', 'src_FNsJooz87aFFTkyTwtyyKf9Y', NULL, NULL, NULL, 'processing', '2025-05-14 04:37:35', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747330334163', '96bf31b2-4f47-4fb8-9127-c8992b065bc3', 127.50, 'gcash', 'src_dyqTrC9EMAtueuKjXxnDDCNY', NULL, NULL, NULL, 'pending', '2025-05-15 17:32:14', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747330491624', '0b811ec7-c59a-4e1a-a061-a8540ffa4315', 139.74, 'gcash', 'src_8tqHTAUeSZchj8VB6zT1WtzP', NULL, NULL, NULL, 'pending', '2025-05-15 17:34:51', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747330700474', 'e23f4379-dec2-4d1e-8805-9dfe8418208a', 139.74, 'gcash', 'src_xxw46FPSi8S5gbxrcxXgbtAj', NULL, NULL, NULL, 'pending', '2025-05-15 17:38:20', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747330797860', '89899126-1fcb-4e15-805c-6913b793f159', 139.74, 'gcash', 'src_yTbbxHFX6zdse7bw1MAtyrfz', NULL, NULL, NULL, 'pending', '2025-05-15 17:39:57', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747330896152', 'dbae05cb-5902-44be-8dbf-22dd0c33f086', 139.74, 'gcash', 'src_tXQiPcAjVQJaVS9Wx7nTShye', NULL, NULL, NULL, 'pending', '2025-05-15 17:41:36', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747331099025', 'cb2fad97-91ec-4174-b3ff-ef106bcb1fd6', 139.74, 'gcash', 'src_UsjHsXeK5WSnbdkXTvUYgERd', NULL, NULL, NULL, 'pending', '2025-05-15 17:44:59', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747331253009', 'af3669b1-a2b7-45dd-9386-31e33abf7705', 139.74, 'gcash', 'src_HBsc7YR74QhWhGf6Sm6S5hd3', NULL, NULL, NULL, 'pending', '2025-05-15 17:47:33', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747331314020', '6b8b03d4-caf6-4f6c-a4d0-d865846a6069', 139.74, 'gcash', 'src_HYDkhdZwcjZXrdGvzyr6U3DG', NULL, NULL, NULL, 'pending', '2025-05-15 17:48:34', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747331421261', '1b23e79a-690b-433f-b9fe-7a017108e87a', 139.74, 'gcash', 'src_4ciLQLEXSsuK3uy1Mz3Gzi99', NULL, NULL, NULL, 'pending', '2025-05-15 17:50:21', '2025-05-15 17:59:51', NULL, NULL, NULL),
('1747331790057', '3406d021-4f9f-4d0d-87c3-dcd71c46d834', 140.00, 'gcash', 'src_SJyVUTrh4U8yGYo2dbbpRMye', NULL, NULL, NULL, 'pending', '2025-05-15 17:56:30', '2025-05-15 17:59:31', NULL, NULL, NULL),
('1747332023662', '8ab6a4aa-befb-4781-95c8-50707a0ad5a3', 139.74, 'gcash', 'src_g8keT6My5inrmeDWcTct9vJN', NULL, NULL, NULL, 'pending', '2025-05-15 18:00:23', '2025-05-15 18:00:23', NULL, NULL, NULL),
('1747333068794', '87829297-d547-4962-9552-972a43e8c235', 139.74, 'gcash', 'src_xd8oNWQQBYSYwwMjdUmxtDuA', NULL, NULL, NULL, 'pending', '2025-05-15 18:17:48', '2025-05-15 18:17:48', NULL, NULL, NULL),
('1747333274845', '71cf4e37-a1f8-43c4-b8d0-ca096d74b8df', 139.74, 'gcash', 'src_snJRWA59iZWr8s8Z3d4G4dPe', NULL, NULL, NULL, 'pending', '2025-05-15 18:21:14', '2025-05-15 18:21:14', NULL, NULL, NULL),
('1747361420766', '90612f9a-bec2-4330-9fd3-b5341641c579', 139.74, 'gcash', 'src_qfrknea3rjNSmQMhgMJcvBKe', NULL, NULL, NULL, 'pending', '2025-05-16 02:10:20', '2025-05-16 02:10:20', NULL, NULL, NULL),
('1747363234238', 'be7e73b7-f720-4765-b736-8e787d8a20a8', 149.94, 'gcash', 'src_hkBv5dkyZoR8tE8NyqykV2RC', NULL, NULL, NULL, 'pending', '2025-05-16 02:40:34', '2025-05-16 02:40:34', NULL, NULL, NULL);

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

--
-- Dumping data for table `prescriptions`
--

INSERT INTO `prescriptions` (`id`, `user_id`, `image_url`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 7, '/images/prescriptions/prescription-1747323448106.png', 'approved', 'pangit niya', '2025-05-15 15:37:28', '2025-05-15 15:37:46');

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
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `banner_url` varchar(255) DEFAULT NULL,
  `promotion_type` varchar(50) NOT NULL DEFAULT 'general',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `applicable_products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_products`)),
  `terms_conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`terms_conditions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`id`, `title`, `description`, `image_url`, `banner_url`, `promotion_type`, `start_date`, `end_date`, `discount_percentage`, `discount_amount`, `is_featured`, `is_active`, `applicable_products`, `terms_conditions`, `created_at`, `updated_at`) VALUES
(1, 'Kevin', 'awww', 'uploads\\promotions\\55a46dfb-464b-4407-b081-5b5c64531579.jpg', 'uploads\\promotions\\0bf09b45-0020-4e48-80aa-21660676a64b.jpg', 'flash_sale', '2025-05-15', '2025-06-15', 1.00, 1.00, 1, 1, '\"\\\"[]\\\"\"', '\"\\\"{}\\\"\"', '2025-05-14 18:12:02', '2025-05-14 18:12:02'),
(2, 'Kevin', 'asd', 'uploads\\promotions\\5f4e5d33-7402-4c98-9acc-ae995a43299c.png', 'uploads\\promotions\\00d6c0a0-c252-4481-869d-a9fd1e0fb258.png', 'product_specific', '2025-05-15', '2025-06-17', 1.00, 111.00, 1, 1, '\"\\\"[]\\\"\"', '\"\\\"{}\\\"\"', '2025-05-14 18:15:21', '2025-05-14 18:15:21'),
(3, 'Alden Tongue', 'VHinz ', 'uploads\\promotions\\d9272323-de40-4d3e-8d1b-c90b352459f0.png', 'uploads\\promotions\\47c2a4cf-547d-45eb-a518-aa08a60553a2.png', 'general', '2025-05-15', '2025-06-15', 1.00, 0.01, 1, 1, '\"[]\"', '\"{}\"', '2025-05-15 13:11:04', '2025-05-15 13:11:04');

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `review` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_verified_purchase` tinyint(1) DEFAULT 0,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `moderated_by` int(11) DEFAULT NULL,
  `moderation_date` timestamp NULL DEFAULT NULL,
  `moderation_reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`id`, `user_id`, `medicine_id`, `rating`, `review`, `created_at`, `updated_at`, `is_verified_purchase`, `status`, `moderated_by`, `moderation_date`, `moderation_reason`) VALUES
(2, 8, 27, 5, 'awdawdawd', '2025-05-14 03:29:46', '2025-05-15 03:16:12', 0, 'approved', NULL, NULL, NULL),
(5, 8, 27, 5, 'wadawd', '2025-05-14 03:47:36', '2025-05-15 03:16:12', 0, 'approved', NULL, NULL, NULL),
(6, 8, 27, 5, 'omg', '2025-05-15 04:03:26', '2025-05-15 04:03:26', 1, 'approved', NULL, NULL, NULL),
(7, 8, 27, 2, 'nononon', '2025-05-15 04:03:38', '2025-05-15 04:03:38', 1, 'approved', NULL, NULL, NULL);

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

--
-- Dumping data for table `returns`
--

INSERT INTO `returns` (`id`, `order_id`, `user_id`, `status`, `reason`, `total_refund_amount`, `created_at`, `updated_at`) VALUES
(2, '7e2a80f8-1c6d-4a48-836a-67da2b706bed', 8, 'rejected', NULL, 42.00, '2025-05-14 06:17:55', '2025-05-15 15:53:47'),
(3, '1192cb53-919b-4bd2-addc-f07ba974a170', 8, 'approved', NULL, 47.00, '2025-05-15 15:42:42', '2025-05-15 15:53:43'),
(4, '2c3fb0a1-af92-419b-80a6-14e9d6cbec08', 8, 'pending', NULL, 25.00, '2025-05-15 15:55:45', '2025-05-15 15:55:45');

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
  `item_condition` varchar(255) NOT NULL,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `return_items`
--

INSERT INTO `return_items` (`id`, `return_id`, `order_item_id`, `quantity`, `reason`, `item_condition`, `refund_amount`, `created_at`) VALUES
(1, 2, 3, 1, 'damaged', 'opened', 30.00, '2025-05-14 06:17:55'),
(2, 2, 4, 1, 'wrong_item', 'opened', 12.00, '2025-05-14 06:17:55'),
(3, 3, 5, 1, 'not_as_described', 'opened', 22.00, '2025-05-15 15:42:42'),
(4, 3, 6, 1, 'wrong_item', 'new', 25.00, '2025-05-15 15:42:42'),
(5, 4, 22, 1, 'wrong_item', 'new', 25.00, '2025-05-15 15:55:45');

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

--
-- Dumping data for table `shipping_methods`
--

INSERT INTO `shipping_methods` (`id`, `name`, `base_cost`, `estimated_days`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Standard Shipping', 100.00, 5, 1, '2025-05-14 16:07:23', '2025-05-14 16:07:23'),
(2, 'Express Shipping', 200.00, 2, 1, '2025-05-14 16:07:23', '2025-05-14 16:07:23'),
(3, 'Same Day Delivery', 350.00, 1, 1, '2025-05-14 16:07:23', '2025-05-14 16:07:23');

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

--
-- Dumping data for table `tax_rates`
--

INSERT INTO `tax_rates` (`id`, `country`, `state`, `rate`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Philippines', 'Zambales', 2.00, 1, '2025-05-15 17:08:39', '2025-05-15 17:08:39');

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
  `mfa_enabled` tinyint(1) DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `google_access_token` text DEFAULT NULL,
  `google_refresh_token` text DEFAULT NULL,
  `google_profile_picture` varchar(255) DEFAULT NULL,
  `is_google_account` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`, `mfa_secret`, `mfa_enabled`, `google_id`, `google_access_token`, `google_refresh_token`, `google_profile_picture`, `is_google_account`) VALUES
(2, 'superadmin', 'superadmin@example.com', '$2y$10$PQD.Y8OPwoKV2TlHOYVxeOJaZAZKhHyXXhvZ5tqUGtxYsG0Ej4wPm', 'admin', NULL, NULL, '2025-03-13 04:13:17', '2025-03-13 04:13:17', NULL, 0, NULL, NULL, NULL, NULL, 0),
(3, 'kevin', 'kevin@gmail.com', '$2a$10$5Qtp8f0AziT5MNo3fwOPzuWC2YMXxQaCWZutR/YDj8igsgNRg.iV2', 'user', 'a4173a1f-a6c2-41f7-ab4c-be5d9917feb7', '2025-05-13 10:43:10', '2025-03-13 04:25:12', '2025-05-13 01:43:10', NULL, 0, NULL, NULL, NULL, NULL, 0),
(4, 'admin', 'admin@gmail.com', '$2a$10$ohXuuCfIS1UK6.ycVvAxcO2OlBAPSIOzVwbnnDDR0l4eBPR95xiMG', 'admin', NULL, NULL, '2025-03-13 04:32:01', '2025-03-13 04:32:01', NULL, 0, NULL, NULL, NULL, NULL, 0),
(7, 'kevinmilesjulhusin99', 'kevinmilesjulhusin99@gmail.com', '$2b$10$m8mJypp08l43Fbdq5TurA.1XJeBNXYT7tIVfHuK4.yuEJV5tLOgtO', 'user', NULL, NULL, '2025-05-13 01:31:55', '2025-05-13 02:05:24', NULL, 0, NULL, NULL, NULL, NULL, 0),
(8, 'kevin123', 'kevin123@gmail.com', '$2a$10$7ETpIpW/dw7EV1BkV7qia.hUhVeXolAnKk68GnBp.7WlKnoPuOxKq', 'user', NULL, NULL, '2025-05-13 16:11:55', '2025-05-13 16:11:55', NULL, 0, NULL, NULL, NULL, NULL, 0),
(9, 'Jonie Catindig', 'joniecatindig@gmail.com', '', 'user', NULL, NULL, '2025-05-16 02:40:06', '2025-05-16 02:40:06', NULL, 0, '100889018279494773652', NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocLuGCvUA23HpCec0L7qmcc_OItKp6jdjgJ2mrzhOvE_PBrfMw=s96-c', 1),
(10, 'Aba', 'abaewan214@gmail.com', '', 'user', NULL, NULL, '2025-05-16 03:01:30', '2025-05-16 03:01:30', NULL, 0, '115486721288550041401', NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocKjezHiEEqbK8jj9TAzA5hkNlaTBG2TsVTE9ELDUtptv8MwHg=s96-c', 1);

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_insert` AFTER INSERT ON `users` FOR EACH ROW BEGIN
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
(1, 7, 'IQ4V2KKNOZIX2L3WJMUESJDBKAYS6STG', 1, '[\"F6QD90JC\",\"SQTSNRC4\",\"BQLMBGVI\",\"L5JTZKGQ\",\"58GONO6J\",\"WPTEBIH7\",\"4TGWJWEK\",\"17AGTX9K\",\"FHIYLTZ5\",\"2RU0TKTD\"]', '2025-05-13 14:44:48', '2025-05-15 15:36:32');

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
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `avatar_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `first_name`, `last_name`, `phone_number`, `address`, `city`, `state_province`, `country`, `postal_code`, `bio`, `date_of_birth`, `gender`, `created_at`, `updated_at`, `avatar_url`) VALUES
(100, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-13 18:03:32', '2025-05-13 18:03:32', NULL),
(102, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-13 18:04:23', '2025-05-13 18:04:23', NULL),
(122, 8, 'Kevin Miles', 'Julhusin', '+6312345678911', '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejos', 'Zambales', 'Philippines', '2208', 'a handsome man', '1990-11-05', 'male', '2025-05-14 02:18:51', '2025-05-15 17:11:38', '/uploads/avatars/avatar-1747327014989-162884240.jpg'),
(493, 7, 'Kevin Miles', 'Julhusin', '+6312345678911', '#297 Purok 5A, San Pablo  Castillejos Zambales', 'Castillejoz', 'Zambales', 'Philippines', '2208', 'asd', NULL, NULL, '2025-05-15 13:00:28', '2025-05-15 15:37:16', NULL),
(495, 9, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-16 02:40:06', '2025-05-16 02:40:06', NULL),
(496, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-16 03:01:30', '2025-05-16 03:01:30', NULL);

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
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`id`, `user_id`, `medicine_id`, `created_at`) VALUES
(1, 8, 27, '2025-05-14 02:52:04'),
(4, 8, 18, '2025-05-14 02:54:26');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist_items`
--

CREATE TABLE `wishlist_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wishlist_items`
--

INSERT INTO `wishlist_items` (`id`, `user_id`, `medicine_id`, `created_at`) VALUES
(8, 8, 18, '2025-05-14 03:12:53'),
(9, 8, 27, '2025-05-14 03:12:56'),
(10, 8, 21, '2025-05-14 03:17:16'),
(11, 8, 30, '2025-05-14 03:20:19');

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
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

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
-- Indexes for table `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
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
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ratings_ibfk_1` (`user_id`),
  ADD KEY `fk_ratings_moderated_by` (`moderated_by`),
  ADD KEY `idx_ratings_status` (`status`),
  ADD KEY `idx_ratings_medicine_status` (`medicine_id`,`status`);

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
  ADD UNIQUE KEY `google_id` (`google_id`),
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
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_medicine` (`user_id`,`medicine_id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- Indexes for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_medicine` (`user_id`,`medicine_id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `mfa_settings`
--
ALTER TABLE `mfa_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_coupons`
--
ALTER TABLE `order_coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `prescription_items`
--
ALTER TABLE `prescription_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `refunds`
--
ALTER TABLE `refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `return_items`
--
ALTER TABLE `return_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tax_rates`
--
ALTER TABLE `tax_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_mfa`
--
ALTER TABLE `user_mfa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=497;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
  ADD CONSTRAINT `inventory_transactions_medicine_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `inventory_transactions_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `inventory_transactions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `medicines`
--
ALTER TABLE `medicines`
  ADD CONSTRAINT `medicines_category_fk` FOREIGN KEY (`category_id`) REFERENCES `medicine_categories` (`id`),
  ADD CONSTRAINT `medicines_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `mfa_settings`
--
ALTER TABLE `mfa_settings`
  ADD CONSTRAINT `mfa_settings_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_shipping_method_fk` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods` (`id`),
  ADD CONSTRAINT `orders_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_coupons`
--
ALTER TABLE `order_coupons`
  ADD CONSTRAINT `order_coupons_coupon_fk` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  ADD CONSTRAINT `order_coupons_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_medicine_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `order_items_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD CONSTRAINT `order_tracking_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `prescriptions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD CONSTRAINT `prescription_items_medicine_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `prescription_items_prescription_fk` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_medicine_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `product_reviews_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `fk_ratings_moderated_by` FOREIGN KEY (`moderated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_return_fk` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `returns_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `returns_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `return_items`
--
ALTER TABLE `return_items`
  ADD CONSTRAINT `return_items_order_item_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`),
  ADD CONSTRAINT `return_items_return_fk` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_mfa`
--
ALTER TABLE `user_mfa`
  ADD CONSTRAINT `user_mfa_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_medicine_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `wishlist_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
