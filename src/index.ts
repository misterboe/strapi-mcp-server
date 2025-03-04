#!/usr/bin/env node

/**
 * Strapi MCP Server
 * Version 2.3.0
 * 
 * Version History:
 * 2.3.0 - Documentation & Configuration Enhancement
 * - Added detailed project documentation to CLAUDE.md
 * - Expanded configuration options with version support
 * - Improved error messaging and troubleshooting guides
 * - Enhanced REST API documentation and examples
 * - Added best practices for content management
 * 
 * 2.2.0 - Security & Version Handling Update
 * - Added strict write protection policy
 * - Enhanced version format support (5.*, 4.1.5, v4, etc.)
 * - Integrated documentation into server capabilities
 * - Removed connect prompt (now in capabilities)
 * - Improved error handling and validation
 * 
 * 2.1.0 - Previous Release
 * - Basic Strapi integration
 * - Server configuration
 * - Content type handling
 * - Media upload support
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fetch from 'node-fetch';
import FormData from 'form-data';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import qs from 'qs';

// Define version info type
type VersionInfo = {
    id_field: string;
    data_structure: string;
    attributes: string;
    auth_pattern: string;
    key_features: string[];
    breaking_changes: {
        database: string[];
        api: string[];
        configuration: string[];
        plugins: string[];
    };
    migration_flags: {
        rest_api: string;
        graphql: string;
    };
    compatibility_notes: string[];
};

type StrapiVersionDifferences = {
    v4: VersionInfo;
    v5: VersionInfo;
};

// Define version differences for reference
const STRAPI_VERSION_DIFFERENCES: StrapiVersionDifferences = {
    "v4": {
        "id_field": "id",
        "data_structure": "Uses data wrapper structure",
        "attributes": "Nested under attributes object",
        "auth_pattern": "Classic JWT pattern",
        "key_features": [
            "Numeric IDs",
            "Nested attribute structure",
            "Data wrapper in responses",
            "Traditional REST patterns",
            "External i18n plugin"
        ],
        "breaking_changes": {
            "database": [],
            "api": [],
            "configuration": [],
            "plugins": []
        },
        "migration_flags": {
            "rest_api": "N/A",
            "graphql": "N/A"
        },
        "compatibility_notes": [
            "Uses SQLite3 for SQLite support",
            "Supports MySQL v5",
            "Uses traditional lifecycle hooks",
            "External i18n plugin required"
        ]
    },
    "v5": {
        "id_field": "documentId",
        "data_structure": "Direct access without wrapper",
        "attributes": "Direct access at root level",
        "auth_pattern": "Enhanced JWT with improved security",
        "key_features": [
            "Document-based IDs",
            "Flat data structure",
            "Direct attribute access",
            "Improved REST patterns",
            "Better error handling",
            "Integrated i18n support",
            "New Document Service API",
            "Enhanced database support"
        ],
        "breaking_changes": {
            "database": [
                "Only better-sqlite3 supported for SQLite",
                "Only mysql2 supported for MySQL",
                "MySQL v5 no longer supported",
                "New lifecycle hooks system"
            ],
            "api": [
                "New REST API response format",
                "Updated GraphQL schema and responses",
                "New Document Service API replaces Entity Service"
            ],
            "configuration": [
                "New server configuration for env variables",
                "Stricter custom configuration requirements"
            ],
            "plugins": [
                "helper-plugin removed",
                "i18n integrated into core"
            ]
        },
        "migration_flags": {
            "rest_api": "Set 'Strapi-Response-Format: v4' header for v4 compatibility",
            "graphql": "Set v4CompatibilityMode: true in graphql.config for v4 compatibility"
        },
        "compatibility_notes": [
            "Uses better-sqlite3 for improved SQLite support",
            "Requires MySQL v8+ for MySQL support",
            "New Document Service API for data operations",
            "Built-in i18n support",
            "New lifecycle hooks system with Document Service Middlewares",
            "Environment variables now handled by server configuration"
        ]
    }
};

// Read config file
const CONFIG_PATH = join(homedir(), '.mcp', 'strapi-mcp-server.config.json');
let config: Record<string, { api_url: string, api_key: string, version?: string }>;

try {
    const configContent = readFileSync(CONFIG_PATH, 'utf-8');
    config = JSON.parse(configContent);

    if (Object.keys(config).length === 0) {
        throw new Error('Config file exists but is empty');
    }
} catch (error) {
    console.error('Error reading config file:', error);
    config = {};
}

// Create server instance
const server = new Server(
    {
        name: "strapi-mcp",
        version: "2.3.0",
    },
    {
        capabilities: {
            tools: {},
            prompts: {},
            strapi: {
                security: {
                    write_protection: {
                        policy: "STRICT_USER_AUTHORIZATION_REQUIRED",
                        description: "No write operations without explicit user authorization",
                        protected_operations: [
                            "POST /api/* (Create)",
                            "PUT /api/* (Update)",
                            "DELETE /api/* (Delete)",
                            "POST /api/upload (Media Upload)"
                        ],
                        requirements: [
                            "Explicit user authorization for each write operation",
                            "No automatic updates or deletions",
                            "User confirmation for each data change",
                            "Logging of all write operations"
                        ],
                        validation_steps: [
                            "Verification of user authorization",
                            "Validation of data to be modified",
                            "User confirmation of operation",
                            "Logging of changes with user reference"
                        ]
                    }
                },
                versions: STRAPI_VERSION_DIFFERENCES,
                defaultVersion: "v5",
                supportedVersions: ["v4", "v5"],
                migrationGuides: {
                    "v4_to_v5": {
                        steps: [
                            "Update database (better-sqlite3, mysql2)",
                            "Replace id with documentId",
                            "Remove data wrapper structure",
                            "Update lifecycle hooks",
                            "Check plugin compatibility"
                        ],
                        compatibilityFlags: {
                            rest: "Strapi-Response-Format: v4",
                            graphql: "v4CompatibilityMode: true"
                        }
                    }
                },
                documentation: {
                    schema_conventions: {
                        description: "Schema & naming conventions for Content Types",
                        examples: {
                            schema: {
                                singularName: "article",
                                pluralName: "articles",
                                collectionName: "articles"
                            },
                            endpoints: {
                                rest: "api/articles",
                                graphql_collection: "query { articles }",
                                graphql_single: "query { article }"
                            }
                        }
                    },
                    api_patterns: {
                        rest: {
                            collection: "GET /api/{pluralName}",
                            single: "GET /api/{pluralName}/{id}",
                            create: "POST /api/{pluralName}",
                            update: "PUT /api/{pluralName}/{id}",
                            delete: "DELETE /api/{pluralName}/{id}"
                        },
                        graphql: {
                            collection: "query { pluralName(pagination: { page: 1, pageSize: 100 }) { data { id attributes } } }",
                            single: "query { singularName(id: 1) { data { id attributes } } }",
                            create: "mutation { createPluralName(data: { field: value }) { data { id } } }",
                            update: "mutation { updatePluralName(id: 1, data: { field: value }) { data { id } } }"
                        }
                    },
                    media_handling: {
                        upload_steps: [
                            "Upload via strapi_upload_media",
                            "Provide metadata (name, caption, alternativeText)",
                            "Choose format (jpeg, png, webp)",
                            "Get image ID from response"
                        ],
                        linking_steps: [
                            "Use PUT request",
                            "Include complete data structure",
                            "Use documentId for v5",
                            "Images as array"
                        ],
                        example: {
                            upload: {
                                url: "https://example.com/image.jpg",
                                metadata: {
                                    name: "article-name",
                                    caption: "Article Caption",
                                    alternativeText: "Article Alt Text"
                                }
                            },
                            link: {
                                method: "PUT",
                                endpoint: "api/articles/{documentId}",
                                body: {
                                    data: {
                                        images: ["imageId"]
                                    }
                                }
                            }
                        }
                    },
                    common_errors: {
                        "404": [
                            "Numerical ID used instead of documentId",
                            "Incorrect plural/singular form in endpoint",
                            "DocumentId missing"
                        ],
                        "405": ["Incorrect endpoint (/article instead of /articles)"],
                        "400": ["Data-Wrapper missing"]
                    },
                    best_practices: [
                        "Always check schema first",
                        "When using URLs, first validate the content with webtools",
                        "Always use documentId for IDs",
                        "Always use data-Wrapper for updates",
                        "Always use pluralName for collections",
                        "Check if singular/plural applies based on API type",
                        "In Strapi 5: Direct attribute query without data-Wrapper",
                        "Use documentId instead of id"
                    ],
                    debugging_guide: {
                        steps: [
                            "When 404: Check if plural/singular form is correct",
                            "When 400: Check if data-Wrapper is present",
                            "When errors in URLs: First validate with webtools",
                            "When ID problems: Check on documentId",
                            "Check schema and configuration in Strapi"
                        ]
                    },
                    graphql_tips: {
                        pagination: {
                            example: `query {
                                articles(pagination: { page: 1, pageSize: 10 }) {
                                    documentId
                                    name
                                }
                            }`
                        },
                        best_practices: [
                            "Complete attribute specification",
                            "No pagination parameter for simple queries",
                            "Precise attribute writing"
                        ]
                    },
                    initialization_steps: [
                        "Get schema and analyze",
                        "Capture Content Types and structures",
                        "Remember endpoint names (pluralName/singularName)",
                        "Document fields and types",
                        "Identify relations",
                        "Consider required fields and validations"
                    ]
                }
            }
        },
    }
);

// Helper function to get server config
function getServerConfig(serverName: string): { API_URL: string, JWT: string } {
    if (Object.keys(config).length === 0) {
        const exampleConfig = {
            "myserver": {
                "api_url": "http://localhost:1337",
                "api_key": "your-jwt-token-from-strapi-admin"
            }
        };

        throw new Error(
            `No server configuration found!\n\n` +
            `Please create a configuration file at:\n` +
            `${CONFIG_PATH}\n\n` +
            `Example configuration:\n` +
            `${JSON.stringify(exampleConfig, null, 2)}\n\n` +
            `Steps to set up:\n` +
            `1. Create the .mcp directory: mkdir -p ~/.mcp\n` +
            `2. Create the config file: touch ~/.mcp/strapi-mcp-server.config.json\n` +
            `3. Add your server configuration using the example above\n` +
            `4. Get your JWT token from Strapi Admin Panel > Settings > API Tokens\n` +
            `5. Make sure the file permissions are secure: chmod 600 ~/.mcp/strapi-mcp-server.config.json`
        );
    }

    const serverConfig = config[serverName];
    if (!serverConfig) {
        throw new Error(
            `Server "${serverName}" not found in config.\n\n` +
            `Available servers: ${Object.keys(config).join(', ')}\n\n` +
            `To add a new server, edit:\n` +
            `${CONFIG_PATH}\n\n` +
            `Example configuration:\n` +
            `{\n` +
            `  "${serverName}": {\n` +
            `    "api_url": "http://localhost:1337",\n` +
            `    "api_key": "your-jwt-token-from-strapi-admin"\n` +
            `  }\n` +
            `}`
        );
    }
    return {
        API_URL: serverConfig.api_url,
        JWT: serverConfig.api_key
    };
}

// Define prompt types
interface PromptArgument {
    name: string;
    description: string;
    required: boolean;
}

interface Prompt {
    name: string;
    description: string;
    arguments: PromptArgument[];
}

// Define prompts
const PROMPTS: Record<string, Prompt> = {};

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: Object.values(PROMPTS)
    };
});

// Get specific prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS[request.params.name];
    if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
    }
    throw new Error("Prompt implementation not found");
});

// Helper function for making Strapi API requests
async function makeStrapiRequest(serverName: string, endpoint: string, params?: Record<string, string>): Promise<any> {
    const serverConfig = getServerConfig(serverName);
    let url = `${serverConfig.API_URL}${endpoint}`;
    if (params) {
        const queryString = new URLSearchParams(params).toString();
        url = `${url}?${queryString}`;
    }

    const headers = {
        'Authorization': `Bearer ${serverConfig.JWT}`,
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, { headers });
        return await handleStrapiError(response, `Request to ${endpoint}`);
    } catch (error) {
        console.error("Error making Strapi request:", error);
        throw error;
    }
}

// Helper function to download image as buffer
async function downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

// Helper function to process image with Sharp
async function processImage(buffer: Buffer, format: string, quality: number): Promise<Buffer> {
    let sharpInstance = sharp(buffer);

    if (format !== 'original') {
        switch (format) {
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality });
                break;
            case 'png':
                // PNG quality is 0-100 for zlib compression level
                sharpInstance = sharpInstance.png({
                    compressionLevel: Math.floor((100 - quality) / 100 * 9)
                });
                break;
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality });
                break;
        }
    }

    return sharpInstance.toBuffer();
}

// Update uploadMedia with server config and authorization check
async function uploadMedia(serverName: string, imageBuffer: Buffer, fileName: string, format: string, metadata?: Record<string, any>, userAuthorized: boolean = false): Promise<any> {
    // Check for explicit user authorization for this upload operation
    if (!userAuthorized) {
        throw new Error(
            `AUTHORIZATION REQUIRED: Media upload operations require explicit user authorization.\n\n` +
            `IMPORTANT: The client MUST:\n` +
            `1. Ask the user for explicit permission before uploading this media\n` +
            `2. Show the user what media will be uploaded\n` +
            `3. Receive clear confirmation from the user\n` +
            `4. Set userAuthorized=true when making the request\n\n` +
            `This is a security measure to prevent unauthorized uploads.`
        );
    }

    const serverConfig = getServerConfig(serverName);
    const formData = new FormData();

    // Update filename extension if format is changed
    if (format !== 'original') {
        fileName = fileName.replace(/\.[^/.]+$/, '') + '.' + format;
    }

    // Add the file
    formData.append('files', imageBuffer, {
        filename: fileName,
        contentType: `image/${format === 'original' ? 'jpeg' : format}` // Default to jpeg for original
    });

    // Add metadata if provided
    if (metadata) {
        formData.append('fileInfo', JSON.stringify(metadata));
    }

    const url = `${serverConfig.API_URL}/api/upload`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serverConfig.JWT}`,
            ...formData.getHeaders()
        },
        body: formData
    });

    return handleStrapiError(response, 'Media upload');
}

// List available tools 
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "strapi_list_servers",
                description: "List all available Strapi servers from the configuration.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "strapi_get_content_types",
                description: "Get all content types from Strapi. Returns the complete schema of all content types.",
                inputSchema: {
                    type: "object",
                    properties: {
                        server: {
                            type: "string",
                            description: "The name of the server to connect to"
                        }
                    },
                    required: ["server"],
                },
            },
            {
                name: "strapi_get_components",
                description: "Get all components from Strapi with pagination support. Returns both component data and pagination metadata (page, pageSize, total, pageCount).",
                inputSchema: {
                    type: "object",
                    properties: {
                        server: {
                            type: "string",
                            description: "The name of the server to connect to"
                        },
                        page: {
                            type: "number",
                            description: "Page number (starts at 1)",
                            minimum: 1,
                            default: 1
                        },
                        pageSize: {
                            type: "number",
                            description: "Number of items per page",
                            minimum: 1,
                            default: 25
                        },
                    },
                    required: ["server"],
                },
            },
            {
                name: "strapi_rest",
                description: "Execute REST API requests against Strapi endpoints. IMPORTANT: All write operations (POST, PUT, DELETE) require explicit user authorization via the userAuthorized parameter.\n\n" +
                    "1. Reading components:\n" +
                    "params: { populate: ['SEO'] } // Populate a component\n" +
                    "params: { populate: { SEO: { fields: ['Title', 'seoDescription'] } } } // With field selection\n\n" +
                    "2. Updating components (REQUIRES USER AUTHORIZATION):\n" +
                    "body: {\n" +
                    "  data: {\n" +
                    "    // For single components:\n" +
                    "    componentName: {\n" +
                    "      Title: 'value',\n" +
                    "      seoDescription: 'value'\n" +
                    "    },\n" +
                    "    // For repeatable components:\n" +
                    "    componentName: [\n" +
                    "      { field: 'value' }\n" +
                    "    ]\n" +
                    "  }\n" +
                    "}\n" +
                    "userAuthorized: true // Must set this to true for POST/PUT/DELETE after getting user permission\n\n" +
                    "3. Other parameters:\n" +
                    "- fields: Select specific fields\n" +
                    "- filters: Filter results\n" +
                    "- sort: Sort results\n" +
                    "- pagination: Page through results",
                inputSchema: {
                    type: "object",
                    properties: {
                        server: {
                            type: "string",
                            description: "The name of the server to connect to"
                        },
                        endpoint: {
                            type: "string",
                            description: "The API endpoint (e.g., 'api/articles')"
                        },
                        method: {
                            type: "string",
                            enum: ["GET", "POST", "PUT", "DELETE"],
                            description: "HTTP method to use",
                            default: "GET"
                        },
                        params: {
                            type: "object",
                            description: "Optional query parameters for GET requests. For components, use populate: ['componentName'] or populate: { componentName: { fields: ['field1'] } }",
                            additionalProperties: true,
                            required: false
                        },
                        body: {
                            type: "object",
                            description: "Request body for POST/PUT requests. For components, use: { data: { componentName: { field: 'value' } } } for single components or { data: { componentName: [{ field: 'value' }] } } for repeatable components",
                            additionalProperties: true,
                            required: false
                        },
                        userAuthorized: {
                            type: "boolean",
                            description: "REQUIRED for POST/PUT/DELETE operations. Client MUST obtain explicit user authorization before setting this to true.",
                            default: false
                        }
                    },
                    required: ["server", "endpoint"],
                },
            },
            {
                name: "strapi_upload_media",
                description: "Upload media to Strapi's media library from a URL with format conversion, quality control, and metadata options. IMPORTANT: This is a write operation that REQUIRES explicit user authorization via the userAuthorized parameter.",
                inputSchema: {
                    type: "object",
                    properties: {
                        server: {
                            type: "string",
                            description: "The name of the server to connect to"
                        },
                        url: {
                            type: "string",
                            description: "URL of the image to upload"
                        },
                        format: {
                            type: "string",
                            enum: ["jpeg", "png", "webp", "original"],
                            description: "Target format for the image. Use 'original' to keep the source format.",
                            default: "original"
                        },
                        quality: {
                            type: "number",
                            description: "Image quality (1-100). Only applies when converting formats.",
                            minimum: 1,
                            maximum: 100,
                            default: 80
                        },
                        metadata: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "Name of the file"
                                },
                                caption: {
                                    type: "string",
                                    description: "Caption for the image"
                                },
                                alternativeText: {
                                    type: "string",
                                    description: "Alternative text for accessibility"
                                },
                                description: {
                                    type: "string",
                                    description: "Detailed description of the image"
                                }
                            }
                        },
                        userAuthorized: {
                            type: "boolean",
                            description: "REQUIRED for media upload operations. Client MUST obtain explicit user authorization before setting this to true.",
                            default: false
                        }
                    },
                    required: ["server", "url"]
                }
            }
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "strapi_list_servers") {
            if (Object.keys(config).length === 0) {
                const exampleConfig = {
                    "myserver": {
                        "api_url": "http://localhost:1337",
                        "api_key": "your-jwt-token-from-strapi-admin",
                        "version": "5.*"
                    }
                };

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "No servers configured",
                                help: {
                                    message: "No server configuration found. Please create a configuration file.",
                                    config_path: CONFIG_PATH,
                                    example_config: exampleConfig,
                                    setup_steps: [
                                        "Create the .mcp directory: mkdir -p ~/.mcp",
                                        "Create the config file: touch ~/.mcp/strapi-mcp-server.config.json",
                                        "Add your server configuration using the example above",
                                        "Get your JWT token from Strapi Admin Panel > Settings > API Tokens",
                                        "Make sure the file permissions are secure: chmod 600 ~/.mcp/strapi-mcp-server.config.json"
                                    ]
                                }
                            }, null, 2),
                        },
                    ],
                };
            }

            const servers = Object.keys(config).map(serverName => {
                const serverConfig = config[serverName];
                const version = serverConfig.version || "v4"; // Default to v4 if not specified

                // Extract major version from different formats: "5.*", "4.1.5", "v4", "4.*"
                let majorVersion: keyof StrapiVersionDifferences;
                if (version.includes('*')) {
                    // Handle "5.*" or "4.*" format
                    majorVersion = version.split('.')[0] as keyof StrapiVersionDifferences;
                } else if (version.startsWith('v')) {
                    // Handle "v4" or "v5" format
                    majorVersion = version.substring(1) as keyof StrapiVersionDifferences;
                } else {
                    // Handle "4.1.5" or plain "4" format
                    majorVersion = version.split('.')[0] as keyof StrapiVersionDifferences;
                }

                return {
                    name: serverName,
                    api_url: serverConfig.api_url,
                    version: serverConfig.version,
                    version_details: STRAPI_VERSION_DIFFERENCES[majorVersion]
                };
            });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            servers,
                            config_path: CONFIG_PATH,
                            help: "To add more servers, edit the configuration file at the path shown above.",
                            version_differences: STRAPI_VERSION_DIFFERENCES,
                            user_action_required: {
                                message: "Please specify which server you want to work with by providing the server name in your next command.",
                                example: "For example: 'I want to work with the server \"myserver\"' or 'Use server \"myserver\" for the next operations'",
                                available_servers: servers.map(s => s.name),
                                warning: "Only use servers that are listed in available_servers. Do not attempt to access servers that are not properly configured."
                            },
                            security: {
                                note: "For security reasons, only servers listed in the configuration file can be accessed.",
                                requirement: "Each server must be properly configured with valid credentials before use."
                            }
                        }, null, 2),
                    },
                ],
            };
        } else if (name === "strapi_get_content_types") {
            const { server } = args as { server: string };
            const data = await makeStrapiRequest(server, "/api/content-type-builder/content-types");

            // Add helpful usage information to the response
            const response = {
                data: data,
                usage_guide: {
                    naming_conventions: {
                        rest_api: "Use pluralName for REST API endpoints (e.g., 'api/articles' for pluralName: 'articles')",
                        graphql: {
                            collections: "Use pluralName for collections (e.g., 'query { articles { data { id } } }')",
                            single_items: "Use singularName for single items (e.g., 'query { article(id: 1) { data { id } } }')"
                        }
                    },
                    examples: {
                        rest: {
                            collection: "GET /api/{pluralName}",
                            single: "GET /api/{pluralName}/{id}",
                            create: "POST /api/{pluralName}",
                            update: "PUT /api/{pluralName}/{id}",
                            delete: "DELETE /api/{pluralName}/{id}"
                        },
                        graphql: {
                            collection: "query { pluralName(pagination: { page: 1, pageSize: 100 }) { data { id attributes } } }",
                            single: "query { singularName(id: 1) { data { id attributes } } }",
                            create: "mutation { createPluralName(data: { field: value }) { data { id } } }",
                            update: "mutation { updatePluralName(id: 1, data: { field: value }) { data { id } } }"
                        }
                    },
                    important_notes: [
                        "Always check singularName and pluralName in the schema for correct endpoint/query names",
                        "REST endpoints always start with 'api/'",
                        "Include pagination in GraphQL collection queries",
                        "For updates, always fetch current data first and include ALL fields in the update"
                    ]
                }
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response, null, 2),
                    },
                ],
            };
        } else if (name === "strapi_get_components") {
            const { server, page, pageSize } = args as { server: string, page: number, pageSize: number };
            const params = {
                'pagination[page]': page.toString(),
                'pagination[pageSize]': pageSize.toString(),
            };

            const data = await makeStrapiRequest(server, "/api/content-type-builder/components", params);

            // Add pagination metadata to the response
            const response = {
                data: data,
                pagination: {
                    page,
                    pageSize,
                    total: data.length,
                    pageCount: Math.ceil(data.length / pageSize),
                },
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response, null, 2),
                    },
                ],
            };
        } else if (name === "strapi_rest") {
            const { server, endpoint, method, params, body, userAuthorized } = args as { 
                server: string, 
                endpoint: string, 
                method: string, 
                params?: Record<string, any>, 
                body?: Record<string, any>,
                userAuthorized?: boolean
            };
            
            const data = await makeRestRequest(server, endpoint, method, params, body, userAuthorized === true);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        } else if (name === "strapi_upload_media") {
            const { server, url, format, quality, metadata, userAuthorized } = args as { 
                server: string, 
                url: string, 
                format: string, 
                quality: number, 
                metadata?: Record<string, any>,
                userAuthorized?: boolean
            };

            // Extract filename from URL
            const fileName = url.split('/').pop() || 'image';

            // Download the image
            const imageBuffer = await downloadImage(url);

            // Process the image if format conversion is requested
            const processedBuffer = await processImage(imageBuffer, format, quality);

            // Upload to Strapi with metadata (with authorization check)
            const data = await uploadMedia(server, processedBuffer, fileName, format, metadata, userAuthorized === true);

            // Format response with helpful usage information
            const response = {
                success: true,
                data: data,
                image_info: {
                    format: format === 'original' ? 'original (unchanged)' : format,
                    quality: format === 'original' ? 'original (unchanged)' : quality,
                    filename: data[0].name,
                    size: data[0].size,
                    mime: data[0].mime
                },
                usage_guide: {
                    file_id: data[0].id,
                    url: data[0].url,
                    how_to_use: {
                        rest_api: "Use the file ID in your content type's media field",
                        graphql: "Use the file ID in your GraphQL mutations",
                        examples: {
                            rest: "PUT /api/content-type/1 with body: { data: { image: " + data[0].id + " } }",
                            graphql: "mutation { updateContentType(id: 1, data: { image: " + data[0].id + " }) { data { id } } }"
                        }
                    }
                }
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response, null, 2)
                    }
                ]
            };
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error: unknown) {
        console.error("Error executing tool:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${errorMessage}`,
                },
            ],
        };
    }
});

// Enhanced REST request function
async function makeRestRequest(
    serverName: string,
    endpoint: string,
    method: string = 'GET',
    params?: Record<string, any>,
    body?: Record<string, any>,
    userAuthorized: boolean = false
): Promise<any> {
    // Check for write operations that require explicit user authorization
    if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && !userAuthorized) {
        throw new Error(
            `AUTHORIZATION REQUIRED: ${method} operations require explicit user authorization.\n\n` +
            `IMPORTANT: The client MUST:\n` +
            `1. Ask the user for explicit permission before making this request\n` +
            `2. Show the user exactly what data will be modified\n` +
            `3. Receive clear confirmation from the user\n` +
            `4. Set userAuthorized=true when making the request\n\n` +
            `This is a security measure to prevent unauthorized data modifications.`
        );
    }

    const serverConfig = getServerConfig(serverName);
    let url = `${serverConfig.API_URL}/${endpoint}`;

    // Parse query parameters if provided
    if (params) {
        const queryString = qs.stringify(params, {
            encodeValuesOnly: true
        });
        if (queryString) {
            url = `${url}?${queryString}`;
        }
    }

    const headers = {
        'Authorization': `Bearer ${serverConfig.JWT}`,
        'Content-Type': 'application/json',
    };

    const requestOptions: import('node-fetch').RequestInit = {
        method,
        headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, requestOptions);
        return await handleStrapiError(response, `REST request to ${endpoint}`);
    } catch (error) {
        console.error(`REST request to ${endpoint} failed:`, error);
        throw error;
    }
}

// Update error handler to be more generic and helpful
async function handleStrapiError(response: import('node-fetch').Response, context: string): Promise<any> {
    if (!response.ok) {
        let errorMessage = `${context} failed with status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage += ` - ${errorData.error.message || JSON.stringify(errorData.error)}`;

                // Add helpful hints based on status
                if (response.status === 400) {
                    errorMessage += "\nHINT: Check the request structure matches Strapi's expectations. For v4/v5 differences, refer to Strapi's migration guide.";
                } else if (response.status === 404) {
                    errorMessage += "\nHINT: Check the endpoint path and ID are correct.";
                }
            }
        } catch {
            errorMessage += ` - ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Strapi MCP Server running on stdio");
}

main().catch((error: unknown) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
}); 