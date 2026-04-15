import { X, Calendar, Clock, Users, Phone, User, FileText } from 'lucide-react';
import { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuthStore } from '../store/useAuthStore';

export default function CreateReservationModal({ isOpen, onClose, onSuccess }) {
    const { restaurantId } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        date: '',
        time: '',
        party_size: '',
        allergies: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.phone || !formData.date || !formData.time || !formData.party_size) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                phoneNo: formData.phone,
                guests: parseInt(formData.party_size),
                date: formData.date,
                time: formData.time,
                allergy: formData.allergies || null,
                Notes: formData.notes || null,
            };

            await onSuccess(payload);

            // Reset form
            setFormData({
                name: '',
                phone: '',
                date: '',
                time: '',
                party_size: '',
                allergies: '',
                notes: '',
            });
            onClose();
        } catch (error) {
            console.error('Failed to create reservation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="border-b border-border p-5 sticky top-0 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-heading font-semibold text-foreground text-lg">
                                Create Manual Reservation
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Add a new reservation to your calendar
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-muted/20 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-foreground" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Guest Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <User className="w-4 h-4" />
                            Guest Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Phone className="w-4 h-4" />
                            Phone Number *
                        </label>
                        <PhoneInput
                            international
                            defaultCountry="ZA"
                            countries={['US', 'ZA', 'IN']}
                            value={formData.phone}
                            onChange={(value) => handleChange('phone', value || '')}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus-within:ring-2 focus-within:ring-foreground focus-within:border-foreground transition-all [&_input]:outline-none [&_input]:bg-transparent"
                            placeholder="+27 234 567 890"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Date Picker */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <Calendar className="w-4 h-4" />
                                Date *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all cursor-pointer"
                                required
                            />
                        </div>

                        {/* Time Picker */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <Clock className="w-4 h-4" />
                                Time *
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => handleChange('time', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all cursor-pointer"
                                required
                            />
                        </div>
                    </div>

                    {/* Party Size */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Users className="w-4 h-4" />
                            Party Size *
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={formData.party_size}
                            onChange={(e) => handleChange('party_size', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                            placeholder="Number of guests"
                            required
                        />
                    </div>

                    {/* Allergies (Optional) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <FileText className="w-4 h-4" />
                            Allergies
                        </label>
                        <input
                            type="text"
                            value={formData.allergies}
                            onChange={(e) => handleChange('allergies', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                            placeholder="e.g. peanuts, gluten — leave blank for NA"
                        />
                    </div>

                    {/* Notes (Optional) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <FileText className="w-4 h-4" />
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all resize-none"
                            placeholder="Any special requests or additional info — leave blank for NA"
                            rows="3"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border cursor-pointer border-border text-foreground rounded-md hover:bg-muted/20 transition-colors text-sm font-medium"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-foreground cursor-pointer text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Reservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
