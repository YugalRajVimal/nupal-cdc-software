import React from "react";

// ----- CONTACT US POLICY -----
export const ContactUs: React.FC = () => (
  <div className="max-w-4xl mx-auto px-6 py-10 text-gray-800">
    <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Contact Us</h1>
    <p className="text-sm text-gray-500 text-center mb-8">
      Last updated: 12 Nov 2025
    </p>
    <div className="mb-8">
      <ul className="list-none mb-6 space-y-2 text-base md:text-lg">
        <li>
          <span className="font-semibold">Address:</span>{" "}
          B-180 First Floor, Gujranwala Town Part 1,<br />
          Opp. GD Goenka primary school, Delhi 110009, India
        </li>
        <li>
          <span className="font-semibold">Phone:</span>{" "}
          <a
            href="tel:+919910388103"
            className="text-blue-600 underline"
          >
            +91 9910388103
          </a>
        </li>
        <li>
          <span className="font-semibold">Email:</span>{" "}
          <a
            href="mailto:info@nupalcdc.com"
            className="text-blue-600 underline"
          >
            info@nupalcdc.com
          </a>
        </li>
      </ul>
  
    </div>
    <p>
      We aim to respond to all inquiries within 2 business days.
    </p>
  </div>
);

// ----- TERMS & CONDITIONS POLICY -----
export const TermsAndConditions: React.FC = () => (
  <div className="max-w-4xl mx-auto px-6 py-10 text-gray-800">
    <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">
      Terms &amp; Conditions
    </h1>
    <p className="text-sm text-gray-500 text-center mb-8">
      Last updated: 12 Nov 2025
    </p>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
      <p>
        Welcome to <strong>NUPALCDC</strong>. By using our application or services, you agree to abide by these Terms &amp; Conditions. Please read them carefully.
      </p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">2. Account Responsibility</h2>
      <p>
        User accounts are created manually by the administrator. You are responsible for maintaining the confidentiality of your login credentials and all activities that occur under your account.
      </p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">3. Usage of Services</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Do not misuse or interfere with our services.</li>
        <li>Respect all laws and regulations applicable to your usage.</li>
        <li>Do not attempt unauthorized access to any part of the platform.</li>
      </ul>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">4. Limitation of Liability</h2>
      <p>
        <strong>NUPALCDC</strong> is not liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services.
      </p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">5. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. Changes will be notified through the application or official communication channels.
      </p>
    </section>
    <section>
      <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
      <p>
        For queries about these Terms, reach out at{" "}
        <a href="mailto:info@nupalcdc.com" className="text-blue-600 underline">
          info@nupalcdc.com
        </a>
        .
      </p>
    </section>
  </div>
);

// ----- REFUNDS & CANCELLATIONS POLICY -----
export const RefundsAndCancellations: React.FC = () => (
  <div className="max-w-4xl mx-auto px-6 py-10 text-gray-800">
    <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">
      Refunds &amp; Cancellations Policy
    </h1>
    <p className="text-sm text-gray-500 text-center mb-8">
      Last updated: 12 Nov 2025
    </p>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">1. Refund Policy</h2>
      <p>
        All payments made through the <strong>NUPALCDC</strong> platform are final and non-refundable, unless otherwise specified due to technical error or duplicate transaction. Under special circumstances, users may contact support within 3 days of payment for a review.
      </p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">2. Cancellations</h2>
      <p>
        As user accounts and transactions are managed directly by the administrator, cancellation of payments or services must be requested by contacting support. We evaluate all requests on a case-by-case basis.
      </p>
    </section>
    <section>
      <h2 className="text-xl font-semibold mb-2">3. Contact for Refunds/Cancellations</h2>
      <p>
        For assistance regarding refunds or cancellations, please email{" "}
        <a href="mailto:info@nupalcdc.com" className="text-blue-600 underline">
          info@nupalcdc.com
        </a>{" "}
        or call{" "}
        <a href="tel:+919910388103" className="text-blue-600 underline">
          +91 9910388103
        </a>
        .
      </p>
    </section>
  </div>
);