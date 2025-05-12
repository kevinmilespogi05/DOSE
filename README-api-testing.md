# Pharmacy Management System API Testing

This guide explains how to test the Pharmacy Management System API using the provided Postman collection.

## Setup

1. Install [Postman](https://www.postman.com/downloads/) if you haven't already.
2. Import the collection file `pharmacy-api-collection.json` into Postman:
   - Click on "Import" in the top-left corner
   - Upload or drag-and-drop the collection file
   - Click "Import" to complete

## Environment Setup

Create a new environment for testing:

1. Click the "Environments" tab in Postman
2. Click "Add" to create a new environment
3. Name it "Pharmacy API Testing"
4. Add the following variables (leave them empty for now, they'll be populated automatically):
   - `token`: For regular user authentication
   - `adminToken`: For admin user authentication
5. Click "Save"
6. Select this environment from the dropdown menu in the top-right corner

## Using the Collection

The collection is organized into the following folders:

- **Authentication**: Login, registration, and logout
- **Medicines**: Browsing and managing medicines
- **Prescriptions**: Prescription upload and management
- **Cart & Orders**: Shopping cart and order management
- **User Profile**: User profile and settings management

### Predefined User Accounts

The collection includes requests with predefined user credentials for quick testing:

- **Regular User**:
  - Email: `kevin@gmail.com`
  - Password: `123456`
  - Use the "Login - Regular User" request to authenticate with this account

- **Admin User**:
  - Email: `admin@gmail.com`
  - Password: `admin123`
  - Use the "Login - Admin" request to authenticate with this account

### Automatic Token Handling

The collection includes scripts that automatically save authentication tokens:

1. When you successfully log in with a regular user, the token is saved to the `token` variable
2. When you successfully log in with an admin user, the token is saved to the `adminToken` variable

These tokens are automatically used in subsequent requests that require authentication.

## Testing Workflow

### Basic User Flow

1. **Log in with an existing user**:
   - Use the "Login - Regular User" request to authenticate with the predefined user account
   - The token will be automatically saved

2. **Browse medicines**:
   - Use "Get All Medicines" to see available products
   - Use filters like search and category to narrow results

3. **Upload a prescription**:
   - Use "Upload Prescription" to submit a new prescription
   - Attach a PDF file and provide required information

4. **Add items to cart**:
   - Use "Add to Cart" to add medicines to your shopping cart
   - For prescription medicines, include the prescription ID

5. **Checkout**:
   - Use "Checkout" to place an order with the items in your cart
   - Provide shipping and payment information

6. **View orders**:
   - Use "Get Orders" to see your order history
   - Use "Get Order by ID" to check a specific order's details

### Admin Flow

1. **Log in as admin**:
   - Use the "Login - Admin" request to authenticate with the predefined admin account
   - The admin token will be automatically saved

2. **Manage medicines**:
   - Add new medicines with "Create Medicine"
   - Update existing ones with "Update Medicine"
   - Remove products with "Delete Medicine"

3. **Process prescriptions**:
   - View all user prescriptions with "All Prescriptions"
   - Approve or reject prescriptions with "Update Prescription Status"

4. **Manage orders**:
   - View all orders with "All Orders"
   - Update order statuses with "Update Order Status"

### Creating New Test Users

If you want to test with a new user account:

1. Use the "Register" request in the Authentication folder
2. Modify the request body with your test user details
3. After registering, use the "Login" request with the credentials you just registered

## Troubleshooting

- If you get a 401 Unauthorized error, your token may have expired. Try logging in again.
- Check that you're using the correct URL for your API. The collection defaults to `http://localhost:3000/api`.
- For admin-only endpoints, make sure you're logged in with an admin account and using the `adminToken`.

## Notes on Security Testing

- The collection includes examples for testing authentication and authorization.
- Try accessing admin endpoints with a regular user token to verify proper access control.
- Test validation by submitting invalid data in requests to ensure proper error handling. 