import PageMeta from "../../../components/common/PageMeta";

const sampleDashboardData = {
  allSupervisorCount: 5,
  allVendorsCount: 25,
  allRoutesCount: 9,

};

export default function SubAdminHome() {
  // Using sample data for now as per instruction
  const dashboardData = sampleDashboardData;
  const loading = false;
  const error = null;

  return (
    <>
      <PageMeta
        title="Dairy Management"
        description="Admin and Sub-Admin Panel for Dairy Management"
      />
      <div className="max-w-6xl mx-auto mt-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-6 md:grid-cols-3 mb-10">
              {/* Total Appointments - Violet */}
              <div className="rounded-xl border border-violet-200 bg-violet-100/90 backdrop-blur-md shadow-lg p-6 flex flex-col items-start relative overflow-hidden">
                {/* Blurred decorative bg */}
                {/* <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-6 -right-10 w-32 h-32 bg-violet-200 opacity-40 blur-2xl rounded-full"></div>
                </div> */}
                <span className="text-gray-700 mt-2 font-medium">Total Appointments</span>
                <span className="text-4xl font-bold text-violet-700 drop-shadow">
                  {dashboardData.allSupervisorCount}
                </span>
              </div>
              {/* Total Revenue - Green */}
              <div className="rounded-xl border border-green-200 bg-green-100/90 backdrop-blur-md shadow-lg p-6 flex flex-col items-start relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-6 -right-10 w-32 h-32 bg-green-200 opacity-40 blur-2xl rounded-full"></div>
                </div>
                <span className="text-gray-700 mt-2 font-medium">Total Revenue</span>
                <span className="text-4xl font-bold text-green-700 drop-shadow">
                  {dashboardData.allVendorsCount}
                </span>
              </div>
              {/* Active Children - Blue */}
              <div className="rounded-xl border border-blue-200 bg-blue-100/90 backdrop-blur-md shadow-lg p-6 flex flex-col items-start relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-6 -right-10 w-32 h-32 bg-blue-200 opacity-40 blur-2xl rounded-full"></div>
                </div>
                <span className="text-gray-700 mt-2 font-medium">Active Children</span>
                <span className="text-4xl font-bold text-blue-700 drop-shadow">
                  {dashboardData.allRoutesCount}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
