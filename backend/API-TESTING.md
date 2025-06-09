# Testing the Question Bank API

This document provides instructions on how to test the Question Bank API using Swagger UI and the provided test scripts.

## Prerequisites

- Node.js installed
- NestJS backend running
- Database properly configured with existing data

## Using Swagger UI

The API is documented using Swagger UI, which provides an interactive interface to explore and test the API endpoints.

### Starting the Server

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies if you haven't already:
   ```
   pnpm install
   ```

3. Start the server:
   ```
   pnpm start:dev
   ```

### Accessing Swagger UI

There are several ways to access the Swagger UI:

1. **Direct URL**: Open your browser and navigate to:
   ```
   http://localhost:3000/api
   ```

2. **Using the provided script**: Run the following command:
   ```
   pnpm swagger
   ```

3. **Using the HTML page**: Open the `swagger-redirect.html` file in your browser.

## Using the Test Script

A test script is provided to automatically test the API endpoints for creating and retrieving questions.

### Running the Test Script

1. Make sure the server is running.

2. Run the test script:
   ```
   pnpm test:api
   ```

This script will:
- Check for existing questions in your database
- Test retrieving an existing question with its answers (if any exist)
- Create a new sample question with multiple answers using an existing section
- Retrieve the created question with its answers
- List all questions in the section

## API Endpoints for Questions

### Question Management

- `GET /cau-hoi` - Get all questions with pagination
- `GET /cau-hoi/:id` - Get a specific question by ID
- `GET /cau-hoi/:id/with-answers` - Get a question with its answers
- `GET /cau-hoi/phan/:maPhan` - Get questions by section
- `GET /cau-hoi/phan/:maPhan/with-answers` - Get questions with answers by section
- `POST /cau-hoi` - Create a new question
- `POST /cau-hoi/with-answers` - Create a new question with answers
- `PUT /cau-hoi/:id` - Update a question
- `PUT /cau-hoi/:id/with-answers` - Update a question with its answers
- `DELETE /cau-hoi/:id` - Delete a question
- `PATCH /cau-hoi/:id/soft-delete` - Soft delete a question
- `PATCH /cau-hoi/:id/restore` - Restore a soft-deleted question

### Answer Management

- `GET /cau-tra-loi` - Get all answers
- `GET /cau-tra-loi/:id` - Get a specific answer
- `GET /cau-tra-loi/cau-hoi/:maCauHoi` - Get answers for a specific question
- `POST /cau-tra-loi` - Create a new answer
- `PUT /cau-tra-loi/:id` - Update an answer
- `DELETE /cau-tra-loi/:id` - Delete an answer

## Example Request for Creating a Question with Answers

```json
{
  "question": {
    "MaPhan": "your-section-id",
    "MaSoCauHoi": 1,
    "NoiDung": "What is the capital of France?",
    "HoanVi": false,
    "CapDo": 1,
    "SoCauHoiCon": 0
  },
  "answers": [
    {
      "NoiDung": "Paris",
      "ThuTu": 1,
      "LaDapAn": true,
      "HoanVi": false
    },
    {
      "NoiDung": "London",
      "ThuTu": 2,
      "LaDapAn": false,
      "HoanVi": false
    },
    {
      "NoiDung": "Berlin",
      "ThuTu": 3,
      "LaDapAn": false,
      "HoanVi": false
    },
    {
      "NoiDung": "Madrid",
      "ThuTu": 4,
      "LaDapAn": false,
      "HoanVi": false
    }
  ]
}
```

Note: When creating answers through the `/cau-hoi/with-answers` endpoint, you don't need to specify the `MaCauHoi` field for each answer as it will be automatically filled in by the backend.
