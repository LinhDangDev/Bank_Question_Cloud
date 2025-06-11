# Question Bank API - Postman Import Guide

This guide will help you import and use the Question Bank API collection in Postman.

## Importing the Collection

1. **Open Postman**

2. **Import the Collection**
   - Click on "Import" button in the top left corner
   - Select "File" tab
   - Choose the `postman-collection.json` file
   - Click "Import"

3. **Set Up Environment**
   - Click on the "Environments" tab in the left sidebar
   - Click the "+" button to create a new environment
   - Name it "Question Bank API"
   - Add the following variables:
     - `baseUrl`: `http://localhost:3000` (or your API server URL)
     - `token`: (leave empty for now)
     - `questionId`: (leave empty for now)
     - `answerId`: (leave empty for now)
     - `sectionId`: (leave empty for now)
     - `examId`: (leave empty for now)
     - `subjectId`: (leave empty for now)
     - `facultyId`: (leave empty for now)
   - Click "Save"
   - Make sure to select this environment from the environment dropdown in the top right corner

## Using the Collection

### Authentication

1. **Login**
   - Run the "Login" request in the Authentication folder
   - This will return an access token
   - Copy the `access_token` value from the response

2. **Set Token Variable**
   - Click on the environment quick look (eye icon) in the top right
   - Set the `token` variable to the access token you copied
   - Click "Save"

### Getting Started with Testing

1. **Get Faculties**
   - Run the "Get All Faculties" request to see available faculties
   - Copy a faculty ID and set it as the `facultyId` variable

2. **Get Sections**
   - You'll need to find or create a section
   - Once you have a section ID, set it as the `sectionId` variable

3. **Create a Question with Answers**
   - Run the "Create Question With Answers" request
   - Copy the question ID from the response and set it as the `questionId` variable
   - Copy one of the answer IDs and set it as the `answerId` variable

4. **Continue Testing**
   - You can now test other API endpoints using the variables you've set

## Automating Tests

You can use the Postman Collection Runner to run a sequence of requests:

1. Click on the "Runner" button in the top left
2. Select the "Question Bank API" collection
3. Choose which requests to run
4. Click "Start Run"

## Exporting Test Results

After running tests:

1. Click on the "Export Results" button
2. Choose your preferred format (JSON, CSV, HTML)
3. Save the file

## Troubleshooting

If you encounter any issues:

- Ensure your API server is running
- Check that your environment variables are correctly set
- Verify that you've set the correct authentication token
- Check the console logs of your API server for errors
