import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";

export default function SupervisorHome() {
  const [dashboardData, setDashboardData] = useState<{
    allVendorsCount: number;
    milkWeightSum: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("supervisor-token");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ""}/api/supervisor/get-dashboard-details`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(
            errData.message || "Failed to fetch dashboard details."
          );
        }
        const data = await res.json();
        setDashboardData({
          allVendorsCount: data.allVendorsCount || 0,
          milkWeightSum: data.milkWeightSum || 0,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardDetails();
  }, []);

  return (
    <>
      <PageMeta
        title="Nupal CDC"
        description="Supervisor Panel for Nupal CDC"
      />
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Therapist Dashboard
        </h1>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">
            {error}
          </div>
        ) : (
          dashboardData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:grid-cols-2 mb-10">
              <div className="rounded-lg shadow bg-white p-5 flex flex-col items-center">
                <span className="text-3xl font-bold text-green-700">
                  {dashboardData.allVendorsCount}
                </span>
                <span className="text-gray-600 mt-2">Vendors in Route</span>
              </div>
              <div className="rounded-lg shadow bg-white p-5 flex flex-col items-center">
                <span className="text-3xl font-bold text-blue-700">
                  {dashboardData.milkWeightSum.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} Ltr
                </span>
                <span className="text-gray-600 mt-2">Total Milk Collected</span>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
