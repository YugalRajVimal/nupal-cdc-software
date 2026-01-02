import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import SignIn from "./pages/SuperAdminPages/AuthPages/SignIn";

import NotFound from "./pages/SuperAdminPages/OtherPage/NotFound";
import UserProfiles from "./pages/SuperAdminPages/UserProfiles";
import Videos from "./pages/SuperAdminPages/UiElements/Videos";
import Images from "./pages/SuperAdminPages/UiElements/Images";
import Alerts from "./pages/SuperAdminPages/UiElements/Alerts";
import Badges from "./pages/SuperAdminPages/UiElements/Badges";
import Avatars from "./pages/SuperAdminPages/UiElements/Avatars";
import Buttons from "./pages/SuperAdminPages/UiElements/Buttons";
import LineChart from "./pages/SuperAdminPages/Charts/LineChart";
import BarChart from "./pages/SuperAdminPages/Charts/BarChart";
import Calendar from "./pages/SuperAdminPages/Calendar";
import BasicTables from "./pages/SuperAdminPages/Tables/BasicTables";
import FormElements from "./pages/SuperAdminPages/Forms/FormElements";
import Blank from "./pages/SuperAdminPages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/SuperAdminPages/Dashboard/Home";
// import SubAdminSignIn from "./pages/SuperAdminPages/AuthPages/SubAdmin/SignIn";

import SubAdminAppLayout from "./layout/Admin/AppLayout";
import SubAdminProfiles from "./pages/AdminPages/UserProfiles";

// import UploadedExcelSheets from "./pages/SubAdminPages/UploadedExcelSheets/UploadedExcelSheets";

import HomePage from "./pages/HomePage";


import SupervisorAppLayout from "./layout/Therapist/AppLayout";
import SupervisorHome from "./pages/TherapistPages/Dashboard/Home";
// import SupervisorSignIn from "./pages/SuperAdminPages/AuthPages/Supervisor/SignIn";

// import PrivacyPolicy from "./pages/PrivacyPolicy";


import ParentAppLayout from "./layout/Parent/AppLayout";
import ParentDashboard from "./pages/ParentPages/Dashboard/Home";
import TherapistRegistration from "./pages/AdminPages/AddTherapist/TherapistRegistration";
import PatientRegistration from "./pages/AdminPages/AddPatient/RegisterPatient";
import SubAdminHome from "./pages/AdminPages/Dashboard/Home";
import ReceptionDesk from "./pages/AdminPages/ReceptionDesk/ReceptionDesk";
import ConsultationsLeads from "./pages/AdminPages/ConsultationsLeads/ConsultationsLeads";
import AnalyticsReports from "./pages/AdminPages/AnalyticsReports/AnalyticsReports";
import AppointmentBookingSystem from "./pages/AdminPages/AppointmentBookingSystem/AppointmentBookingSystem";
import TherapistsPage from "./pages/AdminPages/TherapistsPage/TherapistsPage";
import PatientsPage from "./pages/AdminPages/PatientsPage/PatientsPage";
import FinancesPage from "./pages/AdminPages/FinancesPage/FinancesPage";
import TherapyTypesPage from "./pages/AdminPages/TherapyTypesPage/TherapyTypesPage";
import AuthPage from "./pages/AuthPages/SIgnInPage";
import PackagesPage from "./pages/AdminPages/PackagesPage/PackagesPage";
import ManageAvailabilityPage from "./pages/AdminPages/ManageAvailabilityPage/ManageAvailabilityPage";
import MyChildrens from "./pages/ParentPages/AllChildrens/MyChildrens";
import MyChildrenAppointmentsPage from "./pages/ParentPages/MyChildrenAppointments/MyChildrenAppointmentsPage";
import ParentProfile from "./pages/ParentPages/ProfilePage/ParentProfile";
import TherapistMyAppointments from "./pages/TherapistPages/MyAppointment/MyAppointments";
import CalendarAndSchedule from "./pages/TherapistPages/CalendarAndSchedule/CalendarAndSchedule";
import TherpaistProfile from "./pages/TherapistPages/TherapistProfile/TherpaistProfile";


