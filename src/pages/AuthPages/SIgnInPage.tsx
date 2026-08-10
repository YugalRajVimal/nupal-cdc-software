import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiUsers,
  FiShield,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiHome,
  FiPhone,
  FiKey,
  FiMessageSquare,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";

// Support ?role= in search params
function getInitialRole(): Role {
  if (typeof window === "undefined") return "patient";
  const url = new URL(window.location.href);
  const param = url.searchParams.get("role")?.toLowerCase();
  if (param === "admin") return "admin";
  if (param === "therapist") return "therapist";
  if (param === "superadmin") return "superadmin";
  return "patient";
}

const roles = [
  { key: "patient", label: "Parent", icon: FiUser },
  { key: "therapist", label: "Therapist", icon: FiUsers },
  { key: "admin", label: "Admin", icon: FiShield },
  { key: "superadmin", label: "Super Admin", icon: FaCrown },
] as const;

type Role = typeof roles[number]["key"];
type LoginMethod = "otp" | "password";
type StandardStep = "login" | "forgot" | "verify";
type SuperStep = "login" | "forgot" | "verify";

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

function validateInput(input: string): "email" | "phone" | null {
  if (/^\+?[1-9]\d{7,14}$/.test(input.replace(/\s/g, ""))) return "phone";
  if (input.includes("@") && /\S+@\S+\.\S+/.test(input)) return "email";
  return null;
}

