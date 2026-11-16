import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import AdBoardPage from './pages/AdBoardPage'
import AdminPage from './pages/AdminPage'
import CalendarPage from './pages/CalendarPage'
import EmailDetailPage from './pages/EmailDetailPage'
import InboxPage from './pages/InboxPage'
import LoginPage from './pages/LoginPage'
import OrganisationPage from './pages/OrganisationPage'
import ProfilePage from './pages/ProfilePage'
import SegmentPage from './pages/SegmentPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* signed-in pages share the sidebar layout */}
        <Route element={<AppShell />}>
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/emails/:id" element={<EmailDetailPage />} />
          <Route path="/segments" element={<SegmentPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/board" element={<AdBoardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/organisation" element={<OrganisationPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
