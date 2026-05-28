import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import GeneratedContent from '../pages/GeneratedContent';
import ContentCalendar from '../pages/ContentCalendar';
import ApiManagement from '../pages/ApiManagement';
import Analytics from '../pages/Analytics';
import NotionIntegration from '../pages/NotionIntegration';
import Settings from '../pages/Settings';
import Logs from '../pages/Logs';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="content" element={<GeneratedContent />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="api-keys" element={<ApiManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notion" element={<NotionIntegration />} />
        <Route path="settings" element={<Settings />} />
        <Route path="logs" element={<Logs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
