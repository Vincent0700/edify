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

# 2. Login via browser extension
edify login

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
# Login to Dify (requires browser extension)
edify login

# Logout and clear credentials
edify logout
```

### Configuration

```bash
# Show current configuration
edify config show

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

## Browser Extension Setup

The `edify login` command requires a browser extension to capture authentication tokens from Dify.

### Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder from this package

### Usage

1. Run `edify login` in terminal
2. Login to Dify in your browser
3. The extension will automatically capture and send tokens to the CLI

## Requirements

- Node.js >= 18.0.0
- Chrome browser (for login extension)

## License

MIT
