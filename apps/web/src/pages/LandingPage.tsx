import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatRs, type CustomerSummary, type ShopSummary } from '../api/client';
import { Logo } from '../components/Logo';

export function LandingPage() {
  const [shop, setShop] = useState<ShopSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    api.getShop().then(setShop).catch(() => undefined);
    api.getCustomers().then((r) => setCustomers(r.customers.slice(0, 4))).catch(() => undefined);
  }, []);

  const totalToCollect = shop ? formatRs(shop.totalToCollect) : 'Rs 18,450';

  return (
    <div>
      <header style={{ borderBottom: '2px solid var(--ink)' }}>
        <div
          className="wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 18,
            paddingBottom: 18,
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Khata Saathi home">
            <Logo size={38} />
            <span className="h" style={{ fontSize: 26 }}>Khata Saathi</span>
            <span className="ur" lang="ur" dir="rtl" style={{ fontSize: 17, color: 'var(--stone)' }}>
              کھاتہ ساتھی
            </span>
          </Link>
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#how" style={{ fontWeight: 700 }}>How it works</a>
            <a href="#book" style={{ fontWeight: 700 }}>The khata</a>
            <a href="#trust" style={{ fontWeight: 700 }}>Why trust it</a>
            <Link className="btn p" to="/app">Open my khata</Link>
          </nav>
        </div>
      </header>

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
        <span>Khata Saathi · National Hackathon 2026</span>
        <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/privacy" style={{ textDecoration: 'underline' }}>Privacy</Link>
          <Link to="/terms" style={{ textDecoration: 'underline' }}>Terms</Link>
          <span>Not financial advice; not a payment system.</span>
        </span>
      </footer>
    </div>
  );
}
