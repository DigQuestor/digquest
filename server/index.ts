import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'digquest-development-secret',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
    domain: undefined
  },
  rolling: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalSend = res.send;
  res.send = function(body) {
    if (res.statusCode < 400) {
      try {
        capturedJsonResponse = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        // Not JSON, ignore
      }
    }
    return originalSend.call(this, body);
  };

  const originalJson = res.json;
  res.json = function(body) {
    if (res.statusCode < 400) {
      capturedJsonResponse = body;
    }
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith('/api')) {
      let logInfo = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logInfo += ` :: ${responseStr.slice(0, 100)}${responseStr.length > 100 ? '…' : ''}`;
      }
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })} [express] ${logInfo}`);
    }
  });

  next();
});

// Production static file serving
if (process.env.NODE_ENV === "production") {
  const clientPath = path.resolve(process.cwd(), 'server/public');
  app.use(express.static(clientPath));
  
  // Catch-all handler for client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    const indexPath = path.join(clientPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Client files not found');
    }
  });
}

async function startServer() {
  const server = await registerRoutes(app);
  const port = Number(process.env.PORT) || 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`\n🚀 Server running on http://0.0.0.0:${port}`);
    if (process.env.NODE_ENV === "production") {
      console.log(`📁 Serving client files from: ${path.resolve(process.cwd(), 'server/public')}`);
    }
  });
}

startServer().catch(console.error);
