import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import SignIn from "./pages/SuperAdminPages/AuthPages/SignIn";

import NotFound from "./pages/SuperAdminPages/OtherPage/NotFound";
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
// import Home from "./pages/SuperAdminPages/Dashboard/Home";
// import SubAdminSignIn from "./pages/SuperAdminPages/AuthPages/SubAdmin/SignIn";

import SubAdminAppLayout from "./layout/Admin/AppLayout";

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
// import AppointmentBookingSystem from "./pages/AdminPages/AppointmentBookingSystem/AppointmentBookingSystem";
import TherapistsPage from "./pages/AdminPages/TherapistsPage/TherapistsPage";
import PatientsPage from "./pages/AdminPages/PatientsPage/PatientsPage";
import FinancesPage from "./pages/AdminPages/FinancesPage/FinancesPage";
import TherapyTypesPage from "./pages/SuperAdminPages/TherapyTypesPage/TherapyTypesPage";
import AuthPage from "./pages/AuthPages/SIgnInPage";
import PackagesPage from "./pages/SuperAdminPages/PackagesPage/PackagesPage";
import ManageAvailabilityPage from "./pages/AdminPages/ManageAvailabilityPage/ManageAvailabilityPage";
import MyChildrens from "./pages/ParentPages/AllChildrens/MyChildrens";
import MyChildrenAppointmentsPage from "./pages/ParentPages/MyChildrenAppointments/MyChildrenAppointmentsPage";
import ParentProfile from "./pages/ParentPages/ProfilePage/ParentProfile";
import TherapistMyAppointments from "./pages/TherapistPages/MyAppointment/MyAppointments";
import CalendarAndSchedule from "./pages/TherapistPages/CalendarAndSchedule/CalendarAndSchedule";
import TherpaistProfile from "./pages/TherapistPages/TherapistProfile/TherpaistProfile";
import ManageDiscounts from "./pages/SuperAdminPages/Discounts/ManageDiscounts";
import OnboardSubAdmin from "./pages/SuperAdminPages/OnboardSubAdmin/OnboardSubAdmin";
import AllUsers from "./pages/SuperAdminPages/AllUsers/AllUsers";
import AllAppointments from "./pages/SuperAdminPages/AllAppointments/AllAppointments";
import RequestAppointment from "./pages/ParentPages/RequestAppointment/RequestAppointment";
import BookingRequests from "./pages/AdminPages/BookingRequest/BookingRequests";
import AppointmentBookingSystemNew from "./pages/AdminPages/AppointmentBookingSystem/AppointmentBookingSystemNew";
import RequestEditAppointments from "./pages/ParentPages/RequestEditInAppointments/RequestEditInAppointments";
import SessionEditRequestsAdmin from "./pages/AdminPages/SessionEditRequests/SessionEditRequests";
import InvoiveAndPaymentsPage from "./pages/ParentPages/InvoiveAndPaymentsPage/InvoiceAndPaymentsPage";
import FinancesSuperAdminPage from "./pages/SuperAdminPages/FinancesPage/FinancesPage";
import ManageHolidays from "./pages/AdminPages/ManageHolidays/ManageHolidays";
import AdminProfile from "./pages/AdminPages/ProfilePage/AdminProfile";
import LogOutAdmin from "./pages/AdminPages/LogOutAdmin";
import LogOutParent from "./pages/ParentPages/LogOutParent";
import LogOutTherapist from "./pages/TherapistPages/LogOutTherapist";
import MyEarningsTherapist from "./pages/TherapistPages/MyEarnings/MyEarnings";
import FullCalendar from "./pages/AdminPages/FullCalendar/FullCalendar";
import SuperAdminTherapistsPage from "./pages/SuperAdminPages/TherapistsPage/TherapistsPage";
import TherapistSignUp from "./pages/TherapistPages/TherapistSignUpAdKYC/TherapistSignUp";
import CompleteProfilePage from "./pages/TherapistPages/IncompleteProfile/CompleteProfilePage";
import ApprovalPending from "./pages/TherapistPages/IncompleteProfile/ApprovalPending";
import ParentSignUp from "./pages/ParentPages/ParentSignUp/ParentSignUpp";
import ParentCompleteProfile from "./pages/ParentPages/ParentSignUp/ParentCompleteProfile";
import SuperAdminProfile from "./pages/SuperAdminPages/ProfilePage/SuperAdminProfile";
import LogOutSuperAdmin from "./pages/SuperAdminPages/LogOutSuperAdmin";
import SuperAdminFullCalendar from "./pages/SuperAdminPages/FullCalendar/SuperAdminFullCalendar";
import AllLogs from "./pages/SuperAdminPages/Auditlogs/AllLogs";
import AllUpcomingSessions from "./pages/AdminPages/ReceptionDesk/AllSessions";
import TherapistIncomeComparison from "./pages/SuperAdminPages/TherapistIncomeComparison/TherapistIncomeComparison";
import SuperAdminDashboardHome from "./pages/SuperAdminPages/Dashboard/Home";


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
            <Route index path="/super-admin" element={<SuperAdminDashboardHome />} />
            <Route path="/super-admin/all-users" element={<AllUsers />} />
            <Route path="/super-admin/all-appointments" element={<AllAppointments />} />
            {/* <Route path="/super-admin/finances" element={<FinancesPage/>} /> */}
            <Route path="/super-admin/onboard-sub-admin" element={<OnboardSubAdmin />} />
            <Route path="/super-admin/therapy-types" element={<TherapyTypesPage />} />
            <Route path="/super-admin/packages" element={<PackagesPage />} />
            <Route path="/super-admin/discount-coupons" element={<ManageDiscounts />} />
            <Route path="/super-admin/audit-logs" element={<AllLogs/>} />
            <Route path="/super-admin/finances" element={<FinancesSuperAdminPage/>} />
            <Route path="/super-admin/full-calendar" element={<SuperAdminFullCalendar/>} />
            <Route path="/super-admin/therapists" element={<SuperAdminTherapistsPage/>} />
            <Route path="/super-admin/therapist-salary-comparison" element={<TherapistIncomeComparison/>} />

            <Route path="/super-admin/children" element={<PatientsPage/>} />



            {/* Others Page */}
            <Route path="/super-admin/profile" element={<SuperAdminProfile />} />
            <Route path="/super-admin/logout" element={<LogOutSuperAdmin />} />
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
            <Route path="/admin/all-upcomming-sessions" element={<AllUpcomingSessions/>} />

            <Route path="/admin/leads-consults" element={<ConsultationsLeads />} />
            <Route path="/admin/reports-analytics" element={<AnalyticsReports />} />

            <Route path="/admin/bookings" element={<AppointmentBookingSystemNew/>} />
            <Route path="/admin/booking-requests" element={<BookingRequests/>} />
            <Route path="/admin/session-edit-requests" element={<SessionEditRequestsAdmin/>} />


            <Route path="/admin/therapists" element={<TherapistsPage/>} />
            <Route path="/admin/children" element={<PatientsPage/>} />
            <Route path="/admin/finances" element={<FinancesPage/>} />

            {/* <Route path="/admin/therapy-types" element={<TherapyTypesPage />} />
            <Route path="/admin/packages" element={<PackagesPage />} />
            <Route path="/admin/discounts" element={<ManageDiscounts />} /> */}

            <Route path="/admin/manage-availability" element={<ManageAvailabilityPage />} />
            <Route path="/admin/manage-holidays" element={<ManageHolidays />} />
            <Route path="/admin/full-calendar" element={<FullCalendar/>} />



            {/* Others Page */}
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/logout" element={<LogOutAdmin />} />
          </Route>

          <Route element={<SupervisorAppLayout />}>
            <Route index path="/therapist" element={<SupervisorHome />} />
            <Route path="/therapist/appointments" element={<TherapistMyAppointments />} />
            <Route path="/therapist/calendar" element={<CalendarAndSchedule />} />
            <Route path="/therapist/earnings" element={<MyEarningsTherapist/>} />
            <Route path="/therapist/profile" element={<TherpaistProfile />} />
            <Route path="/therapist/earnings" element={<MyEarningsTherapist/>} />
          

          </Route>

          <Route path="/therapist/signup" element={<TherapistSignUp />} />
          <Route path="/therapist/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/therapist/pending-approval" element={<ApprovalPending/>} />
          <Route path="/therapist/logout" element={<LogOutTherapist/>} />


          <Route element={<ParentAppLayout />}>
            <Route index path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/children" element={<MyChildrens />} />
            <Route path="/parent/appointments" element={<MyChildrenAppointmentsPage  />} />
            <Route path="/parent/invoices-payments" element={<InvoiveAndPaymentsPage/>} />
            <Route path="/parent/profile" element={<ParentProfile />} />
            <Route path="/parent/request-appointment" element={<RequestAppointment />} />
            <Route path="/parent/request-edit-appointment" element={<RequestEditAppointments />} />
          <Route path="/parent/logout" element={<LogOutParent />} />


          </Route>       

          <Route path="/parent/signup" element={<ParentSignUp />} />
          <Route path="/parent/complete-parent-profile" element={<ParentCompleteProfile />} />

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
