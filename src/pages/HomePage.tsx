// import { Link } from "react-router";
// import Button from "../components/ui/button/Button";

// const HomePage = () => {
//   return (
//     <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-200 px-6 relative">
//       {/* Hero Section */}
//       <div className="text-center">
//         <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
//           Welcome to <span className="text-blue-600">NUPAL CDC</span>
//         </h1>
//         <p className="text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
          
//         </p>

//         {/* Buttons */}
//         <div className="flex flex-col md:flex-row gap-4 justify-center">
//         <Link to="/super-admin">
//             <Button className="w-full md:w-auto px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition">
//               Super Admin Login
//             </Button>
//           </Link>
//           <Link to="/admin">
//             <Button className="w-full md:w-auto px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg transition">
//               Admin Login
//             </Button>
//           </Link>
//           <Link to="/therapist">
//             <Button className="w-full md:w-auto px-6 py-3 text-lg bg-violet-700 hover:bg-violet-800 text-white rounded-xl shadow-lg transition">
//               Therapist Login
//             </Button>
//           </Link>
//           <Link to="/parent">
//             <Button className="w-full md:w-auto px-6 py-3 text-lg bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-lg transition">
//               Parents Login
//             </Button>
//           </Link>
//           {/* <Link to="/supervisor">
//             <Button className="w-full md:w-auto px-6 py-3 text-lg bg-violet-800 hover:bg-violet-900 text-white rounded-xl shadow-lg transition">
//               Supervisor Login
//             </Button>
//           </Link> */}
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="absolute bottom-6 text-gray-500 text-sm">
//         © {new Date().getFullYear()} NUPAL CDC
//       </footer>
//     </div>
//   );
// };

// export default HomePage;

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
      desc: "Manage appointments, patient reports, and daily schedules.",
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

          {/* copyright */}
          <div className="mt-4 text-center text-[11px] text-slate-300">
            © {new Date().getFullYear()} Nupal CDC. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
