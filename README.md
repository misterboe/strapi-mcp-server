# Strapi MCP Server

A Model Context Protocol server for interacting with Strapi CMS. This server enables AI assistants to interact with your Strapi instance through a standardized interface, supporting content types and REST API operations.

<a href="https://glama.ai/mcp/servers/qfdkybxvkp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/qfdkybxvkp/badge" alt="Strapi Server MCP server" />
</a>

⚠️ **IMPORTANT DISCLAIMER**: This software has been developed with the assistance of AI technology. It is provided as-is and should NOT be used in production environments without thorough testing and validation. The code may contain errors, security vulnerabilities, or unexpected behavior. Use at your own risk for research, learning, or development purposes only.

## Changelog

### Version 2.5.1 - Documentation & Configuration Enhancement

- 📚 Added comprehensive project documentation in CLAUDE.md
- ⚙️ Expanded configuration options with better version detection
- 🛠️ Enhanced troubleshooting guides for common issues
- 🔄 Detailed REST API documentation with practical examples
- 📝 Best practices guide for content management
- 🐛 Fixed version parsing from different format patterns
- 🔍 Improved error messaging with version-specific guidance

For complete version history, see [CHANGELOG.md](./CHANGELOG.md).

## Features

- 🔍 Schema introspection
- 🔄 REST API support with validation
- 📸 Media upload handling
- 🔐 JWT authentication
- 📝 Content type management
- 🖼️ Image processing with format conversion
- 🌐 Multiple server support
- ✅ Automatic schema validation
- 🔒 Write protection policy
- 📚 Integrated documentation
- 🔄 Version compatibility management

## Installation

You can use this server directly with npx in your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "strapi": {
      "command": "npx",
      "args": ["-y", "@bschauer/strapi-mcp-server@2.5.1"]
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
    "api_key": "your-jwt-token-from-strapi-admin",
    "version": "5.*" // Optional: Specify Strapi version (e.g., "5.*", "4.1.5", "v4")
  }
}
```

You can configure multiple Strapi instances by adding them to this file.

### Version Configuration

The server now supports various version formats:

- Wildcard: "5._", "4._"
- Specific: "4.1.5", "5.0.0"
- Simple: "v4", "v5"

This helps the server provide version-specific guidance and handle API differences appropriately.

### Getting a JWT Token

1. Log in to your Strapi admin panel
2. Create an API token with appropriate permissions
3. Add the token to your config file under the appropriate server name

## Usage

### List Available Servers

```javascript
strapi_list_servers();
// Now includes version information and differences between v4 and v5
```

### Content Types

```javascript
// Get all content types from a specific server
strapi_get_content_types({
  server: "myserver",
});

// Get components with pagination
strapi_get_components({
  server: "myserver",
  page: 1,
  pageSize: 25,
});
```

### REST API

The REST API provides comprehensive CRUD operations with built-in validation and version-specific handling:

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

## Version Differences (v4 vs v5)

Key differences between Strapi versions that the server handles automatically:

### v4

- Uses numeric IDs
- Nested attribute structure
- Data wrapper in responses
- Traditional REST patterns
- External i18n plugin

### v5

- Document-based IDs
- Flat data structure
- Direct attribute access
- Enhanced JWT security
- Integrated i18n support
- New Document Service API

## Security Features

### Write Protection Policy

The server implements a strict write protection policy:

- All write operations require explicit authorization
- Protected operations include:
  - POST (Create)
  - PUT (Update)
  - DELETE
  - Media Upload
- Each operation is logged and validated

## Best Practices

1. Always check schema first with `strapi_get_content_types`
2. Use proper plural/singular forms for endpoints
3. Include error handling in your queries
4. Validate URLs before upload
5. Start with minimal queries and add population only when needed
6. Always include the complete data object when updating
7. Use filters to optimize query performance
8. Leverage built-in schema validation
9. Check version compatibility for your operations
10. Follow the write protection policy guidelines

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
// Basic request without population
params: {
}

// Selective population when needed
params: {
  populate: ["category"];
}

// Detailed population with field selection
params: {
  populate: {
    category: {
      fields: ["name", "slug"];
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
   - Check if using correct ID format (numeric vs document-based)

2. Authentication Issues

   - Verify JWT token is valid
   - Check token permissions
   - Ensure token hasn't expired

3. Version-Related Issues

   - Verify version specification in config
   - Check data structure matches version
   - Review version differences documentation

4. Write Protection Errors
   - Ensure operation is authorized
   - Check if operation is protected
   - Verify request follows security policy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
