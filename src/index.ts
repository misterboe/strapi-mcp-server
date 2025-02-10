#!/usr/bin/env node

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
import { CONNECT_TO_STRAPI_CONTENT } from './promts/connect.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Read config file
const CONFIG_PATH = join(homedir(), '.mcp', 'strapi-mcp-server.config.json');
let config: Record<string, { api_url: string, api_key: string }>;

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
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
            prompts: {},
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
const PROMPTS: Record<string, Prompt> = {
    "Connect to Strapi": {
        name: "Connect to Strapi",
        description: "Start a conversation with an expert who understands both Strapi v4 and v5, their differences, and best practices",
        arguments: []
    }
};

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

    if (request.params.name === "Connect to Strapi") {
        return {
            messages: [
                {
                    role: "assistant",
                    content: {
                        type: "text",
                        text: CONNECT_TO_STRAPI_CONTENT
                    }
                }
            ]
        };
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

// Update handleStrapiError function with node-fetch Response type
async function handleStrapiError(response: import('node-fetch').Response, context: string): Promise<any> {
    if (!response.ok) {
        let errorMessage = `${context} failed with status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage += ` - ${errorData.error.message || JSON.stringify(errorData.error)}`;

                // Add helpful hints based on error status
                if (response.status === 400) {
                    errorMessage += "\nHINT: This might be a schema mismatch. Try:\n" +
                        "1. Use 'strapi_get_content_types' to check the latest schema\n" +
                        "2. Use 'strapi_get_components' to verify component structures\n" +
                        "3. Ensure all required fields are included\n" +
                        "4. Check field types match the schema";
                } else if (response.status === 404) {
                    errorMessage += "\nHINT: The requested resource might not exist. Try:\n" +
                        "1. Use 'strapi_get_content_types' to list available endpoints\n" +
                        "2. Check if the content type or component exists\n" +
                        "3. Verify the endpoint path is correct\n" +
                        "4. IMPORTANT: API endpoints use the pluralName from content types (e.g., 'api/articles' for pluralName: 'articles')\n" +
                        "5. For GraphQL, use both singularName (for single items) and pluralName (for collections)";
                } else if (response.status === 403) {
                    errorMessage += "\nHINT: This might be a permissions issue. Check:\n" +
                        "1. JWT token permissions\n" +
                        "2. Content type permissions in Strapi admin";
                }

                // Add general naming convention hint for all errors
                errorMessage += "\n\nNAMING CONVENTIONS:\n" +
                    "- REST API endpoints use pluralName (e.g., 'api/articles' for pluralName: 'articles')\n" +
                    "- GraphQL queries use:\n" +
                    "  * pluralName for collections (e.g., 'query { articles { data { id } } }')\n" +
                    "  * singularName for single items (e.g., 'query { article(id: 1) { data { id } } }')\n" +
                    "- Use strapi_get_content_types to see the correct singularName and pluralName for each type";
            }
        } catch {
            errorMessage += ` - ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

// Update makeGraphQLRequest with server config
async function makeGraphQLRequest(serverName: string, query: string, variables?: Record<string, any>): Promise<any> {
    const serverConfig = getServerConfig(serverName);
    const url = `${serverConfig.API_URL}/graphql`;
    const headers = {
        'Authorization': `Bearer ${serverConfig.JWT}`,
        'Content-Type': 'application/json',
    };

    try {
        console.error('Making GraphQL request to:', url);
        console.error('Query:', query);
        console.error('Variables:', variables);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        // Log response status and headers for debugging
        console.error('GraphQL Response Status:', response.status);
        console.error('GraphQL Response Headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.text();
        console.error('Raw Response:', data);

        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            throw new Error(`Invalid JSON response from GraphQL: ${data}`);
        }

        if (!response.ok) {
            let errorMessage = `GraphQL request failed with status ${response.status}`;
            if (parsedData.errors) {
                errorMessage += '\nGraphQL Errors:\n' + parsedData.errors
                    .map((e: any) => `- ${e.message}${e.locations ? ` at ${JSON.stringify(e.locations)}` : ''}`)
                    .join('\n');

                // Add helpful debugging information
                errorMessage += '\n\nDebugging Tips:';
                errorMessage += '\n1. Check if GraphQL is enabled in Strapi';
                errorMessage += '\n2. Verify the GraphQL endpoint URL is correct';
                errorMessage += '\n3. Ensure your JWT token has GraphQL permissions';
                errorMessage += '\n4. Validate your query syntax';
                errorMessage += '\n5. Check if the queried types and fields exist';

                // Add example of a working introspection query
                errorMessage += '\n\nTry this introspection query to check GraphQL setup:';
                errorMessage += '\nquery { __schema { types { name } } }';
            }
            throw new Error(errorMessage);
        }

        if (parsedData.errors) {
            let errorMessage = 'GraphQL query completed with errors:\n' + parsedData.errors
                .map((e: any) => `- ${e.message}${e.locations ? ` at ${JSON.stringify(e.locations)}` : ''}`)
                .join('\n');

            // Add query-specific debugging tips
            errorMessage += '\n\nPossible Solutions:';
            errorMessage += '\n1. Check field names match the schema exactly';
            errorMessage += '\n2. Ensure all required fields are included';
            errorMessage += '\n3. Verify the content type exists and is published';
            errorMessage += '\n4. Check if you need to include pagination';
            errorMessage += '\n5. Make sure you have permission to access these fields';

            // Add example query structure
            errorMessage += '\n\nExample Query Structure:';
            errorMessage += '\nquery {';
            errorMessage += '\n  contentType {';
            errorMessage += '\n    data {';
            errorMessage += '\n      id';
            errorMessage += '\n      attributes {';
            errorMessage += '\n        field1';
            errorMessage += '\n        field2';
            errorMessage += '\n      }';
            errorMessage += '\n    }';
            errorMessage += '\n    meta {';
            errorMessage += '\n      pagination {';
            errorMessage += '\n        page';
            errorMessage += '\n        pageSize';
            errorMessage += '\n        total';
            errorMessage += '\n      }';
            errorMessage += '\n    }';
            errorMessage += '\n  }';
            errorMessage += '\n}';

            throw new Error(errorMessage);
        }

        return parsedData;
    } catch (error) {
        console.error("GraphQL request failed:", error);
        throw error;
    }
}

// Schema for GraphQL request
const GraphQLRequestSchema = z.object({
    query: z.string().min(1),
    variables: z.record(z.any()).optional(),
});

// Schema for components request
const ComponentsRequestSchema = z.object({
    page: z.number().min(1).optional().default(1),
    pageSize: z.number().min(1).optional().default(25),
});

// Schema for REST request
const RestRequestSchema = z.object({
    endpoint: z.string().min(1),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    params: z.record(z.any()).optional(),
    body: z.record(z.any()).optional(),
});

// Enhanced Schema for media upload request
const MediaUploadSchema = z.object({
    url: z.string().url(),
    format: z.enum(['jpeg', 'png', 'webp', 'original']).default('original'),
    quality: z.number().min(1).max(100).optional().default(80),
    metadata: z.object({
        name: z.string().optional(),
        caption: z.string().optional(),
        alternativeText: z.string().optional(),
        description: z.string().optional()
    }).optional()
});

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

// Update uploadMedia with server config
async function uploadMedia(serverName: string, imageBuffer: Buffer, fileName: string, format: string, metadata?: Record<string, any>): Promise<any> {
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
                name: "strapi_graphql",
                description: "Execute a GraphQL query against Strapi's GraphQL endpoint. PREFERRED METHOD FOR WRITE OPERATIONS (mutations). IMPORTANT FOR WRITE OPERATIONS: 1) Always fetch the complete current data first before updating, 2) Include ALL existing fields in your mutation, not just the ones you're changing, 3) Never send partial updates as this might clear unspecified fields. PAGINATION: Always include pagination in collection queries using 'pagination: { page: 1, pageSize: 100 }' and request meta.pagination in the response. Example query: query { entityName(pagination: { page: 1, pageSize: 100 }) { data { id } meta { pagination { total pageCount pageSize page } } } } }. Example mutation: mutation { updateEntity(id: \"1\", data: { ...existingData, fieldToUpdate: newValue }) { data { id attributes } } }",
                inputSchema: {
                    type: "object",
                    properties: {
                        server: {
                            type: "string",
                            description: "The name of the server to connect to"
                        },
                        query: {
                            type: "string",
                            description: "The GraphQL query to execute. For collections, always include pagination parameters and meta.pagination in response. For write operations, first query existing data and include ALL fields in mutations to prevent data loss.",
                        },
                        variables: {
                            type: "object",
                            description: "Optional variables for the GraphQL query or mutation. When updating, include all existing data plus your changes to prevent data loss.",
                            additionalProperties: true,
                        },
                    },
                    required: ["server", "query"],
                },
            },
            {
                name: "strapi_rest",
                description: "Execute REST API requests against Strapi endpoints. Best suited for reading data - for writing data, prefer using strapi_graphql with mutations. CRITICAL FOR WRITE OPERATIONS: To prevent data loss, you must 1) First GET the complete current data, 2) Merge your changes with the existing data, 3) Send the complete object back, not just the changed fields. For collection endpoints, pagination is automatically included with page=1&pageSize=100 and populate=* by default to include all relations. IMPORTANT: Use strapi_get_content_types and strapi_get_components first to understand the available fields and their types. This ensures your requests match the schema. Example: { endpoint: 'api/articles', params: { filters: { title: { $contains: 'test' } } } }.",
                inputSchema: {
                    type: "object",
                    properties: {
                        server: {
                            type: "string",
                            description: "The name of the server to connect to"
                        },
                        endpoint: {
                            type: "string",
                            description: "The API endpoint (e.g., 'api/articles'). Check strapi_get_content_types first to see available endpoints.",
                        },
                        method: {
                            type: "string",
                            enum: ["GET", "POST", "PUT", "DELETE"],
                            description: "HTTP method to use. Note: For write operations (POST/PUT/DELETE), GraphQL mutations are preferred. When using PUT, you must include ALL existing data to prevent data loss.",
                            default: "GET"
                        },
                        params: {
                            type: "object",
                            description: "Query parameters (filters, sort, etc.). Use schema from strapi_get_content_types to determine valid fields.",
                            additionalProperties: true,
                        },
                        body: {
                            type: "object",
                            description: "Request body for POST/PUT requests. Must match the schema from strapi_get_content_types. For updates, must include ALL existing fields to prevent data loss. Consider using GraphQL mutations instead for write operations.",
                            additionalProperties: true,
                        },
                        populate: {
                            type: "string",
                            description: "Relations to populate (defaults to '*' to include all relations). Can be specified as specific fields if needed.",
                            default: "*"
                        }
                    },
                    required: ["server", "endpoint"],
                },
            },
            {
                name: "strapi_upload_media",
                description: "Upload media to Strapi's media library from a URL with format conversion, quality control, and metadata options. Returns the uploaded file information including the ID for future reference.",
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
                        }
                    },
                    required: ["server", "url"]
                }
            }
        ],
    };
});