export default function App() {
  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route index path="/" element={<HomePage />} />
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            {/* 
              Routing based on AppSidebar.tsx navItems:
              1. Dashboard Overview -> /super-admin
              2. Account Access -> /super-admin/account-access
              3. Data Management -> /super-admin/data-management
              4. Data Import -> /super-admin/data-import
              5. Data Export -> /super-admin/data-export
              6. App Configuration -> /super-admin/app-configuration
              7. Roles & Permissions -> /super-admin/roles-permissions
              8. Audit Logs -> /super-admin/audit-logs
              (Admin custom routes below these, as before...)
            */}
            <Route index path="/super-admin" element={<Home />} />
            <Route
              path="/super-admin/account-access"
              element={<h1>Account Access</h1>}
            />
            <Route
              path="/super-admin/data-management"
              element={<h1>Data Management</h1>}
            />
            <Route
              path="/super-admin/data-import"
              element={<h1>Data Import</h1>}
            />
            <Route
              path="/super-admin/data-export"
              element={<h1>Data Export</h1>}
            />
            <Route
              path="/super-admin/app-configuration"
              element={<h1>App Configuration</h1>}
            />
            <Route
              path="/super-admin/roles-permissions"
              element={<h1>Roles &amp; Permissions</h1>}
            />
            <Route
              path="/super-admin/audit-logs"
              element={<h1>Audit Logs</h1>}
            />
            {/* Others Page */}
            <Route path="/super-admin/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          <Route element={<SubAdminAppLayout />}>
            <Route index path="/admin" element={<SubAdminHome />} />
            <Route path="/admin/register-therapist" element={<TherapistRegistration/>} />
            <Route path="/admin/register-patient" element={<PatientRegistration />} />
            <Route path="/admin/reception-desk" element={<ReceptionDesk/>} />
            <Route path="/admin/leads-consults" element={<ConsultationsLeads />} />
            <Route path="/admin/reports-analytics" element={<AnalyticsReports />} />

            <Route path="/admin/bookings" element={<AppointmentBookingSystem/>} />
            <Route path="/admin/therapists" element={<TherapistsPage/>} />
            <Route path="/admin/children" element={<PatientsPage/>} />
            <Route path="/admin/finances" element={<FinancesPage/>} />
            <Route path="/admin/therapy-types" element={<TherapyTypesPage />} />
            <Route path="/admin/packages" element={<PackagesPage />} />

            <Route path="/admin/manage-availability" element={<ManageAvailabilityPage />} />

            {/* Others Page */}
            <Route path="/admin/profile" element={<SubAdminProfiles />} />
          </Route>

          <Route element={<SupervisorAppLayout />}>
            <Route index path="/therapist" element={<SupervisorHome />} />
            <Route path="/therapist/appointments" element={<TherapistMyAppointments />} />
            <Route path="/therapist/calendar" element={<CalendarAndSchedule />} />
            <Route path="/therapist/earnings" element={<div>My Earnings Page</div>} />
            <Route path="/therapist/profile" element={<TherpaistProfile />} />
          </Route>

          <Route element={<ParentAppLayout />}>
            <Route index path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/children" element={<MyChildrens />} />
            <Route path="/parent/appointments" element={<MyChildrenAppointmentsPage  />} />
            <Route path="/parent/invoices-payments" element={<div>Invoices & Payments Page</div>} />
            <Route path="/parent/profile" element={<ParentProfile />} />
          </Route>       

          <Route path="/signin" element={<AuthPage />} />
        
          {/* <Route path="/privacy-policy" element={<PrivacyPolicy />} /> */}

          {/* <Route path="/sub-admin/signup" element={<SubAdminSignUpForm />} /> */}

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
