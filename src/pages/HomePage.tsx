// @App.tsx (266-268): Add Policy Links (Contact Us, Terms, Refunds/Cancellations) to HomePage Footer

import { useEffect, useState } from "react";
import { Link } from "react-router";

// REACT ICONS REPLACEMENTS:
import { FaUsers, FaStethoscope, FaLock, FaGlobe, FaQuestionCircle } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { HiShieldCheck } from "react-icons/hi";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

const HomePage = () => {
  // Remove all tokens from localStorage when this page loads
  useEffect(() => {
    localStorage.removeItem("therapist-token");
    localStorage.removeItem("patient-token");
    localStorage.removeItem("admin-token");
    localStorage.removeItem("super-admin-token");
    localStorage.removeItem("userData");
      localStorage.removeItem("userRole");
  }, []);

  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  const portals = [
    {
      title: "Parent Portal",
      desc: "Track child progress, book sessions, and manage payments.",
      to: "/parent",
      icon: <FaUsers className="h-5 w-5 text-white" />,
      iconBg: "from-blue-500 to-blue-600",
    },
    {
      title: "Therapist Portal",
      desc: "Manage appointments, children reports, and daily schedules.",
      to: "/therapist",
      icon: <FaStethoscope className="h-5 w-5 text-white" />,
      iconBg: "from-fuchsia-500 to-purple-600",
    },
    {
      title: "Admin Dashboard",
      desc: "Oversee operations, manage staff, and handle center logistics.",
      to: "/admin",
      icon: <MdDashboard className="h-5 w-5 text-white" />,
      iconBg: "from-emerald-500 to-green-600",
    },
    {
      title: "Super Admin",
      desc: "Full system control, configuration, and data management.",
      to: "/super-admin",
      icon: <HiShieldCheck className="h-5 w-5 text-white" />,
      iconBg: "from-orange-500 to-red-500",
    },
  ];

  const handleHelpClick = () => {
    window.open("https://nupalcdc.com/contact-us", "_blank");
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafa] relative">
      {/* thin top line like screenshot */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

      {/* Top-left logo */}
      <div className="absolute top-5 left-6 z-30">
        <Link to="/">
          <img
            src="/logo.webp"
            alt="NUPAL"
            className="h-12 w-auto md:h-16 max-w-none"
            style={{ opacity: 0.95 }}
          />
        </Link>
      </div>

      {/* Bottom left help icon */}
      <div
        className="fixed bottom-8 left-8 z-50 group"
        onMouseEnter={() => setShowHelpTooltip(true)}
        onMouseLeave={() => setShowHelpTooltip(false)}
        style={{ cursor: "pointer" }}
      >
        <button
          type="button"
          className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 rounded-full p-0.5 shadow-2xl border-4 border-white hover:scale-105 hover:shadow-[0_10px_24px_0_rgba(55,65,81,0.15)] transition-transform duration-200 flex items-center justify-center outline-none ring-2 ring-blue-300/20 focus:ring-blue-400/70"
          aria-label="Get Help"
          style={{ outline: "none" }}
          onClick={handleHelpClick}
          tabIndex={0}
        >
          <span className="flex items-center justify-center h-14 w-14 rounded-full bg-white/95 backdrop-blur-md shadow-inner">
            <FaQuestionCircle className="w-7 h-7 text-blue-500 group-hover:text-purple-600 transition-colors duration-150 drop-shadow" />
          </span>
          <span className="absolute animate-ping top-1 left-1 h-12 w-12 rounded-full bg-blue-500/15 opacity-90" />
        </button>
        {showHelpTooltip && (
          <span
            className="absolute left-20 bottom-1/2 translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-br from-gray-900 via-fuchsia-800 to-purple-600 text-white text-xs font-semibold shadow-2xl z-40 whitespace-nowrap border border-purple-400/30 fade-in "
            style={{
              boxShadow: "0 8px 32px 0 rgba(68,12,92,0.16)",
              letterSpacing: ".02em",
            }}
          >
            {/* <span className="inline-block align-middle mr-2">
              <FaQuestionCircle className="inline h-4 w-4 text-pink-300" />
            </span> */}
            Need help? Click to contact us.
          </span>
        )}
      </div>
 

      <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-6">
        {/* soft watermark background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.6]  select-none">
          <div className="text-[160px] md:text-[220px] font-extrabold tracking-tight">
            <img
              src="/logo.webp"
              alt="NUPAL"
              className="w-screen md:w-[80vw] mx-auto"
              style={{  opacity: 0.7 }}
            />
          </div>
        </div>

        {/* MAIN */}
        <div className="relative z-10 w-full max-w-5xl">
          {/* badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50/80 text-blue-700 text-xs font-semibold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              EARLY INTERVENTION CLINIC 
            </div>
          </div>

          {/* title */}
          <div className="text-center">
            <h1 className="text-[42px] md:text-[54px] leading-tight font-extrabold text-slate-900">
              Welcome to{" "}
              <span className="text-blue-600">Nupal CDC</span>
            </h1>

            <p className="mt-4 text-slate-500 max-w-2xl mx-auto leading-relaxed">
              A comprehensive platform connecting parents, therapists, and
              administrators for seamless child development tracking and center
              management.
            </p>
          </div>

          {/* cards */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {portals.map((p) => (
              <Link
                key={p.title}
                to={p.to}
                className="group rounded-2xl bg-white border border-slate-100 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:shadow-[0_14px_35px_rgba(15,23,42,0.12)] transition-all duration-300"
              >
                <div className="p-6">
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${p.iconBg} flex items-center justify-center shadow-md`}
                  >
                    {p.icon}
                  </div>

                  <h3 className="mt-5 text-[16px] font-bold text-slate-900">
                    {p.title}
                  </h3>

                  <p className="mt-2 text-[12px] text-slate-500 leading-relaxed min-h-[44px]">
                    {p.desc}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold text-slate-400 group-hover:text-slate-700 transition">
                    Enter Portal <HiOutlineArrowNarrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* footer info row (center bottom) */}
          <div className="mt-16 flex items-center justify-center gap-6 text-[12px] text-slate-400">
            <span className="inline-flex items-center gap-2">
              <FaGlobe className="h-4 w-4" />
              Public Access Enabled
            </span>
            <span className="inline-flex items-center gap-2">
              <FaLock className="h-4 w-4" />
              Secure Environment
            </span>
            <span className="text-slate-400">v2.4.0 (Build 2026.01)</span>
          </div>
        </div>

        {/* copyright & policies */}
        <div className="mt-10 text-center text-slate-300">
          <span>
            © {new Date().getFullYear()} Nupal CDC. All rights reserved.
          </span>
          <div className="mt-2 flex flex-wrap justify-center items-center gap-3 text-slate-400">
            <Link
              to="/policies/contact-us"
              className="hover:text-blue-500 underline transition"
            >
              Contact Us
            </Link>
            <span>|</span>
            <Link
              to="/policies/terms-and-conditions"
              className="hover:text-blue-500 underline transition"
            >
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link
              to="/policies/refunds-cancellations"
              className="hover:text-blue-500 underline transition"
            >
              Refunds &amp; Cancellations
            </Link>
          </div>
        </div>
      </div>
      {/* Bottom right Owned & Operated note */}
      <div className="fixed bottom-6 right-8 z-50 pointer-events-none select-none">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-tr from-[#e7eafc] via-white to-[#f5e9fe] shadow-xl px-6 py-2 border border-blue-100/60">
         
          <span className="text-[13px] font-semibold tracking-wider text-slate-700">
            Owned &amp; Operated by
          </span>
          <span className="ml-3 text-base font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-blue-600 to-violet-600 drop-shadow-md" style={{ textShadow: '0 1px 8px #c3ceff33' }}>
            Aabha Pradhan
          </span>
        </div>
      </div>
 
    </div>
  );
};

export default HomePage;
