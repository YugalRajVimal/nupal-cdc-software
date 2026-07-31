import React, { useState } from "react";

/**
 * Therapist Sign Up (OTP-based)
 * Stage 1: Enter name, email, phone, password, request OTP
 * Stage 2: Enter OTP to verify
 * Uses:
 *  POST /api/therapist/signup/send-otp  {name, email, phone, password}
 *  POST /api/therapist/signup/verify-otp {name, email, phone, password, otp}
 *  Success message on completion.
 */

const API_URL = import.meta.env.VITE_API_URL || "";

// --- Validation helpers ---
const emailPattern =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;

const phonePattern = /^[0-9]{8,16}$/; // Accept 8-16 digit phone numbers

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Please enter your name.";
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed))
    return "Name contains invalid characters.";
  return null;
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return "Please enter your email address.";
  if (!emailPattern.test(trimmed))
    return "Please enter a valid email address.";
  if (trimmed.length > 96)
    return "Email address is too long (96 character max).";
  return null;
}

function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null; // phone is optional
  if (!phonePattern.test(trimmed))
    return "Phone number must be 8-16 digits, numbers only.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 6)
    return "Password must be at least 6 characters.";
  if (password.length > 64)
    return "Password cannot be more than 64 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return "Password must contain both letters and numbers.";
  if (/\s/.test(password))
    return "Password should not contain whitespace.";
  return null;
}

function validateOtp(otp: string): string | null {
  if (!otp) return "Please enter the OTP sent to your email.";
  if (!/^\d{4,6}$/.test(otp))
    return "OTP must be 4 to 6 digits (numbers only).";
  return null;
}

const TherapistSignUp: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Handle request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    // FIELD VALIDATIONS
    // Name
    let error = validateName(name);
    if (error) {
      setFormError(error);
      return;
    }

    // Email
    error = validateEmail(email);
    if (error) {
      setFormError(error);
      return;
    }

    // Phone (optional)
    error = validatePhone(phone);
    if (error) {
      setFormError(error);
      return;
    }

    // Password
    error = validatePassword(password);
    if (error) {
      setFormError(error);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/therapist/signup/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfo("OTP sent to your email address.");
        setStep(2);
      } else {
        setFormError(data.message || "Failed to send OTP.");
      }
    } catch (e: any) {
      setFormError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    // Re-validate fields (esp. in case user edits them before step 2 submit)
    let error = validateName(name);
    if (error) {
      setFormError(error);
      return;
    }
    error = validateEmail(email);
    if (error) {
      setFormError(error);
      return;
    }
    error = validatePhone(phone);
    if (error) {
      setFormError(error);
      return;
    }
    error = validatePassword(password);
    if (error) {
      setFormError(error);
      return;
    }
    error = validateOtp(otp);
    if (error) {
      setFormError(error);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/therapist/signup/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          otp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfo("Therapist account created. You may now login.");
        setStep(3);
      } else {
        setFormError(data.message || "Invalid OTP.");
      }
    } catch (e: any) {
      setFormError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-3 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-5 text-center text-blue-700">
          Therapist Sign Up
        </h2>

        {step === 1 && (
          <>
            <form onSubmit={handleRequestOTP} className="space-y-4" noValidate>
              <label className="block text-sm font-medium text-gray-700">
                Name
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={loading}
                  required
                  minLength={2}
                  maxLength={64}
                  autoFocus
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  maxLength={96}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
                <input
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Phone (8-16 digits, optional)"
                  value={phone}
                  onChange={e =>
                    setPhone(e.target.value.replace(/\D/g, "").substr(0, 16))
                  }
                  disabled={loading}
                  minLength={8}
                  maxLength={16}
                  inputMode="tel"
                  pattern="[0-9]*"
                  autoComplete="tel"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Password
                <input
                  type="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password (min 6 chars, incl. number & letter)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                  maxLength={64}
                  autoComplete="new-password"
                  inputMode="text"
                />
              </label>
              {formError && (
                <div className="text-red-600 text-sm">{formError}</div>
              )}
              {info && <div className="text-green-600 text-sm">{info}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                {loading ? "Sending OTP..." : "Request OTP"}
              </button>
            </form>
            <div className="mt-5 text-center">
              <span className="text-gray-500 text-sm">
                Already have an account?{" "}
                <a
                  href="/signin?role=therapist"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign In
                </a>
              </span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <form onSubmit={handleVerifyOTP} className="space-y-4" noValidate>
              <div>
                <div className="text-gray-700 mb-2">
                  Please enter the OTP sent to{" "}
                  <span className="font-semibold">{email}</span>
                </div>
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  maxLength={6}
                  minLength={4}
                  autoComplete="one-time-code"
                  pattern="[0-9]{4,6}"
                  inputMode="numeric"
                  value={otp}
                  onChange={e =>
                    setOtp(e.target.value.replace(/\D/g, "").substr(0, 6))
                  }
                  disabled={loading}
                  required
                  placeholder="Enter OTP"
                />
              </div>
              {formError && (
                <div className="text-red-600 text-sm">{formError}</div>
              )}
              {info && <div className="text-green-600 text-sm">{info}</div>}
              <div className="flex justify-between">
                <button
                  type="button"
                  className="text-blue-600 underline text-sm"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Change Email/Name/Other Info
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </form>
            <div className="mt-5 text-center">
              <span className="text-gray-500 text-sm">
                Already have an account?{" "}
                <a
                  href="/signin?role=therapist"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign In
                </a>
              </span>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="text-green-700 text-lg font-semibold mb-2">
              Sign Up Successful!
            </div>
            <div className="text-gray-600 mb-4">
              Your therapist account has been created.<br />
              You may now login.
            </div>
            <a
              href="/therapist"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Go to Therapist Login
            </a>
            <div className="mt-4">
              <span className="text-gray-500 text-sm">
                Or{" "}
                <a
                  href="/signin?role=therapist"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign In
                </a>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistSignUp;