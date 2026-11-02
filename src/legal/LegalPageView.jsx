import { useEffect, useMemo } from 'react';
import Footer from '../components/landingpage/footer';
import { LEGAL_CSS, renderLegalBody } from './renderLegal';

function setMetaDescription(content) {
    let tag = document.querySelector('meta[name="description"]');
    const previous = tag ? tag.getAttribute('content') : null;
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
    return () => {
        if (previous === null) tag.remove();
        else tag.setAttribute('content', previous);
    };
}

/** Legal page + site footer. The build pre-renders this into static HTML. */
export default function LegalPageView({ page }) {
    const html = useMemo(() => renderLegalBody(page), [page]);

    useEffect(() => {
        const previousTitle = document.title;
        document.title = page.metaTitle;
        const restoreDescription = setMetaDescription(page.metaDescription);

        const hash = decodeURIComponent(window.location.hash.slice(1));
        if (hash) document.getElementById(hash)?.scrollIntoView();
        else window.scrollTo(0, 0);

        return () => {
            document.title = previousTitle;
            restoreDescription();
        };
    }, [page]);

    return (
        <div className="min-h-screen bg-snow">
            <style>{LEGAL_CSS}</style>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <Footer />
        </div>
    );
}
