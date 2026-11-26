import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function PrivacyPage() {
  return (
    <div className="app-shell">
      <header className="app-top">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={34} />
          <span className="h" style={{ fontSize: 24 }}>Khata Saathi</span>
        </Link>
        <Link className="btn sm" to="/app">Open my khata</Link>
      </header>
      <main className="wrap" style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 780 }}>
        <div className="card">
          <p className="lab" style={{ margin: '0 0 8px', color: 'var(--grn)' }}>Privacy Policy</p>
          <h1 className="h" style={{ fontSize: 38, marginBottom: 18 }}>Your book stays yours.</h1>
          <p>
            <strong>Local-first storage:</strong> All customer names, balances, and ledger transactions stay on the
            device or server you run. Khata Saathi does not sell, share, or upload your khata to third-party ad
            networks.
          </p>
          <p>
            <strong>No analytics tracking:</strong> Khata Saathi does not run behavioral analytics or tracking pixels.
          </p>
          <p>
            <strong>Voice input:</strong> When you use the microphone button, speech recognition uses your browser&apos;s
            built-in Web Speech API. You can always type entries instead.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Draft-only reminders:</strong> WhatsApp reminders are prepared as drafts on your screen. Nothing is
            sent unless you tap <em>Open in WhatsApp</em> and send it yourself.
          </p>
        </div>
      </main>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="app-shell">
      <header className="app-top">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={34} />
          <span className="h" style={{ fontSize: 24 }}>Khata Saathi</span>
        </Link>
        <Link className="btn sm" to="/app">Open my khata</Link>
      </header>
      <main className="wrap" style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 780 }}>
        <div className="card">
          <p className="lab" style={{ margin: '0 0 8px', color: 'var(--grn)' }}>Terms of Use</p>
          <h1 className="h" style={{ fontSize: 38, marginBottom: 18 }}>Simple terms for shopkeepers.</h1>
          <p>
            <strong>Record-keeping tool only:</strong> Khata Saathi is a digital udhaar-khata notebook. It is{' '}
            <strong>not</strong> a bank, payment processor, or financial/tax advisor.
          </p>
          <p>
            <strong>You confirm every entry:</strong> Voice and text parsing only proposes an entry. You are responsible
            for checking the customer name, type, and amount before tapping <em>Confirm</em>.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Backups:</strong> You can export customer ledgers to CSV or download a full JSON backup at any time.
            Keep regular backups of your database file.
          </p>
        </div>
      </main>
    </div>
  );
}
