# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
