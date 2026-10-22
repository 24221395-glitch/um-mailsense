import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AdBoardPage from "./pages/AdBoardPage";
import AdminPage from "./pages/AdminPage";
import InboxPage from "./pages/InboxPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SegmentPage from "./pages/SegmentPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/segments/:segment" element={<SegmentPage />} />
        <Route path="/ads" element={<AdBoardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
