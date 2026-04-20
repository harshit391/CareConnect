import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faCheckCircle,
    faCreditCard,
    faShieldAlt,
    faExclamationTriangle,
    faArrowRight,
    faMoneyBillWave,
    faLock,
    faCalendarCheck,
    faReceipt
} from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../utils/contants';

interface PaymentProcessingProps {
    paymentMethod: string;
    amount: number;
    onClose: () => void;
    doctorName: string;
    hospitalName: string;
    appointmentDate: string;
    hospitalId: string;
    userId: string;
}

// Payment processing steps
const STEPS = {
    VERIFYING: 0,
    INITIATING: 1,
    PROCESSING: 2,
    SUCCESS: 3,
    COMPLETE: 4
};

const PaymentProcessing: React.FC<PaymentProcessingProps> = ({
    paymentMethod,
    amount,
    onClose,
    doctorName,
    hospitalName,
    appointmentDate,
    hospitalId,
    userId
}) => {
    const [currentStep, setCurrentStep] = useState(STEPS.VERIFYING);
    const [error, setError] = useState<string | null>(null);
    const [txnId, setTxnId] = useState('');
    const [appointmentId, setAppointmentId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Generate transaction ID
    useEffect(() => {
        const generatedId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        setTxnId(generatedId);
    }, []);

    // Simulated payment processing
    useEffect(() => {
        // Start with verifying details (already set as initial state)
        const verifyingTimeout = setTimeout(() => {
            setCurrentStep(STEPS.INITIATING);

            // Simulate initiation
            const initiatingTimeout = setTimeout(() => {
                setCurrentStep(STEPS.PROCESSING);

                // Simulate processing
                const processingTimeout = setTimeout(() => {
                    // Small chance of payment failure for realism
                    const isSuccessful = Math.random() > 0.05;

                    if (isSuccessful) {
                        setCurrentStep(STEPS.SUCCESS);

                        // Simulate completion
                        const successTimeout = setTimeout(() => {
                            setCurrentStep(STEPS.COMPLETE);
                        }, 1500);

                        return () => clearTimeout(successTimeout);
                    } else {
                        setError("Transaction declined. Please try another payment method.");
                    }
                }, 2500);

                return () => clearTimeout(processingTimeout);
            }, 2000);

            return () => clearTimeout(initiatingTimeout);
        }, 2000);

        return () => clearTimeout(verifyingTimeout);
    }, []);

    // Send appointment data to server when payment is complete
    useEffect(() => {
        const createAppointment = async () => {
            if (currentStep === STEPS.COMPLETE && !appointmentId && !isSubmitting) {
                setIsSubmitting(true);

                try {
                    // Parse the appointment date string to a Date object
                    const appointmentDateTime = new Date(appointmentDate);

                    // Calculate expiration (1 hour after appointment time)
                    const expirationDateTime = new Date(appointmentDateTime);
                    expirationDateTime.setHours(appointmentDateTime.getHours() + 1);

                    // Prepare the request payload
                    const appointmentData = {
                        userId: userId,
                        hospitalId: hospitalId,
                        date: appointmentDateTime.toISOString(),
                        expiration: expirationDateTime.toISOString(),
                        paidPrice: amount
                    };

                    console.log('Appointment Data:', appointmentData);

                    const token = localStorage.getItem('eWauthToken');
                    const response = await fetch(`${API_URL}/appointments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(appointmentData),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create appointment');
                    }

                    const data = await response.json();
                    setAppointmentId(data.id);

                } catch (error) {
                    console.error('Error creating appointment:', error);
                    setError('Failed to complete booking. Please contact support with your transaction ID.');
                } finally {
                    setIsSubmitting(false);
                }
            }
        };

        createAppointment();
    }, [currentStep, appointmentId, isSubmitting, userId, hospitalId, appointmentDate, amount]);

    // Progress bar calculation
    const calculateProgress = () => {
        if (currentStep === STEPS.VERIFYING) return 20;
        if (currentStep === STEPS.INITIATING) return 40;
        if (currentStep === STEPS.PROCESSING) return 60;
        if (currentStep === STEPS.SUCCESS) return 80;
        if (currentStep === STEPS.COMPLETE) return 100;
        return 0;
    };

    // Handle completion
    const handleComplete = () => {
        if (appointmentId) {
            navigate(`/appointments/${appointmentId}`);
        } else {
            // Fallback in case the appointment ID is not available
            navigate('/success');
        }
    };

    // Handle retry
    const handleRetry = () => {
        setError(null);
        setCurrentStep(STEPS.VERIFYING);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-gradient-to-br from-cyan-700/90 via-teal-500/90 to-blue-400/90 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-5 flex items-center">
                    <div className="bg-white/20 p-2 rounded-full">
                        <FontAwesomeIcon icon={faCreditCard} className="text-xl" />
                    </div>
                    <h2 className="text-xl font-bold ml-3">CareConnect Payment</h2>

                    {/* Payment method indicator */}
                    <div className="ml-auto px-3 py-1.5 bg-white/20 rounded-full text-sm flex items-center">
                        <FontAwesomeIcon
                            icon={paymentMethod === 'upi' ? faMoneyBillWave : faCreditCard}
                            className="mr-2"
                        />
                        {paymentMethod === 'credit-card' && 'Credit Card'}
                        {paymentMethod === 'debit-card' && 'Debit Card'}
                        {paymentMethod === 'upi' && 'UPI Payment'}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-2.5">
                    <div
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full transition-all duration-500 ease-in-out rounded-r-full"
                        style={{ width: `${calculateProgress()}%` }}
                    ></div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error ? (
                        <div className="text-center py-6">
                            <div className="bg-red-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-red-500" />
                            </div>

                            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Payment Failed</h3>
                            <p className="text-gray-600 mb-8">{error}</p>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleRetry}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                >
                                    Change Payment
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {(currentStep < STEPS.COMPLETE) && (
                                <div className="text-center py-8">
                                    {currentStep === STEPS.VERIFYING && (
                                        <>
                                            <div className="w-24 h-24 mx-auto mb-6 bg-teal-50 rounded-full flex items-center justify-center border-4 border-teal-100">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-teal-600" />
                                            </div>
                                            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Verifying Details</h3>
                                            <p className="text-gray-600">Please wait while we verify your payment information...</p>
                                        </>
                                    )}

                                    {currentStep === STEPS.INITIATING && (
                                        <>
                                            <div className="w-24 h-24 mx-auto mb-6 bg-teal-50 rounded-full flex items-center justify-center border-4 border-teal-100">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-teal-600" />
                                            </div>
                                            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Initiating Payment</h3>
                                            <p className="text-gray-600">Connecting to the payment gateway...</p>

                                            <div className="flex items-center justify-center mt-5 text-sm text-gray-500 bg-gray-50 py-2 px-4 rounded-full mx-auto w-max">
                                                <FontAwesomeIcon icon={faLock} className="mr-2 text-teal-600" />
                                                Secure 256-bit encrypted connection
                                            </div>
                                        </>
                                    )}

                                    {currentStep === STEPS.PROCESSING && (
                                        <>
                                            <div className="w-24 h-24 mx-auto mb-6 bg-teal-50 rounded-full flex items-center justify-center border-4 border-teal-100">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-teal-600" />
                                            </div>
                                            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Transaction in Process</h3>
                                            <p className="text-gray-600 mb-5">Processing your payment. Please don't close this window...</p>

                                            <div className="text-sm text-gray-500 bg-gray-50 py-2 px-4 rounded-full mx-auto w-max">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faReceipt} className="mr-2 text-teal-600" />
                                                    <span>Transaction ID: <span className="font-medium">{txnId}</span></span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {currentStep === STEPS.SUCCESS && (
                                        <>
                                            <div className="w-24 h-24 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500" />
                                            </div>
                                            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Transaction Successful</h3>
                                            <p className="text-gray-600">Your payment has been processed successfully!</p>
                                        </>
                                    )}
                                </div>
                            )}

                            {currentStep === STEPS.COMPLETE && (
                                <div className="text-center py-6">
                                    <div className="w-24 h-24 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Payment Complete</h3>
                                    <p className="text-gray-600 mb-6">Your appointment has been successfully booked.</p>

                                    <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
                                        <div className="flex justify-between mb-3">
                                            <span className="text-gray-600">Transaction ID:</span>
                                            <span className="font-medium">{txnId}</span>
                                        </div>
                                        <div className="flex justify-between mb-3">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-medium text-teal-700">₹{amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between mb-3">
                                            <span className="text-gray-600">Date:</span>
                                            <span className="font-medium">{new Date().toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between mb-3">
                                            <span className="text-gray-600">Doctor:</span>
                                            <span className="font-medium">{doctorName}</span>
                                        </div>
                                        <div className="flex justify-between mb-3">
                                            <span className="text-gray-600">Hospital:</span>
                                            <span className="font-medium">{hospitalName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Appointment:</span>
                                            <span className="font-medium">{appointmentDate || new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleComplete}
                                        className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center"
                                        disabled={!appointmentId && currentStep === STEPS.COMPLETE}
                                    >
                                        {!appointmentId && currentStep === STEPS.COMPLETE ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                                Finalizing Booking...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
                                                View Appointment Details
                                                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                    <div className="flex items-center justify-center text-sm text-gray-500">
                        <FontAwesomeIcon icon={faShieldAlt} className="text-teal-600 mr-2" />
                        Secured by CareConnect Payment Protection
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentProcessing;