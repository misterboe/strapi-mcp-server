# Strapi MCP Server Debugging Guide

This guide provides comprehensive debugging strategies and tools for the Strapi MCP server, helping developers troubleshoot issues, test functionality, and optimize performance.

## Table of Contents

1. [Enabling Debug Mode](#enabling-debug-mode)
2. [Common Debugging Scenarios](#common-debugging-scenarios)
3. [Using MCP Inspector](#using-mcp-inspector)
4. [Log Interpretation](#log-interpretation)
5. [Testing Tool Scenarios](#testing-tool-scenarios)
6. [Configuration Troubleshooting](#configuration-troubleshooting)
7. [Performance Debugging](#performance-debugging)
8. [Security Debugging](#security-debugging)

## Enabling Debug Mode

### Environment Variables

Enable detailed logging by setting environment variables:

```bash
# Enable debug logging for MCP SDK
export DEBUG=mcp:*

# Enable debug logging for specific components
export DEBUG=mcp:server,mcp:transport

# Enable all debug logging
export DEBUG=*

# Run the server with debug enabled
DEBUG=mcp:* npm run dev
```

### Development Mode

Use development scripts for better debugging experience:

```bash
# Run with ts-node for source map support
npm run dev

# Run with nodemon for hot reload
npm run dev:watch

# Build with source maps
npm run build -- --sourceMap
```

### Console Logging

Add strategic console.log statements in `src/index.ts`:

```typescript
// Log incoming tool requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log('Tool request:', {
    name: request.params.name,
    arguments: request.params.arguments,
    timestamp: new Date().toISOString()
  });
  // ... rest of handler
});
```

## Common Debugging Scenarios

### 1. Authentication Failures

**Symptoms:** 401 or 403 errors when calling Strapi API

**Debug Steps:**
```bash
# Test authentication directly
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-strapi.com/api/users/me

# Check token expiry
# Decode JWT at jwt.io to check exp claim
```

**Solution:**
```json
// ~/.mcp/strapi-mcp-server.config.json
{
  "servers": [{
    "name": "production",
    "url": "https://your-strapi.com",
    "auth": {
      "type": "jwt",
      "token": "FRESH_TOKEN_HERE"
    }
  }]
}
```

### 2. Version Detection Issues

**Symptoms:** Wrong API endpoints being used, unexpected response formats

**Debug Steps:**
```typescript
// Add logging to version detection
const detectStrapiVersion = async (baseUrl: string, headers: any) => {
  console.log('Detecting Strapi version for:', baseUrl);
  try {
    const response = await fetch(`${baseUrl}/api`, { headers });
    const data = await response.json();
    console.log('Version detection response:', data);
    // ... rest of function
  } catch (error) {
    console.error('Version detection failed:', error);
  }
};
```

### 3. Content Type Schema Issues

**Symptoms:** Missing fields, incorrect data types

**Debug Steps:**
```bash
# Use MCP Inspector to fetch raw schema
# Compare with Strapi admin panel
```

**Add detailed logging:**
```typescript
case 'strapi_get_content_types': {
  const response = await makeRequest(`${serverUrl}/api/content-type-builder/content-types`);
  console.log('Raw content types response:', JSON.stringify(response, null, 2));
  // Process response...
}
```

### 4. Media Upload Failures

**Symptoms:** Upload errors, file processing issues

**Debug Steps:**
```typescript
// Log FormData contents
console.log('Upload FormData entries:');
for (const [key, value] of formData.entries()) {
  console.log(`${key}:`, value instanceof File ? 
    `File(${value.name}, ${value.size} bytes)` : value);
}
```

## Using MCP Inspector

### Installation

```bash
npm install -g @modelcontextprotocol/inspector
```

### Basic Usage

```bash
# Start the inspector
mcp-inspector

# In another terminal, run your server
npm run dev

# Connect inspector to server
# Use the inspector UI at http://localhost:5173
```

### Testing Workflows

1. **List Servers Test:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "strapi_list_servers",
    "arguments": {}
  }
}
```

2. **Get Content Types Test:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "strapi_get_content_types",
    "arguments": {
      "server": "production"
    }
  }
}
```

3. **REST Operation Test:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "strapi_rest",
    "arguments": {
      "server": "production",
      "method": "GET",
      "endpoint": "/api/articles?populate=*"
    }
  }
}
```

### Inspector Features

- **Request/Response Viewer:** See full JSON payloads
- **Tool Testing:** Execute tools with custom arguments
- **Session Recording:** Save and replay debugging sessions
- **Error Inspection:** Detailed error messages and stack traces

## Log Interpretation

### Understanding Log Levels

```typescript
// Add custom logging utility
const log = {
  debug: (msg: string, data?: any) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data || '');
    }
  },
  info: (msg: string, data?: any) => {
    console.log(`[INFO] ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error || '');
  }
};
```

### Common Log Patterns

**Successful Request:**
```
[INFO] Tool request: strapi_rest
[DEBUG] 2024-01-15T10:30:00.000Z - Making request to: https://api.example.com/api/articles
[DEBUG] 2024-01-15T10:30:01.000Z - Response status: 200
[INFO] Tool completed successfully
```

**Failed Request:**
```
[ERROR] Tool request failed: strapi_rest
[DEBUG] 2024-01-15T10:30:00.000Z - Request details: {"method":"POST","endpoint":"/api/articles"}
[ERROR] API Error: 403 Forbidden - Insufficient permissions
```

### Structured Logging

```typescript
// Log with context
const logContext = {
  server: args.server,
  tool: request.params.name,
  requestId: crypto.randomUUID()
};

log.info('Processing request', logContext);
```

## Testing Tool Scenarios

### 1. Content Type Introspection

```bash
# Test script for content types
cat > test-content-types.mjs << 'EOF'
import { spawn } from 'child_process';

const server = spawn('node', ['build/index.js']);

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.includes('capabilities')) {
      // Send test request
      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'strapi_get_content_types',
          arguments: { server: 'production' }
        },
        id: 1
      };
      server.stdin.write(JSON.stringify(request) + '\n');
    }
  }
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});
EOF

node test-content-types.mjs
```

### 2. Media Upload Testing

```typescript
// Add test mode for media uploads
if (process.env.TEST_MODE === 'media') {
  // Log file processing details
  console.log('Media upload test mode enabled');
  // Add detailed logging for each step
}
```

### 3. Batch Operations

```bash
# Test multiple operations
cat > test-batch.json << 'EOF'
[
  {
    "method": "tools/call",
    "params": {
      "name": "strapi_rest",
      "arguments": {
        "server": "production",
        "method": "GET",
        "endpoint": "/api/articles?pagination[page]=1&pagination[pageSize]=10"
      }
    }
  },
  {
    "method": "tools/call",
    "params": {
      "name": "strapi_rest",
      "arguments": {
        "server": "production",
        "method": "GET",
        "endpoint": "/api/categories"
      }
    }
  }
]
EOF
```

## Configuration Troubleshooting

### 1. Config File Issues

```bash
# Validate config file
node -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.env.HOME, '.mcp/strapi-mcp-server.config.json');
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('Config is valid JSON');
  console.log('Servers configured:', config.servers.length);
} catch (e) {
  console.error('Config error:', e.message);
}
"
```

### 2. Path Resolution

```typescript
// Debug config loading
const loadConfig = () => {
  const configPath = path.join(os.homedir(), '.mcp/strapi-mcp-server.config.json');
  console.log('Loading config from:', configPath);
  console.log('Config exists:', fs.existsSync(configPath));
  
  if (!fs.existsSync(configPath)) {
    console.log('Config not found, using default');
    return { servers: [] };
  }
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  console.log('Config content length:', configContent.length);
  return JSON.parse(configContent);
};
```

### 3. Environment-Specific Configs

```bash
# Use different configs for different environments
export MCP_CONFIG_PATH=~/.mcp/strapi-mcp-server.dev.config.json
npm run dev

export MCP_CONFIG_PATH=~/.mcp/strapi-mcp-server.prod.config.json
npm run start
```

## Performance Debugging

### 1. Request Timing

```typescript
// Add performance monitoring
const measurePerformance = async (operation: string, fn: () => Promise<any>) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[PERF] ${operation} took ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${operation} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
};

// Usage
const response = await measurePerformance('strapi_api_call', 
  () => makeRequest(url, options)
);
```

### 2. Memory Usage

```bash
# Monitor memory usage
node --expose-gc build/index.js

# In another terminal
while true; do 
  ps aux | grep "node.*index.js" | grep -v grep | awk '{print $6}' 
  sleep 5
done
```

### 3. Connection Pooling

```typescript
// Debug connection reuse
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10
});

// Log connection events
agent.on('free', () => console.log('[CONN] Socket freed'));
agent.on('timeout', () => console.log('[CONN] Socket timeout'));
```

## Security Debugging

### 1. Permission Validation

```typescript
// Log security checks
const validateWritePermission = (args: any) => {
  console.log('[SECURITY] Write permission check:', {
    method: args.method,
    endpoint: args.endpoint,
    hasAuthorization: !!args.authorization
  });
  
  if (!args.authorization?.toLowerCase().includes('i authorize')) {
    console.log('[SECURITY] Write permission denied - missing authorization');
    throw new Error('Authorization required');
  }
  
  console.log('[SECURITY] Write permission granted');
};
```

### 2. Token Security

```bash
# Check for token leaks in logs
grep -r "Bearer" *.log | grep -v "Bearer [REDACTED]"

# Ensure tokens are masked
export MASK_TOKENS=true
npm run dev
```

### 3. Input Validation

```typescript
// Debug input sanitization
const sanitizeInput = (input: any) => {
  console.log('[SECURITY] Input before sanitization:', 
    JSON.stringify(input).substring(0, 100));
  
  // Sanitization logic...
  
  console.log('[SECURITY] Input after sanitization:', 
    JSON.stringify(sanitized).substring(0, 100));
  
  return sanitized;
};
```

## Advanced Debugging Techniques

### 1. Network Debugging

```bash
# Use mitmproxy to inspect HTTPS traffic
mitmproxy -p 8080

# Configure Node.js to use proxy
export https_proxy=http://localhost:8080
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
```

### 2. Breakpoint Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/build/**/*.js"],
      "env": {
        "DEBUG": "mcp:*"
      }
    }
  ]
}
```

### 3. Profiling

```bash
# CPU profiling
node --cpu-prof build/index.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

## Debugging Checklist

Before reporting issues:

- [ ] Enable debug logging with `DEBUG=mcp:*`
- [ ] Check configuration file is valid JSON
- [ ] Verify authentication tokens are current
- [ ] Test with MCP Inspector
- [ ] Check Strapi server logs
- [ ] Verify network connectivity
- [ ] Review recent code changes
- [ ] Test with minimal configuration
- [ ] Capture full error messages and stack traces
- [ ] Document reproduction steps

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Server not reachable | Check URL and network |
| `401 Unauthorized` | Invalid/expired token | Refresh JWT token |
| `403 Forbidden` | Missing permissions | Check Strapi user role |
| `404 Not Found` | Wrong endpoint/version | Verify API path |
| `ETIMEDOUT` | Network timeout | Increase timeout, check firewall |
| `Invalid JSON` | Malformed response | Check Strapi error logs |

## Getting Help

When debugging doesn't resolve your issue:

1. **Gather Information:**
   - Full error message and stack trace
   - Debug logs with `DEBUG=*`
   - Configuration (with tokens redacted)
   - Strapi version
   - Node.js version
   - Steps to reproduce

2. **Create Minimal Reproduction:**
   - Isolate the problem
   - Remove unnecessary configuration
   - Test with curl/Postman first

3. **Report Issue:**
   - Check existing issues on GitHub
   - Include all gathered information
   - Provide minimal reproduction case

Remember: Good debugging starts with good logging. When in doubt, add more logs!