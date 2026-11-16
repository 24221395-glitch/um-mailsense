import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import InboxPage from './pages/InboxPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import AdBoardPage from './pages/AdBoardPage'
import OrganisationPage from './pages/OrganisationPage'
import AdminPage from './pages/AdminPage'
import CalendarPage from './pages/CalendarPage'
import EmailDetailPage from './pages/EmailDetailPage'
import SegmentPage from './pages/SegmentPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/board" element={<AdBoardPage />} />
        <Route path="/organisation" element={<OrganisationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/emails/:id" element={<EmailDetailPage />} />
        <Route path="/segments" element={<SegmentPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
