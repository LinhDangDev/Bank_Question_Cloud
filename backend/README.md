# Database Setup Instructions

## Environment Setup

This project requires a `.env` file in the backend root directory with the following parameters:

```
# Database Configuration
DB_HOST=<database-host>
DB_PORT=<database-port>
DB_USERNAME=<database-username>
DB_PASSWORD=<database-password>
DB_DATABASE=<database-name>

# Application Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration (for authentication)
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRATION=1h
```

## Setup Instructions

### Automatic Setup

Run the database setup script:

```bash
# Navigate to the backend directory
cd backend

# Install required Python libraries
pip install pyodbc python-dotenv

# Run the setup script
python scripts/setup-database.py
```

### Manual Setup

If you prefer to set up manually:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your database credentials:
   ```
   DB_HOST=<your-database-host>
   DB_PORT=<your-database-port>
   DB_USERNAME=<your-username>
   DB_PASSWORD=<your-password>
   DB_DATABASE=<your-database-name>
   ```

## Docker Deployment

When deploying with Docker, you can:

1. Set environment variables in docker-compose.yml:
   ```yaml
   backend:
     build:
       context: ./backend
     environment:
       - DB_HOST=<your-database-host>
       - DB_PORT=<your-database-port>
       - DB_USERNAME=<your-username>
       - DB_PASSWORD=<your-password>
       - DB_DATABASE=<your-database-name>
       - NODE_ENV=production
   ```

2. Or create a .env file and mount it to the container:
   ```yaml
   backend:
     volumes:
       - ./backend/.env:/app/.env
   ```

## Clean Up Sensitive Files

To remove files with potential sensitive information:

```bash
python scripts/clean_sensitive_files.py
```

This script will remove any test files that might contain hardcoded credentials.
