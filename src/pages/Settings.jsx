import { MapPin, Mail, Lock, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsService } from '../services/settings';

export function Settings() {
    const [loading, setLoading] = useState(true);

    // Restaurant Address State
    const [address, setAddress] = useState({
        streetLine1: '',
        city: '',
        province: '',
        postalCode: '',
    });

    // Email State
    const [email, setEmail] = useState('');

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Load Initial Data
    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await settingsService.getSettings();
                setAddress(data.address);
                setEmail(data.email);
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSaveAddress = async () => {
        try {
            await settingsService.updateAddress(address);
            alert('Address updated successfully!');
        } catch (error) {
            alert('Failed to update address');
        }
    };

    const handleSaveEmail = async () => {
        try {
            await settingsService.updateEmail(email);
            alert('Email updated successfully!');
        } catch (error) {
            alert('Failed to update email');
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

        try {
            await settingsService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            alert('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert(error.message || 'Failed to change password');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <h1 className="font-heading font-semibold text-foreground">
                        Restaurant Settings
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your restaurant information and account preferences
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-5 space-y-5">
                {/* 1. Restaurant Address Section */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    {/* Section Header */}
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

                    {/* Section Content */}
                    <div className="p-5">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Street Line 1 */}
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
                                {/* City */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1.5">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                        placeholder="New York"
                                    />
                                </div>

                                {/* Province/State */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1.5">
                                        Province/State
                                    </label>
                                    <input
                                        type="text"
                                        value={address.province}
                                        onChange={(e) => setAddress({ ...address, province: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                        placeholder="NY"
                                    />
                                </div>

                                {/* Postal Code */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1.5">
                                        Postal Code
                                    </label>
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

                        {/* Save Button */}
                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleSaveAddress}
                                className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                Save Address
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Restaurant Email Section */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    {/* Section Header */}
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

                    {/* Section Content */}
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

                        {/* Save Button */}
                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleSaveEmail}
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
                    {/* Section Header */}
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

                    {/* Section Content */}
                    <div className="p-5">
                        <div className="space-y-4">
                            {/* Current Password */}
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1.5">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                    placeholder="Enter current password"
                                />
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1.5">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                    placeholder="Enter new password (min 8 characters)"
                                />
                            </div>

                            {/* Confirm New Password */}
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            {/* Password Requirements */}
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

                        {/* Save Button */}
                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleChangePassword}
                                className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
                            >
                                <Lock className="w-4 h-4" />
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}