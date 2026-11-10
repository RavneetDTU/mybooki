/**
 * Dark option list inspired by the attached chatbot reference:
 * icon + title + subtitle, with a green selected state.
 */
export default function OptionPicker({ heading = 'What can I help you with?', options, selectedId, onSelect }) {
    return (
        <div className="w-full rounded-2xl bg-[#1c1c1e] text-white overflow-hidden shadow-lg border border-white/5">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <p className="text-[11px] text-white/55">{heading}</p>
            </div>
            <div className="px-2 pb-2 space-y-1">
                {options.map((option) => {
                    const selected = selectedId === option.id;
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelect(option)}
                            className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                                selected
                                    ? 'bg-[#25D366] text-white'
                                    : 'hover:bg-white/10 text-white'
                            }`}
                        >
                            {Icon ? (
                                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${selected ? 'text-white' : 'text-white/80'}`} />
                            ) : (
                                <span className="text-sm mt-0.5">{option.emoji}</span>
                            )}
                            <span className="min-w-0">
                                <span className="block text-sm font-medium leading-tight">{option.label}</span>
                                {option.subtitle ? (
                                    <span className={`block text-[11px] mt-0.5 ${selected ? 'text-white/85' : 'text-white/45'}`}>
                                        {option.subtitle}
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
