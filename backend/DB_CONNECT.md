# Database Connection Switching

This project supports easy switching between your local development database and a server database by setting a simple `DB_ENV` variable in your `.env` file.

## Quick Start

The easiest way to switch database environments is to use these commands:

```bash
# View current database environment
pnpm run db:status

# Switch to local development database
pnpm run db:local

# Switch to server database
pnpm run db:server
```

After changing the environment, **restart your application** for changes to take effect.

## How It Works

The system reads a `DB_ENV` variable from your `.env` file to determine which database configuration to use:

- When `DB_ENV=local`: Uses local database settings (DB_HOST, DB_PORT, etc.)
- When `DB_ENV=server`: Uses server database settings (SERVER_DB_HOST, SERVER_DB_PORT, etc.)

## Required Environment Variables

Make sure your `.env` file has these variables:

### For Local Database (DB_ENV=local)

```
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=your_password
DB_DATABASE=question_bank
```

### For Server Database (DB_ENV=server)

```
SERVER_DB_HOST=your-server-hostname
SERVER_DB_PORT=1433
SERVER_DB_USERNAME=server_username
SERVER_DB_PASSWORD=server_password
SERVER_DB_DATABASE=server_database_name
```

## Manual Configuration

You can also manually edit the `.env` file to switch environments by setting:

```
# Set this to 'local' or 'server'
DB_ENV=local
```

Change this value to `server` when you want to use the server database.

## Troubleshooting

If you encounter database connection issues:

1. Make sure your `.env` file exists with the correct settings
2. Check that your database passwords are correct
3. Verify that your database server is running and accessible
4. Remember to restart your application after switching environments
