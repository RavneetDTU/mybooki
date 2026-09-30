import { Check, Loader, Pencil, Plus, RefreshCw, Trash2, Utensils, X } from 'lucide-react';
import { useState } from 'react';
import { sittingService } from '../services/sittings';
import { useAuthStore } from '../store/useAuthStore';

const EMPTY_FORM = { name: '', description: '', capacity: '', is_active: true };

const inputClass =
    'w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all';

function validateForm(form, sittings, editingId) {
    const name = form.name.trim();
    if (!name) return 'Please enter a sitting name.';
    if (form.capacity !== '' && (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 0)) {
        return 'Capacity must be a whole number of 0 or more (leave empty for no limit).';
    }
    const duplicate = sittings.some(
        (s) => s.id !== editingId && String(s.name).trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) return `A sitting called "${name}" already exists.`;
    return null;
}

/**
 * SittingsSection
 * Restaurant-defined sittings (e.g. Breakfast, Lunch, Pub Lunch, Christmas Dinner).
 * Sittings describe what is offered; timings are set per day in Operating Hours or per date on the calendar.
 */
export function SittingsSection({ sittings, loading, loadError, onReload }) {
    const { restaurantId } = useAuthStore();

    const [newSitting, setNewSitting] = useState(EMPTY_FORM);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [busyId, setBusyId] = useState(null);

    const handleAdd = async () => {
        const error = validateForm(newSitting, sittings, null);
        if (error) {
            alert(error);
            return;
        }
        setAdding(true);
        try {
            await sittingService.createSitting(restaurantId, newSitting);
            setNewSitting(EMPTY_FORM);
            await onReload();
        } catch (err) {
            console.error('[SittingsSection] Create failed:', err);
            alert(err.message || 'Failed to add sitting. Please try again.');
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (sitting) => {
        setEditingId(sitting.id);
        setEditForm({
            name: sitting.name || '',
            description: sitting.description || '',
            capacity: sitting.capacity ?? '',
            is_active: sitting.is_active,
        });
    };

    const saveEdit = async () => {
        const error = validateForm(editForm, sittings, editingId);
        if (error) {
            alert(error);
            return;
        }
        setBusyId(editingId);
        try {
            await sittingService.updateSitting(restaurantId, editingId, editForm);
            setEditingId(null);
            await onReload();
        } catch (err) {
            console.error('[SittingsSection] Update failed:', err);
            alert(err.message || 'Failed to update sitting. Please try again.');
        } finally {
            setBusyId(null);
        }
    };

    const toggleActive = async (sitting) => {
        setBusyId(sitting.id);
        try {
            await sittingService.updateSitting(restaurantId, sitting.id, {
                name: sitting.name,
                description: sitting.description,
                capacity: sitting.capacity,
                is_active: !sitting.is_active,
            });
            await onReload();
        } catch (err) {
            console.error('[SittingsSection] Toggle failed:', err);
            alert(err.message || 'Failed to update sitting. Please try again.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (sitting) => {
        if (!window.confirm(
            `Delete "${sitting.name}"? It will be removed from your weekly and date schedules and can no longer be booked. Existing reservations keep this sitting name.`
        )) return;
        setBusyId(sitting.id);
        try {
            await sittingService.deleteSitting(restaurantId, sitting.id);
            await onReload();
        } catch (err) {
            console.error('[SittingsSection] Delete failed:', err);
            alert(err.message || 'Failed to delete sitting. Please try again.');
        } finally {
            setBusyId(null);
        }
    };

    const renderRow = (s) => {
        const busy = busyId === s.id;
        if (editingId === s.id) {
            return (
                <div key={s.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_120px_auto] gap-2 items-center px-4 py-3 bg-muted/10">
                    <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={inputClass}
                        placeholder="Name"
                    />
                    <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className={inputClass}
                        placeholder="Description (optional)"
                    />
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={editForm.capacity}
                        onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                        className={inputClass}
                        placeholder="No limit"
                    />
                    <div className="flex items-center gap-1 justify-end">
                        <button
                            onClick={saveEdit}
                            disabled={busy}
                            className="p-1.5 text-green-700 hover:bg-green-50 rounded transition-colors cursor-pointer disabled:opacity-40"
                            title="Save"
                        >
                            {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setEditingId(null)}
                            disabled={busy}
                            className="p-1.5 text-muted-foreground hover:bg-muted/20 rounded transition-colors cursor-pointer disabled:opacity-40"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div key={s.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${s.is_active ? '' : 'opacity-60'}`}>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    {s.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                        {s.capacity == null ? 'No capacity limit' : `${s.capacity} guests`}
                    </span>
                    <button
                        onClick={() => toggleActive(s)}
                        disabled={busy}
                        className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                            s.is_active
                                ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                                : 'text-muted-foreground bg-muted/20 border-border hover:bg-muted/40'
                        }`}
                        title={s.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                        {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                    <button
                        onClick={() => startEdit(s)}
                        disabled={busy}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Edit sitting"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(s)}
                        disabled={busy}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
                        title="Delete sitting"
                    >
                        {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 border-b border-border px-5 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-foreground" />
                        <h2 className="font-heading font-semibold text-foreground">
                            Sittings
                        </h2>
                    </div>
                    <button
                        onClick={onReload}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Create the sittings your restaurant offers (e.g. Lunch, Pub Lunch, Christmas Dinner). Each sitting has its own capacity. Set their timings in Operating Hours below or per date on the calendar.
                </p>
            </div>

            <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_140px_auto] gap-3 items-end">
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Sitting Name</label>
                        <input
                            type="text"
                            value={newSitting.name}
                            onChange={(e) => setNewSitting({ ...newSitting, name: e.target.value })}
                            disabled={adding}
                            className={inputClass}
                            placeholder="e.g. Pub Lunch"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Description</label>
                        <input
                            type="text"
                            value={newSitting.description}
                            onChange={(e) => setNewSitting({ ...newSitting, description: e.target.value })}
                            disabled={adding}
                            className={inputClass}
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Capacity (guests)</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={newSitting.capacity}
                            onChange={(e) => setNewSitting({ ...newSitting, capacity: e.target.value })}
                            disabled={adding}
                            className={inputClass}
                            placeholder="No limit"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={adding || loading}
                        className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {adding
                            ? <><Loader className="w-4 h-4 animate-spin" /> Adding…</>
                            : <><Plus className="w-4 h-4" /> Add Sitting</>
                        }
                    </button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/20 border-b border-border px-4 py-2.5">
                        <p className="text-xs font-semibold text-foreground">
                            Your sittings ({sittings.length})
                        </p>
                    </div>
                    {loading ? (
                        <div className="flex items-center gap-2 px-4 py-5 text-muted-foreground">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading sittings…</span>
                        </div>
                    ) : loadError ? (
                        <p className="px-4 py-5 text-xs text-red-700">{loadError}</p>
                    ) : sittings.length === 0 ? (
                        <p className="px-4 py-5 text-sm text-muted-foreground">
                            No sittings yet. Add your first sitting above.
                        </p>
                    ) : (
                        <div className="divide-y divide-border">
                            {sittings.map(renderRow)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
