# TrelloAssist

Automated project numbering system for Trello cards. Automatically assigns sequential numbers to cards based on project selection.

## Features

- **Automatic Card Numbering**: Cards are automatically renamed with project prefix and sequential number (e.g., `PRJ-25 Task Name`)
- **Multi-Board Support**: Supports multiple Trello boards with independent webhook registration
- **Cross-Board Numbering**: Sequential numbering across all boards (shared counter per project)
- **HMAC Security**: Webhook signature validation to prevent unauthorized requests
- **Adaptive Logging**: Environment-based logging (files in dev, stdout in production)
- **Health Monitoring**: Health check endpoint for monitoring and load balancers

## How It Works

1. User changes the "Project" custom field on a Trello card
2. Trello sends a webhook to the server
3. Server validates HMAC signature
4. Server checks if board is registered
5. Server increments project counter in database
6. Server updates card title with `{PREFIX}-{NUMBER} {Original Title}`

**Example:**
```
Card: "Fix login bug"
User sets: Project = PRJ
Result: "PRJ-25 Fix login bug"
```

---

## Prerequisites

- **Node.js** 14+ and npm
- **Trello Account** with API access
- **ngrok** (for local development) or public server
- **SQLite** (included with Node.js)

---

## Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd trelloassist
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```bash
# Trello API (get from https://trello.com/power-ups/admin)
TRELLO_API_KEY=your_api_key_here
TRELLO_TOKEN=your_token_here
TRELLO_SECRET=your_webhook_secret_here

# Webhook callback URL (your server URL)
CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/

# App configuration
TRELLO_CUSTOM_FIELD_NAME=Project
TRELLO_EVENT_TYPE=updateCustomFieldItem
APP_WEBHOOK_PATH=/your_webhook_path_with_leading_slash
APP_HEALTHCHECK_PATH=/your_health_endpoint_path_with_leading_slash

#Webhook description
TRELLO_WEBHOOK_DESCRIPTION=your_description_here

# Server
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

**Getting Trello credentials:**
1. Go to https://trello.com/power-ups/admin
2. Create a new Power-Up (or use existing)
3. Copy API Key
4. Generate Token
5. Generate Webhook Secret

### 4. Configure boards

Copy the boards template:
```bash
cp config/boards.example.js config/boards.local.js
```

Get your board IDs:
```bash
node scripts/list-boards.js
```

Add your boards to `config/boards.local.js`:
```javascript
const boards = {
    'your_board_id_here': 'Board Description',
    '1a2b3c4a1d4e5f6g7h8i9j0k': 'Development Board',
    // Add more boards as needed
};

module.exports = { boards };
```

**Note:** `boards.local.js` is in `.gitignore` and will not be committed.

### 5. Register webhooks

For each board, register a webhook:
```bash
node register-webhook.js <board_id> "Board Description"
```

Example:
```bash
node register-webhook.js 5f8b3c2a1d4e5f6g7h8i9j0k "Development Board"
```

Verify registration:
```bash
node list-webhooks.js
```

### 6. Start the server

**Development:**
```bash
node server.js
```

**Production:**
```bash
NODE_ENV=production node server.js
```

**With nodemon (auto-reload):**
```bash
npm install -g nodemon
nodemon server.js
```

---

## Usage

### Adding a New Board

1. Get the board ID:
```bash
   node scripts/list-boards.js
```

2. Register a webhook:
```bash
   node register-webhook.js <board_id> "add_your_description"
```

3. Add board to `config/boards.local.js`:
```javascript
   const boards = {
       // ... existing boards
       'new_board_id': 'Board Description',
   };
```

4. Restart the server

### Using in Trello

1. Create or open a card
2. Set the "Project" custom field (e.g., select "LV")
3. Card is automatically renamed: `PRJ-1 Original Card Name`
4. Next card with same project: `PRJ-2 Next Card Name`

### Removing a Board

1. Remove from `config/boards.local.js`
2. Delete webhook:
```bash
   node delete-webhook.js <webhook_id>
```
3. Restart the server

---

## Architecture
```
┌─────────────────────┐
│   Trello Board      │
│   (User changes     │
│    Project field)   │
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

### Project Structure
```
trelloassist/
├── config/
│   ├── boards.js              # Board configuration loader
│   ├── boards.example.js      # Template (in Git)
│   └── boards.local.js        # Your boards (NOT in Git)
├── middleware/
│   └── hmac-validation.js     # HMAC signature validation
├── scripts/
│   └── list-boards.js         # Helper to find board IDs
│   └── list-webhooks.js       # List registered webhooks
├── logs/                      # Log files (NOT in Git)
│   ├── error.log
│   └── combined.log
├── db.js                      # SQLite database functions
├── logger.js                  # Winston logger configuration
├── server.js                  # Express server & webhook handler
├── trello-utils.js            # Trello API client functions
├── utils.js                   # Utility functions
├── register-webhook.js        # Register webhooks for boards
├── delete-webhook.js          # Delete webhooks
├── .env                       # Environment variables (NOT in Git)
├── .env.example               # Template (in Git)
├── projects.db                # SQLite database (NOT in Git)
└── package.json
```

