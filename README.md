# Strapi MCP Server

A Model Context Protocol server for interacting with Strapi CMS. This server enables AI assistants to interact with your Strapi instance through a standardized interface, supporting content types and REST API operations.

## Features

- 🔍 Schema introspection
- 🔄 REST API support with validation
- 📸 Media upload handling
- 🔐 JWT authentication
- 📝 Content type management
- 🖼️ Image processing with format conversion
- 🌐 Multiple server support
- ✅ Automatic schema validation

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

The REST API provides comprehensive CRUD operations with built-in validation:

```javascript
// Query content with filters
strapi_rest({
  server: "myserver",
  endpoint: "api/articles",
  method: "GET",
  params: {
    filters: {
      title: {
        $contains: "search term",
      },
    },
    populate: "*",
  },
});

// Create new content
strapi_rest({
  server: "myserver",
  endpoint: "api/articles",
  method: "POST",
  body: {
    data: {
      title: "New Article",
      content: "Article content",
      category: "news",
    },
  },
});

// Update content
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

// Delete content
strapi_rest({
  server: "myserver",
  endpoint: "api/articles/123",
  method: "DELETE",
});
```

### Media Upload

```javascript
// Upload image with automatic optimization
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
6. Always include the complete data object when updating
7. Use filters to optimize query performance
8. Leverage built-in schema validation

## REST API Tips

### Filtering

```javascript
// Filter by field value
params: {
  filters: {
    title: "Exact Match";
  }
}

// Contains filter
params: {
  filters: {
    title: {
      $contains: "partial";
    }
  }
}

// Multiple conditions
params: {
  filters: {
    $and: [{ category: "news" }, { published: true }];
  }
}
```

### Sorting

```javascript
params: {
  sort: ["createdAt:desc"];
}
```

### Pagination

```javascript
params: {
  pagination: {
    page: 1,
    pageSize: 25
  }
}
```

### Population

```javascript
// Populate all relations
params: {
  populate: "*"
}

// Populate specific fields
params: {
  populate: {
    category: true,
    author: {
      fields: ["name", "email"]
    }
  }
}
```

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

3. Validation Errors

   - Check required fields are provided
   - Verify data types match schema
   - Ensure related content exists

4. Configuration Issues
   - Check if `~/.mcp/strapi-mcp-server.config.json` exists
   - Verify server name is correct
   - Ensure API URL and key are valid

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
