// import { SidebarProvider, useSidebar } from "../context/SidebarContext";
// import { Outlet } from "react-router";
// import AppHeader from "./AppHeader";
// import Backdrop from "./Backdrop";
// import AppSidebar from "./AppSidebar";
// import { useEffect, useState } from "react";
// import axios from "axios";

// const LayoutContent: React.FC = () => {
//   const { isExpanded, isHovered, isMobileOpen } = useSidebar();

//   return (
//     <div className="min-h-screen xl:flex">
//       <div>
//         <AppSidebar />
//         <Backdrop />
//       </div>
//       <div
//         className={`flex-1 transition-all duration-300 ease-in-out ${
//           isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
//         } ${isMobileOpen ? "ml-0" : ""}`}
//       >
//         <AppHeader />
//         <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// const AppLayout: React.FC = () => {
//   const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<
//     boolean | null
//   >(null);

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const token = localStorage.getItem("admin-token");

//         if (!token && window.location.pathname !== "/admin/signin") {
//           window.location.href = "/admin/signin";
//         }

//         // if (window.location.pathname !== "/admin" && isAdminAuthenticated) {
//         //   console.log(window.location.pathname)
//         //   console.log(isAdminAuthenticated)

//         //   return;
//         // }

//         if (!token) {
//           setIsAdminAuthenticated(false);
//           return;
//         }

//         const res = await axios.post(
//           `${import.meta.env.VITE_API_URL}/api/auth`,
//           {}, // <- request body (empty in this case)
//           {
//             headers: {
//               Authorization: `${token}`,
//             },
//           }
//         );

//         if (res.status === 200) {
//           setIsAdminAuthenticated(true);
//           // await getProfileDetails();
//           window.location.href = "/admin";
//         } else {
//           setIsAdminAuthenticated(false);
//         }
//       } catch (err) {
//         console.error("Auth check failed:", err);
//         setIsAdminAuthenticated(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   if (isAdminAuthenticated === null) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
//         <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <SidebarProvider>
//       <LayoutContent />
//     </SidebarProvider>
//   );
// };

// export default AppLayout;

import { useEffect, useState } from "react";
// import axios from "axios";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import { Outlet } from "react-router";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen max-w-screen xl:flex overflow-hidden">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all md:w-[80%] duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6 overflow-x-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<
    boolean | null
  >(null);

  useEffect(()=>{
    setIsSuperAdminAuthenticated(true);
  })
  

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const token = localStorage.getItem("admin-token");
  //       if (!token) {
  //         setIsAdminAuthenticated(false);
  //         if (window.location.pathname.startsWith("/admin")) {
  //           window.location.href = "/admin/signin";
  //         }
  //         return;
  //       }

  //       const res = await axios.post(
  //         `${import.meta.env.VITE_API_URL}/api/auth`,
  //         {},
  //         {
  //           headers: { Authorization: `${token}` },
  //         }
  //       );

  //       if (res.status === 200) {
  //         setIsAdminAuthenticated(true);
  //         // redirect only if logged in but not already on an admin page
  //         if (window.location.pathname === "/admin/signin") {
  //           window.location.href = "/admin";
  //         }
  //       } else {
  //         setIsAdminAuthenticated(false);
  //         window.location.href = "/admin/signin";
  //       }
  //     } catch (err) {
  //       console.error("Auth check failed:", err);
  //       setIsAdminAuthenticated(false);
  //       window.location.href = "/admin/signin";
  //     }
  //   };

  //   checkAuth();
  // }, []);

  if (isSuperAdminAuthenticated === null || !isSuperAdminAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="w-40 h-40 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
