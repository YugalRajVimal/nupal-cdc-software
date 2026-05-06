// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiUser,
//   FiUsers,
//   FiShield,
//   FiMail,
//   FiLock,
//   FiEye,
//   FiHome,
//   FiPhone,
// } from "react-icons/fi";
// import { FaCrown } from "react-icons/fa";

// // Support ?role= in search params
// function getInitialRole(): Role {
//   if (typeof window === "undefined") return "patient";
//   const url = new URL(window.location.href);
//   const param = url.searchParams.get("role")?.toLowerCase();
//   if (param === "admin") return "admin";
//   if (param === "therapist") return "therapist";
//   if (param === "superadmin") return "superadmin";
//   // Fallback/default to "patient"
//   return "patient";
// }

// const roles = [
//   { key: "patient", label: "Parent", icon: FiUser },
//   { key: "therapist", label: "Therapist", icon: FiUsers },
//   { key: "admin", label: "Admin", icon: FiShield },
//   { key: "superadmin", label: "Super Admin", icon: FaCrown },
// ] as const;

// type Role = typeof roles[number]["key"];

// const roleTokenMap: Record<Role, string> = {
//   patient: "patient-token",
//   therapist: "therapist-token",
//   admin: "admin-token",
//   superadmin: "super-admin-token",
// };

// const roleHomeMap: Record<Role, string> = {
//   patient: "/parent",
//   therapist: "/therapist",
//   admin: "/admin",
//   superadmin: "/super-admin",
// };

// const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;

// function validateInput(input: string): "email" | "phone" | null {
//   // Very simple patterns
//   if (/^\+?[1-9]\d{7,14}$/.test(input.replace(/\s/g, ""))) return "phone"; // basic E.164 or local
//   if (input.includes("@") && /\S+@\S+\.\S+/.test(input)) return "email";
//   return null;
// }

// export default function AuthPage() {
//   // Choose role by param if present, default to "patient"
//   const [role, setRole] = useState<Role>(getInitialRole());
//   const [emailOrPhone, setEmailOrPhone] = useState("");
//   const [otp, setOtp] = useState("");
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState<string | null>(null);

//   // Superadmin states
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   // Superadmin extra states for forgot password and OTP for superadmin
//   const [superStep, setSuperStep] = useState<"login" | "forgot" | "verify">("login");

//   const [superOtp, setSuperOtp] = useState("");
//   const [superLoading, setSuperLoading] = useState(false);

//   const isSuperAdmin = role === "superadmin";

