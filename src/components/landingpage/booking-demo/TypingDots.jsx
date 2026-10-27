export default function TypingDots({ color = 'bg-slate-400' }) {
    return (
        <span className="inline-flex items-center gap-1 px-1" aria-label="Assistant is typing">
            {[0, 1, 2].map((index) => (
                <span
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full ${color}`}
                    style={{ animation: 'landing-demo-typing 1s ease-in-out infinite', animationDelay: `${index * 0.15}s` }}
                />
            ))}
        </span>
    );
}
