import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Outlet } from "react-router";
import SubAdminAppSidebar from "./AppSidebar";
import SubAdminBackdrop from "./Backdrop";
import { useEffect, useState } from "react";
import AdminHeader from "../../pages/AdminPages/AdminHeader/AdminHeader";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div
      className="min-h-screen xl:flex"
      style={{
        background: "linear-gradient(135deg, #fdf4cc 0%, #ffe3ef 45%, #ced3f3 100%)",
      }}
    >
      <div>
        <SubAdminAppSidebar />
        <SubAdminBackdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {/* <SubAdminAppHeader /> */}
        <AdminHeader />

        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const SubAdminAppLayout: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Get token and email from localStorage (admin-token & admin-email)
        const token = localStorage.getItem("admin-token");
        if (!token) {
          setIsAdminAuthenticated(false);
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/signin";
          }
          return;
        }

        // Call the check-auth endpoint (as per auth.routes.js /auth/check-auth)
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({ role: "admin" }),
          }
        );

        if (res.ok) {
          setIsAdminAuthenticated(true);
          // If already logged in but on /signin, redirect to /admin
          if (window.location.pathname === "/signin") {
            window.location.href = "/admin";
          }
        } else {
          setIsAdminAuthenticated(false);
          window.location.href = "/signin";
        }
      } catch (err) {
        // In case of error, force re-login
        setIsAdminAuthenticated(false);
        window.location.href = "/signin";
      }
    };

    checkAdminAuth();
  }, []);

  if (isAdminAuthenticated === null || !isAdminAuthenticated) {
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

export default SubAdminAppLayout;
