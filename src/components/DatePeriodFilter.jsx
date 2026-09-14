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
            className="inline-flex items-center rounded-lg border-2 border-foreground bg-white p-0.5"
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
                        className={`px-3.5 py-1.5 rounded-md text-sm font-heading whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                                ? 'bg-foreground text-white'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
