# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run build` - Compile TypeScript to build/ directory and make executable
- `npm run build:watch` - Build with watch mode for development
- `npm run start` - Start the compiled server from build/index.js
- `npm run dev` - Run src/index.ts directly via Node type stripping (`--experimental-transform-types`, Node >= 22.7)
- `npm run dev:watch` - Same with `node --watch` for hot reload during development

## Debugging

Enable detailed logging via environment variables:

```bash
# Log levels: ERROR, WARN, INFO, DEBUG, TRACE
MCP_LOG_LEVEL=DEBUG npm run dev

# Enable/disable specific features
MCP_ENABLE_REQUEST_TRACKING=true
MCP_ENABLE_PERFORMANCE_MONITORING=true
MCP_SANITIZE_DATA=true
MCP_MAX_LOG_LENGTH=10000
MCP_INCLUDE_STACK_TRACE=true

# Enable MCP SDK debug logging
DEBUG=mcp:* npm run dev
```

Testing with MCP Inspector:
```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector  # Start inspector at http://localhost:5173
```

## Architecture

### Single-File Design

The entire server is implemented in `src/index.ts` (~1800 lines). Key sections in order:

1. **Logging System** (lines ~56-424) - `McpLogger` class with structured JSON logging to stderr
2. **Zod Validation Schemas** (lines ~454-627) - Input validation for all 5 tools
3. **Version Differences** (lines ~747-826) - `STRAPI_VERSION_DIFFERENCES` constant for v4/v5
4. **Configuration** (lines ~828-851) - Loads from `~/.mcp/strapi-mcp-server.config.json`
5. **Server Setup** (lines ~853-1024) - MCP server with capabilities including security policy
6. **Helper Functions** (lines ~1026-1167) - `getServerConfig`, `makeStrapiRequest`, image processing
7. **Tool Handlers** (lines ~1241-1675) - `ListToolsRequestSchema` and `CallToolRequestSchema` handlers
8. **REST/Upload Functions** (lines ~1678-1812) - `makeRestRequest`, `handleStrapiError`

### Validation Flow

All tool inputs are validated through Zod schemas before execution:

```
Tool Call → validateToolInput() → Zod Schema → Validated Args → Handler
                    ↓ (on error)
          McpError with detailed validation errors
```

Key schemas: `ListServersSchema`, `GetContentTypesSchema`, `GetComponentsSchema`, `RestSchema`, `UploadMediaSchema`

### Security Model

Write operations (POST, PUT, DELETE, media upload) require `userAuthorized: true` parameter. This is enforced at two levels:
1. Zod schema refinement (validation fails if missing)
2. Runtime check in `makeRestRequest()` and `uploadMedia()`

### Strapi Version Handling

Supports both v4 and v5 with automatic detection from config version string formats:
- `"5.*"`, `"4.*"` - Wildcard
- `"v4"`, `"v5"` - Simple prefix
- `"4.1.5"`, `"5.0.0"` - Specific version

## Tools Provided

| Tool | Description |
|------|-------------|
| `strapi_list_servers` | List configured servers with version info |
| `strapi_get_content_types` | Schema introspection for all content types |
| `strapi_get_components` | Component schemas with pagination |
| `strapi_rest` | REST API operations (GET/POST/PUT/DELETE) |
| `strapi_upload_media` | Media upload with format conversion via Sharp |

## Code Style

- TypeScript strict mode with ES2022 target, Node16 module resolution
- ES modules (import/export)
- 2-space indentation, semicolons required
- camelCase for variables/functions, PascalCase for types/interfaces
- Logs go to stderr (not stdout) to avoid interfering with MCP protocol

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP server implementation
- `zod` - Runtime input validation
- `sharp` - Image processing and format conversion
- `qs` - Query string serialization for REST params
- `form-data` + `node-fetch` - Media upload handling

## Version Differences (v4 vs v5)

| Aspect | v4 | v5 |
|--------|----|----|
| ID Field | `id` (numeric) | `documentId` (string) |
| Response Structure | Wrapped in `data` | Flat/direct access |
| Attributes | Nested under `attributes` | Direct at root level |

## Commit Guidelines

- Git commits in English without any mention of Claude, Anthropic, or promotional content
