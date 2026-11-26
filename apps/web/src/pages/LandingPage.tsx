import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatRs, type CustomerSummary, type ShopSummary } from '../api/client';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';

export function LandingPage() {
  const [shop, setShop] = useState<ShopSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.getShop().then(setShop).catch(() => undefined);
    api.getCustomers().then((r) => setCustomers(r.customers.slice(0, 4))).catch(() => undefined);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrollPct(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
      setShowTop(window.scrollY > 320);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalToCollect = shop ? formatRs(shop.totalToCollect) : 'Rs 18,450';

  return (
    <div>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="scroll-progress" style={{ width: `${scrollPct}%` }} aria-hidden="true" />

      <header className="sticky-header">
        <div
          className="wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 14,
            paddingBottom: 14,
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Khata Saathi home">
            <Logo size={38} />
            <span className="h" style={{ fontSize: 26 }}>Khata Saathi</span>
            <span className="ur" lang="ur" dir="rtl" style={{ fontSize: 17, color: 'var(--stone)' }}>
              کھاتہ ساتھی
            </span>
          </Link>

          <nav className="desktop-nav" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#how" style={{ fontWeight: 700 }}>How it works</a>
            <a href="#book" style={{ fontWeight: 700 }}>The khata</a>
            <a href="#trust" style={{ fontWeight: 700 }}>Why trust it</a>
            <a href="#faq" style={{ fontWeight: 700 }}>FAQ</a>
            <ThemeToggle />
            <Link className="btn p" to="/app">Open my khata</Link>
          </nav>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="mobile-menu-btn">
            <ThemeToggle />
            <button
              type="button"
              className="btn sm"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu-drawer"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-menu-drawer"
            className="wrap"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingBottom: 16,
              borderTop: '1.5px solid var(--line)',
              paddingTop: 12,
            }}
          >
            <a href="#how" onClick={() => setMenuOpen(false)} style={{ fontWeight: 700 }}>How it works</a>
            <a href="#book" onClick={() => setMenuOpen(false)} style={{ fontWeight: 700 }}>The khata</a>
            <a href="#trust" onClick={() => setMenuOpen(false)} style={{ fontWeight: 700 }}>Why trust it</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} style={{ fontWeight: 700 }}>FAQ</a>
            <Link className="btn p" to="/app" onClick={() => setMenuOpen(false)}>Open my khata</Link>
          </nav>
        )}
      </header>

      <main id="main-content">

      <section className="wrap" style={{ paddingTop: 60, paddingBottom: 88 }}>
        <div className="split">
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>
            <p className="lab rise" style={{ margin: '0 0 16px', color: 'var(--stone)' }}>
              For kiryana shops, tailors, tutors and home businesses
            </p>
            <h1 className="h rise d1" style={{ fontSize: 'clamp(44px, 6vw, 82px)' }}>
              Bolo. Khata likh jaye.
            </h1>
            <p className="rise d2" style={{ fontSize: 21, maxWidth: 540, margin: '24px 0 32px' }}>
              Say &ldquo;Ali ko 500 ka udhaar likh do&rdquo; in Urdu or Roman Urdu. Khata Saathi writes the entry,
              checks the amount with you, and reminds customers politely when money is due.
            </p>
            <div className="rise d3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link className="btn p lg" to="/app">Try it with sample data</Link>
              <Link className="btn lg" to="/app?view=mobile">Open shop counter</Link>
            </div>
          </div>

          <div style={{ flex: '1 1 440px', minWidth: 0 }}>
            <div className="card" style={{ padding: 24, background: 'var(--led)' }}>
              <p className="lab" style={{ margin: '0 0 14px', color: 'var(--stone)' }}>Today · Shop counter</p>
              <div className="bub" style={{ display: 'flex', gap: 14, alignItems: 'center', maxWidth: '100%' }}>
                <div className="wave" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i /><i />
                </div>
                <div>
                  <b>&ldquo;Ali ko 500 ka udhaar likh do&rdquo;</b>
                  <div className="lab" style={{ color: 'var(--stone)', marginTop: 2 }}>Voice · 0:03</div>
                </div>
              </div>

              <div className="entry-pop tgrn" style={{ marginTop: 16 }}>
                <p className="lab" style={{ margin: '0 0 8px', color: 'var(--grn)' }}>I understood</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 18px' }}>
                  <span style={{ color: 'var(--stone)' }}>Customer</span><b>Ali Raza</b>
                  <span style={{ color: 'var(--stone)' }}>Type</span><b>Udhaar (credit given)</b>
                  <span style={{ color: 'var(--stone)' }}>Amount</span><b className="mono" style={{ fontSize: 22 }}>Rs 500</b>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
                  <Link className="btn p sm" to="/app">Confirm</Link>
                  <Link className="btn sm" to="/app">Edit</Link>
                  <span className="tick mono" style={{ color: 'var(--grn)', marginLeft: 'auto' }}>Saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
        <div
          className="wrap"
          style={{
            paddingTop: 22,
            paddingBottom: 22,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <span className="lab">Urdu &amp; Roman Urdu</span>
          <span className="lab">Voice or typing</span>
          <span className="lab">You confirm every entry</span>
          <span className="lab">Polite reminders</span>
          <span className="lab">Works on any phone</span>
        </div>
      </section>

      <section id="how" className="wrap" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <h2 className="h" style={{ fontSize: 'clamp(34px, 4.4vw, 56px)', marginBottom: 14 }}>
          Three steps. No typing columns.
        </h2>
        <p style={{ maxWidth: 600, margin: '0 0 40px', color: 'var(--stone)' }}>
          Shopkeepers are busy at the counter. Khata Saathi works at the speed of a sentence.
        </p>
        <div className="grid3">
          <div className="card">
            <p className="lab" style={{ margin: 0, color: 'var(--grn)' }}>1 · Bolo</p>
            <h3 className="h" style={{ fontSize: 28, margin: '10px 0' }}>Say or type it</h3>
            <p style={{ margin: 0 }}>
              &ldquo;Bilal ne 300 wapis kiye.&rdquo; &ldquo;Sara ko 1,200 ka suit udhaar.&rdquo; Natural sentences,
              any mix of Urdu and English.
            </p>
          </div>
          <div className="card">
            <p className="lab" style={{ margin: 0, color: 'var(--grn)' }}>2 · Check</p>
            <h3 className="h" style={{ fontSize: 28, margin: '10px 0' }}>Confirm in one tap</h3>
            <p style={{ margin: 0 }}>
              The amount and name are read back to you. Nothing is saved until you press Confirm.
            </p>
          </div>
          <div className="card">
            <p className="lab" style={{ margin: 0, color: 'var(--grn)' }}>3 · Yaad dihani</p>
            <h3 className="h" style={{ fontSize: 28, margin: '10px 0' }}>Remind, politely</h3>
            <p style={{ margin: 0 }}>
              A ready-to-send message in the customer&apos;s language, with the exact amount and date.
            </p>
          </div>
        </div>
      </section>

      <section
        id="book"
        style={{
          background: 'var(--paper)',
          borderTop: '2px solid var(--ink)',
          borderBottom: '2px solid var(--ink)',
        }}
      >
        <div className="wrap" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <div className="split">
            <div style={{ flex: '1 1 420px', minWidth: 0 }}>
              <p className="lab" style={{ color: 'var(--stone)', margin: '0 0 14px' }}>The khata</p>
              <h2 className="h" style={{ fontSize: 'clamp(34px, 4vw, 52px)' }}>Who owes what, at a glance.</h2>
              <p style={{ margin: '22px 0 0', maxWidth: 500 }}>
                One list of customers, sorted by who needs a reminder first. Open anyone to see their full history
                and a statement you can share.
              </p>
            </div>
            <div className="card" style={{ flex: '1 1 460px', minWidth: 0, background: 'var(--led)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <span className="h" style={{ fontSize: 26 }}>Total to collect</span>
                <span className="mono" style={{ fontSize: 30, color: 'var(--brk)' }}>{totalToCollect}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                {customers.length > 0 ? (
                  customers.map((c, idx) => (
                    <Link
                      key={c.customer.id}
                      to={`/app/customers/${c.customer.id}`}
                      className="row"
                      style={idx === customers.length - 1 ? { borderBottom: 0 } : undefined}
                    >
                      <b>{c.customer.name}</b>
                      <span className="mono" style={{ color: c.balance > 0 ? 'var(--brk)' : 'var(--grn)' }}>
                        {formatRs(c.balance)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <>
                    <div className="row"><b>Ali Raza</b><span className="mono" style={{ color: 'var(--brk)' }}>Rs 2,500</span></div>
                    <div className="row"><b>Hina Traders</b><span className="mono" style={{ color: 'var(--brk)' }}>Rs 9,950</span></div>
                    <div className="row"><b>Bilal Ahmed</b><span className="mono" style={{ color: 'var(--brk)' }}>Rs 4,800</span></div>
                    <div className="row" style={{ borderBottom: 0 }}><b>Sara Khan</b><span className="mono" style={{ color: 'var(--brk)' }}>Rs 1,200</span></div>
                  </>
                )}
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--stone)' }}>
                {shop ? `Live data · ${shop.shopName}` : 'Sample data.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="wrap" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <h2 className="h" style={{ fontSize: 'clamp(34px, 4.4vw, 56px)', marginBottom: 40 }}>
          Money needs care.
        </h2>
        <div className="grid3">
          <div className="card" style={{ boxShadow: '8px 8px 0 var(--grn)' }}>
            <h3 className="h" style={{ fontSize: 26, margin: '0 0 10px' }}>The code counts, not the AI</h3>
            <p style={{ margin: 0 }}>
              Amounts and balances are calculated by plain code. AI only helps understand the sentence.
            </p>
          </div>
          <div className="card" style={{ boxShadow: '8px 8px 0 var(--saf)' }}>
            <h3 className="h" style={{ fontSize: 26, margin: '0 0 10px' }}>You always confirm</h3>
            <p style={{ margin: 0 }}>
              Every entry is read back first. Mistakes can be undone and every change is in the history.
            </p>
          </div>
          <div className="card" style={{ boxShadow: '8px 8px 0 var(--brk)' }}>
            <h3 className="h" style={{ fontSize: 26, margin: '0 0 10px' }}>Your book stays yours</h3>
            <p style={{ margin: 0 }}>
              Export to a spreadsheet at any time. Reminders are drafts; nothing is sent without your tap.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <h2 className="h" style={{ fontSize: 'clamp(30px, 3.8vw, 46px)', marginBottom: 24 }}>
          Common questions
        </h2>
        <div style={{ display: 'grid', gap: 14, maxWidth: 820 }}>
          <details className="faq-item">
            <summary>Does Khata Saathi work without an internet connection or cloud account?</summary>
            <p style={{ margin: '10px 0 0', color: 'var(--stone)' }}>
              Yes. Everything runs locally on SQLite and deterministic TypeScript code with no cloud account required,
              and the PWA caches your ledger for offline reading.
            </p>
          </details>
          <details className="faq-item">
            <summary>Can I fix a mistake after confirming an entry?</summary>
            <p style={{ margin: '10px 0 0', color: 'var(--stone)' }}>
              Yes. Open the customer&apos;s ledger and tap Undo last entry. It appends a reversing adjustment so the
              history stays complete and transparent.
            </p>
          </details>
          <details className="faq-item">
            <summary>Are WhatsApp reminders sent automatically?</summary>
            <p style={{ margin: '10px 0 0', color: 'var(--stone)' }}>
              Never. Reminders are drafts only; nothing is sent until you tap Open in WhatsApp or Copy text yourself.
            </p>
          </details>
        </div>
      </section>

      <section style={{ background: 'var(--grn)', color: '#fff', borderTop: '2px solid var(--ink)' }}>
        <div
          className="wrap"
          style={{
            paddingTop: 72,
            paddingBottom: 72,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 className="h" style={{ fontSize: 'clamp(32px, 4.4vw, 54px)', maxWidth: 700 }}>
            Put the register down. Just say it.
          </h2>
          <Link className="btn lg" to="/app" style={{ color: 'var(--ink)' }}>Open my khata</Link>
        </div>
      </section>
      </main>

      <footer
        className="wrap"
        style={{
          paddingTop: 28,
          paddingBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          color: 'var(--stone)',
          fontSize: 15,
        }}
      >
        <span>Khata Saathi · National Hackathon 2026 · Last updated: 27 Nov 2026</span>
        <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/privacy" style={{ textDecoration: 'underline' }}>Privacy</Link>
          <Link to="/terms" style={{ textDecoration: 'underline' }}>Terms</Link>
          <Link to="/cookies" style={{ textDecoration: 'underline' }}>Cookies</Link>
          <Link to="/refunds" style={{ textDecoration: 'underline' }}>Refunds</Link>
          <span>Not financial advice; not a payment system.</span>
        </span>
      </footer>

      {showTop && (
        <button
          type="button"
          className="btn sm back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          Top
        </button>
      )}
    </div>
  );
}
