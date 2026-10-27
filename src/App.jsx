import { Navigate, Route, BrowserRouter as Router, Routes, useSearchParams } from 'react-router-dom';
import { conversationPath } from './data/omnichannelMock';
import Sidebar from './components/Sidebar';

// Auth Pages
import PrivacyPolicy from './components/landingpage/privacy-policy';
import TermsAndConditions from './components/landingpage/terms-of-service';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import OnboardRestaurant from './pages/OnboardRestaurant';
import RegistrationPending from './pages/RegistrationPending';
import Signup from './pages/Signup';

// DinePlan Pages
import { Availability } from './pages/Availability';
import { BotSetting } from './pages/BotSetting';
import FailedBookings from './pages/FailedBookings';
import { Guests } from './pages/Guests';
import { Payments } from './pages/Payments';
import { Reservations } from './pages/Reservations';
import { Conversations } from './pages/Conversations';
import { SetNumber } from './pages/SetNumber';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';
import { Widget } from './pages/Widget';
import WidgetConversations from './pages/WidgetConversations';
import { Marketing } from './pages/Marketing';

function LegacyConversationsRedirect() {
  const [params] = useSearchParams();
  return <Navigate to={conversationPath(params.get('id')) || '/whatsapp'} replace />;
}

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
        <Route path="/admin/onboard" element={<OnboardRestaurant />} />

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
                  <Route path="/whatsapp" element={<Conversations channel="whatsapp" />} />
                  <Route path="/website-widget" element={<Conversations channel="widget" />} />
                  <Route path="/email" element={<Conversations channel="email" />} />
                  <Route path="/conversations" element={<LegacyConversationsRedirect />} />
                  <Route path="/guests" element={<Guests />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/botsettings" element={<BotSetting />} />
                  <Route path="/availability" element={<Availability />} />
                  <Route path="/set-number" element={<SetNumber />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/marketing" element={<Marketing />} />
                  <Route path="/all-calls" element={<FailedBookings />} />
                  <Route path="/other-calls" element={<Navigate to="/all-calls" replace />} />
                  <Route path="/widget" element={<Widget />} />
                  <Route path="/widget-conversations" element={<WidgetConversations />} />

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