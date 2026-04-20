import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CreditCardForm from '../components/CreditCardForm';
import DebitCardForm from '../components/DebitCardForm';
import UPIForm from '../components/UPIForm';
import PaymentProcessing from '../components/PaymentProcess'; // Import the new component
import LoadingSpinner from '../components/LoadingSpinner';
import NotFound from './NotFound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCreditCard,
    faMobileAlt,
} from '@fortawesome/free-solid-svg-icons';

import { API_URL } from '../utils/contants';
import { useAuth } from '../context/auth';
import { Appointment } from '../model/user.model';
import { mapNumberToDay } from '../utils/date';

// Define Hospital interface if not already defined elsewhere
interface Hospital {
    id: string;
    name: string;
    email: string;
    phone: string;
    fees: number;
    appointments: Appointment[];
    parent?: Hospital;
}

const CheckoutPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('credit-card');
    const [loading, setLoading] = useState(false);
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [parentHospital, setParentHospital] = useState<Hospital | null>(null);
    const [showPaymentProcessing, setShowPaymentProcessing] = useState(false); // Add this state

    const navigate = useNavigate();

    const auth = useAuth();

    if (!auth) {
        return <LoadingSpinner />;
    }

    const { user } = auth;

    if (!user) {
        return <LoadingSpinner />;
    }

    if (user && user.role !== "PATIENT") {
        alert("You are not authorized to access this page.");
        navigate("/dashboard")
        return;
    }

    // Calculate dates for appointment
    const [today, setToday] = useState(new Date());

    let formattedToday = today.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
    });

    // Order details calculation
    const calculateOrderDetails = () => {
        if (!hospital || !parentHospital) {
            return {
                subtotal: 0,
                discount: 0,
                tax: 0,
                total: 0
            };
        }

        const originalPrice = parentHospital.fees + hospital.fees;
        const siteCompensation = originalPrice * 0.05;
        const totalAmount = originalPrice + siteCompensation;

        return {
            subtotal: originalPrice,
            discount: 0,
            tax: siteCompensation,
            total: totalAmount
        };
    };

    const [orderDetails, setOrderDetails] = useState(calculateOrderDetails());

    // Fetch hospital data
    useEffect(() => {
        if (!id) return;

        setLoading(true);

        fetch(`${API_URL}/hospitals/${id}`)
            .then((response) => response.json())
            .then((data) => {
                console.log("Checkout", data);

                const todayWeekDay = mapNumberToDay(today.getDay());

                if (!data.timings[todayWeekDay]) {
                    alert("The doctor is not available now.");
                    setLoading(false);
                    return;
                }

                setHospital(data);
                setParentHospital(data.parent);
                setLoading(false);

                // If null then set today to next day   
                setToday(new Date(data.freeSlotDate ||
                    new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
                ));
                // Update order details after fetching data
                setOrderDetails(calculateOrderDetails());

                const alreadyBooked = hospital?.appointments.filter((appointment: Appointment) => appointment.userId === auth.user._id);

                if (alreadyBooked && alreadyBooked.length > 0) {
                    alert("You have already booked an appointment with this doctor.");
                }
            })
            .catch((error) => {
                console.error("Error fetching hospital details:", error);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        formattedToday = today.toLocaleDateString("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
        });
    }, [today])

    // Update order details when hospital data changes
    useEffect(() => {
        setOrderDetails(calculateOrderDetails());
    }, [hospital, parentHospital]);

    // Handle payment initiation
    const handlePaymentStart = () => {
        setShowPaymentProcessing(true);
    };

    // Handle payment cancellation/close
    const handlePaymentClose = () => {
        setShowPaymentProcessing(false);
    };

    if (loading) return <LoadingSpinner />;
    if (!hospital && id) return <NotFound />;

    return (
        <div className="bg-gradient-to-r from-teal-500 to-blue-400 min-h-screen">
            {/* Main Content */}
            <div className="container mx-auto px-4 py-10">
                <h1 className="text-3xl font-bold text-white text-center mb-8">Book an Appointment</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Checkout Form */}
                    <div className="bg-white rounded-lg shadow-lg p-6 flex-1">
                        {/* Doctor Details (from Payment.tsx) */}
                        {hospital && (
                            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Doctor Details</h2>
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <img
                                        src="/Services/Hospital.jpg"
                                        alt="Doctor"
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">{"Dr. " + hospital.name}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                            <div className="text-sm"><span className="font-semibold">Contact:</span> {hospital.phone}</div>
                                            <div className="text-sm"><span className="font-semibold">Email:</span> {hospital.email}</div>
                                            {parentHospital && (
                                                <div className="text-sm">
                                                    <span className="font-semibold">Associated Hospital:</span>{" "}
                                                    <Link className="text-teal-500 hover:underline" to={"/hospital/" + parentHospital.id}>
                                                        {parentHospital.name}
                                                    </Link>
                                                </div>
                                            )}
                                            <div className="text-sm"><span className="font-semibold">Appointment Date:</span> {formattedToday}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Payment Details</h2>

                        {/* Payment Method Selection */}
                        <div className="mb-8">
                            <h3 className="text-gray-700 font-medium mb-3">Select Payment Method</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button
                                    className={`border rounded-lg p-4 flex flex-col items-center justify-center transition ${selectedPaymentMethod === 'credit-card' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedPaymentMethod('credit-card')}
                                >
                                    <FontAwesomeIcon icon={faCreditCard} className="text-xl mb-2 text-teal-500" />
                                    <span className="text-sm font-medium">Credit Card</span>
                                </button>

                                <button
                                    className={`border rounded-lg p-4 flex flex-col items-center justify-center transition ${selectedPaymentMethod === 'debit-card' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedPaymentMethod('debit-card')}
                                >
                                    <FontAwesomeIcon icon={faCreditCard} className="text-xl mb-2 text-blue-500" />
                                    <span className="text-sm font-medium">Debit Card</span>
                                </button>

                                <button
                                    className={`border rounded-lg p-4 flex flex-col items-center justify-center transition ${selectedPaymentMethod === 'upi' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedPaymentMethod('upi')}
                                >
                                    <FontAwesomeIcon icon={faMobileAlt} className="text-xl mb-2 text-green-500" />
                                    <span className="text-sm font-medium">UPI</span>
                                </button>
                            </div>
                        </div>

                        {/* Payment Method Forms */}
                        <div className="mb-6">
                            {selectedPaymentMethod === 'credit-card' && <CreditCardForm />}
                            {selectedPaymentMethod === 'debit-card' && <DebitCardForm />}
                            {selectedPaymentMethod === 'upi' && <UPIForm />}
                        </div>

                        <div className="flex gap-4">
                            {/* Change from Link to button to trigger payment processing */}
                            <button
                                onClick={handlePaymentStart}
                                className="flex-1 bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 transition font-medium text-center"
                            >
                                Complete Payment
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-medium text-center">
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-lg shadow-lg p-6 lg:w-96">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Order Summary</h2>

                        <div className="border-b pb-4 mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Appointment Fee</span>
                                <span className="font-medium">₹{orderDetails.subtotal.toFixed(2)}</span>
                            </div>
                            {orderDetails.discount > 0 && (
                                <div className="flex justify-between mb-2 text-green-600">
                                    <span>Discount</span>
                                    <span>-₹{orderDetails.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Site Compensation (5%)</span>
                                <span className="font-medium">₹{orderDetails.tax.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{orderDetails.total.toFixed(2)}</span>
                        </div>

                        {hospital && parentHospital && (
                            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-medium text-gray-800 mb-2">Appointment Details</h3>
                                <p className="text-gray-600 text-sm mb-1">Dr. {hospital.name}</p>
                                <p className="text-gray-600 text-sm mb-1">{parentHospital.name}</p>
                                <p className="text-gray-600 text-sm">{formattedToday} - 10:30 AM</p>
                            </div>
                        )}

                        <div className="mt-6 text-xs text-gray-500 text-center">
                            <p>By completing this payment, you agree to our <a href="#" className="text-teal-500 hover:underline">Terms of Service</a> and <a href="#" className="text-teal-500 hover:underline">Privacy Policy</a>.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Processing Modal */}
            {showPaymentProcessing && hospital && parentHospital && (
                <PaymentProcessing
                    paymentMethod={selectedPaymentMethod}
                    amount={orderDetails.total}
                    onClose={handlePaymentClose}
                    doctorName={"Dr. " + hospital.name}
                    hospitalName={parentHospital.name}
                    appointmentDate={formattedToday}
                    hospitalId={hospital.id}
                    userId={auth.user._id} // Pass userId to PaymentProcessing component
                />
            )}
        </div>
    );
};

export default CheckoutPage;