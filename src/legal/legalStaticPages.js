// Vite plugin: /privacy-policy and /terms-of-service as real HTML files.
//   build   → dist/privacy-policy/index.html, dist/terms-of-service/index.html:
//             the built index.html with the page (LegalPageView + site Footer)
//             already rendered inside #root, plus its <title> and meta tags.
//             Vercel serves files before the SPA rewrite in vercel.json, and
//             the app then loads as usual on top of the same content.
//   preview → serves those files.
//   dev     → the normal React routes in App.jsx.
// Meta's crawler does not run JavaScript, so the text must be in the HTML.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import { LEGAL_PAGES } from './legalContent.js';
import { legalPageForPath, renderLegalHead } from './renderLegal.js';

const ROOT_TAG = '<div id="root"></div>';

function fileFor(outDir, page) {
    return path.join(outDir, page.path.replace(/^\//, ''), 'index.html');
}

export default function legalStaticPages() {
    let config;

    return {
        name: 'legal-static-pages',

        configResolved(resolved) {
            config = resolved;
        },

        configurePreviewServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const page = legalPageForPath(req.url);
                if (!page || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
                try {
                    const html = await readFile(fileFor(path.resolve(config.root, config.build.outDir), page), 'utf8');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.end(html);
                } catch {
                    next();
                }
            });
        },

        async closeBundle() {
            if (config.command !== 'build' || config.build.ssr) return;
            const outDir = path.resolve(config.root, config.build.outDir);
            const template = await readFile(path.join(outDir, 'index.html'), 'utf8');
            if (!template.includes(ROOT_TAG)) throw new Error(`[legal-static-pages] ${ROOT_TAG} not found in index.html`);

            const ssr = await createServer({
                configFile: false,
                root: config.root,
                logLevel: 'error',
                appType: 'custom',
                server: { middlewareMode: true, hmr: false, ws: false },
                plugins: [react()],
            });
            try {
                const { renderLegalMarkup } = await ssr.ssrLoadModule('/src/legal/prerender.js');
                for (const page of LEGAL_PAGES) {
                    const html = template
                        .replace(/<title>[\s\S]*?<\/title>/, renderLegalHead(page))
                        .replace(ROOT_TAG, `<div id="root">${renderLegalMarkup(page)}</div>`);
                    const file = fileFor(outDir, page);
                    await mkdir(path.dirname(file), { recursive: true });
                    await writeFile(file, html);
                    config.logger.info(`[legal-static-pages] ${path.relative(config.root, file)}`);
                }
            } finally {
                await ssr.close();
            }
        },
    };
}
