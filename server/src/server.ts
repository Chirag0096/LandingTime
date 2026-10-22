import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { DatabaseManager } from './persistence/database.ts';
import { CookingSessionService } from './sessions/service.ts';
import { createApiRouter } from './api/routes.ts';
import { createMcpServer } from './mcp/server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp(dbPath?: string) {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());

  // SQLite Persistence & Session Service
  const resolvedDbPath =
    dbPath ||
    process.env.DB_PATH ||
    path.resolve(__dirname, '../../data/landing_time.db');

  const db = new DatabaseManager(resolvedDbPath);
  const sessionService = new CookingSessionService(db);

  // REST API Routes
  app.use('/api/v1', createApiRouter(sessionService));

  // MCP Server with Streamable HTTP
  const mcpServer = createMcpServer(sessionService);
  const mcpTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await mcpServer.connect(mcpTransport);

  // Streamable HTTP endpoint for MCP spec 2025-11-25
  app.all('/mcp', async (req, res) => {
    try {
      await mcpTransport.handleRequest(req, res, req.body);
    } catch (err: any) {
      console.error('MCP transport error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: err.message },
          id: null,
        });
      }
    }
  });

  // Root status
  app.get('/', (_req, res) => {
    res.json({
      name: 'Landing Time Backend & MCP Server',
      status: 'active',
      endpoints: {
        api: '/api/v1',
        health: '/api/v1/health',
        mcp: '/mcp',
      },
    });
  });

  return { app, db, sessionService, mcpServer };
}

// Start standalone server when executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const PORT = Number(process.env.PORT) || 3001;
  createApp()
    .then(({ app }) => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Landing Time backend running at http://0.0.0.0:${PORT}`);
        console.log(`- REST API: http://0.0.0.0:${PORT}/api/v1`);
        console.log(`- MCP Endpoint: http://0.0.0.0:${PORT}/mcp`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
