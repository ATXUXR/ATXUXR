/* global React, Wordmark, Btn, Icon */
function Nav({ view, setView }) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [['Home', 'home'], ['Events', 'events'], ['Volunteer', 'volunteer'], ['Donate', 'donate']];
  const go = (v) => { setView(v); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(248,244,238,0.85)' : 'rgba(248,244,238,0)',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent', transition: 'var(--transition)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px', height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); go('home'); }} style={{ display: 'flex' }}><Wordmark height={30} /></a>
        <nav className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {links.map(([l, v]) => (
            <a key={v} href="#" onClick={(e) => { e.preventDefault(); go(v); }}
              style={{ fontSize: 15, fontWeight: 600, color: view === v ? 'var(--primary)' : 'var(--fg)', position: 'relative' }}>
              {l}
              {view === v && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -6, height: 2, background: 'var(--primary)', borderRadius: 2 }} />}
            </a>
          ))}
          <Btn variant="primary" size="sm" icon="mail" onClick={() => { const el = document.getElementById('mailing'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Join list</Btn>
        </nav>
        <button className="nav-burger" onClick={() => setOpen(!open)} aria-label="Menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg)' }}><Icon name={open ? 'x' : 'menu'} size={26} /></button>
      </div>
      {open && (
        <div style={{ padding: '8px 28px 22px', borderTop: '1px solid var(--border)', background: 'var(--paper)' }}>
          {links.map(([l, v]) => <a key={v} href="#" onClick={(e) => { e.preventDefault(); go(v); }} style={{ display: 'block', padding: '12px 0', fontSize: 17, fontWeight: 600, borderBottom: '1px solid var(--border)', color: view === v ? 'var(--primary)' : 'var(--fg)' }}>{l}</a>)}
        </div>
      )}
    </header>
  );
}
window.Nav = Nav;
