import { Phone, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsService } from '../services/settings';
import { phoneVerificationService } from '../services/phoneVerification';

export function SetNumber() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle' | 'verifying' | 'valid' | 'invalid' | 'error'
    const [verificationResult, setVerificationResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (!phoneNumber.trim()) {
            setVerificationStatus('error');
            setVerificationResult({ error: 'Please enter a phone number' });
            return;
        }

        try {
            setIsSubmitting(true);
            setVerificationStatus('verifying');
            setVerificationResult(null);

            // Step 1: Verify the phone number with Twilio Lookup
            const verification = await phoneVerificationService.verifyPhoneNumber(phoneNumber);

            if (!verification.success || !verification.valid) {
                setVerificationStatus('invalid');
                setVerificationResult({
                    error: verification.error || 'This phone number is invalid or inactive'
                });
                setIsSubmitting(false);
                return;
            }

            // Step 2: If valid, save to backend (commented out as API is not available)
            setVerificationStatus('valid');
            setVerificationResult(verification);

            // await settingsService.updatePhoneNumber(phoneNumber); // API endpoint not available yet
            alert('Phone number verified successfully! (Update API not available)');

        } catch (error) {
            setVerificationStatus('error');
            setVerificationResult({
                error: 'An unexpected error occurred. Please try again.'
            });
            console.error('Verification error:', error);
        } finally {
            setIsSubmitting(false);
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
                                    onChange={(e) => {
                                        setPhoneNumber(e.target.value);
                                        setVerificationStatus('idle');
                                        setVerificationResult(null);
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${verificationStatus === 'valid'
                                        ? 'border-green-500 focus:ring-green-500 bg-green-50'
                                        : verificationStatus === 'invalid' || verificationStatus === 'error'
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                            : 'border-border focus:ring-foreground focus:border-foreground'
                                        }`}
                                    placeholder="+1 (555) 123-4567"
                                    disabled={isSubmitting}
                                />
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5">
                                This number will be used for AI-powered reservation calls and call forwarding. Ensure it can receive incoming calls.
                            </p>

                            {/* Verification Status */}
                            {verificationStatus === 'verifying' && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Verifying phone number...</span>
                                </div>
                            )}

                            {verificationStatus === 'valid' && verificationResult && (
                                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-sm text-green-800 mb-1">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-medium">Valid phone number verified!</span>
                                    </div>
                                    <div className="text-xs text-green-700 ml-6">
                                        {verificationResult.nationalFormat && (
                                            <p>Format: {verificationResult.nationalFormat}</p>
                                        )}
                                        {verificationResult.lineTypeIntelligence?.type && (
                                            <p>Type: {verificationResult.lineTypeIntelligence.type}</p>
                                        )}
                                        {verificationResult.lineTypeIntelligence?.carrierName && (
                                            <p>Carrier: {verificationResult.lineTypeIntelligence.carrierName}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(verificationStatus === 'invalid' || verificationStatus === 'error') && verificationResult && (
                                <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">Verification failed</p>
                                        <p className="text-xs text-red-600 mt-1">{verificationResult.error}</p>
                                    </div>
                                </div>
                            )}
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
                                className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${isSubmitting || loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-foreground hover:bg-foreground/90 cursor-pointer'
                                    } text-white`}
                                disabled={loading || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Number
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}