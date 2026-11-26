import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function NotFoundPage() {
  return (
    <div className="app-shell">
      <header className="app-top">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={34} />
          <span className="h" style={{ fontSize: 24 }}>Khata Saathi</span>
        </Link>
      </header>
      <main className="wrap" style={{ paddingTop: 72, paddingBottom: 72, maxWidth: 640 }}>
        <div className="card">
          <p className="lab" style={{ margin: '0 0 8px', color: 'var(--brk)' }}>404 · Page not found</p>
          <h1 className="h" style={{ fontSize: 38, marginBottom: 14 }}>This khata page does not exist.</h1>
          <p style={{ color: 'var(--stone)', margin: '0 0 24px' }}>
            The link you opened may be old or mistyped. You can go back to your shop dashboard or the home page.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="btn p" to="/app">Open my khata</Link>
            <Link className="btn" to="/">Go home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