---

## Logging

### Development Mode

Logs are written to:
- **Console** (colored, human-readable)
- **`logs/error.log`** (errors only, JSON format)
- **`logs/combined.log`** (all levels, JSON format)
```bash
# View logs in real-time
tail -f logs/combined.log

# View only errors
tail -f logs/error.log

# Filter by board
tail -f logs/combined.log | grep "boardId"
```

### Production Mode

Logs are written to **stdout only** (JSON format).

Docker/Kubernetes will collect logs from container output:
```bash
# Docker logs
docker logs -f <container_id>

# Kubernetes logs
kubectl logs -f <pod_name>
```

### Log Levels

Set via `LOG_LEVEL` environment variable:

- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Informational, warnings, and errors (default)
- `debug` - All logs including debug messages

Example:
```bash
LOG_LEVEL=debug node server.js
```

---

## Security

### HMAC Signature Validation

All webhooks are validated using HMAC-SHA1 signatures:

1. Trello sends webhook with `x-trello-webhook` header containing signature
2. Server generates its own signature: `HMAC-SHA1(secret, body + callbackURL)`
3. Signatures are compared
4. Request is rejected if signatures don't match (401 Unauthorized)

**This prevents:**
- Unauthorized webhook requests
- Replay attacks
- Data tampering

### Board Registration

Only registered boards (in `boards.local.js`) are processed. Webhooks from unregistered boards are logged and ignored.

### Environment Variables

Sensitive data is stored in `.env` (not committed to Git):
- API keys and tokens
- HMAC secret
- Board IDs (in `boards.local.js`)

---

## API Endpoints

### POST /app_webhook_path

Receives webhooks from Trello.

**Authentication:** HMAC signature validation

**Request:**
```
Headers:
  x-trello-webhook: <HMAC-SHA1 signature>
  Content-Type: application/json

Body: (Trello webhook payload)
```

**Response:**
```
200 OK
```

### GET /app_healthcheck_path

Health check endpoint for monitoring.

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "boards_registered": 2
}
```

**Response (unhealthy):**
```json
{
  "status": "unhealthy",
  "error": "Database connection failed"
}
```

### HEAD /app_healthcheck_pathlth

Lightweight health check (returns only status code, no body).

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

### Migrations

Database migrations run automatically on server start.

To manually run migrations:
```bash
node -e "require('./migrations').runMigrations()"
```

### Backup
```bash
# Backup database
cp projects.db projects.db.backup

# Restore database
cp projects.db.backup projects.db
```

---

## Troubleshooting

### Webhooks not received

**Check:**
1. Server is running: `curl http://localhost:3000/app_healthcheck_path` app_healthcheck_path - from .env
2. ngrok is running (for local development)
3. Webhook is registered: `node list-webhooks.js`
4. Board is in `boards.local.js`
5. Check logs: `tail -f logs/combined.log`

### Cards not updating

**Check logs for:**
- "Webhook from unregistered board" → Add board to `boards.local.js`
- "Invalid HMAC signature" → Check `TRELLO_SECRET` in `.env`
- "Could not resolve project name" → Custom field configuration issue

**Debug mode:**
```bash
LOG_LEVEL=debug node server.js
```

### Database locked

SQLite database is locked by another process.

**Solution:**
```bash
# Find process using database
lsof projects.db

# Kill process
kill <PID>
```

### ngrok URL changed

When ngrok restarts, URL changes. Update:

1. `.env` → `CALLBACK_URL`
2. Re-register all webhooks:
```bash
   node delete-webhook.js <old_webhook_id>
   node register-webhook.js <board_id> "Description"
```

---

## Development

### Running tests
```bash
# Test database functions
node test-project-functions.js

# Test custom field mapping
node test-custom-field.js
```

### Code style

- Use `logger` instead of `console.log`
- Use async/await instead of callbacks
- Use descriptive variable names
- Add comments for complex logic

### Adding new features

1. Create feature branch
2. Implement feature
3. Test locally
4. Update README if needed
5. Create pull request

---

## Deployment

### Docker

Coming soon. The application is designed for Docker deployment:

- Logs to stdout in production mode
- Environment variables via Docker
- Health check endpoint for container health
- No file-based configuration in production

### Environment Variables for Production (abstract, see full list of variables in the .env.example file)
```bash
NODE_ENV=production
TRELLO_API_KEY=...
TRELLO_TOKEN=...
TRELLO_SECRET=...
CALLBACK_URL=https://your-domain.com/
PORT=3000
LOG_LEVEL=info 
```


---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Create pull request

---

## License

[Add your license here]

---

## Support

For issues and questions:
- Check logs: `tail -f logs/combined.log`
- Check troubleshooting section above
- Review Trello API documentation: https://developer.atlassian.com/cloud/trello/

---

## Changelog

### [1.0.0] - 2026-02-04

**Added:**
- Initial release
- Multi-board support
- HMAC webhook validation
- Winston logging with adaptive transports
- Health check endpoint
- SQLite database with migrations
- Cross-board sequential numbering