import { DATE_PERIODS } from '../config/constants';

const OPTIONS = [
    { id: DATE_PERIODS.TODAY, label: 'Today' },
    { id: DATE_PERIODS.LAST_7, label: 'Last 7 Days' },
    { id: DATE_PERIODS.LAST_30, label: 'Last 30 Days' },
];

/**
 * Segmented period control used next to the existing date picker
 * on Reservations and Other Calls.
 */
export default function DatePeriodFilter({ value, onChange }) {
    return (
        <div
            role="tablist"
            aria-label="Date range"
            className="inline-flex items-center gap-2"
        >
            {OPTIONS.map((option) => {
                const isActive = value === option.id;
                return (
                    <button
                        key={option.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(option.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-heading whitespace-nowrap border-2 transition-all cursor-pointer ${
                            isActive
                                ? 'bg-foreground text-white border-foreground'
                                : 'bg-white text-foreground border-border hover:border-foreground'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
