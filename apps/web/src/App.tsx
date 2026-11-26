import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const CustomerLedgerPage = lazy(() =>
  import('./pages/CustomerLedgerPage').then((m) => ({ default: m.CustomerLedgerPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.TermsPage }))
);
const CookiePolicyPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.CookiePolicyPage }))
);
const RefundPolicyPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.RefundPolicyPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="wrap" style={{ padding: 36 }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/customers/:id" element={<CustomerLedgerPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/refunds" element={<RefundPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
