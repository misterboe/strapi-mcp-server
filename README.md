# Strapi MCP Server

A Model Context Protocol server for interacting with Strapi CMS. This server enables AI assistants to interact with your Strapi instance through a standardized interface, supporting content types, REST API, and GraphQL queries.

## Features

- 🔍 Schema introspection
- 🔄 REST API support
- 📊 GraphQL support
- 📸 Media upload handling
- 🔐 JWT authentication
- 📝 Content type management
- 🖼️ Image processing with format conversion

## Installation

You can use this server directly with npx in your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "strapi": {
      "command": "npx",
      "args": [
        "-y",
        "@bschauer/strapi-mcp-server"
      ],
      "env": {
        "API_URL": "http://localhost:1337",
        "JWT": "your-jwt-token"
      }
    }
  }
}
```

## Configuration

### Environment Variables

- `API_URL`: Your Strapi instance URL (e.g., `http://localhost:1337`)
- `JWT`: Your Strapi JWT token for authentication

### Getting a JWT Token

1. Log in to your Strapi admin panel
2. Create an API token with appropriate permissions
3. Use this token as the `JWT` environment variable

## Features

### Content Type Management
- Automatic schema introspection
- Support for both Strapi 4 and 5
- Handles collection types and single types

### REST API
- Full CRUD operations
- Pagination support
- Relation population
- Field selection

### GraphQL Support
- Complex queries
- Field selection
- Pagination
- Error handling

### Media Handling
- Image upload from URLs
- Format conversion (JPEG, PNG, WebP)
- Quality control
- Metadata management

## Usage Examples

### Content Types
```javascript
// Get all content types
strapi_get_content_types()

// Get components
strapi_get_components()
```

### REST API
```javascript
// Query content
strapi_rest({
  endpoint: 'api/articles',
  method: 'GET',
  params: { populate: '*' }
})
```

### Media Upload
```javascript
// Upload image
strapi_upload_media({
  url: "https://example.com/image.jpg",
  format: "webp",
  quality: 80,
  metadata: {
    name: "My Image",
    caption: "Image Caption",
    alternativeText: "Alt Text"
  }
})
```

## Best Practices

1. Always check schema first with `strapi_get_content_types`
2. Use proper plural/singular forms for endpoints
3. Include error handling in your queries
4. Validate URLs before upload
5. Use appropriate content population strategies

## Troubleshooting

Common issues and solutions:

1. 404 Errors
   - Check endpoint plural/singular form
   - Verify content type exists
   - Ensure correct API URL

2. Authentication Issues
   - Verify JWT token is valid
   - Check token permissions
   - Ensure proper environment variable setup

3. GraphQL Issues
   - Verify GraphQL is enabled in Strapi
   - Check query syntax
   - Ensure proper field selection

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 