# Strapi MCP Server Development Guide

## Build Commands
- `npm run build` - Build the project
- `npm run build:watch` - Build with watch mode
- `npm run start` - Start the server from build
- `npm run dev` - Run with ts-node
- `npm run dev:watch` - Run with nodemon watch mode
- `npm run prepublishOnly` - Prepare for publishing

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
- Server implements Model Context Protocol (MCP) for Strapi CMS
- Serves as middleware between AI assistants and Strapi instances
- Handles schema introspection, REST operations, media uploads
- Version 2.2.0 focuses on security and version compatibility
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