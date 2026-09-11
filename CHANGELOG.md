# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.9.0] - 2026-09-11

### Security

- **SSRF in `strapi_upload_media`**: media downloads accepted any URL and followed redirects blindly, allowing a caller to make the server fetch loopback, private or link-local addresses. Downloads now:
  - accept `http`/`https` only (schema-level, `data:` and `file:` are rejected)
  - reject non-public hosts for literal IPs and for every DNS resolution result (guards against DNS rebinding)
  - re-validate each redirect hop (max 5, `redirect: "manual"`)
  - require an `image/*` content type and cap the download at 50 MB
  - report download failures generically so internal reachability is not leaked
- Thanks to Anas for the responsible report.

### Fixed

- `strapi_rest` DELETE failed with `Unexpected end of JSON input` because Strapi v5 answers with 204 No Content. Empty responses now return `{ "success": true, "status": <code> }`.

### Changed

- Updated dependencies:
  - `@modelcontextprotocol/sdk`: 1.25.1 → 1.30.0
  - `zod`: 4.3.5 → 4.6.2
  - `sharp`: 0.34.5 → 0.35.4
  - `qs`: 6.14.1 → 6.16.0
  - `form-data`: 4.0.5 → 4.0.6
  - `typescript`: 5.9.3 → 7.0.2
  - `@types/node`: 25.0.3 → 26.5.1
- `npm run dev` / `npm run dev:watch` now use native Node type stripping (`node --experimental-transform-types`, Node >= 22.7) instead of ts-node/nodemon

### Removed

- `ts-node`, `nodemon` (incompatible with TypeScript 7, replaced by native Node)
- `@types/sharp` (sharp ships its own types)

## [2.8.0] - 2025-01-07

### Fixed

- **Issue #8**: JSON Schema now correctly generates `oneOf` arrays for union types, fixing validation errors when Claude Desktop passes values as strings (e.g., `userAuthorized: "true"` instead of `true`)

### Changed

- **BREAKING**: Migrated from Zod v3 to Zod v4
  - `z.record(z.any())` → `z.record(z.string(), z.any())`
  - `ZodError.errors` → `ZodError.issues`
  - `z.string().url()` → `z.url()`
  - `errorMap` → `error` parameter for enums
- Updated all dependencies to latest versions:
  - `@modelcontextprotocol/sdk`: 1.13.3 → 1.25.1
  - `zod`: 3.25.76 → 4.3.5
  - `typescript`: 5.8.3 → 5.9.3
  - `@types/node`: 24.x → 25.0.3
  - `sharp`: 0.34.2 → 0.34.5
  - And other minor updates
- Enhanced tool descriptions with comprehensive documentation:
  - Security policy and best practices in `strapi_list_servers`
  - Initialization steps and schema conventions in `strapi_get_content_types`
  - Debugging guide and Strapi v5 specifics in `strapi_rest`
  - Upload workflow documentation in `strapi_upload_media`
- Simplified binary name from `@bschauer/strapi-mcp-server` to `strapi-mcp-server`

### Removed

- Unused imports (`createHash`)
- Unused type definitions (`ServerSchema`, input type aliases)
- Custom MCP capabilities (not supported in SDK 1.25.1)

## [2.6.0] - 2025-07-03

### Added

- Comprehensive Zod validation for all tool inputs with runtime type safety
- Structured error handling using McpError and ErrorCode from MCP SDK
- Comprehensive logging system with request tracking and performance monitoring
- Debug mode configuration with environment variables (MCP_LOG_LEVEL, MCP_ENABLE_*)
- DEBUGGING.md guide with practical troubleshooting workflows
- LOGGING.md documentation for the logging system
- Request ID tracking for complete request lifecycle monitoring
- Data sanitization for secure logging (removes sensitive information)
- Performance monitoring with slow request detection

### Changed

- Updated all dependencies to latest versions (@modelcontextprotocol/sdk@1.13.3, etc.)
- Enhanced input validation with detailed error messages and field-specific feedback
- Improved error handling with proper categorization (InvalidParams, InternalError, etc.)
- Enhanced type safety throughout the codebase with explicit TypeScript types
- Better developer experience with detailed validation errors and debugging information

### Removed

