// @App.tsx (266-268): Add Policy Links (Contact Us, Terms, Refunds/Cancellations) to HomePage Footer

import { Link } from "react-router";

// REACT ICONS REPLACEMENTS:
import { FaUsers, FaStethoscope, FaLock, FaGlobe } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { HiShieldCheck } from "react-icons/hi";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

const HomePage = () => {
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

  return (
    <div className="min-h-screen w-full bg-[#fafafa]">
      {/* thin top line like screenshot */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

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
      
    </div>
  );
};

export default HomePage;