//   // Keep role in sync with search param if user manually changes the URL
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const onPopState = () => {
//       setRole(getInitialRole());
//       setOtpSent(false);
//       setStatus(null);
//       setSuperStep("login");
//       setSuperOtp("");
//       setPassword("");
//     };
//     window.addEventListener("popstate", onPopState);
//     return () => window.removeEventListener("popstate", onPopState);
//     // eslint-disable-next-line
//   }, []);

//   // Standard roles: Parent, Therapist, Admin
//   async function handleSendOtp() {
//     setStatus(null);
//     setLoading(true);

//     const inputType = validateInput(emailOrPhone.trim());
//     let sendPayload: { email?: string; phone?: string; role: Role } = { role };

//     if (inputType === "email") {
//       sendPayload.email = emailOrPhone.trim().toLowerCase();
//     } else if (inputType === "phone") {
//       sendPayload.phone = emailOrPhone.replace(/\s+/g, "");
//     } else {
//       setStatus("Please enter a valid email address or phone number.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch(`${API_BASE}/signin`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(sendPayload),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setOtpSent(true);
//         setStatus(
//           sendPayload.email
//             ? "OTP sent! Please check your email."
//             : "OTP sent! Please check your WhatsApp."
//         );
//       } else {
//         setOtpSent(false);
//         setStatus(data?.message || "Failed to send OTP");
//       }
//     } catch (err) {
//       setStatus("An error occurred.");
//       setOtpSent(false);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleVerifyOtp() {
//     setStatus(null);
//     setLoading(true);
//     const inputType = validateInput(emailOrPhone.trim());
//     let verifyPayload: { email?: string; phone?: string; role: Role; otp: string } = {
//       role,
//       otp,
//     };

//     if (inputType === "email") {
//       verifyPayload.email = emailOrPhone.trim().toLowerCase();
//     } else if (inputType === "phone") {
//       verifyPayload.phone = emailOrPhone.replace(/\s+/g, "");
//     } else {
//       setStatus("Invalid input.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch(`${API_BASE}/verify-account`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(verifyPayload),
//       });
//       const data = await res.json();
//       localStorage.setItem("isLogInViaSuperAdmin", "false");
//       if (res.ok && data.token) {
//         localStorage.setItem(roleTokenMap[role], data.token);
//         setStatus("Login successful!");
//         setTimeout(() => {
//           window.location.href = roleHomeMap[role];
//         }, 800);
//       } else {
//         setStatus(data?.message || "OTP verification failed");
//       }
//     } catch (err) {
//       setStatus("An error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   // --- SUPERADMIN APIs ---

//   // API1: Login with email/phone + password for SuperAdmin
//   async function handleSuperAdminLogin() {
//     setStatus(null);
//     setSuperLoading(true);
//     try {
//       const inputType = validateInput(emailOrPhone.trim());
//       let payload: any = { password };
//       if (inputType === "email") {
//         payload.email = emailOrPhone.trim().toLowerCase();
//       } else if (inputType === "phone") {
//         payload.phone = emailOrPhone.replace(/\s+/g, "");
//       } else {
//         setStatus("Enter a valid email address or phone number.");
//         setSuperLoading(false);
//         return;
//       }

//       const res = await fetch(`${API_BASE}/super-admin/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (res.ok && data.token) {
//         localStorage.setItem(roleTokenMap["superadmin"], data.token);
//         setStatus("Superadmin login successful!");
//         setTimeout(() => {
//           window.location.href = roleHomeMap["superadmin"];
//         }, 800);
//       } else {
//         setStatus(data?.message || "Invalid login credentials");
//       }
//     } catch (err) {
//       setStatus("An error occurred during superadmin login.");
//     } finally {
//       setSuperLoading(false);
//     }
//   }

//   // API2: Superadmin - Forgot password (send OTP to email or phone)
//   async function handleSuperAdminSendOtp() {
//     setStatus(null);
//     setSuperLoading(true);
//     try {
//       const inputType = validateInput(emailOrPhone.trim());
//       let payload: any = {};
//       if (inputType === "email") {
//         payload.email = emailOrPhone.trim().toLowerCase();
//       } else if (inputType === "phone") {
//         payload.phone = emailOrPhone.replace(/\s+/g, "");
//       } else {
//         setStatus("Enter a valid email address or phone number.");
//         setSuperLoading(false);
//         return;
//       }

//       const res = await fetch(`${API_BASE}/super-admin/forgot-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setStatus(
//           inputType === "email"
//             ? "OTP sent! Please check your superadmin email."
//             : "OTP sent! Please check your registered WhatsApp."
//         );
//         setSuperStep("verify");
//       } else {
//         setStatus(data?.message || "Failed to send OTP");
//       }
//     } catch (err) {
//       setStatus("An error occurred.");
//     } finally {
//       setSuperLoading(false);
//     }
//   }

//   // API3: Superadmin - verify OTP, reset password (optional, just verify for now)
//   async function handleSuperAdminVerifyOtp() {
//     setStatus(null);
//     setSuperLoading(true);
//     try {
//       const inputType = validateInput(emailOrPhone.trim());
//       let payload: any = { otp: superOtp };
//       if (inputType === "email") {
//         payload.email = emailOrPhone.trim().toLowerCase();
//       } else if (inputType === "phone") {
//         payload.phone = emailOrPhone.replace(/\s+/g, "");
//       } else {
//         setStatus("Enter a valid email address or phone number.");
//         setSuperLoading(false);
//         return;
//       }

//       const res = await fetch(`${API_BASE}/super-admin/verify-account`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (res.ok && data.token) {
//         localStorage.setItem(roleTokenMap["superadmin"], data.token);
//         setStatus("Superadmin OTP verified & login successful!");
//         setTimeout(() => {
//           window.location.href = roleHomeMap["superadmin"];
//         }, 800);
//       } else {
//         setStatus(data?.message || "OTP verification failed");
//       }
//     } catch (err) {
//       setStatus("An error occurred while verifying the OTP.");
//     } finally {
//       setSuperLoading(false);
//     }
//   }

//   // Superadmin: handle "forgot password" / "back to login"
//   function handleSuperAdminEnterForgot() {
//     setSuperStep("forgot");
//     setStatus(null);
//     setSuperOtp("");
//     setPassword("");
//   }
//   function handleSuperAdminBackToLogin() {
//     setSuperStep("login");
//     setStatus(null);
//     setSuperOtp("");
//     setPassword("");
//   }

//   // Handler for back to home button
//   function handleBackToHome() {
//     window.location.href = "/";
//   }

//   // Helper for superadmin username label
//   function superAdminUsernameLabel() {
//     return "Administrator Email or Phone Number";
//   }

//   // Helper for superadmin username placeholder
//   function superAdminUsernamePlaceholder() {
//     return "Superadmin email or phone (+91...)";
//   }

//   // Helper for forgot password username label
//   function superAdminForgotLabel() {
//     return "Enter Superadmin Email or Phone for OTP";
//   }

//   return (
//     <div
//       className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-700 ${
//         isSuperAdmin
//           ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
//           : "bg-gradient-to-br from-yellow-400 via-pink-500 to-indigo-500"
//       }`}
//     >
//       <motion.div
//         initial="hidden"
//         animate="visible"
//         exit="exit"
//         className={`w-full max-w-md rounded-2xl p-8 shadow-2xl transition-colors duration-500 ${
//           isSuperAdmin
//             ? "bg-slate-900 text-slate-100 border border-slate-700"
//             : "bg-white"
//         }`}
//       >
//         {/* Header */}
//         <motion.div
//           initial={{ opacity: 0, y: -25 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
//           className="text-center mb-6"
//         >
//           <h1
//             className={`text-2xl font-bold ${
//               isSuperAdmin ? "text-amber-400" : "text-blue-600"
//             }`}
//           >
//             {isSuperAdmin ? "System Control" : "Welcome to Nupal CDC"}
//           </h1>
//           <p
//             className={`text-sm ${isSuperAdmin ? "text-slate-400" : "text-slate-500"}`}
//           >
//             {isSuperAdmin
//               ? "Restricted Access Area"
//               : "Login or Sign Up"}
//           </p>
//         </motion.div>

//         {/* Back to Home Button */}
//         <button
//           type="button"
//           onClick={handleBackToHome}
//           className={`flex items-center space-x-1 text-xs text-blue-600 hover:underline mb-3 bg-transparent border-0 p-0 shadow-none ${
//             isSuperAdmin ? "text-amber-300 hover:text-amber-400" : "text-blue-600 hover:text-blue-800"
//           }`}
//           style={{ fontWeight: 500 }}
//         >
//           <FiHome className="text-base" />
//           <span>Back to Home</span>
//         </button>

//         {/* Role Switch with smooth transitions */}
//         <motion.div
//           layout
//           className={`grid grid-cols-4 rounded-xl p-1 mb-6 transition-colors duration-500 ${
//             isSuperAdmin ? "bg-slate-800" : "bg-slate-100"
//           }`}
//         >
//           {roles.map((r) => {
//             const Icon = r.icon;
//             const active = role === r.key;
//             return (
//               <motion.button
//                 layout
//                 key={r.key}
//                 onClick={() => {
//                   setRole(r.key);
//                   setOtpSent(false);
//                   setStatus(null);
//                   setSuperStep("login");
//                   setSuperOtp("");
//                   setPassword("");
//                   // update URL param as well for deep-linkability
//                   if (typeof window !== "undefined") {
//                     const url = new URL(window.location.href);
//                     url.searchParams.set("role", r.key);
//                     window.history.replaceState({}, "", url.toString());
//                   }
//                 }}
//                 initial="initial"
//                 animate={active ? "selected" : "notSelected"}
//                 className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs transition-all duration-300 ${
//                   active
//                     ? isSuperAdmin
//                       ? "bg-amber-500 text-slate-900"
//                       : "bg-white text-blue-600 shadow"
//                     : isSuperAdmin
//                     ? "text-slate-400"
//                     : "text-slate-500"
//                 }`}
//                 whileTap={{ scale: 0.98 }}
//                 type="button"
//               >
//                 <Icon className="text-base" />
//                 {r.label}
//               </motion.button>
//             );
//           })}
//         </motion.div>

//         {/* Animated form switching */}
//         <AnimatePresence mode="wait" initial={false}>
//           {!isSuperAdmin ? (
//             <motion.div
//               key="user-login"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               transition={{ duration: 0.45, type: "spring", damping: 18 }}
//               className="space-y-4"
//             >
//               {/* Show status/error message */}
//               {status && (
//                 <motion.div
//                   className={`block text-sm px-2 py-1 mb-1 rounded ${
//                     status.includes("successful") || status.includes("sent")
//                       ? "bg-green-100 text-green-800"
//                       : "bg-red-100 text-red-700"
//                   }`}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.3 }}
//                 >
//                   {status}
//                 </motion.div>
//               )}
//               {!otpSent ? (
//                 <>
//                   <motion.label
//                     className="text-sm font-medium text-slate-600"
//                     initial={{ opacity: 0, x: -15 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.04, duration: 0.35 }}
//                   >
//                     Email Address or Phone Number
//                   </motion.label>
//                   <div className="relative">
//                     <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                     <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-12" />
//                     <motion.input
//                       type="text"
//                       value={emailOrPhone}
//                       autoComplete="username"
//                       onChange={(e) => setEmailOrPhone(e.target.value)}
//                       placeholder="Enter your email or phone (+91...)"
//                       className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//                       initial={{ opacity: 0, x: 30 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: 0.07, duration: 0.38 }}
//                       disabled={loading}
//                     />
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.03 }}
//                     whileTap={{ scale: 0.98 }}
//                     className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 transition"
//                     transition={{ duration: 0.15 }}
//                     type="button"
//                     onClick={handleSendOtp}
//                     disabled={loading || !emailOrPhone.trim()}
//                   >
//                     {loading ? "Sending..." : "Send OTP →"}
//                   </motion.button>
//                 </>
//               ) : (
//                 <>
//                   <motion.label
//                     className="text-sm font-medium text-slate-600"
//                     initial={{ opacity: 0, x: -15 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.04, duration: 0.35 }}
//                   >
//                     OTP (received on Email or WhatsApp)
//                   </motion.label>
//                   <div className="relative mb-2">
//                     <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                     <motion.input
//                       value={otp}
//                       onChange={(e) => setOtp(e.target.value)}
//                       placeholder="Enter OTP"
//                       className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//                       initial={{ opacity: 0, x: 30 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: 0.05, duration: 0.28 }}
//                       disabled={loading}
//                     />
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.03 }}
//                     whileTap={{ scale: 0.98 }}
//                     className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 transition"
//                     transition={{ duration: 0.15 }}
//                     type="button"
//                     onClick={handleVerifyOtp}
//                     disabled={loading || !otp.trim()}
//                   >
//                     {loading ? "Verifying..." : "Verify & Login"}
//                   </motion.button>
//                   <motion.button
//                     whileTap={{ scale: 0.96 }}
//                     className="w-full text-xs text-blue-700 mt-2 hover:underline"
//                     type="button"
//                     onClick={() => {
//                       setOtp("");
//                       setOtpSent(false);
//                       setStatus(null);
//                     }}
//                     disabled={loading}
//                   >
//                     ← Back to Login
//                   </motion.button>
//                 </>
//               )}
//             </motion.div>
//           ) : (
//             <motion.div
//               key="superadmin"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               transition={{ duration: 0.45, type: "spring", damping: 18 }}
//               className="space-y-4"
//             >
//               {/* Show status/error message */}
//               {status && (
//                 <motion.div
//                   className={`block text-sm px-2 py-1 mb-1 rounded ${
//                     status.includes("successful") || status.includes("sent")
//                       ? "bg-green-200 text-green-900"
//                       : "bg-red-200 text-red-900"
//                   }`}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.3 }}
//                 >
//                   {status}
//                 </motion.div>
//               )}
//               <motion.div
//                 className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300"
//                 initial={{ opacity: 0, scale: 0.95 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{ delay: 0.08, duration: 0.34 }}
//               >
//                 Authorized Personnel Only. Unauthorized access will be logged.
//               </motion.div>
//               {superStep === "login" && (
//                 <>
//                   <motion.label
//                     className="text-sm font-medium text-slate-300"
//                     initial={{ opacity: 0, x: -15 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.11, duration: 0.3 }}
//                   >
//                     {superAdminUsernameLabel()}
//                   </motion.label>
//                   <motion.input
//                     type="text"
//                     value={emailOrPhone}
//                     autoComplete="username"
//                     onChange={e => setEmailOrPhone(e.target.value)}
//                     placeholder={superAdminUsernamePlaceholder()}
//                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-300 transition-all"
//                     initial={{ opacity: 0, x: 25 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.14, duration: 0.3 }}
//                   />

