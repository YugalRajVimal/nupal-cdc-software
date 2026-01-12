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

const ParentAppLayout: React.FC = () => {
  const [isParentAuthenticated, setIsParentAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkParentAuth = async () => {
      try {
        // Get token from localStorage (patient-token)
        const token = localStorage.getItem("patient-token");
        if (!token) {
          setIsParentAuthenticated(false);
          if (window.location.pathname.startsWith("/parent")) {
            window.location.href = "/signin";
          }
          return;
        }

        // Call the check-auth endpoint (as per auth.routes.js /auth/)
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({ role: "patient" }),
          }
        );

        if (res.ok) {
          setIsParentAuthenticated(true);
          // Redirect to /parent if already logged in but on /signin
          if (window.location.pathname === "/signin") {
            window.location.href = "/parent";
          }
        } else {
          setIsParentAuthenticated(false);
          window.location.href = "/signin";
        }
      } catch (err) {
        setIsParentAuthenticated(false);
        window.location.href = "/signin";
      }
    };

    checkParentAuth();
  }, []);

  if (isParentAuthenticated === null || !isParentAuthenticated) {
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

export default ParentAppLayout;
