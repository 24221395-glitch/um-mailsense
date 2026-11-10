import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import InboxPage from './pages/InboxPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}