import { AlertCircle, CheckCircle, Clock, Loader2, Phone, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { bookiopsService, isBookiOpsEnabled } from '../services/bookiops';
import { phoneVerificationService } from '../services/phoneVerification';
import { settingsService } from '../services/settings';
import { useAuthStore } from '../store/useAuthStore';

export function SetNumber() {
    const { restaurantId, bookiopsRestaurantToken } = useAuthStore();
    const bookiopsEnabled = isBookiOpsEnabled();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [updateNumber, setUpdateNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle' | 'verifying' | 'valid' | 'invalid' | 'error' | 'pending'
    const [verificationResult, setVerificationResult] = useState(null);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }
        loadPhoneNumber();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    useEffect(() => {
        if (!bookiopsEnabled || !bookiopsRestaurantToken) {
            setPendingRequest(null);
            return;
        }
        loadPendingRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookiopsEnabled, bookiopsRestaurantToken]);

    const loadPhoneNumber = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getPhoneNumber(restaurantId);
            setPhoneNumber(data.phoneNumber || '');
        } catch (error) {
            console.error("Failed to load phone number", error);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequest = async () => {
        try {
            const request = await bookiopsService.getCurrentNumberChangeRequest(bookiopsRestaurantToken);
            setPendingRequest(request);
            if (request?.status === 'pending') {
                setVerificationStatus('pending');
                setVerificationResult({
                    message: `Pending approval for ${request.requested_number}`,
                });
            }
        } catch (error) {
            console.warn('[SetNumber] Could not load pending number-change request:', error.message);
        }
    };

    const handleSaveViaBookiOps = async () => {
        if (!bookiopsRestaurantToken) {
            setVerificationStatus('error');
            setVerificationResult({
                error: 'BookiOps session missing. Please log out and log in again, then retry.',
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setVerificationStatus('verifying');
            setVerificationResult(null);

            const request = await bookiopsService.submitNumberChangeRequest(
                bookiopsRestaurantToken,
                updateNumber.trim()
            );

            setPendingRequest(request);
            setVerificationStatus('pending');
            setVerificationResult({
                message: `Request submitted for ${request.requested_number}. Awaiting For approval.`,
            });
            setUpdateNumber('');
        } catch (error) {
            setVerificationStatus('error');
            setVerificationResult({
                error: error.message || 'Failed to submit number change request',
            });
            console.error('BookiOps number-change error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveViaVerification = async () => {
        try {
            setIsSubmitting(true);
            setVerificationStatus('verifying');
            setVerificationResult(null);

            // Legacy path when BookiOps is not configured
            const verification = await phoneVerificationService.verifyPhoneNumber(updateNumber);

            if (!verification.success || !verification.valid) {
                setVerificationStatus('invalid');
                setVerificationResult({
                    error: verification.error || 'This phone number is invalid or inactive'
                });
                setIsSubmitting(false);
                return;
            }

            setVerificationStatus('valid');
            setVerificationResult(verification);
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

    const handleSaveNumber = async () => {
        if (!updateNumber.trim()) {
            setVerificationStatus('error');
            setVerificationResult({ error: 'Please enter a phone number' });
            return;
        }

        if (bookiopsEnabled) {
            await handleSaveViaBookiOps();
            return;
        }

        await handleSaveViaVerification();
    };

    const hasPending = pendingRequest?.status === 'pending';

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
                                    readOnly
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-slate-50 text-muted-foreground cursor-not-allowed"
                                    placeholder="+1 (555) 123-4567"
                                />
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5">
                                This number will be used for AI-powered reservation calls and call forwarding. Ensure it can receive incoming calls.
                            </p>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-medium text-foreground mb-1.5">
                                Update Number
                            </label>
                            {loading ? (
                                <div className="animate-pulse h-10 w-full bg-slate-100 rounded-md"></div>
                            ) : (
                                <input
                                    type="tel"
                                    value={updateNumber}
                                    onChange={(e) => {
                                        setUpdateNumber(e.target.value);
                                        if (!hasPending) {
                                            setVerificationStatus('idle');
                                            setVerificationResult(null);
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${verificationStatus === 'valid' || verificationStatus === 'pending'
                                        ? verificationStatus === 'pending'
                                            ? 'border-amber-500 focus:ring-amber-500 bg-amber-50'
                                            : 'border-green-500 focus:ring-green-500 bg-green-50'
                                        : verificationStatus === 'invalid' || verificationStatus === 'error'
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                            : 'border-border focus:ring-foreground focus:border-foreground'
                                        }`}
                                    placeholder="+1 (555) 123-4567"
                                    disabled={isSubmitting || hasPending}
                                />
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5">
                                {bookiopsEnabled
                                    ? 'Enter a new number and save to send an approval request to BookiOps. The live number updates only after approval.'
                                    : 'Enter a new number to replace the current restaurant phone number.'}
                            </p>

                            {/* Status */}
                            {verificationStatus === 'verifying' && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>
                                        {bookiopsEnabled
                                            ? 'Submitting number change for approval...'
                                            : 'Verifying phone number...'}
                                    </span>
                                </div>
                            )}

                            {verificationStatus === 'pending' && verificationResult && (
                                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-sm text-amber-900 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">Awaiting For approval</span>
                                    </div>
                                    <p className="text-xs text-amber-800 ml-6">
                                        {verificationResult.message}
                                    </p>
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
                                        <p className="font-medium">
                                            {bookiopsEnabled ? 'Request failed' : 'Verification failed'}
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">{verificationResult.error}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
                            <p className="text-xs font-medium text-slate-900 mb-1.5">How it works:</p>
                            <ul className="text-xs text-slate-700 space-y-1">
                                {bookiopsEnabled ? (
                                    <>
                                        <li>• Submit a new number here — it does not go live immediately</li>
                                        <li>• BookiOps reviews and approves the change</li>
                                        <li>• After approval, the restaurant phone number and call routing update</li>
                                        <li>• Only one pending request is allowed at a time</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Customers call this number to make reservations</li>
                                        <li>• AI agent answers and handles booking requests automatically</li>
                                        <li>• All conversations are recorded and transcribed</li>
                                        <li>• Reservations are added to your calendar instantly</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={handleSaveNumber}
                                className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${isSubmitting || loading || hasPending
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-foreground hover:bg-foreground/90 cursor-pointer'
                                    } text-white`}
                                disabled={loading || isSubmitting || hasPending}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {bookiopsEnabled ? 'Submitting...' : 'Verifying...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {hasPending ? 'Pending Approval' : 'Save Number'}
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
