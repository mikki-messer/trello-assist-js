# TrelloAssist

![Lint Status](https://github.com/mikki-messer/trello-assist-js/workflows/Lint%20Code/badge.svg)

Automated project numbering system for Trello cards. Automatically assigns sequential numbers to cards based on Custom Field selection via webhooks.

## Features

- **Automatic Card Numbering** — Cards are renamed with project prefix and sequential number (e.g., `PRJ-25 Task Name`)
- **Multi-Board Support** — Monitor multiple Trello boards with independent webhook registration
- **Cross-Board Numbering** — Sequential numbering shared across all boards per project
- **HMAC Security** — Webhook signature validation to prevent unauthorized requests
- **Logging** — Logs are written to stdout
- **Health Monitoring** — Health check endpoint for monitoring and load balancers
- **Docker Ready** — Production-ready Docker and docker-compose setup

## How It Works

1. User changes the "Project" custom field on a Trello card
2. Trello sends a webhook to the server
3. Server validates HMAC signature
4. Server checks if the board is registered
5. Server increments the project counter in the database
6. Server updates the card title with `{PREFIX}-{NUMBER} {Original Title}`

**Example:**
```
Card: "Fix login bug"
User sets: Project = PRJ
Result: "PRJ-25 Fix login bug"
```

---

## Prerequisites

- **Trello Account** with API access ([Power-Ups admin](https://trello.com/power-ups/admin))
- **Docker Desktop** (for Docker deployment) or **Node.js 20+** and npm (for local development)
- **ngrok** (for local development) or a publicly accessible server
- **SQLite** (included with Node.js, no separate installation needed)

---

## Quick Start

### Option A: Docker (Recommended)

```bash
git clone <your-repo-url>
cd trelloassist
cp .env.example .env         # Edit with your credentials
cp config/boards.example.js config/boards.local.js  # Add your board IDs
docker compose up -d
```

### Option B: Local Development

```bash
git clone <your-repo-url>
cd trelloassist
npm install
cp .env.example .env         # Edit with your credentials
cp config/boards.example.js config/boards.local.js  # Add your board IDs
node server.js
```

After starting the server, register webhooks for your boards:

```bash
npm run webhooks:register
```

---

## 🐋 Docker Deployment

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Starting the Service

```bash
docker compose up -d
```

This builds the image from the `Dockerfile`, starts the container in the background, and maps port 3000.

### Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start the service in the background |
| `docker compose down` | Stop and remove the container |
| `docker compose logs -f` | Follow container logs |
| `docker compose ps` | Show container status |
| `docker compose exec app sh` | Open a shell inside the container |
| `docker compose restart` | Restart the service |
| `docker compose up -d --build` | Rebuild and restart |

### Data Persistence

The following directories are mounted as volumes and persist across container restarts:

| Volume | Path | Purpose |
|--------|------|---------|
| `./data` | `/app/data` | SQLite database |
| `./backups` | `/app/backups` | Database backups |

### Health Check

Docker performs automatic health checks every 30 seconds against the health endpoint. Check container health status:

```bash
docker compose ps
```

The `STATUS` column shows `healthy`, `unhealthy`, or `starting`.

### Environment Variables

The container reads environment variables from the `.env` file via the `env_file` directive in `docker-compose.yml`. To update variables, edit `.env` and restart:

```bash
docker compose restart
```

### Container Details

- **Container name**: `trelloassist`
- **Base image**: `node:20-alpine`
- **Runs as**: Non-root user (`nodejs`)
- **Restart policy**: `unless-stopped`
- **Log rotation**: max 10MB per file, 3 files

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `TRELLO_API_KEY` | Trello API key | From [Power-Ups admin](https://trello.com/power-ups/admin) |
| `TRELLO_TOKEN` | Trello API token | Generated from Power-Ups admin |
| `TRELLO_SECRET` | Webhook HMAC secret | Generated from Power-Ups admin |
| `CALLBACK_URL` | Server base URL | `https://abc.ngrok-free.app` |
| `APP_WEBHOOK_PATH` | Webhook endpoint path | `/webhook` |
| `APP_HEALTHCHECK_PATH` | Health check path | `/health` |
| `TRELLO_CUSTOM_FIELD_NAME` | Custom field to watch | `Project` |
| `TRELLO_WEBHOOK_DESCRIPTION` | Description for registered webhooks | `TrelloAssist` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `LOG_LEVEL` | Logging verbosity | `error`, `warn`, `info`, `debug` |
| `DB_PATH` | SQLite database path | `projects.db` |

The full callback URL for Trello webhooks is composed from `CALLBACK_URL` + `APP_WEBHOOK_PATH` (e.g., `https://abc.ngrok-free.app/webhook`).

See `.env.example` for the complete list of variables.

**Getting Trello credentials:**
1. Go to https://trello.com/power-ups/admin
2. Create a new Power-Up (or use an existing one)
3. Copy the API Key
4. Generate a Token
5. Note the Webhook Secret (used for HMAC validation)

### Board Configuration

Boards are configured in `config/boards.local.js` as an object with board IDs as keys:

```javascript
const boards = {
    '5f8b3c2a1d4e5f6g7h8i9j0k': 'Development Board',
    '6a9c4d3b2e5f7g8h9i0j1k2l': 'Marketing Projects',
};

module.exports = { boards };
```

To find your board IDs:

```bash
node scripts/list-boards.js
```

`boards.local.js` is in `.gitignore` and will not be committed.

### Custom Field Setup in Trello

1. Enable the **Custom Fields** Power-Up on your Trello board
2. Add a dropdown custom field named to match `TRELLO_CUSTOM_FIELD_NAME` (e.g., "Project")
3. Add dropdown options for each project prefix (e.g., "PRJ", "MKT", "DEV")

---

## Webhook Management

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run webhooks:list` | List all registered webhooks |
| `npm run webhooks:register` | Register webhooks for all boards in `boards.local.js` |
| `npm run webhooks:delete` | Delete all registered webhooks |

### Registering Webhooks

Register webhooks for all boards defined in `config/boards.local.js`:

```bash
npm run webhooks:register
```

The server must be running and accessible at `CALLBACK_URL` before registering webhooks, because Trello sends a HEAD request to verify the callback URL during registration.

### When ngrok URL Changes

If you use ngrok for local development, the URL changes on each restart (unless you have a paid plan). To update:

1. Update `CALLBACK_URL` in `.env` with the new ngrok URL
2. Restart the server
3. Delete old webhooks and register new ones:

```bash
npm run webhooks:delete
npm run webhooks:register
```

### Registering a Single Webhook

To register a webhook for a single board:

```bash
node scripts/register-webhook.js <board_id> "Board Description"
```

### Deleting a Single Webhook

```bash
node scripts/delete-webhook.js <webhook_id>
```

Find webhook IDs with `npm run webhooks:list`.

---

## 🔧 Development

### Local Setup

```bash
npm install
cp .env.example .env
cp config/boards.example.js config/boards.local.js
node server.js
```

### Using ngrok for Webhook Testing

Trello requires a publicly accessible HTTPS URL for webhooks. Use [ngrok](https://ngrok.com/) during local development:

```bash
ngrok http 3000
```

Copy the HTTPS forwarding URL to `CALLBACK_URL` in `.env`, then restart the server and register webhooks.

### Linting

The project uses ESLint with CI via GitHub Actions.

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Database Backup

```bash
npm run backup
```

This runs `scripts/backup.sh` to create a backup in the `backups/` directory.

---

## Scripts Reference

### npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node server.js` | Start the server |
| `npm run lint` | `eslint .` | Run ESLint |
| `npm run lint:fix` | `eslint . --fix` | Auto-fix lint issues |
| `npm run backup` | `./scripts/backup.sh` | Backup the database |
| `npm run webhooks:list` | `node scripts/list-webhooks.js` | List all webhooks |
| `npm run webhooks:delete` | `node scripts/delete-all-webhooks.js` | Delete all webhooks |
| `npm run webhooks:register` | `node scripts/register-webhooks-from-boards-file.js` | Register webhooks from `boards.local.js` |

### Utility Scripts in `scripts/`

| Script | Description |
|--------|-------------|
| `list-boards.js` | List all boards accessible by your Trello token |
| `list-webhooks.js` | List all registered webhooks |
| `register-webhook.js` | Register a webhook for a single board |
| `register-webhooks-from-boards-file.js` | Register webhooks for all boards in `boards.local.js` |
| `delete-webhook.js` | Delete a single webhook by ID |
| `delete-all-webhooks.js` | Delete all registered webhooks |
| `show-migrations.js` | Show applied database migrations |
| `backup.sh` | Backup the SQLite database |

---

## Project Structure

```
trelloassist/
├── config/
│   ├── boards.js                  # Board configuration loader
│   ├── boards.example.js          # Template (in Git)
│   └── boards.local.js            # Your boards (NOT in Git)
├── middleware/
│   └── hmac-validation.js         # HMAC signature validation
├── scripts/
│   ├── backup.sh                  # Database backup script
│   ├── delete-all-webhooks.js     # Delete all webhooks
│   ├── delete-webhook.js          # Delete a single webhook
│   ├── list-boards.js             # List accessible boards
│   ├── list-webhooks.js           # List registered webhooks
│   ├── register-webhook.js        # Register a single webhook
│   ├── register-webhooks-from-boards-file.js  # Bulk webhook registration
│   └── show-migrations.js         # Show DB migrations
├── utils/
│   ├── format.js                  # Formatting utilities
│   ├── trello-utils.js            # Trello API client functions
│   └── validate-env.js            # Environment variable validation
├── data/                          # Database directory (Docker)
├── backups/                       # Database backups
├── db.js                          # SQLite database functions
├── logger.js                      # Winston logger configuration
├── migrations.js                  # Database migration runner
├── server.js                      # Express server & webhook handler
├── .env                           # Environment variables (NOT in Git)
├── .env.example                   # Environment template (in Git)
├── docker-compose.yml             # Docker Compose configuration
├── Dockerfile                     # Multi-stage Docker build
└── package.json
```

---

## Architecture

```
┌─────────────────────┐
│   Trello Board      │
│   (User changes     │
│    Project field)    │
└──────────┬──────────┘
           │ Webhook (HTTPS)
           ↓
┌─────────────────────┐
│  HMAC Validation    │ ← Verify signature
│  (middleware)       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Board Check        │ ← boards.local.js
│  (server.js)        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Database           │ ← Increment counter
│  (SQLite)           │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Trello API         │ ← Update card title
│  (PUT /cards/{id})  │
└─────────────────────┘
```

---

## API Endpoints

### POST `{APP_WEBHOOK_PATH}`

Receives webhooks from Trello. Protected by HMAC signature validation.

### HEAD `{APP_WEBHOOK_PATH}`

Responds to Trello's webhook verification requests during registration.

### GET `{APP_HEALTHCHECK_PATH}`

Returns service health status:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "boards_registered": 2
}
```

### HEAD `{APP_HEALTHCHECK_PATH}`

Lightweight health check (status code only, no body).

---

## Database

### Schema

```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT UNIQUE NOT NULL,
    last_number INTEGER DEFAULT 0
);

CREATE TABLE migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
```

Migrations run automatically on server start. To view applied migrations:

```bash
node scripts/show-migrations.js
```

---

## Logging

Logs are written to **stdout** (JSON format).

**Local development:**
```bash
npm start
# Logs appear in terminal
```

**Docker:**
```bash
# View logs in real-time
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs from last hour
docker-compose logs --since 1h
```

Docker automatically manages log rotation (max 30MB: 3 files × 10MB).

### Log Levels

Set via `LOG_LEVEL` environment variable: `error`, `warn`, `info` (default), `debug`.

---

## Troubleshooting

### Webhook Registration Fails

- **Server must be running** — Trello sends a HEAD request to `CALLBACK_URL` + `APP_WEBHOOK_PATH` during registration to verify the endpoint
- **URL must be publicly accessible** — Use ngrok for local development
- **Check credentials** — Verify `TRELLO_API_KEY` and `TRELLO_TOKEN` in `.env`

### HMAC Validation Errors

- Verify `TRELLO_SECRET` in `.env` matches the secret from your Trello Power-Up
- Ensure the callback URL registered with Trello exactly matches `CALLBACK_URL` + `APP_WEBHOOK_PATH`
- Check logs for "Invalid HMAC signature" messages

### ngrok URL Changed

1. Update `CALLBACK_URL` in `.env`
2. Restart the server
3. Delete old webhooks: `npm run webhooks:delete`
4. Register new webhooks: `npm run webhooks:register`

### Cards Not Updating

Check logs for:
- `"Webhook from unregistered board"` — Add the board to `config/boards.local.js`
- `"Could not resolve project name"` — Check custom field configuration in Trello
- Enable debug logging: set `LOG_LEVEL=debug` in `.env` and restart

### Database Issues

**Database locked:**
```bash
lsof projects.db    # Find the process
kill <PID>           # Terminate it
```

**View migrations:**
```bash
node scripts/show-migrations.js
```

### Docker Connectivity

- Verify the container is running: `docker compose ps`
- Check container health: look for `healthy` in the STATUS column
- View logs: `docker compose logs -f`
- Ensure port 3000 is not used by another process
- Rebuild after code changes: `docker compose up -d --build`

---

## Security

### HMAC Signature Validation

All incoming webhooks are validated using HMAC-SHA1:

1. Trello sends a signature in the `x-trello-webhook` header
2. Server computes `HMAC-SHA1(secret, body + callbackURL)`
3. Signatures are compared; mismatches return 401 Unauthorized

### Board Registration

Only boards listed in `config/boards.local.js` are processed. Webhooks from unregistered boards are logged and ignored.

### Sensitive Data

API keys, tokens, and secrets are stored in `.env` (excluded from Git). Board IDs are stored in `boards.local.js` (also excluded from Git).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Create a pull request

---

## License

ISC