//                   <motion.label
//                     className="text-sm font-medium text-slate-300"
//                     initial={{ opacity: 0, x: -15 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.15, duration: 0.3 }}
//                   >
//                     Secure Password
//                   </motion.label>
//                   <div className="relative">
//                     <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                     <motion.input
//                       type={showPassword ? "text" : "password"}
//                       value={password}
//                       autoComplete="current-password"
//                       onChange={(e) => setPassword(e.target.value)}
//                       className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-10 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
//                       initial={{ opacity: 0, x: 25 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: 0.18, duration: 0.35 }}
//                     />
//                     <motion.button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
//                       whileTap={{ scale: 0.8, rotate: 15 }}
//                       whileHover={{ scale: 1.15 }}
//                       aria-label={showPassword ? "Hide password" : "Show password"}
//                     >
//                       <FiEye />
//                     </motion.button>
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.03 }}
//                     whileTap={{ scale: 0.97 }}
//                     className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 font-medium text-slate-900 hover:opacity-90 transition"
//                     transition={{ duration: 0.18 }}
//                     type="button"
//                     onClick={handleSuperAdminLogin}
//                     disabled={superLoading || !emailOrPhone.trim() || !password}
//                   >
//                     {superLoading ? "Authenticating..." : "Authenticate System Access"}
//                   </motion.button>
//                   <motion.button
//                     className="w-full text-xs text-amber-300 mt-2 hover:underline"
//                     type="button"
//                     whileTap={{ scale: 0.96 }}
//                     onClick={handleSuperAdminEnterForgot}
//                     disabled={superLoading}
//                   >
//                     Forgot password?
//                   </motion.button>
//                 </>
//               )}
//               {superStep === "forgot" && (
//                 <>
//                   <motion.label
//                     className="text-sm font-medium text-slate-300"
//                     initial={{ opacity: 0, x: -15 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.11, duration: 0.3 }}
//                   >
//                     {superAdminForgotLabel()}
//                   </motion.label>
//                   <motion.input
//                     type="text"
//                     value={emailOrPhone}
//                     autoComplete="username"
//                     onChange={e => setEmailOrPhone(e.target.value)}
//                     placeholder={superAdminUsernamePlaceholder()}
//                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-300 transition-all"
//                     initial={{ opacity: 0, x: 25 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.14, duration: 0.3 }}
//                     disabled={superLoading}
//                   />
//                   <motion.button
//                     whileHover={{ scale: 1.03 }}
//                     whileTap={{ scale: 0.97 }}
//                     className="w-full rounded-lg bg-amber-600 py-2.5 font-medium text-slate-900 hover:opacity-90 transition"
//                     transition={{ duration: 0.18 }}
//                     type="button"
//                     onClick={handleSuperAdminSendOtp}
//                     disabled={superLoading || !emailOrPhone.trim()}
//                   >
//                     {superLoading ? "Sending OTP..." : "Send OTP"}
//                   </motion.button>
//                   <motion.button
//                     className="w-full text-xs text-amber-300 mt-2 hover:underline"
//                     type="button"
//                     whileTap={{ scale: 0.96 }}
//                     onClick={handleSuperAdminBackToLogin}
//                     disabled={superLoading}
//                   >
//                     ← Back to Login
//                   </motion.button>
//                 </>
//               )}
//               {superStep === "verify" && (
//                 <>
//                   <motion.label
//                     className="text-sm font-medium text-slate-300"
//                     initial={{ opacity: 0, x: -15 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.13, duration: 0.3 }}
//                   >
//                     Enter OTP sent to your email or WhatsApp
//                   </motion.label>
//                   <div className="relative">
//                     <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                     <motion.input
//                       type="text"
//                       value={superOtp}
//                       onChange={e => setSuperOtp(e.target.value)}
//                       placeholder="Enter OTP"
//                       className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
//                       initial={{ opacity: 0, x: 30 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: 0.14, duration: 0.38 }}
//                       disabled={superLoading}
//                     />
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.03 }}
//                     whileTap={{ scale: 0.97 }}
//                     className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 font-medium text-slate-900 hover:opacity-90 transition"
//                     transition={{ duration: 0.18 }}
//                     type="button"
//                     onClick={handleSuperAdminVerifyOtp}
//                     disabled={superLoading || !superOtp.trim()}
//                   >
//                     {superLoading ? "Verifying OTP..." : "Verify & Login"}
//                   </motion.button>
//                   <motion.button
//                     className="w-full text-xs text-amber-300 mt-2 hover:underline"
//                     type="button"
//                     whileTap={{ scale: 0.96 }}
//                     onClick={handleSuperAdminBackToLogin}
//                     disabled={superLoading}
//                   >
//                     ← Back to Login
//                   </motion.button>
//                 </>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//         {/* Footer */}
//         {isSuperAdmin && (
//           <motion.p
//             className="mt-6 text-center text-xs text-slate-500"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.5 }}
//           >
//             SECURE CONNECTION v2.4
//           </motion.p>
//         )}
//       </motion.div>
//     </div>
//   );
// }

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

  // function handleMethodChange(m: LoginMethod) {
  //   setMethod(m);
  //   setOtp("");
  //   setOtpSent(false);
  //   setStatus(null);
  //   setStep("login");
  //   setForgotOtp("");
  //   setPassword("");
  // }

  // ── Password login ─────────────────────────────────────────────────────────
  // Use /login as per instructions (authRouter.post("/login", authController.loginWithPassword))
  async function handlePasswordLogin() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Please enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
    // Per instructions: use /login for parent / therapist / admin
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
  // Use /signin endpoint (for forgot password OTP as per instructions)
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
      // as per previous instructions for forgot: /signin route, not /forgot-password (OLD)
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
  // Use /verify-account endpoint and save token if present
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
  // OTP Login uses /signin + /verify-account as originally
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
        // Save token under role-specific key
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

  // function resetAll() {
  //   setEmailOrPhone("");
  //   setPassword("");
  //   setOtp("");
  //   setOtpSent(false);
  //   setStatus(null);
  //   setSuperStep("login");
  //   setForgotOtp("");
  // }

  function handleMethodChange(m: LoginMethod) {
    setMethod(m);
    setOtp("");
    setOtpSent(false);
    setStatus(null);
    setSuperStep("login");
    setForgotOtp("");
    setPassword("");
  }

  // ── Password Login ────────────────────────────────────────────────────────
  async function handlePasswordLogin() {
    setStatus(null);
    setLoading(true);
    const inputType = validateInput(emailOrPhone.trim());
    if (!inputType) {
      setStatus("Enter a valid email address or phone number.");
      setLoading(false);
      return;
    }
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

  // ── OTP: verify ───────────────────────────────────────────────────────────
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

  // ── Forgot password: send OTP ─────────────────────────────────────────────
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

  // ── Forgot password: verify OTP ───────────────────────────────────────────
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