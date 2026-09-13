import { Elysia } from 'elysia';

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .get('/', () => ({
    status: 'ok',
    message: 'Welcome to Elysia + Drizzle + MySQL API',
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }))
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
