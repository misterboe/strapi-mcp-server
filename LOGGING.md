# Comprehensive Logging and Debugging System

This document describes the comprehensive logging and debugging system implemented for the Strapi MCP Server.

## Overview

The logging system provides structured, configurable, and secure logging with the following features:

- **Structured JSON logging** with timestamps, request IDs, and context
- **Request tracking** for complete request lifecycle monitoring
- **Performance monitoring** with API call timing and slow request detection
- **Data sanitization** to remove sensitive information from logs
- **Configurable log levels** from ERROR to TRACE
- **stderr output** to avoid interfering with MCP protocol on stdout

## Configuration

The logging system is configured via environment variables:

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_LOG_LEVEL` | `INFO` | Log level: ERROR, WARN, INFO, DEBUG, TRACE |
| `MCP_ENABLE_REQUEST_TRACKING` | `true` | Enable/disable request ID tracking |
| `MCP_ENABLE_PERFORMANCE_MONITORING` | `true` | Enable/disable performance monitoring |
| `MCP_SANITIZE_DATA` | `true` | Enable/disable data sanitization |
| `MCP_MAX_LOG_LENGTH` | `10000` | Maximum length of log messages |
| `MCP_INCLUDE_STACK_TRACE` | `false` | Include stack traces in error logs |

### Examples

```bash
# Enable debug logging
export MCP_LOG_LEVEL=DEBUG

# Disable data sanitization (not recommended for production)
export MCP_SANITIZE_DATA=false

# Enable stack traces for debugging
export MCP_INCLUDE_STACK_TRACE=true

# Set maximum log message length
export MCP_MAX_LOG_LENGTH=5000
```

## Log Levels

- **ERROR (0)**: Critical errors that prevent operation
- **WARN (1)**: Warnings about potential issues
- **INFO (2)**: General information about operations
- **DEBUG (3)**: Detailed debugging information
- **TRACE (4)**: Very verbose tracing information

## Log Structure

All log entries follow this JSON structure:

```json
{
  "timestamp": "2024-07-03T10:30:45.123Z",
  "level": "INFO",
  "message": "Request completed: strapi_get_content_types",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "operation": "strapi_get_content_types",
  "server": "myserver",
  "endpoint": "/api/content-type-builder/content-types",
  "method": "GET",
  "duration": 150,
  "error": false,
  "sanitized": true,
  "context": {
    "success": true,
    "status": 200
  }
}
```

## Features

### 1. Request Tracking

Each tool execution gets a unique request ID that tracks the complete lifecycle:

```json
{
  "timestamp": "2024-07-03T10:30:45.000Z",
  "level": "DEBUG",
  "message": "Request started: strapi_get_content_types",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "operation": "strapi_get_content_types",
  "server": "myserver"
}
```

### 2. Performance Monitoring

API calls and operations are timed with automatic detection of slow operations:

```json
{
  "timestamp": "2024-07-03T10:30:45.500Z",
  "level": "WARN",
  "message": "Slow API call: GET /api/content-types took 3500ms",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "endpoint": "/api/content-types",
  "duration": 3500,
  "status": 200,
  "server": "myserver"
}
```

### 3. Data Sanitization

Sensitive data is automatically removed from logs:

```json
{
  "context": {
    "headers": {
      "Authorization": "[REDACTED]",
      "Content-Type": "application/json"
    },
    "api_key": "[REDACTED]",
    "jwt": "[REDACTED]"
  },
  "sanitized": true
}
```

Sensitive keys include: `password`, `token`, `jwt`, `api_key`, `secret`, `authorization`, `auth`, `credentials`, `key`

### 4. Validation Error Logging

Input validation errors are logged with detailed context:

```json
{
  "timestamp": "2024-07-03T10:30:45.123Z",
  "level": "ERROR",
  "message": "Validation failed for tool: strapi_rest",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "context": {
    "toolName": "strapi_rest",
    "input": { "server": "", "endpoint": "/api/test" },
    "validationErrors": [
      {
        "path": "server",
        "message": "Server name is required and cannot be empty",
        "code": "too_small"
      }
    ]
  }
}
```

### 5. Tool Execution Logging

Complete tool execution tracking with timing:

```json
{
  "timestamp": "2024-07-03T10:30:45.500Z",
  "level": "INFO",
  "message": "Tool executed successfully: strapi_get_content_types",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "context": {
    "toolName": "strapi_get_content_types",
    "args": { "server": "myserver" },
    "duration": 500,
    "success": true,
    "error": false
  }
}
```

## Viewing Logs

Since logs are output to stderr, you can view them while running the server:

```bash
# Run the server and redirect logs to a file
npm run dev 2> server.log

# View logs in real-time
tail -f server.log

# Filter logs by level
grep '"level":"ERROR"' server.log

# Filter logs by request ID
grep '"requestId":"550e8400-e29b-41d4-a716-446655440000"' server.log

# Pretty print logs with jq
tail -f server.log | jq .
```

## Debugging Common Issues

### 1. Performance Issues

Look for slow request warnings:

```bash
grep '"message":"Slow' server.log | jq .
```

### 2. Validation Errors

Find validation failures:

```bash
grep '"message":"Validation failed"' server.log | jq .
```

### 3. API Errors

Look for Strapi API errors:

```bash
grep '"message":"Strapi API error"' server.log | jq .
```

### 4. Request Tracking

Follow a specific request through its lifecycle:

```bash
grep '"requestId":"YOUR_REQUEST_ID"' server.log | jq .
```

## Production Recommendations

1. **Set appropriate log level**: Use `INFO` or `WARN` in production
2. **Enable sanitization**: Keep `MCP_SANITIZE_DATA=true`
3. **Disable stack traces**: Keep `MCP_INCLUDE_STACK_TRACE=false`
4. **Monitor performance**: Watch for slow request warnings
5. **Log rotation**: Use log rotation tools for long-running servers

## Logger API

The logger instance provides these methods:

```typescript
// Basic logging levels
logger.error(message, context?, error?)
logger.warn(message, context?)
logger.info(message, context?)
logger.debug(message, context?)
logger.trace(message, context?)

// Request tracking
const requestId = logger.generateRequestId()
logger.startRequest(requestId, operation, server?)
logger.endRequest(requestId, success, error?)

// API monitoring
logger.logApiCall(requestId, method, endpoint, duration, status, server?)

// Validation errors
logger.logValidationError(toolName, zodError, input, requestId?)

// Tool execution
logger.logToolExecution(toolName, args, requestId, duration, success, error?)

// Configuration
const config = logger.getConfig()
const activeRequests = logger.getActiveRequests()
```

## Security Considerations

1. **Data Sanitization**: Always enabled by default to prevent credential leakage
2. **stderr Output**: Logs don't interfere with MCP protocol communication
3. **No File Output**: Logs are streamed to avoid file permission issues
4. **Configurable Verbosity**: Can reduce log verbosity in production

This logging system provides comprehensive observability while maintaining security and performance standards for the Strapi MCP Server.