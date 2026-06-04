/* global React, Eyebrow, Btn, Tag, Icon, Mark */
// Shared building blocks used by Home & Events.

function EventTypes() {
  return (
    <section style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '76px 28px' }}>
        <Eyebrow style={{ marginBottom: 14 }}>OUR EVENT TYPES</Eyebrow>
        <h2 style={{ fontSize: 'var(--text-3xl)', margin: '0 0 36px', maxWidth: '20ch' }}>Three ways we show up for each other.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="types-grid">
          {window.EVENT_TYPES.map((t) => (
            <div key={t.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 26px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 50, height: 50, borderRadius: '999px 999px 14px 14px',
                  background: t.tone === 'teal' ? 'var(--teal-50)' : t.tone === 'honey' ? 'var(--honey-100)' : 'var(--orange-50)',
                  color: t.tone === 'teal' ? 'var(--teal-700)' : t.tone === 'honey' ? 'var(--honey-700)' : 'var(--primary)' }}>
                  <Icon name={t.icon} size={24} />
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--border-strong)' }}>{t.n}</span>
              </div>
              <h3 style={{ fontSize: 24, margin: '0 0 10px' }}>{t.name}</h3>
              <p style={{ fontSize: 15, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.55 }}>{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventRow({ e, onOpen }) {
  const tone = window.KIND_TONE[e.kind];
  const open = e.status === 'open';
  return (
    <article onClick={() => onOpen && onOpen(e)} style={{ display: 'grid', gridTemplateColumns: '108px 1fr auto', gap: 24, alignItems: 'center', cursor: onOpen ? 'pointer' : 'default',
      padding: '22px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }} className="event-row"
      onMouseEnter={(ev) => { if (onOpen) ev.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={(ev) => { ev.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
      <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: 16 }} className="event-date">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--fg-subtle)' }}>{e.day}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1.05, color: 'var(--neutral-950)' }}>{e.date}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-subtle)' }}>{e.year}</div>
      </div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <Tag tone={tone} style={{ fontSize: 10 }}>{e.kind}</Tag>
          {open && <Tag tone="flame" style={{ fontSize: 10, background: 'var(--success-bg)', color: 'var(--success)' }}>RSVP OPEN</Tag>}
        </div>
        <h3 style={{ fontSize: 20, margin: '0 0 6px', lineHeight: 1.15 }}>{e.title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', color: 'var(--fg-muted)', fontSize: 13.5, marginBottom: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={14} />{e.where}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={14} />{e.time}</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, maxWidth: '62ch' }}>{e.desc}</p>
      </div>
      <div className="event-cta">
        {open
          ? <Btn variant="primary" iconRight="arrow-right" onClick={(ev) => { ev.stopPropagation(); onOpen && onOpen(e); }}>RSVP</Btn>
          : <Btn variant="secondary" onClick={(ev) => { ev.stopPropagation(); onOpen && onOpen(e); }}>Details</Btn>}
      </div>
    </article>
  );
}

function Mailing() {
  const [done, setDone] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const submit = (e) => { e.preventDefault(); if (email.includes('@')) setDone(true); };
  const inputStyle = { fontFamily: 'var(--font-sans)', fontSize: 15, padding: '13px 15px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.95)', color: 'var(--neutral-950)', width: '100%', boxSizing: 'border-box' };
  return (
    <section id="mailing" style={{ background: 'var(--neutral-950)', color: 'var(--fg-on-dark)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: -320, left: '50%', transform: 'translateX(-50%)', width: 1000, height: 620,
        background: 'radial-gradient(circle at 50% 50%, rgba(238,74,28,0.30), rgba(231,163,60,0.12) 42%, transparent 68%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '88px 28px', position: 'relative', textAlign: 'center' }}>
        <div style={{ display: 'inline-grid', placeItems: 'center', width: 70, height: 70, borderRadius: '999px 999px 16px 16px', background: 'rgba(255,255,255,.06)', marginBottom: 22 }}>
          <Mark variant="orange" height={38} />
        </div>
        <h2 style={{ fontSize: 'var(--text-3xl)', color: '#fff', margin: '0 0 14px' }}>Don't miss out! Join our mailing list.</h2>
        <p style={{ fontSize: 17, color: 'rgba(247,242,236,.72)', maxWidth: '46ch', margin: '0 auto 30px' }}>
          Be the first to know about future events, and receive educational content from our ATX UXR community.
        </p>
        {done ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(47,158,106,.16)', color: '#7fe0ab', border: '1px solid rgba(47,158,106,.4)', padding: '15px 24px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
            <Icon name="check-circle" size={22} /> You're on the list — welcome to the community.
          </div>
        ) : (
          <form onSubmit={submit} style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input style={inputStyle} placeholder="First name *" required />
              <input style={inputStyle} placeholder="Last name" />
            </div>
            <input style={{ ...inputStyle, marginBottom: 14 }} type="email" placeholder="Email *" required value={email} onChange={(ev) => setEmail(ev.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(247,242,236,.8)', marginBottom: 18 }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} /> I want to subscribe to your mailing list.
            </label>
            <Btn variant="primary" size="lg" type="submit" icon="send" style={{ width: '100%', justifyContent: 'center' }}>Join</Btn>
          </form>
        )}
      </div>
    </section>
  );
}

Object.assign(window, { EventTypes, EventRow, Mailing });
