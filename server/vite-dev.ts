import { createServer as createViteServer } from 'vite';

export async function createViteDevServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: 'client'
  });

  return vite;
}