# MCP Setup

This project does not require MCP servers, but it includes the pattern for adding live context safely.

## Recommended Read-Only MCP Candidates

- GraphQL API MCP for layer metadata and schema inspection.
- Figma MCP for design-to-component grounding.
- Documentation MCP such as Context7 for current framework/library docs.
- Sentry or observability MCP for production incident context.

## Local Template

Create `.mcp.json` locally. It is gitignored.

```json
{
  "mcpServers": {
    "metria-graphql": {
      "command": "node",
      "args": ["tools/mcp-metria-graphql/dist/index.js"],
      "env": {
        "GRAPHQL_ENDPOINT": "http://localhost:4000/graphql"
      }
    }
  }
}
```

Keep shared examples in docs. Do not commit credentials.
