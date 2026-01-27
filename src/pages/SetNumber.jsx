import { Phone, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsService } from '../services/settings';

export function SetNumber() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPhoneNumber();
    }, []);

    const loadPhoneNumber = async () => {
        try {
            const data = await settingsService.getPhoneNumber();
            setPhoneNumber(data.phoneNumber);
        } catch (error) {
            console.error("Failed to load phone number", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNumber = async () => {
        try {
            await settingsService.updatePhoneNumber(phoneNumber);
            alert('Phone number updated successfully!');
        } catch (error) {
            alert('Failed to update phone number');
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <h1 className="font-heading font-semibold text-foreground">
                        Set Number
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Configure your phone number for AI calling agent and call forwarding
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-5">
                {/* Phone Number Section */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    {/* Section Header */}
                    <div className="bg-muted/30 border-b border-border px-5 py-3">
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-foreground" />
                            <h2 className="font-heading font-semibold text-foreground">
                                Phone Number
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Set your restaurant's phone number for handling reservations via AI
                        </p>
                    </div>

                    {/* Section Content */}
                    <div className="p-5">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">
                                Restaurant Phone Number
                            </label>
                            {loading ? (
                                <div className="animate-pulse h-10 w-full bg-slate-100 rounded-md"></div>
                            ) : (
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                    placeholder="+1 (555) 123-4567"
                                />
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5">
                                This number will be used for AI-powered reservation calls and call forwarding. Ensure it can receive incoming calls.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
                            <p className="text-xs font-medium text-slate-900 mb-1.5">How it works:</p>
                            <ul className="text-xs text-slate-700 space-y-1">
                                <li>• Customers call this number to make reservations</li>
                                <li>• AI agent answers and handles booking requests automatically</li>
                                <li>• All conversations are recorded and transcribed</li>
                                <li>• Reservations are added to your calendar instantly</li>
                            </ul>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleSaveNumber}
                                className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4" />
                                Save Number
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}