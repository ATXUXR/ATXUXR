/* global React, Eyebrow, Btn, Icon, Mark, Mailing */
// Volunteer & Donate — real forms recreated from austinuxresearchers.com.

const fieldStyle = { fontFamily: 'var(--font-sans)', fontSize: 15, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)', width: '100%', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13.5, marginBottom: 6, color: 'var(--fg)' };

function PageHero({ icon, eyebrow, title, sub }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -280, left: '50%', transform: 'translateX(-50%)', width: 900, height: 540,
        background: 'radial-gradient(circle at 50% 50%, rgba(238,74,28,0.16), transparent 64%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '76px 28px 8px', position: 'relative', textAlign: 'center' }}>
        <span style={{ display: 'inline-grid', placeItems: 'center', width: 70, height: 70, borderRadius: '999px 999px 18px 18px', background: 'var(--primary)', color: '#fff', marginBottom: 22 }}>
          <Icon name={icon} size={34} />
        </span>
        <Eyebrow style={{ marginBottom: 14 }}>{eyebrow}</Eyebrow>
        <h1 style={{ fontSize: 'clamp(2rem, 1.4rem + 2vw, 3rem)', margin: 0 }}>{title}</h1>
        <p className="lead" style={{ fontSize: 18, maxWidth: '48ch', margin: '18px auto 0' }}>{sub}</p>
      </div>
    </section>
  );
}

function Card({ children }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '30px 30px 32px' }}>{children}</div>
  );
}

function Volunteer({ setView }) {
  const [role, setRole] = React.useState('');
  const [done, setDone] = React.useState(false);
  const roles = ['Volunteering as a mentor / educator', 'Volunteering my time for event organization', 'Volunteering to facilitate connections & resources', 'Other'];
  const submit = (e) => { e.preventDefault(); setDone(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <React.Fragment>
      <PageHero icon="hand-heart" eyebrow="JOIN THE FUN"
        title="Sign up to volunteer for future events" 
        sub="We're looking for volunteers to help us grow and expand our reach. Let us know if you'd like to join the fun." />
      <section style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '36px 28px 80px' }}>
          <Card>
            {done ? (
              <div style={{ textAlign: 'center', padding: '12px 4px' }}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 60, height: 60, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', marginBottom: 16 }}><Icon name="check" size={32} /></span>
                <h3 style={{ fontSize: 22, margin: '0 0 8px' }}>Thank you for stepping up! 🙌</h3>
                <p style={{ fontSize: 15, color: 'var(--fg-muted)', margin: '0 0 20px' }}>We'll be in touch about how you can help. The community is better with you in it.</p>
                <Btn variant="secondary" onClick={() => setView('events')}>Browse events</Btn>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={labelStyle}>Email</label><input style={fieldStyle} type="email" placeholder="you@example.com" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={labelStyle}>First name *</label><input style={fieldStyle} required /></div>
                  <div><label style={labelStyle}>Last name *</label><input style={fieldStyle} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={labelStyle}>Company <span style={{ color: 'var(--fg-subtle)', fontWeight: 400 }}>(most recent)</span></label><input style={fieldStyle} /></div>
                  <div><label style={labelStyle}>Position <span style={{ color: 'var(--fg-subtle)', fontWeight: 400 }}>(most recent)</span></label><input style={fieldStyle} /></div>
                </div>
                <div>
                  <label style={labelStyle}>How would you like to join the fun? *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
                    {roles.map((r) => {
                      const on = role === r;
                      return (
                        <button type="button" key={r} onClick={() => setRole(r)} style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'),
                          background: on ? 'var(--orange-50)' : 'var(--surface)', transition: 'var(--transition)' }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', flex: 'none', border: '2px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'), display: 'grid', placeItems: 'center' }}>
                            {on && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)' }} />}
                          </span>
                          <span style={{ fontSize: 14.5, fontWeight: on ? 600 : 400, color: 'var(--fg)' }}>{r}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Btn variant="primary" size="lg" type="submit" icon="send" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>Submit</Btn>
              </form>
            )}
          </Card>
        </div>
      </section>
      <Mailing />
    </React.Fragment>
  );
}

function Donate({ setView }) {
  const [amount, setAmount] = React.useState(25);
  const [custom, setCustom] = React.useState('');
  const [done, setDone] = React.useState(false);
  const presets = [10, 25, 50, 100];
  const submit = (e) => { e.preventDefault(); setDone(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const value = custom || amount;
  return (
    <React.Fragment>
      <PageHero icon="heart-handshake" eyebrow="SUPPORT OUR COMMUNITY"
        title="Leave a one-time donation"
        sub="We keep our events free and accessible. Your gift covers venues, food, accessibility, and the tools that bring Austin's researchers together." />
      <section style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '36px 28px 80px' }}>
          <Card>
            {done ? (
              <div style={{ textAlign: 'center', padding: '12px 4px' }}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 60, height: 60, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', marginBottom: 16 }}><Icon name="heart" size={30} /></span>
                <h3 style={{ fontSize: 22, margin: '0 0 8px' }}>Thank you for helping us make a difference!</h3>
                <p style={{ fontSize: 15, color: 'var(--fg-muted)', margin: '0 0 20px' }}>Your ${value} donation keeps ATX UXR free and open for everyone.</p>
                <Btn variant="secondary" onClick={() => setView('events')}>Browse events</Btn>
              </div>
            ) : (
              <React.Fragment>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div><label style={labelStyle}>First name</label><input style={fieldStyle} /></div>
                    <div><label style={labelStyle}>Last name</label><input style={fieldStyle} /></div>
                  </div>
                  <div><label style={labelStyle}>Email</label><input style={fieldStyle} type="email" placeholder="you@example.com" /></div>
                  <div>
                    <label style={labelStyle}>Amount</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      {presets.map((p) => {
                        const on = !custom && amount === p;
                        return <button type="button" key={p} onClick={() => { setAmount(p); setCustom(''); }} style={{ cursor: 'pointer', flex: '1 1 0', minWidth: 64, padding: '11px 0', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
                          border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--border-strong)'), background: on ? 'var(--primary)' : 'var(--surface)', color: on ? '#fff' : 'var(--fg)', transition: 'var(--transition)' }}>${p}</button>;
                      })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <span style={{ padding: '12px 16px', background: 'var(--surface-sunk)', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--fg-muted)' }}>$</span>
                      <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Other amount"
                        style={{ ...fieldStyle, border: 'none', borderRadius: 0 }} inputMode="numeric" />
                    </div>
                  </div>
                  <Btn variant="primary" size="lg" type="submit" icon="heart" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>{`Donate $${value}`}</Btn>
                </form>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--fg-subtle)' }}>OR</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <a href="https://www.venmo.com/u/MaralElliott" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <Btn variant="ink" size="lg" icon="external-link" style={{ width: '100%', justifyContent: 'center' }}>Donate on Venmo</Btn>
                </a>
              </React.Fragment>
            )}
          </Card>
        </div>
      </section>
      <Mailing />
    </React.Fragment>
  );
}

function Simple({ kind, setView }) {
  return kind === 'donate' ? <Donate setView={setView} /> : <Volunteer setView={setView} />;
}
window.Simple = Simple;
