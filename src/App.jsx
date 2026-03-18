import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import RegistrationPending from './pages/RegistrationPending';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './components/landingpage/privacy-policy';
import TermsAndConditions from './components/landingpage/terms-of-service';

// DinePlan Pages
import { Reservations } from './pages/Reservations';
import { Availability } from './pages/Availability';
import { Guests } from './pages/Guests';
import { SetNumber } from './pages/SetNumber';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';
import { Payments } from './pages/Payments';
import {BotSetting} from './pages/BotSetting';
import FailedBookings from './pages/FailedBookings';



export default function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Auth Pages (No Sidebar) --- */}
        <Route path="/" element={<LandingPage/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/registration-pending" element={<RegistrationPending />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsAndConditions />} />

        {/* --- Main App Layout (Sidebar + Content) --- */}
        {/* This catches all other paths (*) and renders the Sidebar layout */}
        <Route
          path="*"
          element={
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-52">
                <Routes>
                  {/* Specific Pages */}
                  <Route path="/reservations" element={<Reservations />} />
                  <Route path="/guests" element={<Guests />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/botsettings" element={<BotSetting />} />
                  <Route path="/availability" element={<Availability />} />
                  <Route path="/set-number" element={<SetNumber />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/failed-bookings" element={<FailedBookings />} />

                  {/* Fallback: If path is unknown, go to Reservations */}
                  {/* <Route path="*" element={<Navigate to="/reservations" replace />} /> */}
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}