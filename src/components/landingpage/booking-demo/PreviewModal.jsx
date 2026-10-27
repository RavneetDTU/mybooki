import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function PreviewModal({
    isOpen,
    onClose,
    title,
    labelledBy = 'landing-demo-preview-title',
    widthClass = 'max-w-lg',
    children,
}) {
    useEffect(() => {
        if (!isOpen) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
            <button
                type="button"
                aria-label="Close preview overlay"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] cursor-pointer"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                className={`relative ${widthClass} w-full max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden`}
            >
                <h2 id={labelledBy} className="sr-only">{title}</h2>
                {children}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close preview"
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
