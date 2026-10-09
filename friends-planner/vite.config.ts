import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** Injects a strict Content-Security-Policy meta tag into production builds only
 *  (Vite's dev server injects <style> tags that a strict CSP would block). */
function cspMeta(): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
  return {
    name: 'fp-csp-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), cspMeta()],
  build: {
    // Hashed bundles are emitted flat as "static-*" files in dist/ instead of a dist/static/ directory:
    // Netlify CLI 27 on Windows serves nested static files with backslashes (403) whenever the SPA
    // catch-all redirect exists, which breaks `netlify serve`. Production Netlify is unaffected, and
    // netlify.toml still gives these files immutable caching.
    assetsDir: '',
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'static-[name]-[hash].js',
        chunkFileNames: 'static-[name]-[hash].js',
        assetFileNames: 'static-[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
