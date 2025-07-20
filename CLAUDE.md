# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Strapi MCP Server Development Guide

## Development Commands

- `npm run build` - Compile TypeScript to build/ directory and make executable
- `npm run build:watch` - Build with watch mode for development
- `npm run start` - Start the compiled server from build/index.js
- `npm run dev` - Run directly with ts-node for development
- `npm run dev:watch` - Run with nodemon for hot reload during development
- `npm run prepublishOnly` - Prepare for publishing (runs build automatically)

## Testing

- No formal test suite exists; test manually using MCP client
- Use Claude Desktop or other MCP clients for integration testing
- Configuration testing: create test config in `~/.mcp/strapi-mcp-server.config.json`

## Code Style Guidelines

- **TypeScript**: Use strict mode with ES2022 target
- **Imports**: Use ES modules (import/export)
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces
- **Error Handling**: Use try/catch blocks with specific error types
- **Types**: Prefer explicit typing over implicit, use interfaces for object shapes
- **Comments**: JSDoc for public functions, inline for complex logic
- **Async**: Use async/await pattern for asynchronous code
- **Structure**: Group related functions together, export interfaces/types
- **Formatting**: 2-space indentation, semicolons required

## Project Architecture

- Single TypeScript file (`src/index.ts`) implements the entire MCP server
- Built on @modelcontextprotocol/sdk with stdio transport for CLI usage
- Configuration loaded from `~/.mcp/strapi-mcp-server.config.json`
- Server implements Model Context Protocol (MCP) for Strapi CMS
- Serves as middleware between AI assistants and Strapi instances
- Handles schema introspection, REST operations, media uploads
- Current version focuses on security and version compatibility
- Supports both Strapi v4 and v5 with automatic version detection

## Key Features

- Content type and component schema introspection
- REST API operations with version-specific adaptations
- Media upload and processing with format conversion
- Strict write protection policy for secure operations
- Comprehensive documentation in server capabilities
- Multiple server configuration support

## Tools

- **strapi_list_servers** - List configured Strapi servers
- **strapi_get_content_types** - Get schema for all content types
- **strapi_get_components** - Get component schema with pagination
- **strapi_rest** - Execute REST API operations with validation
- **strapi_upload_media** - Upload media with processing options

## Strapi Version Differences

- **v4**: Numeric IDs, nested attributes, data wrapper in responses
- **v5**: Document-based IDs, flat structure, direct attribute access

## Security Model

- All write operations require explicit user authorization
- Protected operations: POST, PUT, DELETE, media uploads
- Strict validation and security policy enforcement
- JWT authentication for all Strapi interactions

## Commit Guidelines

- Git-Commit ohne jegliche Erwähnung von Claude, Anthropic oder anderen werblichen Inhalten