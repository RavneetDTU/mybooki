/**
 * JarvisWidget
 * Embeds the Jarvis AI chat widget via an iframe.
 * The widget page is a full Next.js app at /embed — it cannot be loaded as a
 * <script> tag, so we embed it inside a floating iframe instead.
 *
 * Props:
 *  position – "bottom-right" | "bottom-left"  (default: "bottom-right")
 *  theme    – "light" | "dark"               (default: "light")
 */
export default function JarvisWidget({ position = "bottom-right", theme = "light" }) {
    const isRight = position === "bottom-right";

    const containerStyle = {
        position: "fixed",
        bottom: 0,
        [isRight ? "right" : "left"]: 0,
        width: "420px",
        height: "620px",
        zIndex: 9999,
        pointerEvents: "none",   // let clicks fall through to the page by default
        border: "none",
        background: "transparent",
    };

    const iframeStyle = {
        width: "100%",
        height: "100%",
        border: "none",
        background: "transparent",
        pointerEvents: "auto",   // the iframe itself is still clickable
    };

    return (
        <div style={containerStyle}>
            <iframe
                src={`https://openai-widgets-ten.vercel.app/embed?theme=${theme}&position=${position}`}
                style={iframeStyle}
                title="Jarvis AI Widget"
                allow="microphone; autoplay"
                scrolling="no"
            />
        </div>
    );
}
