import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CustomerLedgerPage } from './pages/CustomerLedgerPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/customers/:id" element={<CustomerLedgerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
