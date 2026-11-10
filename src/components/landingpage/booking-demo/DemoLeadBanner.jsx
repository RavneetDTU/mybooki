export default function DemoLeadBanner({ onEarlyAccess, onBookSetup }) {
    return (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-emerald-50 p-4">
            <p className="text-sm font-semibold text-graphite">Want this for your restaurant?</p>
            <p className="text-xs text-graphite/60 mt-1">
                This was a sample walkthrough. No real booking was made — join the waitlist and we will set it up for you.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
                <button
                    type="button"
                    onClick={onEarlyAccess}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                >
                    Get Early Access
                </button>
                <button
                    type="button"
                    onClick={onBookSetup}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-graphite text-xs font-medium cursor-pointer hover:bg-gray-50"
                >
                    Book Free Setup
                </button>
            </div>
        </div>
    );
}
