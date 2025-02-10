# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0]

### Breaking Changes

- **Server Configuration**: Changed from environment variables to config file
  - Now requires a configuration file at `~/.mcp/strapi-mcp-server.config.json`
  - Supports multiple server configurations
  - Old method using `API_URL` and `JWT` environment variables no longer works
  - All API calls now require a `server` parameter to specify which server to use

### Added

- Multiple server support through config file
- New `strapi_list_servers` command to show available servers
- Better error messages with configuration help
- Server-specific configuration validation

### Changed

- All API commands now require a `server` parameter
- Configuration structure moved to JSON file
- Improved error messages with setup instructions
- Updated documentation for multi-server setup

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

## [1.0.1]

### Fixed

- Fixed binary path in package.json for npx execution

## [1.0.0]

### Added

- Initial release
- Basic Strapi CMS integration
- REST API support
- GraphQL support
- Media upload handling
- JWT authentication
- Content type management
- Image processing with format conversion
