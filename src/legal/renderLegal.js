// Renders a page from legalContent.js to HTML for LegalPageView. The build
// (legalStaticPages.js) pre-renders that view, with the site footer, into
// real HTML files so crawlers such as Meta's can read them without JavaScript.

import { LEGAL_DETAILS, LEGAL_PAGES } from './legalContent.js';

export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeHref(url) {
    return /^(https?:\/\/|mailto:|#|\/)/i.test(url) ? url : '#';
}

/** **bold**, [text](url); any other [TEXT] is highlighted as a placeholder. */
export function formatInline(text) {
    return escapeHtml(text)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
            const href = safeHref(url);
            const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${href}"${external}>${label}</a>`;
        })
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]/g, '<mark class="legal-placeholder">[$1]</mark>');
}

function renderBlock(block) {
    if (typeof block === 'string') return `<p>${formatInline(block)}</p>`;
    if (block?.list) return `<ul>${block.list.map((item) => `<li>${formatInline(item)}</li>`).join('')}</ul>`;
    return '';
}

function otherPages(page) {
    return LEGAL_PAGES.filter((p) => p.path !== page.path);
}

/** Header, contents and sections. The site footer is added by LegalPageView. */
export function renderLegalBody(page) {
    const toc = page.sections
        .map((s, i) => `<li><a href="#${s.id}">${i + 1}. ${escapeHtml(s.title)}</a></li>`)
        .join('');
    const sections = page.sections
        .map((s, i) => `<section id="${s.id}" class="legal-section"><h2><span class="legal-num">${i + 1}.</span> ${escapeHtml(s.title)}</h2>${s.blocks.map(renderBlock).join('')}</section>`)
        .join('');

    return `<div class="legal-page">
<header class="legal-hero"><div class="legal-wrap">
<a class="legal-back" href="/">&larr; Back to ${escapeHtml(LEGAL_DETAILS.companyName)}</a>
<h1>${escapeHtml(page.title)}</h1>
<p class="legal-updated">Last updated: ${escapeHtml(LEGAL_DETAILS.lastUpdated)}</p>
</div></header>
<main class="legal-wrap legal-main">
${page.intro.map((p) => `<p class="legal-intro">${formatInline(p)}</p>`).join('')}
<nav class="legal-toc" aria-label="Contents"><h2>Contents</h2><ol>${toc}</ol></nav>
${sections}
</main>
</div>`;
}

export const LEGAL_CSS = `
.legal-page{background:#f9fafb;color:#334155;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:16px;line-height:1.7}
.legal-page *{box-sizing:border-box}
.legal-wrap{max-width:56rem;margin:0 auto;padding:0 1.25rem}
.legal-hero{background:#1e293b;color:#fff;padding:3rem 0 2.5rem}
.legal-back{display:inline-block;color:rgba(255,255,255,.65);text-decoration:none;font-size:.875rem;margin-bottom:1.5rem}
.legal-back:hover{color:#fff}
.legal-hero h1{margin:0;font-family:Manrope,Inter,system-ui,sans-serif;font-weight:600;font-size:clamp(1.875rem,5vw,2.5rem);line-height:1.2;color:#fff}
.legal-updated{margin:.5rem 0 0;color:rgba(255,255,255,.6);font-size:.875rem}
.legal-main{padding-top:2.5rem;padding-bottom:3.5rem}
.legal-intro{font-size:1.125rem;color:#1e293b;margin:0 0 2rem}
.legal-toc{background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:1.25rem 1.5rem;margin-bottom:2.5rem}
.legal-toc h2{margin:0 0 .75rem;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
.legal-toc ol{margin:0;padding:0;list-style:none;columns:2;column-gap:2rem}
.legal-toc li{break-inside:avoid;margin:.2rem 0;font-size:.95rem}
.legal-section{scroll-margin-top:1.5rem;margin-bottom:2.25rem}
.legal-section h2{font-family:Manrope,Inter,system-ui,sans-serif;font-size:1.25rem;font-weight:600;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:.5rem;margin:0 0 1rem}
.legal-num{color:#4f46e5}
.legal-section:target h2{color:#4f46e5}
.legal-page p{margin:0 0 .9rem}
.legal-page ul{margin:0 0 1rem;padding-left:1.25rem}
.legal-page li{margin:.35rem 0}
.legal-page strong{color:#1e293b}
.legal-page a{color:#4f46e5;text-decoration:underline;text-underline-offset:2px;word-break:break-word}
.legal-page .legal-back{text-decoration:none}
.legal-placeholder{background:#fef3c7;color:#92400e;padding:0 .2rem;border-radius:.25rem}
.legal-see-also{margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid #e2e8f0;font-size:.95rem}
@media (max-width:640px){.legal-hero{padding:2rem 0 1.75rem}.legal-toc ol{columns:1}.legal-intro{font-size:1.05rem}}
`;

/** <title> and meta tags for the pre-rendered HTML file. */
export function renderLegalHead(page) {
    const url = `${LEGAL_DETAILS.website.replace(/\/$/, '')}${page.path}`;
    return [
        `<title>${escapeHtml(page.metaTitle)}</title>`,
        `<meta name="description" content="${escapeHtml(page.metaDescription)}" />`,
        '<meta name="robots" content="index, follow" />',
        `<link rel="canonical" href="${escapeHtml(url)}" />`,
        '<meta property="og:type" content="website" />',
        `<meta property="og:title" content="${escapeHtml(page.metaTitle)}" />`,
        `<meta property="og:description" content="${escapeHtml(page.metaDescription)}" />`,
        `<meta property="og:url" content="${escapeHtml(url)}" />`,
    ].join('\n    ');
}

export function legalPageForPath(urlPath) {
    const path = String(urlPath || '').split(/[?#]/)[0].replace(/\/index\.html$/, '').replace(/\/+$/, '');
    return LEGAL_PAGES.find((p) => p.path === path) || null;
}