// ─── Status Banner ───────────────────────────────────────────────────────────
function StatusBanner({
  status,
  dark,
}: {
  status: string | null;
  dark?: boolean;
}) {
  if (!status) return null;
  const isSuccess =
    status.toLowerCase().includes("success") ||
    status.toLowerCase().includes("sent");
  return (
    <motion.div
      className={`text-sm px-3 py-2 rounded-lg ${
        isSuccess
          ? dark
            ? "bg-green-900/40 text-green-300 border border-green-700"
            : "bg-green-100 text-green-800"
          : dark
          ? "bg-red-900/40 text-red-300 border border-red-700"
          : "bg-red-100 text-red-700"
      }`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {status}
    </motion.div>
  );
}

// ─── Login Method Toggle ──────────────────────────────────────────────────────
function LoginMethodToggle({
  method,
  onChange,
  dark,
}: {
  method: LoginMethod;
  onChange: (m: LoginMethod) => void;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex rounded-lg p-0.5 text-xs font-medium mb-1 ${
        dark ? "bg-slate-800 border border-slate-700" : "bg-slate-100"
      }`}
    >
      {(["otp", "password"] as LoginMethod[]).map((m) => {
        const active = method === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all duration-200 ${
              active
                ? dark
                  ? "bg-amber-500 text-slate-900 shadow"
                  : "bg-white text-blue-600 shadow"
                : dark
                ? "text-slate-400 hover:text-slate-300"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {m === "otp" ? (
              <FiMessageSquare className="text-sm" />
            ) : (
              <FiKey className="text-sm" />
            )}
            {m === "otp" ? "OTP Login" : "Password Login"}
          </button>
        );
      })}
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────
function inputClass(dark?: boolean) {
  return dark
    ? "w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
    : "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
}

function labelClass(dark?: boolean) {
  return `block text-xs font-semibold mb-1 tracking-wide ${
    dark ? "text-slate-400" : "text-slate-500"
  }`;
}

// ─── Password Input ────────────────────────────────────────────────────────────
function PasswordInput({
  value,
  onChange,
  dark,
  disabled,
  placeholder = "Enter your password",
  autoComplete = "current-password",
}: {
  value: string;
  onChange: (v: string) => void;
  dark?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <FiLock
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
          dark ? "text-slate-500" : "text-slate-400"
        }`}
      />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`${inputClass(dark)} pl-10 pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className={`absolute right-3 top-1/2 -translate-y-1/2 ${
          dark
            ? "text-slate-500 hover:text-amber-400"
            : "text-slate-400 hover:text-blue-500"
        } transition-colors`}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}

// ─── Standard Role Form (Parent / Therapist / Admin) ─────────────────────────
function StandardRoleForm({
  role,
  dark,
}: {
  role: Role;
  dark?: boolean;
}) {
  // Implements default to password login and gives "Forgot password" flow akin to Super Admin
  const [method, setMethod] = useState<LoginMethod>("password");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [step, setStep] = useState<StandardStep>("login");
  const [forgotOtp, setForgotOtp] = useState("");

  // Reset all state on role change
  useEffect(() => {
    setMethod("password");
    setEmailOrPhone("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
    setStatus(null);
    setStep("login");
    setForgotOtp("");
  }, [role]);

  // ── Password login ─────────────────────────────────────────────────────────
  async function handlePasswordLogin() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Please enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
    // Payload always includes role, and only email or phone filled
    const payload: Record<string, string> = { role, password };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        setStatus(data?.message || "Invalid credentials");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password: send OTP ─────────────────────────────────────────────
  async function handleForgotSendOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Please enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = { role };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");
    try {
      const res = await fetch(`${API_BASE}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("verify");
        setStatus("OTP sent! Please check your email or WhatsApp.");
      } else {
        setStatus(data?.message || "Failed to send OTP");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password: verify OTP ────────────────────────────────────────────
  async function handleForgotVerifyOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Invalid input.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = { otp: forgotOtp, role };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");
    try {
      const res = await fetch(`${API_BASE}/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      localStorage.setItem("isLogInViaSuperAdmin", "false");
      if (res.ok && data.token) {
        localStorage.setItem(roleTokenMap[role], data.token);
        setStatus("Verified & logged in successfully!");
        setTimeout(() => {
          window.location.href = roleHomeMap[role];
        }, 800);
      } else {
        setStatus(data?.message || "OTP verification failed");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // For completeness, preserve otp login for any future use, but don't show in UI initially
  async function handleSendOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Please enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = { role };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");

    try {
      const res = await fetch(`${API_BASE}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setStatus(
          inputType === "email"
            ? "OTP sent! Please check your email."
            : "OTP sent! Please check your WhatsApp."
        );
      } else {
        setStatus(data?.message || "Failed to send OTP");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Invalid input.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = { role, otp };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");

    try {
      const res = await fetch(`${API_BASE}/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const primaryBtn = dark
    ? "w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 font-semibold text-slate-900 hover:opacity-90 transition disabled:opacity-50"
    : "w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50";
  const ghostBtn = dark
    ? "w-full text-xs text-amber-300 hover:underline mt-1 disabled:opacity-50"
    : "w-full text-xs text-blue-600 hover:underline mt-1 disabled:opacity-50";

  // ── Signup button logic ──────────────────────────────────────────────────
  function showSignupButton() {
    // Only show for patient/parent and therapist
    return role === "patient" || role === "therapist";
  }

  function getSignupButton() {
    if (role === "patient") {
      return (
        <button
          type="button"
          className="w-full  rounded-lg bg-transparent border-2 border-blue-400 text-blue-600 hover:bg-blue-50 py-2 mt-1 font-semibold text-sm transition"
          onClick={() => { window.location.href = "/parent/signup"; }}
        >
          Sign up as Parent
        </button>
      );
    }
    if (role === "therapist") {
      return (
        <button
          type="button"
          className="w-full  rounded-lg bg-transparent border-2 border-blue-400 text-blue-600 hover:bg-blue-50 py-2 mt-1 font-semibold text-sm transition"
          onClick={() => { window.location.href = "/therapist/signup"; }}
        >
          Sign up as Therapist
        </button>
      );
    }
    return null;
  }

  return (
    <div className="space-y-3">
      <StatusBanner status={status} dark={dark} />

      {/* Email / Phone field — always visible */}
      <div>
        <label className={labelClass(dark)}>Email Address or Phone Number</label>
        <div className="relative">
          <FiMail
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              dark ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <FiPhone
            className={`absolute right-3 top-1/2 -translate-y-1/2 rotate-12 ${
              dark ? "text-slate-600" : "text-slate-300"
            }`}
          />
          <input
            type="text"
            value={emailOrPhone}
            autoComplete="username"
            onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder="email@example.com or +91..."
            disabled={loading || (method === "otp" && otpSent)}
            className={`${inputClass(dark)} pl-10 pr-10`}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Password login (default), with forgot password button */}
        {method === "password" && step === "login" && (
          <motion.div
            key="pw-flow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <label className={labelClass(dark)}>Password</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                dark={dark}
                disabled={loading}
              />
            </div>
            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={loading || !emailOrPhone.trim() || !password}
              className={primaryBtn}
            >
              {loading ? "Logging in…" : "Login →"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("forgot");
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              Forgot password?
            </button>

            
            {/* Signup button for Parent and Therapist */}
            {showSignupButton() && getSignupButton()}
          </motion.div>
        )}
        {/* Forgot password: send reset OTP */}
        {method === "password" && step === "forgot" && (
          <motion.div
            key="pw-forgot"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <button
              type="button"
              onClick={handleForgotSendOtp}
              disabled={loading || !emailOrPhone.trim()}
              className={primaryBtn}
            >
              {loading ? "Sending OTP…" : "Send Reset OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("login");
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              ← Back to Login
            </button>
          </motion.div>
        )}
        {/* Forgot password: verify OTP */}
        {method === "password" && step === "verify" && (
          <motion.div
            key="pw-forgot-verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-400">
              OTP sent to{" "}
              <span className="font-medium" style={{ color: "#fbbf24" }}>{emailOrPhone}</span>
            </p>
            <div>
              <label className={labelClass(dark)}>
                Enter OTP to Reset & Login
              </label>
              <div className="relative">
                <FiLock
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-slate-500" : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  disabled={loading}
                  className={`${inputClass(dark)} pl-10`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleForgotVerifyOtp}
              disabled={loading || !forgotOtp.trim()}
              className={primaryBtn}
            >
              {loading ? "Verifying…" : "Verify & Login"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("login");
                setForgotOtp("");
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              ← Back to Login
            </button>
          </motion.div>
        )}
        {/* OTP login (not default, but keep for future/if enabled) */}
        {method === "otp" && !otpSent && (
          <motion.div
            key="otp-send"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || !emailOrPhone.trim()}
              className={primaryBtn}
            >
              {loading ? "Sending OTP…" : "Send OTP →"}
            </button>
          </motion.div>
        )}
        {method === "otp" && otpSent && (
          <motion.div
            key="otp-verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <label className={labelClass(dark)}>
                OTP (received on Email or WhatsApp)
              </label>
              <div className="relative">
                <FiLock
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-slate-500" : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  disabled={loading}
                  className={`${inputClass(dark)} pl-10`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || !otp.trim()}
              className={primaryBtn}
            >
              {loading ? "Verifying…" : "Verify & Login"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtp("");
                setOtpSent(false);
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Super Admin Form ─────────────────────────────────────────────────────────
// (No changes required for Super Admin form - keep everything as is.)
function SuperAdminForm() {
  const [method, setMethod] = useState<LoginMethod>("password");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [superStep, setSuperStep] = useState<SuperStep>("login");
  const [forgotOtp, setForgotOtp] = useState("");

  function handleMethodChange(m: LoginMethod) {
    setMethod(m);
    setOtp("");
    setOtpSent(false);
    setStatus(null);
    setSuperStep("login");
    setForgotOtp("");
    setPassword("");
  }

  async function handlePasswordLogin() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
    // No role needed, use super-admin endpoint
    const payload: Record<string, string> = { password };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");

    try {
      const res = await fetch(`${API_BASE}/super-admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(roleTokenMap["superadmin"], data.token);
        setStatus("Superadmin login successful!");
        setTimeout(() => {
          window.location.href = roleHomeMap["superadmin"];
        }, 800);
      } else {
        setStatus(data?.message || "Invalid credentials");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP: send ──────────────────────────────────────────────────────────────
  async function handleSendOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = {};
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");

    try {
      const res = await fetch(`${API_BASE}/super-admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setStatus("OTP sent! Please check your email or WhatsApp.");
      } else {
        setStatus(data?.message || "Failed to send OTP");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Invalid input.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = { otp };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");

    try {
      const res = await fetch(`${API_BASE}/super-admin/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(roleTokenMap["superadmin"], data.token);
        setStatus("Login successful!");
        setTimeout(() => {
          window.location.href = roleHomeMap["superadmin"];
        }, 800);
      } else {
        setStatus(data?.message || "OTP verification failed");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSendOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = {};
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");

    try {
      const res = await fetch(`${API_BASE}/super-admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuperStep("verify");
        setStatus("OTP sent! Check your email or WhatsApp.");
      } else {
        setStatus(data?.message || "Failed to send OTP");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotVerifyOtp() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Invalid input.");
      setLoading(false);
      return;
    }
    const payload: Record<string, string> = { otp: forgotOtp };
    if (inputType === "email") payload.email = emailOrPhone.trim().toLowerCase();
    else payload.phone = emailOrPhone.replace(/\s+/g, "");

    try {
      const res = await fetch(`${API_BASE}/super-admin/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(roleTokenMap["superadmin"], data.token);
        setStatus("Verified & logged in successfully!");
        setTimeout(() => {
          window.location.href = roleHomeMap["superadmin"];
        }, 800);
      } else {
        setStatus(data?.message || "OTP verification failed");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const primaryBtn =
    "w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 font-semibold text-slate-900 hover:opacity-90 transition disabled:opacity-50";
  const ghostBtn =
    "w-full text-xs text-amber-300 hover:underline mt-1 disabled:opacity-50";

  return (
    <div className="space-y-3">
      <motion.div
        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        Authorized Personnel Only. Unauthorized access will be logged.
      </motion.div>

      <StatusBanner status={status} dark />

      {/* Method toggle — always visible */}
      <LoginMethodToggle method={method} onChange={handleMethodChange} dark />

      {/* Email / Phone — always visible (unless in forgot sub-flow) */}
      {superStep !== "verify" && (
        <div>
          <label className={labelClass(true)}>Administrator Email or Phone</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={emailOrPhone}
              autoComplete="username"
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="superadmin@example.com or +91…"
              disabled={loading || (method === "otp" && otpSent)}
              className={`${inputClass(true)} pl-10`}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Password method ─────────────────────────────────────────────── */}
        {method === "password" && superStep === "login" && (
          <motion.div
            key="sa-pw"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <label className={labelClass(true)}>Secure Password</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                dark
                disabled={loading}
              />
            </div>
            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={loading || !emailOrPhone.trim() || !password}
              className={primaryBtn}
            >
              {loading ? "Authenticating…" : "Authenticate System Access"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuperStep("forgot");
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              Forgot password?
            </button>
          </motion.div>
        )}

        {/* ── OTP method: send ─────────────────────────────────────────────── */}
        {method === "otp" && !otpSent && (
          <motion.div
            key="sa-otp-send"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || !emailOrPhone.trim()}
              className={primaryBtn}
            >
              {loading ? "Sending OTP…" : "Send OTP →"}
            </button>
          </motion.div>
        )}

        {/* ── OTP method: verify ───────────────────────────────────────────── */}
        {method === "otp" && otpSent && (
          <motion.div
            key="sa-otp-verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <label className={labelClass(true)}>
                OTP (received on Email or WhatsApp)
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  disabled={loading}
                  className={`${inputClass(true)} pl-10`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || !otp.trim()}
              className={primaryBtn}
            >
              {loading ? "Verifying…" : "Verify & Login"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtp("");
                setOtpSent(false);
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              ← Back
            </button>
          </motion.div>
        )}

        {/* ── Forgot: enter email ──────────────────────────────────────────── */}
        {superStep === "forgot" && (
          <motion.div
            key="sa-forgot"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <button
              type="button"
              onClick={handleForgotSendOtp}
              disabled={loading || !emailOrPhone.trim()}
              className={primaryBtn}
            >
              {loading ? "Sending OTP…" : "Send Reset OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuperStep("login");
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              ← Back to Login
            </button>
          </motion.div>
        )}

        {/* ── Forgot: verify OTP ───────────────────────────────────────────── */}
        {superStep === "verify" && (
          <motion.div
            key="sa-forgot-verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-400">
              OTP sent to{" "}
              <span className="text-amber-300 font-medium">{emailOrPhone}</span>
            </p>
            <div>
              <label className={labelClass(true)}>
                Enter OTP to Reset & Login
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  disabled={loading}
                  className={`${inputClass(true)} pl-10`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleForgotVerifyOtp}
              disabled={loading || !forgotOtp.trim()}
              className={primaryBtn}
            >
              {loading ? "Verifying…" : "Verify & Login"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuperStep("login");
                setForgotOtp("");
                setStatus(null);
              }}
              disabled={loading}
              className={ghostBtn}
            >
              ← Back to Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [role, setRole] = useState<Role>(getInitialRole());

  const isSuperAdmin = role === "superadmin";

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Remove all role tokens from localStorage whenever this page is hit
    try {
      localStorage.removeItem("therapist-token");
      localStorage.removeItem("patient-token");
      localStorage.removeItem("admin-token");
      localStorage.removeItem("super-admin-token");
      localStorage.removeItem("userData");
      localStorage.removeItem("userRole");
    } catch {}
    const onPopState = () => setRole(getInitialRole());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function switchRole(r: Role) {
    setRole(r);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("role", r);
      window.history.replaceState({}, "", url.toString());
    }
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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, type: "spring", damping: 18 }}
        className={`w-full max-w-md rounded-2xl p-8 shadow-2xl transition-colors duration-500 ${
          isSuperAdmin
            ? "bg-slate-900 text-slate-100 border border-slate-700"
            : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <h1
            className={`text-2xl font-bold ${
              isSuperAdmin ? "text-amber-400" : "text-blue-600"
            }`}
          >
            {isSuperAdmin ? "System Control" : "Welcome to Nupal CDC"}
          </h1>
          <p
            className={`text-sm mt-0.5 ${
              isSuperAdmin ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {isSuperAdmin ? "Restricted Access Area" : "Login to your account"}
          </p>
        </div>

        {/* Back to Home */}
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className={`flex items-center gap-1.5 text-xs font-medium mb-4 ${
            isSuperAdmin
              ? "text-amber-300 hover:text-amber-200"
              : "text-blue-600 hover:text-blue-800"
          }`}
        >
          <FiHome />
          Back to Home
        </button>

        {/* Role Tabs */}
        <div
          className={`grid grid-cols-4 rounded-xl p-1 mb-5 transition-colors duration-500 ${
            isSuperAdmin ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          {roles.map((r) => {
            const Icon = r.icon;
            const active = role === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => switchRole(r.key)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs transition-all duration-200 ${
                  active
                    ? isSuperAdmin
                      ? "bg-amber-500 text-slate-900"
                      : "bg-white text-blue-600 shadow"
                    : isSuperAdmin
                    ? "text-slate-400 hover:text-slate-300"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="text-base" />
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, type: "spring", damping: 20 }}
          >
            {isSuperAdmin ? (
              <SuperAdminForm />
            ) : (
              <StandardRoleForm role={role} dark={false} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        {isSuperAdmin && (
          <p className="mt-6 text-center text-xs text-slate-600">
            SECURE CONNECTION v2.4
          </p>
        )}
      </motion.div>
    </div>
  );
}