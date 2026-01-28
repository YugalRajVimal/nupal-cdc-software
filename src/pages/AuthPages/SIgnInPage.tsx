import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiUsers,
  FiShield,
  FiMail,
  FiLock,
  FiEye,
  FiHome,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";

const roles = [
  { key: "patient", label: "Parent", icon: FiUser },
  { key: "therapist", label: "Therapist", icon: FiUsers },
  { key: "admin", label: "Admin", icon: FiShield },
  { key: "superadmin", label: "Super Admin", icon: FaCrown },
] as const;

type Role = typeof roles[number]["key"];

const roleTokenMap: Record<Role, string> = {
  patient: "patient-token",
  therapist: "therapist-token",
  admin: "admin-token",
  superadmin: "super-admin-token",
};

const roleHomeMap: Record<Role, string> = {
  patient: "/parent",
  therapist: "/therapist",
  admin: "/admin",
  superadmin: "/super-admin",
};

const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;

export default function AuthPage() {
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Superadmin states
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Superadmin extra states for forgot password and OTP for superadmin
  const [superStep, setSuperStep] = useState<"login" | "forgot" | "verify">("login");

  const [superOtp, setSuperOtp] = useState("");
  const [superLoading, setSuperLoading] = useState(false);

  const isSuperAdmin = role === "superadmin";

  // Standard roles: Parent, Therapist, Admin
  async function handleSendOtp() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setStatus("OTP sent! Please check your email.");
      } else {
        setOtpSent(false);
        setStatus(data?.message || "Failed to send OTP");
      }
    } catch (err) {
      setStatus("An error occurred.");
      setOtpSent(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role, otp }),
      });
      const data = await res.json();
      localStorage.setItem("isLogInViaSuperAdmin", "false");
      if (res.ok && data.token) {
        localStorage.setItem(roleTokenMap[role], data.token);
        setStatus("Login successful!");
        setTimeout(() => {
          window.location.href = roleHomeMap[role];
        }, 800);
      } else {
        setStatus(data?.message || "OTP verification failed");
      }
    } catch (err) {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // --- SUPERADMIN APIs ---

  // API1: Login with email+password for SuperAdmin
  async function handleSuperAdminLogin() {
    setStatus(null);
    setSuperLoading(true);
    try {
      const res = await fetch(`${API_BASE}/super-admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(roleTokenMap["superadmin"], data.token);
        setStatus("Superadmin login successful!");
        setTimeout(() => {
          window.location.href = roleHomeMap["superadmin"];
        }, 800);
      } else {
        setStatus(data?.message || "Invalid login credentials");
      }
    } catch (err) {
      setStatus("An error occurred during superadmin login.");
    } finally {
      setSuperLoading(false);
    }
  }

  // API2: Superadmin - Forgot password (send OTP to email)
  async function handleSuperAdminSendOtp() {
    setStatus(null);
    setSuperLoading(true);
    try {
      const res = await fetch(`${API_BASE}/super-admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("OTP sent! Please check your superadmin email.");

        setSuperStep("verify");
      } else {

        setStatus(data?.message || "Failed to send OTP");
      }
    } catch (err) {
      setStatus("An error occurred.");

    } finally {
      setSuperLoading(false);
    }
  }

  // API3: Superadmin - verify OTP, reset password (optional, just verify for now)
  async function handleSuperAdminVerifyOtp() {
    setStatus(null);
    setSuperLoading(true);
    try {
      const res = await fetch(`${API_BASE}/super-admin/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: superOtp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(roleTokenMap["superadmin"], data.token);
        setStatus("Superadmin OTP verified & login successful!");
        setTimeout(() => {
          window.location.href = roleHomeMap["superadmin"];
        }, 800);
      } else {
        setStatus(data?.message || "OTP verification failed");
      }
    } catch (err) {
      setStatus("An error occurred while verifying the OTP.");
    } finally {
      setSuperLoading(false);
    }
  }

  // Superadmin: handle "forgot password" / "back to login"
  function handleSuperAdminEnterForgot() {
    setSuperStep("forgot");
    setStatus(null);
    setSuperOtp("");
    setPassword("");

  }
  function handleSuperAdminBackToLogin() {
    setSuperStep("login");
    setStatus(null);
    setSuperOtp("");
    setPassword("");

  }

  // Handler for back to home button
  function handleBackToHome() {
    window.location.href = "/";
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-700 ${
        isSuperAdmin
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
          : "bg-gradient-to-br from-yellow-400 via-pink-500 to-indigo-500"
      }`}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`w-full max-w-md rounded-2xl p-8 shadow-2xl transition-colors duration-500 ${
          isSuperAdmin
            ? "bg-slate-900 text-slate-100 border border-slate-700"
            : "bg-white"
        }`}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="text-center mb-6"
        >
          <h1
            className={`text-2xl font-bold ${
              isSuperAdmin ? "text-amber-400" : "text-blue-600"
            }`}
          >
            {isSuperAdmin ? "System Control" : "Welcome to Nupal CDC"}
          </h1>
          <p
            className={`text-sm ${isSuperAdmin ? "text-slate-400" : "text-slate-500"}`}
          >
            {isSuperAdmin
              ? "Restricted Access Area"
              : "Login or Sign Up"}
          </p>
        </motion.div>

        {/* Back to Home Button */}
        <button
          type="button"
          onClick={handleBackToHome}
          className={`flex items-center space-x-1 text-xs text-blue-600 hover:underline mb-3 bg-transparent border-0 p-0 shadow-none ${
            isSuperAdmin ? "text-amber-300 hover:text-amber-400" : "text-blue-600 hover:text-blue-800"
          }`}
          style={{ fontWeight: 500 }}
        >
          <FiHome className="text-base" />
          <span>Back to Home</span>
        </button>

        {/* Role Switch with smooth transitions */}
        <motion.div
          layout
          className={`grid grid-cols-4 rounded-xl p-1 mb-6 transition-colors duration-500 ${
            isSuperAdmin ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          {roles.map((r) => {
            const Icon = r.icon;
            const active = role === r.key;
            return (
              <motion.button
                layout
                key={r.key}
                onClick={() => {
                  setRole(r.key);
                  setOtpSent(false);
                  setStatus(null);
                  setSuperStep("login");
                  setSuperOtp("");
                  setPassword("");

                }}
                initial="initial"
                animate={active ? "selected" : "notSelected"}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs transition-all duration-300 ${
                  active
                    ? isSuperAdmin
                      ? "bg-amber-500 text-slate-900"
                      : "bg-white text-blue-600 shadow"
                    : isSuperAdmin
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
                whileTap={{ scale: 0.98 }}
                type="button"
              >
                <Icon className="text-base" />
                {r.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Animated form switching */}
        <AnimatePresence mode="wait" initial={false}>
          {!isSuperAdmin ? (
            <motion.div
              key="user-login"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, type: "spring", damping: 18 }}
              className="space-y-4"
            >
              {/* Show status/error message */}
              {status && (
                <motion.div
                  className={`block text-sm px-2 py-1 mb-1 rounded ${
                    status.includes("successful") || status.includes("sent")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {status}
                </motion.div>
              )}
              {!otpSent ? (
                <>
                  <motion.label
                    className="text-sm font-medium text-slate-600"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04, duration: 0.35 }}
                  >
                    Email Address
                  </motion.label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <motion.input
                      type="email"
                      value={email}
                      autoComplete="username"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.07, duration: 0.38 }}
                      disabled={loading}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 transition"
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || !email.trim()}
                  >
                    {loading ? "Sending..." : "Send OTP →"}
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.label
                    className="text-sm font-medium text-slate-600"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04, duration: 0.35 }}
                  >
                    OTP
                  </motion.label>
                  <div className="relative mb-2">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <motion.input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05, duration: 0.28 }}
                      disabled={loading}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 transition"
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || !otp.trim()}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    className="w-full text-xs text-blue-700 mt-2 hover:underline"
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setOtpSent(false);
                      setStatus(null);
                    }}
                    disabled={loading}
                  >
                    ← Back to Email
                  </motion.button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="superadmin"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, type: "spring", damping: 18 }}
              className="space-y-4"
            >
              {/* Show status/error message */}
              {status && (
                <motion.div
                  className={`block text-sm px-2 py-1 mb-1 rounded ${
                    status.includes("successful") || status.includes("sent")
                      ? "bg-green-200 text-green-900"
                      : "bg-red-200 text-red-900"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {status}
                </motion.div>
              )}
              <motion.div
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08, duration: 0.34 }}
              >
                Authorized Personnel Only. Unauthorized access will be logged.
              </motion.div>
              {superStep === "login" && (
                <>
                  <motion.label
                    className="text-sm font-medium text-slate-300"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.11, duration: 0.3 }}
                  >
                    Administrator Email
                  </motion.label>
                  <motion.input
                    type="email"
                    value={email}
                    autoComplete="username"
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Superadmin email"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-300 transition-all"
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.14, duration: 0.3 }}
                  />

                  <motion.label
                    className="text-sm font-medium text-slate-300"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    Secure Password
                  </motion.label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <motion.input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-10 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      initial={{ opacity: 0, x: 25 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.18, duration: 0.35 }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      whileTap={{ scale: 0.8, rotate: 15 }}
                      whileHover={{ scale: 1.15 }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <FiEye />
                    </motion.button>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 font-medium text-slate-900 hover:opacity-90 transition"
                    transition={{ duration: 0.18 }}
                    type="button"
                    onClick={handleSuperAdminLogin}
                    disabled={superLoading || !email.trim() || !password}
                  >
                    {superLoading ? "Authenticating..." : "Authenticate System Access"}
                  </motion.button>
                  <motion.button
                    className="w-full text-xs text-amber-300 mt-2 hover:underline"
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSuperAdminEnterForgot}
                    disabled={superLoading}
                  >
                    Forgot password?
                  </motion.button>
                </>
              )}
              {superStep === "forgot" && (
                <>
                  <motion.label
                    className="text-sm font-medium text-slate-300"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.11, duration: 0.3 }}
                  >
                    Enter Superadmin Email for OTP
                  </motion.label>
                  <motion.input
                    type="email"
                    value={email}
                    autoComplete="username"
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Superadmin email"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-300 transition-all"
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.14, duration: 0.3 }}
                    disabled={superLoading}
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-lg bg-amber-600 py-2.5 font-medium text-slate-900 hover:opacity-90 transition"
                    transition={{ duration: 0.18 }}
                    type="button"
                    onClick={handleSuperAdminSendOtp}
                    disabled={superLoading || !email.trim()}
                  >
                    {superLoading ? "Sending OTP..." : "Send OTP"}
                  </motion.button>
                  <motion.button
                    className="w-full text-xs text-amber-300 mt-2 hover:underline"
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSuperAdminBackToLogin}
                    disabled={superLoading}
                  >
                    ← Back to Login
                  </motion.button>
                </>
              )}
              {superStep === "verify" && (
                <>
                  <motion.label
                    className="text-sm font-medium text-slate-300"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.13, duration: 0.3 }}
                  >
                    Enter OTP sent to your email
                  </motion.label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <motion.input
                      type="text"
                      value={superOtp}
                      onChange={e => setSuperOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.14, duration: 0.38 }}
                      disabled={superLoading}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 font-medium text-slate-900 hover:opacity-90 transition"
                    transition={{ duration: 0.18 }}
                    type="button"
                    onClick={handleSuperAdminVerifyOtp}
                    disabled={superLoading || !superOtp.trim()}
                  >
                    {superLoading ? "Verifying OTP..." : "Verify & Login"}
                  </motion.button>
                  <motion.button
                    className="w-full text-xs text-amber-300 mt-2 hover:underline"
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSuperAdminBackToLogin}
                    disabled={superLoading}
                  >
                    ← Back to Login
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Footer */}
        {isSuperAdmin && (
          <motion.p
            className="mt-6 text-center text-xs text-slate-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            SECURE CONNECTION v2.4
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
