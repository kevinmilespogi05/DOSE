# Tax and Shipping Calculation Features

This document provides information about the tax and shipping calculation features implemented in the DOSE application.

## Overview

The application now includes tax and shipping calculation functionality for the shopping cart and checkout process. This enhances the user experience by providing accurate total costs and supports various shipping methods and region-specific tax rates.

## Features

### Tax Rate Management

The tax system calculates taxes based on the customer's shipping address location. Admin users can:

- Create, edit, and delete tax rates
- Configure rates by country and optionally by state/province
- Set specific tax percentages
- Enable/disable tax rates

### Shipping Method Management

The shipping system provides multiple delivery options. Admin users can:

- Create, edit, and delete shipping methods
- Set shipping costs for each method
- Configure estimated delivery times
- Enable/disable shipping methods

### Customer Experience

In the shopping cart, customers can:

- Enter their shipping address
- Select from available shipping methods
- See a detailed breakdown of costs:
  - Subtotal (sum of all items)
  - Shipping cost
  - Tax amount (calculated based on location)
  - Total amount to be paid

## Implementation Details

### Database Tables

**Tax Rates Table**
```sql
CREATE TABLE tax_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100) DEFAULT NULL,
  rate DECIMAL(5,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY country_state (country, state)
);
```

**Shipping Methods Table**
```sql
CREATE TABLE shipping_methods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  base_cost DECIMAL(10,2) NOT NULL,
  estimated_days INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### API Endpoints

**Tax Rate Endpoints**
- `GET /api/tax-rates` - Get tax rate for a specific country/state
- `GET /api/admin/tax-rates` - List all tax rates (admin only)
- `POST /api/admin/tax-rates` - Create a new tax rate (admin only)
- `PUT /api/admin/tax-rates/:id` - Update a tax rate (admin only)
- `DELETE /api/admin/tax-rates/:id` - Delete a tax rate (admin only)

**Shipping Method Endpoints**
- `GET /api/shipping-methods` - List active shipping methods
- `GET /api/admin/shipping-methods` - List all shipping methods (admin only)
- `POST /api/admin/shipping-methods` - Create a new shipping method (admin only)
- `PUT /api/admin/shipping-methods/:id` - Update a shipping method (admin only)
- `DELETE /api/admin/shipping-methods/:id` - Delete a shipping method (admin only)

## Usage

### Admin Configuration

1. Log in as an admin user
2. Navigate to Tax Rates or Shipping in the admin menu
3. Configure rates and methods as needed

### Setting Default Values

It's recommended to set up at least:
- A default tax rate for your primary country of operation
- At least one shipping method

## Calculation Logic

The total price calculation follows this logic:
1. Calculate the subtotal (sum of item prices × quantities)
2. Add the shipping cost based on the selected method
3. Calculate tax based on the applicable rate for the shipping location
4. Sum all amounts to get the final total 