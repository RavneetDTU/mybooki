import { MapPin, Mail, Lock, Save, Loader } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settings';
import { useAuthStore } from '../store/useAuthStore';

export function Settings() {
    const { restaurantId } = useAuthStore();
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressSaving, setAddressSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [email, setEmail] = useState('');

    // Restaurant Address State
    const [address, setAddress] = useState({
        streetLine1: '',
        city: '',
        province: '',
        postalCode: '',
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Load address from API
    const loadAddress = useCallback(async () => {
        if (!restaurantId) return;
        setAddressLoading(true);
        try {
            const data = await settingsService.getAddress(restaurantId);
            setAddress(data);
        } catch (error) {
            console.error('[Settings] Failed to load address:', error);
        } finally {
            setAddressLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        loadAddress();
    }, [loadAddress]);

    const handleSaveAddress = async () => {
        setAddressSaving(true);
        try {
            await settingsService.updateAddress(restaurantId, address);
            alert('Address updated successfully!');
        } catch (error) {
            console.error('[Settings] Failed to save address:', error);
            alert('Failed to update address');
        } finally {
            setAddressSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            alert('Password must be at least 8 characters!');
            return;
        }
        setPasswordSaving(true);
        try {
            await settingsService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            alert('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert(error.message || 'Failed to change password');
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <h1 className="font-heading font-semibold text-foreground">
                        Restaurant Settings
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your restaurant information and account preferences
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">

                {/* 1. Restaurant Address Section */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 border-b border-border px-5 py-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-foreground" />
                            <h2 className="font-heading font-semibold text-foreground">
                                Restaurant Address
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Update your restaurant's physical location
                        </p>
                    </div>

                    <div className="p-5">
                        {addressLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading address…</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {/* Street Address */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1.5">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        value={address.streetLine1}
                                        onChange={(e) => setAddress({ ...address, streetLine1: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                        placeholder="123 Main Street"
                                    />
                                </div>

                                {/* City, Province, Postal Code */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">City</label>
                                        <input
                                            type="text"
                                            value={address.city}
                                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                            placeholder="New York"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">Province/State</label>
                                        <input
                                            type="text"
                                            value={address.province}
                                            onChange={(e) => setAddress({ ...address, province: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                            placeholder="NY"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">Postal Code</label>
                                        <input
                                            type="text"
                                            value={address.postalCode}
                                            onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                            placeholder="10001"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleSaveAddress}
                                disabled={addressLoading || addressSaving}
                                className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addressSaving
                                    ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                                    : <><Save className="w-4 h-4" /> Save Address</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Restaurant Email Section */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 border-b border-border px-5 py-3">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-foreground" />
                            <h2 className="font-heading font-semibold text-foreground">
                                Restaurant Email
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Manage your restaurant contact email
                        </p>
                    </div>

                    <div className="p-5">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                placeholder="restaurant@example.com"
                            />
                            <p className="text-xs text-muted-foreground mt-1.5">
                                This email will be used for reservation confirmations and customer communications
                            </p>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={() => alert('Email update coming soon')}
                                className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                Save Email
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Change Password Section */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 border-b border-border px-5 py-3">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-foreground" />
                            <h2 className="font-heading font-semibold text-foreground">
                                Change Password
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Update your account password for security
                        </p>
                    </div>

                    <div className="p-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1.5">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                    placeholder="Enter new password (min 8 characters)"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-blue-900 mb-1.5">Password Requirements:</p>
                                <ul className="text-xs text-blue-800 space-y-0.5">
                                    <li>• Minimum 8 characters</li>
                                    <li>• Mix of uppercase and lowercase letters (recommended)</li>
                                    <li>• At least one number (recommended)</li>
                                    <li>• At least one special character (recommended)</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleChangePassword}
                                disabled={passwordSaving}
                                className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {passwordSaving
                                    ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                                    : <><Lock className="w-4 h-4" /> Change Password</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}