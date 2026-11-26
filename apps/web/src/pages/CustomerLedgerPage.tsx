import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  api,
  formatPlain,
  formatRs,
  type Customer,
  type CustomerSummary,
  type LedgerRow,
  type ReminderDraft,
} from '../api/client';

function formatShortDate(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function CustomerLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);

  const [lang, setLang] = useState<'roman' | 'ur' | 'en'>('roman');
  const [tone, setTone] = useState<'friendly' | 'polite' | 'firm'>('polite');
  const [reminder, setReminder] = useState<ReminderDraft | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getCustomerLedger(id);
      setCustomer(data.customer);
      setSummary(data.summary);
      setRows(data.rows);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load customer ledger.');
    }
  }, [id]);

  const loadReminder = useCallback(async () => {
    if (!id) return;
    try {
      const draft = await api.getReminder(id, lang, tone);
      setReminder(draft);
    } catch {
      // ignore
    }
  }, [id, lang, tone]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    loadReminder();
  }, [loadReminder]);

  const lastActiveRow = [...rows]
    .reverse()
    .find((r) => !r.isReversed && !r.reversedTxId);

  const handleUndo = async (txId: string) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await api.undoTransaction(txId, 'Undo from customer ledger');
      await loadLedger();
      await loadReminder();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not undo entry.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!reminder) return;
    try {
      await navigator.clipboard.writeText(reminder.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg('Could not copy to clipboard.');
    }
  };

  if (!customer || !summary) {
    return (
      <div className="app-shell" style={{ padding: 36 }}>
        <p>{errorMsg || 'Loading customer ledger...'}</p>
        <Link className="btn" to="/app">Back to dashboard</Link>
      </div>
    );
  }

  const sinceDate = new Date(customer.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="app-shell">
      <header className="app-top no-print">
        <Link to="/app" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#17261F"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All customers
        </Link>

        <span className="h" style={{ fontSize: 24 }}>Khata Saathi</span>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a className="btn sm" href={`/api/customers/${customer.id}/export.csv`}>
            Export CSV
          </a>
          <button type="button" className="btn sm" onClick={() => window.print()}>
            Print statement
          </button>
        </div>
      </header>

      <div className="ledger-main">
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p className="lab" style={{ margin: '0 0 6px', color: 'var(--stone)' }}>
                Customer · since {sinceDate}
              </p>
              <h1 className="h" style={{ fontSize: 44 }}>{customer.name}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="lab" style={{ margin: 0, color: 'var(--stone)' }}>Balance to collect</p>
              <p
                className="mono"
                style={{
                  margin: 0,
                  fontSize: 38,
                  color: summary.balance > 0 ? 'var(--brk)' : 'var(--grn)',
                }}
              >
                {formatRs(summary.balance)}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                border: '2px solid var(--brk)',
                background: '#FDECEC',
                color: 'var(--brk)',
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div className="card" style={{ marginTop: 20, padding: '12px 18px 8px' }}>
            <div className="table-wrap">
              <table className="ledger-table" aria-label={`${customer.name} ledger`}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Note</th>
                    <th>Type</th>
                    <th className="r">Amount</th>
                    <th className="r">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={r.isReversed ? 'reversed' : ''}>
                      <td className="mono">{formatShortDate(r.occurredAt)}</td>
                      <td>{r.note}</td>
                      <td>
                        <span className={`tag ${r.type === 'udhaar' ? 'o' : r.type === 'wapis' ? 'g' : ''}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="r mono">{formatPlain(r.amount)}</td>
                      <td className="r mono"><b>{formatPlain(r.runningBalance)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 12, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--stone)' }}>
              Append-only history. Every balance is calculated by code from the rows above.
            </p>
            {lastActiveRow && (
              <button
                type="button"
                className="btn sm no-print"
                onClick={() => handleUndo(lastActiveRow.id)}
                disabled={busy}
              >
                Undo last entry ({formatRs(lastActiveRow.amount)})
              </button>
            )}
          </div>
        </section>

        <aside className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <h2 className="h" style={{ fontSize: 24, marginBottom: 12 }}>Reminder draft</h2>

            <div className="seg" role="group" aria-label="Language">
              <button type="button" className={lang === 'roman' ? 'on' : ''} onClick={() => setLang('roman')}>
                Roman Urdu
              </button>
              <button type="button" className={lang === 'ur' ? 'on' : ''} onClick={() => setLang('ur')} lang="ur">
                اردو
              </button>
              <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>
                English
              </button>
            </div>

            <div className="seg" role="group" aria-label="Tone" style={{ marginTop: 10 }}>
              <button type="button" className={tone === 'friendly' ? 'on' : ''} onClick={() => setTone('friendly')}>
                Friendly
              </button>
              <button type="button" className={tone === 'polite' ? 'on' : ''} onClick={() => setTone('polite')}>
                Polite
              </button>
              <button type="button" className={tone === 'firm' ? 'on' : ''} onClick={() => setTone('firm')}>
                Firm
              </button>
            </div>

            <div
              className={`msg-draft ${lang === 'ur' ? 'ur' : ''}`}
              lang={lang === 'ur' ? 'ur' : 'en'}
              dir={lang === 'ur' ? 'rtl' : 'ltr'}
              style={{ marginTop: 16 }}
            >
              {reminder?.text ?? 'Loading reminder draft...'}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <a
                className="btn p"
                href={reminder?.whatsappUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in WhatsApp
              </a>
              <button type="button" className="btn" onClick={handleCopy} disabled={!reminder}>
                {copied ? 'Copied!' : 'Copy text'}
              </button>
            </div>

            <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--stone)' }}>
              Reminders are drafts; nothing is sent without your tap.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--tgrn)' }}>
            <h2 className="h" style={{ fontSize: 22, marginBottom: 8 }}>Payment pattern</h2>
            <p style={{ margin: 0 }}>
              {summary.paymentPattern.hint
                ? summary.paymentPattern.hint
                : `Not enough settled cycles yet (${summary.paymentPattern.dataPoints}/3 data points).`}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
