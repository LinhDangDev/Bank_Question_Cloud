# Question Bank API Testing Tools

This directory contains tools to help you test the Question Bank API. You can choose between using Postman or a Python script for testing.

## Option 1: Testing with Postman

### Files
- `postman-collection.json`: The Postman collection containing all API endpoints
- `postman-import-guide.md`: Step-by-step guide for importing and using the collection

### Requirements
- [Postman](https://www.postman.com/downloads/) installed on your computer

### Getting Started
1. Follow the instructions in `postman-import-guide.md` to import the collection
2. Set up your environment variables
3. Start testing the API endpoints

## Option 2: Testing with Python Script

### Files
- `test-api.py`: Python script for testing the API endpoints

### Requirements
- Python 3.6+
- Required packages: `requests`, `colorama`

### Installation
```bash
pip install requests colorama
```

### Usage
```bash
# Run a full test sequence
python test-api.py

# Specify a different API URL
python test-api.py --url http://your-api-url:3000

# Run a specific test action
python test-api.py --action login
python test-api.py --action faculties
python test-api.py --action questions
python test-api.py --action sections
python test-api.py --action create_question
python test-api.py --action get_question
python test-api.py --action update_question
python test-api.py --action delete_question
```

### Available Actions
- `login`: Test login functionality
- `faculties`: Get all faculties
- `questions`: Get all questions
- `sections`: Get all sections
- `create_question`: Create a new question with answers
- `get_question`: Get a question with its answers
- `update_question`: Update a question with its answers
- `delete_question`: Delete a question
- `full_test`: Run a complete test sequence (default)

## Using the Existing Node.js Test Script

You can also use the existing Node.js test script:

```bash
# Install dependencies
pnpm install axios

# Run the test script
node test-api.js
```

This script will:
1. Find an existing section in your database
2. Create a sample question with multiple answers
3. Retrieve the created question with its answers
4. List all questions in the section

## API Documentation

For full API documentation, start your server and visit:
```
http://localhost:3000/api
```

This will open the Swagger UI where you can explore and test all available endpoints.
