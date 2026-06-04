/* global React, Eyebrow, EventTypes, EventRow, Mailing, Icon, Tag */
function Events({ openEvent }) {
  const [filter, setFilter] = React.useState('ALL');
  const kinds = ['ALL', 'CONNECT', 'REFLECT', 'LEARN'];
  const list = filter === 'ALL' ? window.EVENTS : window.EVENTS.filter((e) => e.kind === filter);
  return (
    <React.Fragment>
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', top: -280, left: '50%', transform: 'translateX(-50%)', width: 900, height: 560,
          background: 'radial-gradient(circle at 50% 50%, rgba(238,74,28,0.16), transparent 64%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 28px 40px', position: 'relative' }}>
          <Eyebrow style={{ marginBottom: 14 }}>GATHER WITH US</Eyebrow>
          <h1 style={{ fontSize: 'clamp(2.2rem, 1.4rem + 2.4vw, 3.4rem)', margin: 0 }}>Past &amp; upcoming events</h1>
        </div>
      </section>

      <EventTypes />

      <section style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 28px 80px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
            {kinds.map((k) => (
              <button key={k} onClick={() => setFilter(k)} style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em',
                padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1.5px solid ' + (filter === k ? 'var(--primary)' : 'var(--border-strong)'),
                background: filter === k ? 'var(--primary)' : 'transparent', color: filter === k ? '#fff' : 'var(--fg-muted)', transition: 'var(--transition)' }}>{k}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {list.map((e, i) => <EventRow key={i} e={e} onOpen={openEvent} />)}
          </div>
        </div>
      </section>

      <Mailing />
    </React.Fragment>
  );
}
window.Events = Events;
