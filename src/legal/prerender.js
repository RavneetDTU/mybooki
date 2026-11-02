// Loaded only at build time by legalStaticPages.js (through Vite SSR).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LegalPageView from './LegalPageView.jsx';

export function renderLegalMarkup(page) {
    return renderToStaticMarkup(createElement(LegalPageView, { page }));
}