// Update makeRestRequest with server config
async function makeRestRequest(
    serverName: string,
    endpoint: string,
    method: string = 'GET',
    params?: Record<string, any>,
    body?: Record<string, any>
): Promise<any> {
    const serverConfig = getServerConfig(serverName);
    let url = `${serverConfig.API_URL}/${endpoint}`;

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add pagination for collection endpoints if using GET method
    if (method === 'GET' && endpoint.startsWith('api/')) {
        queryParams.append('pagination[page]', '1');
        queryParams.append('pagination[pageSize]', '100');
    }

    // Always add populate='*'
    queryParams.append('populate', '*');

    // Add additional params
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        });
    }

    // Append query string to URL
    const queryString = queryParams.toString();
    if (queryString) {
        url = `${url}?${queryString}`;
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

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "strapi_list_servers") {
            if (Object.keys(config).length === 0) {
                const exampleConfig = {
                    "myserver": {
                        "api_url": "http://localhost:1337",
                        "api_key": "your-jwt-token-from-strapi-admin"
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

            const servers = Object.keys(config).map(serverName => ({
                name: serverName,
                api_url: config[serverName].api_url
            }));

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            servers,
                            config_path: CONFIG_PATH,
                            help: "To add more servers, edit the configuration file at the path shown above."
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
        } else if (name === "strapi_graphql") {
            const { server, query, variables } = args as { server: string, query: string, variables?: Record<string, any> };
            const data = await makeGraphQLRequest(server, query, variables);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        } else if (name === "strapi_rest") {
            const { server, endpoint, method, params, body } = args as { server: string, endpoint: string, method: string, params?: Record<string, any>, body?: Record<string, any> };
            const data = await makeRestRequest(server, endpoint, method, params, body);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        } else if (name === "strapi_upload_media") {
            const { server, url, format, quality, metadata } = args as { server: string, url: string, format: string, quality: number, metadata?: Record<string, any> };

            // Extract filename from URL
            const fileName = url.split('/').pop() || 'image';

            // Download the image
            const imageBuffer = await downloadImage(url);

            // Process the image if format conversion is requested
            const processedBuffer = await processImage(imageBuffer, format, quality);

            // Upload to Strapi with metadata
            const data = await uploadMedia(server, processedBuffer, fileName, format, metadata);

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