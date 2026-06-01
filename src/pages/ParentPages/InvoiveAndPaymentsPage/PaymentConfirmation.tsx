import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PaymentConfirmation: React.FC = () => {
  // Parse orderId from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!orderId) {
        setStatus(null);
        return;
      }
      setStatus('loading');
      setError(null);
      try {
        // The backend route: /api/cashfree/confirm-order-status/:order_id
        // Environment variable VITE_API_URL should be set to base backend API URL
        const API_URL = import.meta.env.VITE_API_URL || "";
        const response = await axios.get(`${API_URL}/api/cashfree/confirm-order-status/${orderId}`);
        const { orderStatus, paymentStatusMarked } = response.data || {};

        if (orderStatus?.order_status === 'PAID' || paymentStatusMarked === 'paid') {
          setStatus('success');
        } else if (orderStatus?.order_status === 'FAILED' || orderStatus?.order_status === 'EXPIRED' || paymentStatusMarked === 'failed') {
          setStatus('failed');
        } else if (orderStatus?.order_status === 'ACTIVE' || paymentStatusMarked === 'pending') {
          setStatus('pending');
        } else {
          setStatus(null);
          setError('Unable to determine payment status');
        }
      } catch (e: any) {
        setStatus('failed');
        setError(
          e?.response?.data?.error ||
          e?.message ||
          'Failed to check payment status'
        );
      }
    };

    if (orderId) {
      checkPaymentStatus();
    }
  }, [orderId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (status === 'success' || status === 'failed' || status === 'pending') {
      timer = setTimeout(() => {
        window.location.href = '/parent/invoices-payments'; // Redirect after 3 seconds
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#fdf9f6] text-center">
      {status === 'loading' && (
        <>
          <h1 className="text-3xl font-bold text-slate-600 mb-4">Checking Payment Status...</h1>
          <p className="text-lg text-gray-700">
            Verifying your payment. Please wait...
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
          <p className="text-lg text-gray-700">
            You will be redirected to the invoices &amp; payments page in a few seconds...
          </p>
        </>
      )}
      {status === 'failed' && (
        <>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed!</h1>
          <p className="text-lg text-gray-700">
            Sorry, your payment was unsuccessful. You will be redirected soon.
          </p>
        </>
      )}
      {status === 'pending' && (
        <>
          <h1 className="text-3xl font-bold text-yellow-500 mb-4">Payment Pending</h1>
          <p className="text-lg text-gray-700">
            Your payment is still being processed. You will be redirected soon.
          </p>
        </>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
      {orderId && (
        <p className="mt-4 text-sm text-gray-500">Order ID: <span className="font-mono">{orderId}</span></p>
      )}
    </div>
  );
};

export default PaymentConfirmation;