- Unused prompt handlers and related code for cleaner codebase
- Unnecessary imports and dependencies

### Fixed

- Runtime type validation for all tool parameters
- Error categorization following MCP protocol specifications
- Memory usage optimization through improved logging

## [2.5.1] - 2025-05-06

### Changed

- Updated all dependencies to their latest versions
- Updated `@modelcontextprotocol/sdk` from ^1.0.3 to ^1.9.0
- Updated node-fetch from v2 to v3 with proper ESM imports and type references
- Improved TypeScript type safety in error handling
- Enhanced compatibility with latest Node.js versions

## [2.4.0] - 2025-03-19

### Added

- Important security disclaimer in the README.md file
- Clear warnings about AI-assisted development and production use

### Changed

- Updated project description to highlight security considerations
- Improved documentation with clearer warnings

## [2.3.0] - 2025-03-04

### Added

- Comprehensive project documentation in CLAUDE.md
- Expanded configuration options with better version detection
- Enhanced troubleshooting guides for common issues
- Detailed REST API documentation with practical examples
- Best practices guide for content management

### Changed

- Improved error messaging with version-specific guidance
- Enhanced version detection from various format strings
- Updated documentation with specific Strapi v4/v5 differences
- Refined security model documentation

### Fixed

- Version parsing from different format patterns
- Error handling for version-specific API differences

## [2.0.0]

### Breaking Changes

- **Server Configuration**: Changed from environment variables to config file

  - Now requires a configuration file at `~/.mcp/strapi-mcp-server.config.json`
  - Supports multiple server configurations
  - Old method using `API_URL` and `JWT` environment variables no longer works
  - All API calls now require a `server` parameter to specify which server to use

- **Removed GraphQL Support**: Removed all GraphQL functionality to simplify the codebase

  - Removed `strapi_graphql` command
  - All write operations should now use REST API
  - Better error handling and validation in REST endpoints

- **Enhanced REST API**:
  - Improved validation for write operations
  - Added automatic schema validation
  - Better error messages with field-specific feedback
  - Automatic data validation against content type schema

### Added

- Multiple server support through config file
- New `strapi_list_servers` command to show available servers
- Better error messages with configuration help
- Server-specific configuration validation
- Improved REST validation helpers
- Schema-based request validation
- Field-level error reporting
- Automatic data type checking

### Changed

- All API commands now require a `server` parameter
- Configuration structure moved to JSON file
- Improved error messages with setup instructions
- Updated documentation for multi-server setup

### Removed

- Environment variables configuration method
- All GraphQL related functionality
- GraphQL mutation support
- GraphQL query builder

### Migration Guide

1. Create the configuration directory:

   ```bash
   mkdir -p ~/.mcp
   ```

2. Create the configuration file:

   ```bash
   touch ~/.mcp/strapi-mcp-server.config.json
   ```

3. Add your server configuration:

   ```json
   {
     "myserver": {
       "api_url": "http://localhost:1337",
       "api_key": "your-jwt-token-from-strapi-admin"
     }
   }
   ```

4. Update your Claude Desktop configuration:

   ```json
   {
     "mcpServers": {
       "strapi": {
         "command": "npx",
         "args": ["-y", "@bschauer/strapi-mcp-server"]
       }
     }
   }
   ```

5. Secure your configuration file:

   ```bash
   chmod 600 ~/.mcp/strapi-mcp-server.config.json
   ```

6. Update GraphQL operations to REST:

   For creating content:

   ```javascript
   strapi_rest({
     server: "myserver",
     endpoint: "api/articles",
     method: "POST",
     body: {
       data: {
         title: "My Article",
         content: "Content here",
       },
     },
   });
   ```

   For updating content:

   ```javascript
   strapi_rest({
     server: "myserver",
     endpoint: "api/articles/123",
     method: "PUT",
     body: {
       data: {
         title: "Updated Title",
         content: "Updated content",
       },
     },
   });
   ```

## [1.0.1]

### Fixed

- Fixed binary path in package.json for npx execution

## [1.0.0]

### Added

- Initial release
- Basic Strapi CMS integration
- REST API support
- Media upload handling
- JWT authentication
- Content type management
- Image processing with format conversion
