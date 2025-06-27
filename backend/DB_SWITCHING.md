# Database Environment Switching Guide

This project supports easy switching between database environments without manually editing configuration files.

## Available Environments

- **local** - Local development database (typically on localhost)
- **server** - Server/production database

## Ways to Switch Environments

### 1. Web Interface

Access the web interface at: http://localhost:3001/db-switcher.html

Simply click on the environment card you want to activate, then restart the server.

### 2. Command Line

You can use the following npm/pnpm scripts:

```bash
# Check current environment status
pnpm run db:status

# Switch to local environment
pnpm run db:local

# Switch to server environment
pnpm run db:server

# Interactive mode (shows all options)
pnpm run db:switch
```

### 3. API Endpoints

You can also use the API endpoints:

- **GET /db-config** - Get current config and available environments
- **POST /db-config/local** - Switch to local environment
- **POST /db-config/server** - Switch to server environment

## Configuration

The database connection settings are defined in `src/config/database.config.ts`:

### Local Environment

```
host: "localhost",
port: 1433,
username: process.env.DB_USERNAME || "sa",
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME || "question_bank"
```

### Server Environment

```
host: process.env.SERVER_DB_HOST || "server-hostname",
port: parseInt(process.env.SERVER_DB_PORT || "1433", 10),
username: process.env.SERVER_DB_USERNAME || process.env.DB_USERNAME,
password: process.env.SERVER_DB_PASSWORD || process.env.DB_PASSWORD,
database: process.env.SERVER_DB_NAME || process.env.DB_NAME
```

## Environment Variables

To fully configure both environments, add these to your `.env` file:

```
# Local database config
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=your_password
DB_NAME=question_bank

# Server database config
SERVER_DB_HOST=your.server.hostname
SERVER_DB_PORT=1433
SERVER_DB_USERNAME=server_user
SERVER_DB_PASSWORD=server_password
SERVER_DB_NAME=server_database
```

## How It Works

The system stores the current environment in a `db_env.txt` file in the project root. When the application starts, it reads this file to determine which database configuration to use. If the file doesn't exist, it defaults to the local environment.
