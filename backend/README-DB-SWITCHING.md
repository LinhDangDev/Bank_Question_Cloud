# Database Environment Switching Guide

This project supports easy switching between database environments (local and server) using various methods.

## Available Environments

- **local** - Local development database (typically on localhost)
- **server** - Remote server database (103.173.226.35)

## Setup

Make sure your `.env` file includes both local and server database configurations:

```
# Database environment (local or server)
DB_ENV=local

# Local database settings
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourPassword123
DB_DATABASE=question_bank

# Server database settings
SERVER_DB_HOST=103.173.226.35
SERVER_DB_PORT=1433
SERVER_DB_USERNAME=sa
SERVER_DB_PASSWORD=Pass123@
SERVER_DB_DATABASE=question_bank
```

## Ways to Switch Environments

### 1. Command Line (Recommended)

Use these NPM/PNPM scripts:

```bash
# Check current environment status
pnpm run db:status

# Switch to local environment
pnpm run db:local

# Switch to server environment
pnpm run db:server

# Interactive mode (shows a menu)
pnpm run db:switch

# Test the current database connection
pnpm run db:test
```

### 2. Batch Script (Windows)

You can also use the included batch script:

```bash
# Show menu
db-switch.bat

# Switch directly to local
db-switch.bat local

# Switch directly to server
db-switch.bat server
```

### 3. Web Interface

When the application is running, access the web interface at:

```
http://localhost:3000/db-switcher.html
```

Simply click on the environment card you want to activate, then restart the server.

### 4. API Endpoints

You can also use the API endpoints:

- **GET /db-config** - Get current config and available environments
- **POST /db-config/local** - Switch to local environment
- **POST /db-config/server** - Switch to server environment

For example:
```bash
# Get current status
curl http://localhost:3000/db-config

# Switch to server
curl -X POST http://localhost:3000/db-config/server
```

## Manual Configuration

If needed, you can manually edit the `.env` file to switch environments by changing:

```
DB_ENV=local
```

to

```
DB_ENV=server
```

## Important Notes

1. After changing the database environment, you **must restart the server** for changes to take effect
2. The system stores the current environment in a `db_env.txt` file in the project root
3. If no environment is specified, it defaults to the local environment

## Troubleshooting

If you encounter database connection issues:

1. Run `pnpm run db:test` to test your current database connection
2. Verify your database credentials in the `.env` file
3. Check that your database server is running and accessible
4. For server connections, ensure your firewall allows the connection
5. If all else fails, run `pnpm run setup:env` to rebuild your environment configuration

## How It Works

The system reads the environment from either:
1. A `db_env.txt` file in the project root, or
2. The `DB_ENV` variable in your `.env` file

Based on this value, the appropriate database configuration is loaded from `database.config.ts`.
