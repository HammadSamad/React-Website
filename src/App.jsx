import { Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './components/site/SiteLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/dash/DashboardLayout.jsx';
import Toast from './components/common/Toast.jsx';

/* ------------------------------ Public site ------------------------------ */
import Home from './pages/site/Home.jsx';
import Rooms from './pages/site/Rooms.jsx';
import RoomDetail from './pages/site/RoomDetail.jsx';
import Experiences from './pages/site/Experiences.jsx';
import Gallery from './pages/site/Gallery.jsx';
import About from './pages/site/About.jsx';
import Contact from './pages/site/Contact.jsx';
import Reviews from './pages/site/Reviews.jsx';
import Booking from './pages/site/Booking.jsx';
import Login from './pages/site/Login.jsx';
import Signup from './pages/site/Signup.jsx';
import Account from './pages/site/Account.jsx';
import NotFound from './pages/site/NotFound.jsx';

/* ------------------------------ Dashboard -------------------------------- */
import Overview from './pages/dash/Overview.jsx';
import Reservations from './pages/dash/Reservations.jsx';
import DashRooms from './pages/dash/DashRooms.jsx';
import Guests from './pages/dash/Guests.jsx';
import Housekeeping from './pages/dash/Housekeeping.jsx';
import Services from './pages/dash/Services.jsx';
import Billing from './pages/dash/Billing.jsx';
import FeedbackPage from './pages/dash/Feedback.jsx';
import Reports from './pages/dash/Reports.jsx';
import Staff from './pages/dash/Staff.jsx';
import Settings from './pages/dash/Settings.jsx';

const FRONT_DESK = ['admin', 'manager', 'receptionist'];
const STAFF = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];

export default function App() {
  return (
    <>
      <Routes>
        {/* Public website */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Management console */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={STAFF} redirectTo="/account">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="reservations" element={<ProtectedRoute roles={FRONT_DESK}><Reservations /></ProtectedRoute>} />
          <Route path="rooms" element={<DashRooms />} />
          <Route path="guests" element={<ProtectedRoute roles={FRONT_DESK}><Guests /></ProtectedRoute>} />
          <Route path="housekeeping" element={<ProtectedRoute roles={['admin', 'manager', 'housekeeping', 'maintenance']}><Housekeeping /></ProtectedRoute>} />
          <Route path="services" element={<ProtectedRoute roles={['admin', 'manager', 'receptionist', 'housekeeping']}><Services /></ProtectedRoute>} />
          <Route path="billing" element={<ProtectedRoute roles={FRONT_DESK}><Billing /></ProtectedRoute>} />
          <Route path="feedback" element={<ProtectedRoute roles={['admin', 'manager']}><FeedbackPage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute roles={['admin', 'manager']}><Reports /></ProtectedRoute>} />
          <Route path="staff" element={<ProtectedRoute roles={['admin', 'manager']}><Staff /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toast />
    </>
  );
}
