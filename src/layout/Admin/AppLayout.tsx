import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Outlet } from "react-router";
import SubAdminAppSidebar from "./AppSidebar";
import SubAdminBackdrop from "./Backdrop";
import { useEffect, useState, useRef, useCallback } from "react";
import AdminHeader from "../../pages/AdminPages/AdminHeader/AdminHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiCalendar, FiX } from "react-icons/fi";

const FOLLOW_UP_TOAST_ID = "followUpPendingToast";

// Custom toast content with close button for Follow Up Pending
const FollowUpPendingToastContent = ({
  count,
  onClose,
}: {
  count: number;
  onClose: () => void;
}) => (
  <div
    className="flex gap-3 items-center"
    style={{ minWidth: 200 }}
    role="alert"
    aria-live="polite"
  >
    <FiCalendar className="text-amber-500" size={22} />
    <span className="font-medium" style={{ color: "#925400" }}>
      {count} Follow Up Pending
    </span>
    <button
      className="ml-3 text-amber-500 rounded hover:bg-amber-200 focus:outline-none"
      aria-label="Close Follow Up Pending Notification"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        marginLeft: 12,
        padding: 2,
        display: "flex",
        alignItems: "center",
      }}
      onClick={onClose}
      tabIndex={0}
    >
      <FiX size={18} />
    </button>
  </div>
);

const LayoutContent: React.FC<{
  superAdminName?: string;
  superAdminEmail?: string;
  isLoggedInViaSuperAdmin?: boolean;
}> = ({ superAdminName, superAdminEmail, isLoggedInViaSuperAdmin }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={false}
        closeOnClick={false}
        pauseOnFocusLoss={false}
        draggable={false}
        theme="light"
        hideProgressBar
        newestOnTop
        limit={2}
      />
      <div
        className="min-h-screen max-w-screen xl:flex overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #fdf4cc 0%, #ffe3ef 45%, #ced3f3 100%)",
        }}
      >
        <div>
          <SubAdminAppSidebar />
          <SubAdminBackdrop />
        </div>
        <div
          className={`flex-1 transition-all md:w-[80%] duration-300 ease-in-out ${
            isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
        >
          {isLoggedInViaSuperAdmin && (
            <div className="bg-yellow-100 text-yellow-900 text-xs px-3 py-2 rounded-b shadow mb-2 flex items-center gap-2 border-b border-yellow-200">
              <span className="font-semibold mr-2">
                You are logged in as Admin
              </span>
              {superAdminName && (
                <span>
                  (<span className="font-medium">{superAdminName}</span>
                  {superAdminEmail && (
                    <span className="text-gray-600 ml-1">
                      | {superAdminEmail}
                    </span>
                  )}
                  )
                </span>
              )}
            </div>
          )}
          <AdminHeader />
          <div className="p-4 mx-auto w-full md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

const SubAdminAppLayout: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [superAdminName, setSuperAdminName] = useState<string | undefined>();
  const [superAdminEmail, setSuperAdminEmail] = useState<string | undefined>();
  const [isLoggedInViaSuperAdmin, setIsLoggedInViaSuperAdmin] = useState<boolean>(false);

  // Control for the follow up toast
  const intervalHandleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastManuallyClosedRef = useRef<boolean>(false);

  // Helper to show toast with close
  const showFollowUpToast = useCallback(
    (count: number) => {
      // If user closed, don't show again until timer triggers next show
      if (toastManuallyClosedRef.current) return;
      if (toast.isActive(FOLLOW_UP_TOAST_ID)) {
        toast.update(FOLLOW_UP_TOAST_ID, {
          render: (
            <FollowUpPendingToastContent
              count={count}
              onClose={() => {
                toast.dismiss(FOLLOW_UP_TOAST_ID);
                toastManuallyClosedRef.current = true;
                // Allow toast to show again after next check/interval
                setTimeout(() => {
                  toastManuallyClosedRef.current = false;
                }, 5 * 60 * 1000);
              }}
            />
          ),
          autoClose: false,
          closeButton: false,
          isLoading: false,
        });
      } else {
        toast(
          <FollowUpPendingToastContent
            count={count}
            onClose={() => {
              toast.dismiss(FOLLOW_UP_TOAST_ID);
              toastManuallyClosedRef.current = true;
              setTimeout(() => {
                toastManuallyClosedRef.current = false;
              }, 5 * 60 * 1000);
            }}
          />,
          {
            toastId: FOLLOW_UP_TOAST_ID,
            autoClose: false,
            closeButton: false,
            isLoading: false,
          }
        );
      }
    },
    []
  );

  // Fetch future follow-up count & display toast
  const fetchAndShowFollowUp = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin-token");
      if (!token) {
        toast.dismiss(FOLLOW_UP_TOAST_ID);
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/leads/future-followup-leads-count`,
        {
          headers: { Authorization: token },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok && typeof data.count === "number") {
        showFollowUpToast(data.count);
      } else {
        toast.dismiss(FOLLOW_UP_TOAST_ID);
      }
    } catch {
      toast.dismiss(FOLLOW_UP_TOAST_ID);
    }
  }, [showFollowUpToast]);

  // Show sticky toast, repeat every 5 min
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAndShowFollowUp();
      intervalHandleRef.current = setInterval(fetchAndShowFollowUp, 5 * 60 * 1000);
    }
    return () => {
      if (intervalHandleRef.current) clearInterval(intervalHandleRef.current);
      toast.dismiss(FOLLOW_UP_TOAST_ID);
    };
  }, [isAdminAuthenticated, fetchAndShowFollowUp]);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem("admin-token");
        if (!token) {
          setIsAdminAuthenticated(false);
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/signin";
          }
          return;
        }

        // Check if login is via super admin
        const isViaSuperAdmin = localStorage.getItem("isLogInViaSuperAdmin") === "true";
        setIsLoggedInViaSuperAdmin(isViaSuperAdmin);

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
          const data = await res.json();
          // API returns { message, name, email } according to backend
          if (isViaSuperAdmin && data && data.name && data.email) {
            setSuperAdminName(data.name);
            setSuperAdminEmail(data.email);
          }
          if (window.location.pathname === "/signin") {
            window.location.href = "/admin";
          }
        } else {
          setIsAdminAuthenticated(false);
          window.location.href = "/signin";
        }
      } catch (err) {
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
      <LayoutContent
        superAdminName={superAdminName}
        superAdminEmail={superAdminEmail}
        isLoggedInViaSuperAdmin={isLoggedInViaSuperAdmin}
      />
    </SidebarProvider>
  );
};

export default SubAdminAppLayout;
