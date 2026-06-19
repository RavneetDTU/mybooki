import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RESTAURANT_ENDPOINTS } from '../services/api/endpoints';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function OnboardRestaurant() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    // Required fields
    const [formData, setFormData] = useState({
        restaurantId: '',
        name: '',
        phoneNumbers: '',
        email: '',
        depositAmount: '',
        totalCapacity: '',
        
        // Optional fields
        currency: '',
        timezone: '',
        venueType: '',
        voice: '',
        greetingMessage: ''
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Format payload
            const payload = {
                restaurantId: formData.restaurantId,
                name: formData.name,
                email: formData.email,
                phoneNumbers: formData.phoneNumbers.split(',').map(n => n.trim()).filter(n => n),
                depositAmount: Number(formData.depositAmount),
                totalCapacity: Number(formData.totalCapacity)
            };

            // Add optional fields if provided
            if (formData.currency) payload.currency = formData.currency;
            if (formData.timezone) payload.timezone = formData.timezone;
            if (formData.venueType) payload.venueType = formData.venueType;
            if (formData.voice) payload.voice = formData.voice;
            if (formData.greetingMessage) payload.greetingMessage = formData.greetingMessage;

            const response = await fetch(RESTAURANT_ENDPOINTS.CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to create restaurant');
            }

            setSuccess(true);
            // Reset form on success
            setFormData({
                restaurantId: '', name: '', phoneNumbers: '', email: '', 
                depositAmount: '', totalCapacity: '', currency: '', 
                timezone: '', venueType: '', voice: '', greetingMessage: ''
            });
            setShowAdvanced(false);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-heading font-semibold text-foreground tracking-tight">
                        Booki.ai <span className="text-muted-foreground font-normal text-base ml-2">Admin Dashboard</span>
                    </span>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">Onboard Restaurant</h1>
                    <p className="text-muted-foreground">Register a new restaurant system on the platform.</p>
                </div>

                <div className="bg-white rounded-lg border border-border shadow-sm p-6 md:p-8">
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-green-900">Restaurant onboarded successfully!</h4>
                                <p className="text-sm text-green-700 mt-1">The system has been configured with default settings.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-red-900">Failed to create restaurant</h4>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Required Fields */}
                            <div className="space-y-2">
                                <Label htmlFor="restaurantId">Restaurant ID *</Label>
                                <Input 
                                    id="restaurantId" 
                                    value={formData.restaurantId} 
                                    onChange={handleChange} 
                                    placeholder="e.g. 6" 
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name *</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Billy's Steakhouse" 
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Notification Email *</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    placeholder="owner@bistro.com" 
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumbers">Phone Numbers *</Label>
                                <Input 
                                    id="phoneNumbers" 
                                    value={formData.phoneNumbers} 
                                    onChange={handleChange} 
                                    placeholder="e.g. +27765551234 (comma separated)" 
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="depositAmount">Deposit per person *</Label>
                                <Input 
                                    id="depositAmount" 
                                    type="number" 
                                    min="0"
                                    value={formData.depositAmount} 
                                    onChange={handleChange} 
                                    placeholder="e.g. 150" 
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalCapacity">Total Capacity *</Label>
                                <Input 
                                    id="totalCapacity" 
                                    type="number" 
                                    min="1"
                                    value={formData.totalCapacity} 
                                    onChange={handleChange} 
                                    placeholder="e.g. 40" 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Optional Fields Toggle */}
                        <div className="pt-4 border-t border-border">
                            <button 
                                type="button" 
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                Advanced Settings (Optional)
                            </button>
                        </div>

                        {/* Optional Fields Container */}
                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-md border border-border animate-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Input 
                                        id="currency" 
                                        value={formData.currency} 
                                        onChange={handleChange} 
                                        placeholder="e.g. usd, gbp, aud (default: rand)" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Input 
                                        id="timezone" 
                                        value={formData.timezone} 
                                        onChange={handleChange} 
                                        placeholder="e.g. Europe/London (default: Africa/Johannesburg)" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="venueType">Venue Type</Label>
                                    <Input 
                                        id="venueType" 
                                        value={formData.venueType} 
                                        onChange={handleChange} 
                                        placeholder="e.g. steakhouse, cafe (default: restaurant)" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="voice">AI Voice</Label>
                                    <Input 
                                        id="voice" 
                                        value={formData.voice} 
                                        onChange={handleChange} 
                                        placeholder="e.g. alloy, nova (default: marin)" 
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="greetingMessage">Custom Greeting Message</Label>
                                    <Input 
                                        id="greetingMessage" 
                                        value={formData.greetingMessage} 
                                        onChange={handleChange} 
                                        placeholder="Leave blank for auto-generated" 
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-6 flex justify-end">
                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto px-8">
                                {isLoading ? 'Creating System...' : 'Onboard Restaurant'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
