import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

function LegalShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.title = `${eyebrow} · Khata Saathi`;
  }, [eyebrow]);

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
        <nav aria-label="Breadcrumb" style={{ marginBottom: 14, fontSize: 14, color: 'var(--stone)' }}>
          <Link to="/" style={{ textDecoration: 'underline' }}>Home</Link>
          {' / '}
          <span aria-current="page">{eyebrow}</span>
        </nav>
        <div className="card">
          <p className="lab" style={{ margin: '0 0 8px', color: 'var(--grn)' }}>{eyebrow}</p>
          <h1 className="h" style={{ fontSize: 38, marginBottom: 18 }}>{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell eyebrow="Privacy Policy" title="Your book stays yours.">
      <p>
        <strong>Minimal data collection:</strong> Khata Saathi only stores what is needed for your ledger: customer
        names, optional phone numbers, and confirmed transaction amounts/notes.
      </p>
      <p>
        <strong>Local-first storage &amp; no third-party tracking SDKs:</strong> Data stays on the device or server you
        run. There are no analytics SDKs, ad trackers, or third-party data brokers.
      </p>
      <p>
        <strong>Voice input:</strong> When you tap the microphone, speech recognition uses your browser&apos;s built-in
        Web Speech API. Typing is always available.
      </p>
      <p>
        <strong>Draft-only reminders:</strong> WhatsApp reminders are prepared as drafts. Nothing is sent unless you tap{' '}
        <em>Open in WhatsApp</em> yourself.
      </p>
      <p>
        <strong>Age notice:</strong> Khata Saathi is a shopkeeper business tool and is not directed at children under 13.
      </p>
      <p style={{ marginBottom: 0 }}>
        <strong>Data deletion requests:</strong> Because your ledger runs locally on your SQLite database, you can delete
        all data at any time by removing your local <code>storage/khata.db</code> file or resetting via your server
        admin.
      </p>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell eyebrow="Terms of Service" title="Simple terms for shopkeepers.">
      <p>
        <strong>Record-keeping tool only:</strong> Khata Saathi is a digital udhaar-khata notebook. It is{' '}
        <strong>not</strong> a bank, payment processor, or financial/tax advisor.
      </p>
      <p>
        <strong>You confirm every entry:</strong> Voice and text parsing only proposes an entry. You are responsible for
        checking the customer name, type, and amount before tapping <em>Confirm</em>.
      </p>
      <p>
        <strong>Business &amp; project details:</strong> Built for National Hackathon 2026 (Pakistan) under the MIT
        License. Source code and documentation are self-hosted by the shopkeeper.
      </p>
      <p style={{ marginBottom: 0 }}>
        <strong>Backups:</strong> You can export customer ledgers to CSV or download a full JSON backup at any time.
      </p>
    </LegalShell>
  );
}

export function CookiePolicyPage() {
  return (
    <LegalShell eyebrow="Cookie Policy" title="No tracking cookies.">
      <p>
        <strong>Zero advertising or analytics cookies:</strong> Khata Saathi does not set tracking, advertising, or
        cross-site cookies.
      </p>
      <p style={{ marginBottom: 0 }}>
        <strong>Essential local storage only:</strong> The browser only stores your light/dark theme preference (
        <code>khata-theme</code>) and offline PWA cache for reading your ledger without internet.
      </p>
    </LegalShell>
  );
}

export function RefundPolicyPage() {
  return (
    <LegalShell eyebrow="Refund Policy" title="Free &amp; open-source software.">
      <p>
        <strong>No fees or subscriptions:</strong> Khata Saathi is free, open-source software (MIT License) with no paid
        tiers, hidden fees, or in-app purchases.
      </p>
      <p style={{ marginBottom: 0 }}>
        <strong>Not a payment processor:</strong> Customer <em>udhaar</em> and <em>wapis</em> entries record cash or
        external transfers made at your shop; Khata Saathi does not process payments or hold funds.
      </p>
    </LegalShell>
  );
}
