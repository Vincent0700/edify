# Edify

CLI tool to import/export YAML configurations to [Dify](https://dify.ai).

## Installation

```bash
npm install -g edify
```

## Quick Start

```bash
# 1. Set Dify URL (default: https://cloud.dify.ai)
edify config set url https://your-dify-instance.com

# 2. Login with email/password
edify login --email admin@example.com

# 3. List all apps
edify list

# 4. Export an app
edify export <app-id> workflow.yaml

# 5. Import a new app
edify import workflow.yaml
```

## Commands

### Authentication

```bash
# Login with email and password (interactive password prompt)
edify login --email user@example.com

# Login via browser extension (no flags)
edify login

# Logout and clear credentials
edify logout
```

### Configuration

```bash
# Show current configuration
edify config

# Set Dify instance URL
edify config set url https://your-dify-instance.com
```

### Apps Management

```bash
# List all apps
edify list

# Import a new app from YAML
edify import <file>
edify import workflow.yaml
edify import workflow.yaml --name "My App"

# Export an app to YAML
edify export <app-id> [output]
edify export abc123 my-workflow.yaml
edify export abc123 --secret  # Include secrets

# Update an existing app
edify update <app-id> <file>
edify update abc123 workflow.yaml

# Delete an app
edify delete <app-id>
edify delete abc123 -y  # Skip confirmation
```

## Configuration File

Edify uses `.difyrc` file to store configuration. Priority:

1. `./.difyrc` (current directory)
2. `~/.difyrc` (home directory)

Example `.difyrc`:

```json
{
  "url": "https://cloud.dify.ai",
  "accessToken": "...",
  "csrfToken": "..."
}
```

## Login Methods

### Email/Password

```bash
# Interactive — prompts for password (masked)
edify login --email user@example.com

# Non-interactive — password via flag
edify login --email user@example.com --password secret

# Non-interactive — via environment variables
export DIFY_BASE_URL=https://your-dify-instance.com
export DIFY_EMAIL=user@example.com
export DIFY_PASSWORD=secret
edify login
```

Precedence: CLI flags / config file > environment variables > interactive prompt.

| Setting | CLI / Config | Env var |
|---------|-------------|---------|
| Base URL | `edify config set url` | `DIFY_BASE_URL` |
| Email | `--email` | `DIFY_EMAIL` |
| Password | `--password` | `DIFY_PASSWORD` |

### Browser Extension

If you prefer cookie-based auth or email/password login is unavailable:

```bash
edify login
```

This starts a local server and opens Dify in your browser. A Chrome extension captures the authentication tokens automatically.

#### Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder from this package

## Requirements

- Node.js >= 18.0.0
- Chrome browser (only for browser extension login)

## License

MIT
