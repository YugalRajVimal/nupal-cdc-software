import React, { useState, useEffect } from "react";

/**
 * Parent Sign Up (OTP-based)
 * Stage 1: Enter parent name, email, phone & password, request OTP
 * Stage 2: Enter OTP to verify
 * 
 * API endpoints:
 *  POST /api/parent/signup  {name, email, phone, password}
 *  POST /api/parent/verify-otp {email, otp}
 *  POST /api/parent/signup/resend-otp {email}
 *  Success message on completion.
 */

// NOTE: Use /api/parent/signup and /api/parent/verify-otp as per backend
const API_URL = import.meta.env.VITE_API_URL || "";

// Validation helpers
const emailPattern =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;

const phonePattern = /^[0-9]{8,16}$/;

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
  if (!trimmed) return "Please enter your phone number.";
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

const RESEND_OTP_COOLDOWN = 30; // seconds

const ParentSignUp: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(2); // seconds

  // For resend OTP cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  // On step 3, redirect to /parent after short delay, using window.location as fallback
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 3) {
      setRedirectCountdown(2);
      timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            window.location.href = "/parent";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  // Handle request OTP (Stage 1)
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    // Field validations
    const nameError = validateName(trimmedName);
    if (nameError) {
      setFormError(nameError);
      return;
    }

    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setFormError(emailError);
      return;
    }

    const phoneError = validatePhone(trimmedPhone);
    if (phoneError) {
      setFormError(phoneError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    setLoading(true);
    try {
      // API: POST /api/parent/signup
      const res = await fetch(`${API_URL}/api/parent/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, phone: trimmedPhone, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfo("OTP sent to your email address.");
        setStep(2);
        setResendCooldown(RESEND_OTP_COOLDOWN); // Start cooldown on success
      } else {
        setFormError(data.message || "Failed to send OTP.");
      }
    } catch (e: any) {
      setFormError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setFormError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setFormError(emailError);
      return;
    }

    setResendLoading(true);
    try {
      // API: POST /api/parent/signup/resend-otp
      const res = await fetch(`${API_URL}/api/parent/signup/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfo("OTP resent to your email address.");
        setResendCooldown(RESEND_OTP_COOLDOWN); // Reset cooldown
      } else {
        setFormError(data.message || "Failed to resend OTP.");
      }
    } catch (e: any) {
      setFormError("Server error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Handle verify OTP (Stage 2)
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    const trimmedOtp = otp.trim();
    const otpError = validateOtp(trimmedOtp);
    if (otpError) {
      setFormError(otpError);
      return;
    }

    setLoading(true);
    try {
      // API: POST /api/parent/verify-otp
      const res = await fetch(`${API_URL}/api/parent/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: trimmedOtp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfo("Parent account created. Redirecting to your dashboard...");
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

  // Simple navigation fallback if react-router context is not available
  const handleSignInRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/signin";
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-3 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-5 text-center text-blue-700">
          Parent Sign Up
        </h2>

        {/* Add sign in link at the top right or above the card */}
        <div className="mb-4 text-right">
          <a
            href="/signin"
            onClick={handleSignInRedirect}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Already have an account? Sign in
          </a>
        </div>

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Parent Name
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                required
                minLength={2}
                maxLength={60}
                pattern="^[a-zA-Z\s.'-]{2,60}$"
                autoComplete="name"
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
                autoComplete="email"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
              <input
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 9123456789"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                required
                minLength={8}
                maxLength={16}
                inputMode="tel"
                pattern="[0-9]{8,16}"
                autoComplete="tel"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Minimum 6 characters, letters and numbers"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                maxLength={64}
                autoComplete="new-password"
                pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{6,64}$"
                title="Password must contain at least 6 characters, including both letters and numbers."
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
        )}

        {/* Step 2: Enter OTP and Resend OTP Feature */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="text-gray-700 mb-2">
                Please enter the OTP sent to{" "}
                <span className="font-semibold">{email}</span>
              </div>
              <input
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={6}
                autoComplete="one-time-code"
                pattern="\d{4,6}"
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                required
                placeholder="Enter OTP"
                title="OTP must be 4 to 6 digits."
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  className={`text-blue-600 underline text-sm ml-0 ${
                    resendLoading || resendCooldown > 0
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:text-blue-800"
                  }`}
                  onClick={handleResendOTP}
                  disabled={resendLoading || resendCooldown > 0}
                  aria-disabled={resendLoading || resendCooldown > 0}
                >
                  {resendLoading
                    ? "Resending..."
                    : resendCooldown > 0
                    ? `Resend OTP (${resendCooldown}s)`
                    : "Resend OTP"}
                </button>
              </div>
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
                Change Details
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
        )}

        {/* Step 3: Success & redirect */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-green-700 text-lg font-semibold mb-2">
              Sign Up Successful!
            </div>
            <div className="text-gray-600 mb-4">
              Your parent account has been created.
              <br />
              Redirecting to your dashboard... ({redirectCountdown})
            </div>
            <div className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold opacity-60 cursor-not-allowed transition">
              Go to Parent Dashboard
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentSignUp;