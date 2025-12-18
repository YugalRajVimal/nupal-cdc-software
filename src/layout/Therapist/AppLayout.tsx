import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Outlet } from "react-router";
import SubAdminAppSidebar from "./AppSidebar";
import SubAdminBackdrop from "./Backdrop";
import SubAdminAppHeader from "./AppHeader";

import { useEffect, useState } from "react";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <SubAdminAppSidebar />
        <SubAdminBackdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <SubAdminAppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const SupervisorAppLayout: React.FC = () => {
  const [isTherapistAuthenticated, setIsTherapistAuthenticated] = useState<
    boolean | null
  >(true);

  useEffect(()=>{
    setIsTherapistAuthenticated(true);
  })

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const token = localStorage.getItem("supervisor-token");

  //       if (!token) {
  //         setIsTherapistAuthenticated(false);
  //         if (window.location.pathname.startsWith("/supervisor")) {
  //           window.location.href = "/supervisor/signin";
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

  //       // console.log(
  //       //   res,
  //       //   "------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------"
  //       // );

  //       if (res.status === 200) {
  //         setIsTherapistAuthenticated(true);
  //         // redirect only if logged in but not already on an admin page
  //         if (window.location.pathname === "/supervisor/signin") {
  //           window.location.href = "/supervisor";
  //         }
  //       } else {
  //         setIsTherapistAuthenticated(false);
  //         window.location.href = "/supervisor/signin";
  //       }
  //     } catch (err) {
  //       console.error("Auth check failed:", err);
  //       setIsTherapistAuthenticated(false);
  //       window.location.href = "/supervisor/signin";
  //     }
  //   };

  //   checkAuth();
  // }, []);

  if (isTherapistAuthenticated === null || !isTherapistAuthenticated) {
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

export default SupervisorAppLayout;
