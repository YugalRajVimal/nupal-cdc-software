import React, { useEffect } from 'react';

const PaymentConfirmation: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/parent/invoices-payments'; // Redirect to home page after 3 seconds
    }, 3000);

    return () => clearTimeout(timer); // Cleanup in case the component unmounts early
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#fdf9f6] text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-lg text-gray-700">
        You will be redirected to the home page in a few seconds...
      </p>
    </div>
  );
};

export default PaymentConfirmation;
