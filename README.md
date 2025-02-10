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
- 🌐 Multiple server support

## Installation

You can use this server directly with npx in your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "strapi": {
      "command": "npx",
      "args": ["-y", "@bschauer/strapi-mcp-server"],
      "env": {
        "API_URL": "http://localhost:1337",
        "JWT": "your-jwt-token"
      }
    }
  }
}
```

## Configuration

Create a configuration file at `~/.mcp/strapi-mcp-server.config.json`:

```json
{
  "myserver": {
    "api_url": "http://localhost:1337",
    "api_key": "your-jwt-token-from-strapi-admin"
  }
}
```

You can configure multiple Strapi instances by adding them to this file.

### Getting a JWT Token

1. Log in to your Strapi admin panel
2. Create an API token with appropriate permissions
3. Add the token to your config file under the appropriate server name

## Usage

### List Available Servers

```javascript
strapi_list_servers();
```

### Content Types

```javascript
// Get all content types from a specific server
strapi_get_content_types({
  server: "myserver",
});

// Get components
strapi_get_components({
  server: "myserver",
});
```

### REST API

```javascript
// Query content
strapi_rest({
  server: "myserver",
  endpoint: "api/articles",
  method: "GET",
  params: { populate: "*" },
});
```

### Media Upload

```javascript
// Upload image
strapi_upload_media({
  server: "myserver",
  url: "https://example.com/image.jpg",
  format: "webp",
  quality: 80,
  metadata: {
    name: "My Image",
    caption: "Image Caption",
    alternativeText: "Alt Text",
  },
});
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
   - Ensure server is properly configured in config file

3. GraphQL Issues

   - Verify GraphQL is enabled in Strapi
   - Check query syntax
   - Ensure proper field selection

4. Configuration Issues
   - Check if `~/.mcp/strapi-mcp-server.config.json` exists
   - Verify server name is correct
   - Ensure API URL and key are valid

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
