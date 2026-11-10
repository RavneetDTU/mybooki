import { useState } from 'react';
import { ArrowLeft, FileUp, Upload } from 'lucide-react';
import { VALIDATION_LABELS, downloadSampleCsv, parseCsv, reviewImport, summarizeContacts } from '../../data/marketingMock';

const COLUMN_HELP = [
    ['Name', 'Recommended'],
    ['Phone Number', 'Required'],
    ['Email', 'Optional'],
    ['Birthday', 'Optional'],
    ['Last Visit', 'Optional'],
    ['Marketing Consent', 'Required for eligibility'],
];

export default function ImportContacts({ existing, onCancel, onImport }) {
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [review, setReview] = useState(null);
    const [dragging, setDragging] = useState(false);

    const readFile = (file) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setError('Use a .csv file. Other formats are not read in this preview.');
            setReview(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const parsed = parseCsv(String(reader.result || ''));
            if (parsed.missingColumns.length) {
                setError(`Missing required column: ${parsed.missingColumns.join(', ')}.`);
                setReview(null);
                setFileName(file.name);
                return;
            }
            setError('');
            setFileName(file.name);
            setReview(reviewImport(parsed.rows, existing));
        };
        reader.readAsText(file);
    };

    const summary = review ? summarizeContacts(review) : null;
    const valid = review ? review.filter((item) => item.validation === 'eligible') : [];

    return (
        <div className="px-6 py-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    <button type="button" onClick={onCancel} aria-label="Back to campaigns" className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-md text-foreground hover:bg-muted cursor-pointer">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                    <h1 className="font-heading font-semibold text-2xl">Import contacts</h1>
                    <p className="text-sm text-muted-foreground mt-1">Read a CSV in the browser. Nothing is uploaded.</p>
                    </div>
                </div>
                <button type="button" onClick={downloadSampleCsv} className="px-3 py-2 text-sm border border-border rounded-lg bg-white cursor-pointer hover:bg-muted">
                    Download sample CSV
                </button>
            </div>

            {!review ? (
                <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-stretch">
                    <div
                        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setDragging(false);
                            readFile(event.dataTransfer.files?.[0]);
                        }}
                        className={`rounded-2xl border-2 border-dashed bg-white px-6 py-16 text-center flex flex-col items-center justify-center min-h-[320px] ${dragging ? 'border-foreground bg-muted' : 'border-border'}`}
                    >
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="mt-3 font-medium">Drop a CSV here</p>
                        <p className="text-sm text-muted-foreground mt-1">or browse a file on this computer</p>
                        <label className="inline-flex mt-4 px-4 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer">
                            <FileUp className="w-4 h-4 mr-2" />
                            Browse file
                            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => readFile(event.target.files?.[0])} />
                        </label>
                        {fileName ? <p className="text-xs mt-3">{fileName}</p> : null}
                        {error ? <p className="text-sm text-rose-600 mt-3">{error}</p> : null}
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-5 h-full">
                        <p className="font-heading font-semibold">Columns</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            {COLUMN_HELP.map(([name, need]) => (
                                <li key={name} className="flex justify-between gap-3">
                                    <span>{name}</span>
                                    <span className="text-muted-foreground text-xs">{need}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-muted-foreground mt-4">Phone Number and Marketing Consent are required. Consent must be yes before a contact can be included in a campaign.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-sm">
                        {[
                            ['Rows', summary.total],
                            ['Valid', summary.eligible],
                            ['Invalid numbers', summary.invalid],
                            ['Duplicates', summary.duplicate],
                            ['No consent', summary.noConsent],
                            ['Unsubscribed', summary.unsubscribed],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-border bg-white px-3 py-2">
                                <p className="text-[11px] text-muted-foreground">{label}</p>
                                <p className="font-heading text-lg">{value}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-amber-800">Demo review only. Importing updates this page, not a live customer list. File: {fileName}</p>
                    <div className="rounded-2xl border border-border bg-white overflow-auto max-h-[420px]">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Name</th>
                                    <th className="px-3 py-2 font-medium">Phone</th>
                                    <th className="px-3 py-2 font-medium">Consent</th>
                                    <th className="px-3 py-2 font-medium">Validation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {review.map((item) => (
                                    <tr key={item.id} className="border-t border-border">
                                        <td className="px-3 py-2">{item.name}</td>
                                        <td className="px-3 py-2">{item.phone || '—'}</td>
                                        <td className="px-3 py-2 capitalize">{item.consent}</td>
                                        <td className={`px-3 py-2 ${item.validation === 'eligible' ? 'text-emerald-700' : 'text-rose-600'}`}>{VALIDATION_LABELS[item.validation]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setReview(null); setFileName(''); }} className="px-4 py-2 rounded-lg border border-border bg-white text-sm cursor-pointer">Back to upload</button>
                        <button
                            type="button"
                            disabled={!valid.length}
                            onClick={() => onImport(valid)}
                            className="px-4 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer disabled:opacity-40"
                        >
                            Import valid contacts ({valid.length})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
