import { Edit2, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { guestService } from '../services/guests';
import { useAuthStore } from '../store/useAuthStore';

export function Guests() {
    const { restaurantId } = useAuthStore();
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editedGuest, setEditedGuest] = useState(null);

    // Fetch guests on mount (and when restaurantId changes)
    useEffect(() => {
        loadGuests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    const loadGuests = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const data = await guestService.getGuests(restaurantId);
            setGuests(data);
        } catch (error) {
            console.error('Failed to load guests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (guest) => {
        setEditingId(guest.id);
        setEditedGuest({ ...guest });
    };

    const handleSave = async () => {
        if (editedGuest) {
            try {
                await guestService.updateGuest(editedGuest, restaurantId);
                setGuests(guests.map((g) => (g.id === editedGuest.id ? editedGuest : g)));
                setEditingId(null);
                setEditedGuest(null);
                alert('Guest details updated successfully');
            } catch (error) {
                alert('Failed to update guest details');
                console.error(error);
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditedGuest(null);
    };

    const handleChange = (field, value) => {
        if (editedGuest) {
            setEditedGuest({ ...editedGuest, [field]: value });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <h1 className="font-heading font-semibold text-foreground">
                        Guests
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your regular customers and their booking history
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-5">
                {/* Table */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    {/* Table Header - Dark like reference image */}
                    <div className="bg-slate-800 text-white">
                        <div className="grid grid-cols-[2fr_1.5fr_2fr_1fr_1.5fr] gap-4 px-5 py-3.5">
                            <div className="text-sm font-semibold">Name</div>
                            <div className="text-sm font-semibold">Phone</div>
                            <div className="text-sm font-semibold">Email</div>
                            <div className="text-sm font-semibold">Bookings</div>
                            <div className="text-sm font-semibold text-right">Actions</div>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                            </div>
                        ) : (
                            guests.length > 0 ? (
                                guests.map((guest) => {
                                    const isEditing = editingId === guest.id;
                                    const displayGuest = isEditing && editedGuest ? editedGuest : guest;

                                    return (
                                        <div
                                            key={guest.id}
                                            className={`grid grid-cols-[2fr_1.5fr_2fr_1fr_1.5fr] gap-4 px-5 py-4 items-center transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-muted/10'
                                                }`}
                                        >
                                            {/* Name */}
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={displayGuest.name}
                                                        onChange={(e) => handleChange('name', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
                                                    />
                                                ) : (
                                                    <div>
                                                        <p className="font-medium text-foreground">{displayGuest.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Last visit: {displayGuest.lastVisit}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Phone */}
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        value={displayGuest.phone}
                                                        onChange={(e) => handleChange('phone', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-foreground">{displayGuest.phone}</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        value={displayGuest.email}
                                                        onChange={(e) => handleChange('email', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-foreground">{displayGuest.email}</p>
                                                )}
                                            </div>

                                            {/* Bookings */}
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {displayGuest.totalBookings} total
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {displayGuest.cancellations} cancellations, {displayGuest.noShows} no-shows
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={handleSave}
                                                            className="p-2 bg-foreground text-white rounded-md hover:bg-primary transition-colors cursor-pointer"
                                                            title="Save"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={handleCancel}
                                                            className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEdit(guest)}
                                                        className="p-2  text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer bg-[rgb(15,23,42)]"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                /* Empty State */
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No regular guests found</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}