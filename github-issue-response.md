# GitHub Issue Response - MCP Server Startup Problems

**Hey @username!**

The "connection trouble" error indicates that Claude Desktop **cannot start the MCP server**. Here are the most common causes and solutions:

## 🚨 **Server Startup Issues**

### 1. **Sharp Module Error (common on macOS)**
```bash
# Fix Sharp dependency:
npm install -g sharp

# Alternative - rebuild native modules:
npm rebuild sharp
```

### 2. **Node.js/NPM Setup Check**
```bash
# Check Node version (requires >= 16):
node --version

# Clear NPX cache:
npx clear-npx-cache
```

### 3. **Manual Installation (recommended)**
```bash
# Install globally instead of using npx:
npm install -g @bschauer/strapi-mcp-server
```

Then in Claude Desktop config:
```json
{
  "mcpServers": {
    "strapi": {
      "command": "strapi-mcp-server"
    }
  }
}
```

### 4. **Debug Server Startup**
```bash
# Test server directly:
npx @bschauer/strapi-mcp-server

# With debug output:
DEBUG=* npx @bschauer/strapi-mcp-server
```

### 5. **Platform-specific Fixes**

**Windows/WSL:**
- Use WSL IP instead of localhost: `http://192.168.x.x:1337`
- Or `host.docker.internal:1337` for Docker

**macOS:**
- Reinstall npm dependencies: `npm ci`

### 6. **Check Claude Desktop Logs**
- **macOS:** `~/Library/Logs/Claude/`
- **Windows:** `%APPDATA%/Claude/logs/`

## 🔧 **Fallback Solution:**
```bash
# Local clone instead of npx:
git clone https://github.com/bschauer/strapi-mcp-server.git
cd strapi-mcp-server
npm install
npm run build
```

In Claude Desktop:
```json
{
  "mcpServers": {
    "strapi": {
      "command": "node",
      "args": ["/path/to/strapi-mcp-server/build/index.js"]
    }
  }
}
```

**Please post the Claude Desktop logs if this doesn't help!** 🚀