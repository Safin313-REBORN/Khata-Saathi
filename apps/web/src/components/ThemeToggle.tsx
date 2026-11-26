import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('khata-theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('khata-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      type="button"
      className="btn sm"
      onClick={() => setDark((d) => !d)}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light ledger theme' : 'Switch to dark ledger theme'}
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
