# Pharmacy Management System API Testing Instructions

This document provides step-by-step instructions on how to run and use the Postman collection for testing the Pharmacy Management System API.

## Prerequisites

Before beginning, make sure you have:

1. [Postman](https://www.postman.com/downloads/) installed on your computer
2. The Pharmacy Management System API server running locally on port 3000
3. The `pharmacy-api-collection.json` file downloaded to your computer
4. Basic understanding of REST APIs and HTTP requests

## Setting Up Postman

### Step 1: Install Postman
If you haven't already, download and install Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)

### Step 2: Import the Collection

1. Open Postman
2. Click on the "Import" button in the top-left corner
3. Select the `pharmacy-api-collection.json` file from your computer
4. Click "Import" to complete the process
5. The "Pharmacy Management System API" collection should now appear in your Collections list

### Step 3: Create an Environment

1. Click on the "Environments" tab in the left sidebar
2. Click the "+" icon to create a new environment
3. Name it "Pharmacy API Testing"
4. Add the following variables:
   - `token`: Leave the value empty
   - `adminToken`: Leave the value empty
5. Click "Save"
6. In the top-right corner of Postman, select "Pharmacy API Testing" from the environment dropdown

## Running API Tests

### Authentication Tests

#### Login as Regular User

1. In the Collections sidebar, expand "Pharmacy Management System API"
2. Expand the "Authentication" folder
3. Click on "Login - Regular User"
4. Click the "Send" button
5. You should receive a successful response with a JWT token
6. The token will be automatically stored in the environment variable `token`
7. Verify by checking the "Environments" tab - the `token` value should be populated

#### Login as Admin

1. In the "Authentication" folder, click on "Login - Admin"
2. Click the "Send" button
3. You should receive a successful response with a JWT token
4. The token will be automatically stored in the environment variable `adminToken`
5. Verify by checking the "Environments" tab - the `adminToken` value should be populated

### Medicine Management Tests

#### Viewing Medicines (User Role)

1. Expand the "Medicines" folder
2. Click on "Get All Medicines"
3. Click the "Send" button
4. You should receive a list of medicines
5. Try using the query parameters in the "Params" tab to filter results:
   - `page`: For pagination
   - `limit`: Number of items per page
   - `search`: Filter by medicine name
   - `category`: Filter by medicine category

#### Adding a New Medicine (Admin Role)

1. In the "Medicines" folder, click on "Create Medicine (Admin)"
2. Review the JSON body of the request
3. Click the "Send" button
4. You should receive a successful response with the created medicine
5. Use "Get All Medicines" to verify the new medicine appears in the list

### Prescription Management Tests

#### Uploading a Prescription (User Role)

1. Expand the "Prescriptions" folder
2. Click on "Upload Prescription"
3. In the "Body" tab, select "form-data"
4. For the "prescription" field, click "Select File" and choose a PDF file
5. Fill in other fields as needed
6. Click the "Send" button
7. You should receive a successful response with the prescription ID

#### Viewing and Managing Prescriptions (Admin Role)

1. In the "Prescriptions" folder, click on "All Prescriptions (Admin)"
2. Click the "Send" button
3. You should receive a list of all user prescriptions
4. To update a prescription status, click on "Update Prescription Status (Admin)"
5. Update the request path to include the ID of the prescription you want to update
6. Click the "Send" button

### Shopping Cart Tests

#### Adding Items to Cart (User Role)

1. Expand the "Cart & Orders" folder
2. Click on "Add to Cart"
3. Update the request body with:
   - `medicine_id`: ID of the medicine to add
   - `quantity`: Number of items
   - `prescription_id`: ID of the prescription (if required)
4. Click the "Send" button
5. Verify by using "Get Cart" to see the updated cart

#### Checkout Process (User Role)

1. In the "Cart & Orders" folder, click on "Checkout"
2. Review the request body with shipping and payment information
3. Click the "Send" button
4. You should receive a successful response with the order details
5. Verify using "Get Orders" to see your recent order

### Order Management Tests (Admin Role)

1. In the "Cart & Orders" folder, click on "All Orders (Admin)"
2. Click the "Send" button
3. You should receive a list of all user orders
4. To update an order status, click on "Update Order Status (Admin)"
5. Update the request path to include the ID of the order you want to update
6. Modify the request body with the new status and tracking information
7. Click the "Send" button

## Testing Best Practices

### Sequential Testing

For a complete test flow, follow this sequence:

1. Login as a user
2. Browse medicines
3. Upload a prescription
4. Add medicines to cart
5. Checkout
6. View orders
7. Login as admin
8. Manage medicines
9. Process prescriptions
10. Update order statuses

### Security Testing

1. Try accessing admin endpoints with a regular user token:
   - Copy the user token value
   - Replace the `{{adminToken}}` with `Bearer your-user-token` in an admin request
   - The request should be rejected with a 403 Forbidden response

2. Test validation by submitting invalid data:
   - Try adding a medicine with negative price
   - Try checking out with an empty cart
   - Try uploading a non-PDF file as a prescription

## Troubleshooting

### Common Issues and Solutions

1. **401 Unauthorized Error**
   - Your token may have expired. Log in again to refresh it.

2. **404 Not Found Error**
   - Check that the API server is running at the correct URL.
   - Verify the endpoint path is correct.

3. **500 Server Error**
   - Check the server logs for more details.
   - Verify your request data is formatted correctly.

4. **Invalid Token Format**
   - Make sure the token is being correctly extracted and stored.
   - Check that the Authorization header is properly formatted as `Bearer your-token`.

5. **Environment Variable Issues**
   - Make sure the environment is selected in the dropdown.
   - Verify the script that extracts tokens is running (check the Console tab after login).

## Advanced Usage

### Creating Test Automation

To run multiple requests in sequence:

1. Right-click on the collection name
2. Select "Run collection"
3. Select which requests to include
4. Click "Run"
5. Review the test results in the Runner tab

### Creating Your Own Tests

You can add test scripts to validate responses:

1. Click on a request
2. Go to the "Tests" tab
3. Write JavaScript code to validate the response
4. Example:
   ```javascript
   pm.test("Status code is 200", function () {
     pm.response.to.have.status(200);
   });
   
   pm.test("Response contains expected data", function () {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('id');
   });
   ```

### Exporting Test Results

1. After running a collection, click "Export Results" in the Runner
2. Choose a format (JSON, CSV, HTML)
3. Save the file to your computer

## Conclusion

This Postman collection provides a comprehensive way to test all aspects of the Pharmacy Management System API. By following these instructions, you can verify that the API functions correctly for both regular users and administrators.

Remember to keep your credentials secure and never use production credentials in test environments. 