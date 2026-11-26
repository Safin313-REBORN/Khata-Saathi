import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  formatPlain,
  formatRs,
  type CustomerSummary,
  type ParseResult,
  type ShopSummary,
} from '../api/client';
import { Logo } from '../components/Logo';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface PendingConfirm {
  sourceText: string;
  parsed: ParseResult;
  customerId: string;
  customerName: string;
  type: 'udhaar' | 'wapis';
  amountText: string;
  note: string;
  occurredAt: string;
  editing: boolean;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export function DashboardPage() {
  const [shop, setShop] = useState<ShopSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'bolo' | 'customers' | 'reminders'>('bolo');

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Assalam o Alaikum! Say or type an entry like "Ali ko 500 ka udhaar likh do" or "Sara ne 400 wapis kiye".',
    },
  ]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'ur-PK' | 'en-IN'>('ur-PK');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [shopData, custData] = await Promise.all([api.getShop(), api.getCustomers()]);
      setShop(shopData);
      setCustomers(custData.customers);
      if (custData.customers.length > 0 && !selectedId) {
        setSelectedId(custData.customers[0].customer.id);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load khata data.');
    }
  }, [selectedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleParse = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || busy) return;

    setErrorMsg(null);
    setBusy(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
    setInputText('');

    try {
      const parsed = await api.parseSentence(trimmed);
      const matchedCustomer = customers.find((c) => c.customer.id === parsed.matchedCustomerId);
      const resolvedName = matchedCustomer?.customer.name ?? parsed.customer ?? '';
      const resolvedType: 'udhaar' | 'wapis' = parsed.type === 'wapis' ? 'wapis' : 'udhaar';

      const needsEdit =
        !resolvedName ||
        parsed.amount === null ||
        parsed.type === null ||
        parsed.ambiguities.length > 0;

      setPending({
        sourceText: trimmed,
        parsed,
        customerId: matchedCustomer?.customer.id ?? '',
        customerName: resolvedName,
        type: resolvedType,
        amountText: parsed.amount !== null ? String(parsed.amount) : '',
        note: parsed.note ?? trimmed,
        occurredAt: parsed.date ?? new Date().toISOString().slice(0, 10),
        editing: needsEdit,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse sentence.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending || busy) return;
    const amountNum = Number(pending.amountText);
    if (!Number.isInteger(amountNum) || amountNum <= 0) {
      setErrorMsg('Amount must be a whole number in Rupees (no decimals).');
      return;
    }
    if (!pending.customerName.trim() && !pending.customerId) {
      setErrorMsg('Please select or enter a customer name.');
      return;
    }

    setErrorMsg(null);
    setBusy(true);
    try {
      const res = await api.createTransaction({
        customerId: pending.customerId || undefined,
        customerName: pending.customerId ? undefined : pending.customerName.trim(),
        type: pending.type,
        amount: amountNum,
        note: pending.note.trim() || pending.sourceText,
        occurredAt: pending.occurredAt,
        sourceText: pending.sourceText,
      });

      const label = pending.type === 'udhaar' ? 'udhaar' : 'wapis';
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `Saved: ${pending.customerName} — ${formatRs(amountNum)} (${label}). New balance is ${formatRs(res.newBalance)}.`,
        },
      ]);
      setPending(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save entry.');
    } finally {
      setBusy(false);
    }
  };

  const toggleVoice = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorMsg('Voice input is not supported in this browser. Please type your sentence below.');
      return;
    }

    const rec = new SpeechRec();
    rec.lang = speechLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setInputText(transcript);
        handleParse(transcript);
      }
    };
    rec.onerror = (ev) => {
      setErrorMsg(`Voice input error (${ev.error}). You can type your entry instead.`);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    recognitionRef.current = rec;
    setErrorMsg(null);
    setListening(true);
    rec.start();
  };

  const handleSeed = async () => {
    setBusy(true);
    try {
      await api.seedDemo();
      await loadData();
      setMessages((prev) => [
        ...prev,
        { id: `seed-${Date.now()}`, role: 'assistant', text: 'Demo data loaded for Rizwan General Store.' },
      ]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load demo data.');
    } finally {
      setBusy(false);
    }
  };

  const selectedSummary = customers.find((c) => c.customer.id === selectedId) ?? customers[0] ?? null;
  const remindersList = customers.filter((c) => c.balance > 0);

  // Compute live proposed balance for read-back card
  const matchedForBalance = customers.find((c) => c.customer.id === pending?.customerId);
  const baseBalance = matchedForBalance?.balance ?? 0;
  const parsedAmt = Number(pending?.amountText);
  const liveProposedBalance =
    pending && Number.isInteger(parsedAmt) && parsedAmt > 0
      ? baseBalance + (pending.type === 'udhaar' ? parsedAmt : -parsedAmt)
      : null;

  return (
    <div className="app-shell">
      <header className="app-top">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }} aria-label="Khata Saathi home">
          <Logo size={34} />
          <span className="h" style={{ fontSize: 24 }}>Khata Saathi</span>
        </Link>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="lab" style={{ color: 'var(--stone)' }}>
            {shop ? `${shop.shopName} · ${shop.location}` : 'Rizwan General Store · Sahiwal'}
          </span>
          <button type="button" className="btn sm" onClick={handleSeed} disabled={busy}>
            Seed demo data
          </button>
          {selectedSummary && (
            <Link className="btn sm p" to={`/app/customers/${selectedSummary.customer.id}`}>
              Open {selectedSummary.customer.name.split(' ')[0]}&apos;s ledger
            </Link>
          )}
        </div>
      </header>

      {/* Mobile summary strip matching Mobile.dc.html */}
      <div className="card mobile-summary-card">
        <div>
          <p className="lab" style={{ margin: 0, color: 'var(--stone)' }}>Total to collect</p>
          <p className="mono" style={{ margin: 0, fontSize: 28, color: 'var(--brk)' }}>
            {shop ? formatRs(shop.totalToCollect) : 'Rs 0'}
          </p>
        </div>
        <span className="mono" style={{ fontSize: 13, color: 'var(--stone)', textAlign: 'right' }}>
          {shop ? `${shop.customerCount} customers` : '0 customers'}
          <br />
          {shop ? `${shop.needsReminderCount} need a reminder` : ''}
        </span>
      </div>

      <div className="app-body">
        {/* Left pane: Customers sorted by reminder urgency */}
        <nav
          className={`pane-list ${mobileTab !== 'customers' ? 'pane-hidden-mobile' : ''}`}
          aria-label="Customers"
        >
          <p className="lab" style={{ margin: '0 0 6px', color: 'var(--stone)' }}>
            Customers · to collect first
          </p>
          {customers.map((c) => {
            const isSelected = selectedSummary?.customer.id === c.customer.id;
            return (
              <div key={c.customer.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className={`cust ${isSelected ? 'on' : ''}`}
                  onClick={() => setSelectedId(c.customer.id)}
                >
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                    <span className="avatar" aria-hidden="true">
                      {c.customer.name.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.customer.name}
                      </b>
                      <span style={{ fontSize: 14, color: 'var(--stone)' }}>{c.dueStatusLabel}</span>
                    </span>
                  </span>
                  <span
                    className="mono"
                    style={{ color: c.balance > 0 ? 'var(--brk)' : 'var(--grn)', flexShrink: 0 }}
                  >
                    {formatPlain(c.balance)}
                  </span>
                </button>
                <Link
                  to={`/app/customers/${c.customer.id}`}
                  className="btn sm"
                  aria-label={`Open ${c.customer.name} ledger`}
                  style={{ flexShrink: 0 }}
                >
                  Open
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Center pane: Voice / text entry + read-back Confirm card */}
        <main className={`pane-chat ${mobileTab !== 'bolo' ? 'pane-hidden-mobile' : ''}`}>
          <p className="lab" style={{ margin: 0, color: 'var(--stone)', textAlign: 'center' }}>Today</p>

          <div className="chat-feed">
            {messages.map((m) => (
              <div key={m.id} className={`bub ${m.role === 'user' ? 'me' : ''}`}>
                {m.role === 'user' ? <b>&ldquo;{m.text}&rdquo;</b> : m.text}
              </div>
            ))}

            {pending && (
              <div className="entry-pop" role="region" aria-label="Confirm ledger entry">
                <p className="lab" style={{ margin: '0 0 8px', color: 'var(--grn)' }}>
                  {pending.parsed.ambiguities.length > 0
                    ? 'Please check or clarify before saving'
                    : 'I understood. Please check.'}
                </p>

                {pending.parsed.ambiguities.length > 0 && (
                  <div
                    style={{
                      background: '#FFF4DE',
                      border: '1.5px solid var(--ink)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  >
                    {pending.parsed.ambiguities.map((amb, i) => (
                      <div key={i}>{amb}</div>
                    ))}
                    {pending.parsed.customerCandidates && pending.parsed.customerCandidates.length > 1 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {pending.parsed.customerCandidates.map((cand) => (
                          <button
                            key={cand.id}
                            type="button"
                            className="btn sm"
                            onClick={() =>
                              setPending({
                                ...pending,
                                customerId: cand.id,
                                customerName: cand.name,
                              })
                            }
                          >
                            {cand.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!pending.editing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 18px' }}>
                    <span style={{ color: 'var(--stone)' }}>Customer</span>
                    <b>{pending.customerName || 'New customer'}</b>
                    <span style={{ color: 'var(--stone)' }}>Type</span>
                    <b>{pending.type === 'udhaar' ? 'Udhaar (credit given)' : 'Wapis (payment received)'}</b>
                    <span style={{ color: 'var(--stone)' }}>Amount</span>
                    <b className="mono" style={{ fontSize: 22 }}>
                      {parsedAmt > 0 ? formatRs(parsedAmt) : '—'}
                    </b>
                    <span style={{ color: 'var(--stone)' }}>New balance</span>
                    <b className="mono">
                      {liveProposedBalance !== null ? formatRs(liveProposedBalance) : '—'}
                    </b>
                    {pending.note && (
                      <>
                        <span style={{ color: 'var(--stone)' }}>Note</span>
                        <span>{pending.note}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <label style={{ display: 'grid', gap: 4 }}>
                      <span className="lab" style={{ color: 'var(--stone)' }}>Customer</span>
                      <select
                        value={pending.customerId}
                        onChange={(e) => {
                          const found = customers.find((c) => c.customer.id === e.target.value);
                          setPending({
                            ...pending,
                            customerId: e.target.value,
                            customerName: found ? found.customer.name : pending.customerName,
                          });
                        }}
                        style={{
                          minHeight: 48,
                          padding: '0 12px',
                          border: '2px solid var(--ink)',
                          borderRadius: 8,
                          fontSize: 16,
                          background: '#fff',
                        }}
                      >
                        <option value="">-- New customer (type below) --</option>
                        {customers.map((c) => (
                          <option key={c.customer.id} value={c.customer.id}>
                            {c.customer.name} ({formatRs(c.balance)})
                          </option>
                        ))}
                      </select>
                    </label>
                    {!pending.customerId && (
                      <label style={{ display: 'grid', gap: 4 }}>
                        <span className="lab" style={{ color: 'var(--stone)' }}>New customer name</span>
                        <input
                          type="text"
                          value={pending.customerName}
                          onChange={(e) => setPending({ ...pending, customerName: e.target.value })}
                          style={{
                            minHeight: 48,
                            padding: '0 12px',
                            border: '2px solid var(--ink)',
                            borderRadius: 8,
                            fontSize: 16,
                          }}
                        />
                      </label>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <label style={{ display: 'grid', gap: 4 }}>
                        <span className="lab" style={{ color: 'var(--stone)' }}>Type</span>
                        <select
                          value={pending.type}
                          onChange={(e) =>
                            setPending({ ...pending, type: e.target.value as 'udhaar' | 'wapis' })
                          }
                          style={{
                            minHeight: 48,
                            padding: '0 12px',
                            border: '2px solid var(--ink)',
                            borderRadius: 8,
                            fontSize: 16,
                            background: '#fff',
                          }}
                        >
                          <option value="udhaar">Udhaar (credit given)</option>
                          <option value="wapis">Wapis (payment received)</option>
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 4 }}>
                        <span className="lab" style={{ color: 'var(--stone)' }}>Amount (Rs)</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={pending.amountText}
                          onChange={(e) => setPending({ ...pending, amountText: e.target.value })}
                          style={{
                            minHeight: 48,
                            padding: '0 12px',
                            border: '2px solid var(--ink)',
                            borderRadius: 8,
                            fontSize: 16,
                          }}
                        />
                      </label>
                    </div>
                    <label style={{ display: 'grid', gap: 4 }}>
                      <span className="lab" style={{ color: 'var(--stone)' }}>Note</span>
                      <input
                        type="text"
                        value={pending.note}
                        onChange={(e) => setPending({ ...pending, note: e.target.value })}
                        style={{
                          minHeight: 48,
                          padding: '0 12px',
                          border: '2px solid var(--ink)',
                          borderRadius: 8,
                          fontSize: 16,
                        }}
                      />
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  <button type="button" className="btn p" onClick={handleConfirm} disabled={busy}>
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setPending({ ...pending, editing: !pending.editing })}
                  >
                    {pending.editing ? 'Preview' : 'Edit'}
                  </button>
                  <button type="button" className="btn" onClick={() => setPending(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              role="alert"
              style={{
                border: '2px solid var(--brk)',
                background: '#FDECEC',
                color: 'var(--brk)',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Quick-try examples */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn sm"
              onClick={() => handleParse('Ali ko 500 ka udhaar likh do')}
            >
              &ldquo;Ali ko 500 ka udhaar likh do&rdquo;
            </button>
            <button
              type="button"
              className="btn sm"
              onClick={() => handleParse('Sara ne 400 wapis kiye')}
            >
              &ldquo;Sara ne 400 wapis kiye&rdquo;
            </button>
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleParse(inputText);
            }}
          >
            <input
              aria-label="Type or say an entry"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Say or type: Bilal ko 250 ka saman diya"
            />
            <button
              type="button"
              className="btn sm"
              onClick={() => setSpeechLang((l) => (l === 'ur-PK' ? 'en-IN' : 'ur-PK'))}
              aria-label={`Voice language ${speechLang}, click to switch`}
              title="Switch voice recognition language"
            >
              {speechLang === 'ur-PK' ? 'UR' : 'EN'}
            </button>
            <button
              type="button"
              className={`mic ${listening ? 'listening' : ''}`}
              onClick={toggleVoice}
              aria-label={listening ? 'Stop voice recording' : 'Record voice'}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#17261F"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
            <button type="submit" className="btn p" disabled={busy || !inputText.trim()}>
              Send
            </button>
          </form>
        </main>

        {/* Right pane: Shop summary & Needs a reminder */}
        <aside
          className={`pane-right ${mobileTab === 'reminders' ? 'pane-visible-mobile' : ''}`}
          aria-label="Summary"
        >
          <h2 className="h" style={{ fontSize: 24 }}>This month</h2>
          <div className="stat">
            <p className="lab" style={{ margin: 0, color: 'var(--stone)' }}>Total to collect</p>
            <p className="mono" style={{ margin: '4px 0 0', fontSize: 32, color: 'var(--brk)' }}>
              {shop ? formatRs(shop.totalToCollect) : 'Rs 0'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="stat">
              <p className="lab" style={{ margin: 0, color: 'var(--stone)' }}>Given</p>
              <p className="mono" style={{ margin: '4px 0 0', fontSize: 20 }}>
                {shop ? formatRs(shop.totalGiven) : 'Rs 0'}
              </p>
            </div>
            <div className="stat">
              <p className="lab" style={{ margin: 0, color: 'var(--stone)' }}>Received</p>
              <p className="mono" style={{ margin: '4px 0 0', fontSize: 20, color: 'var(--grn)' }}>
                {shop ? formatRs(shop.totalReceived) : 'Rs 0'}
              </p>
            </div>
          </div>

          <h3 className="h" style={{ fontSize: 20, marginTop: 4 }}>Needs a reminder</h3>
          {remindersList.map((c) => (
            <div className="row" key={c.customer.id}>
              <span>
                <b>{c.customer.name}</b>
                <br />
                <span className="mono" style={{ fontSize: 13, color: 'var(--brk)' }}>
                  {formatRs(c.balance)}
                </span>
              </span>
              <Link className="btn sm" to={`/app/customers/${c.customer.id}`}>Draft</Link>
            </div>
          ))}

          <p style={{ margin: 'auto 0 0', fontSize: 13, color: 'var(--stone)' }}>
            Totals are added up by code, never by AI. Reminders are drafts; nothing is sent without your tap.
          </p>
        </aside>
      </div>

      {/* Mobile bottom nav matching Mobile.dc.html */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          type="button"
          className={mobileTab === 'bolo' ? 'on' : ''}
          onClick={() => setMobileTab('bolo')}
        >
          Bolo
        </button>
        <button
          type="button"
          className={mobileTab === 'customers' ? 'on' : ''}
          onClick={() => setMobileTab('customers')}
        >
          Customers
        </button>
        <button
          type="button"
          className={mobileTab === 'reminders' ? 'on' : ''}
          onClick={() => setMobileTab('reminders')}
        >
          Reminders
        </button>
      </nav>
    </div>
  );
}
