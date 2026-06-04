/* global React, Eyebrow, Btn, Tag, Icon, Mark, EventRow */
function EventDetail({ event, setView, openEvent }) {
  const e = event || window.EVENTS[0];
  const tone = window.KIND_TONE[e.kind];
  const open = e.status === 'open';
  const grad = { teal: 'linear-gradient(150deg,#5FB7A6,#0F7E6C)', honey: 'linear-gradient(150deg,#F2C879,#E7A33C)', flame: 'linear-gradient(150deg,#F87545,#EE4A1C)' }[tone];
  const related = window.EVENTS.filter((x) => x.title !== e.title).slice(0, 2);

  return (
    <React.Fragment>
      {/* breadcrumb + banner */}
      <section style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 28px 0' }}>
          <button onClick={() => { setView('events'); window.scrollTo({ top: 0 }); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--fg-muted)' }}>
            <Icon name="arrow-left" size={16} /> All events
          </button>
        </div>
        <div style={{ maxWidth: 1140, margin: '14px auto 0', padding: '0 28px' }}>
          <div style={{ height: 240, borderRadius: 'var(--radius-2xl)', background: grad, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: 28 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 80% 0%, rgba(255,255,255,.30), transparent 55%)' }} />
            <div style={{ position: 'absolute', top: -30, right: 26, opacity: 0.22 }}><Mark variant="white" height={200} /></div>
            <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
              <Tag tone="ink" style={{ fontSize: 11 }}>{e.kind}</Tag>
              {open
                ? <Tag tone="flame" style={{ fontSize: 11, background: 'var(--success)', color: '#fff' }}>RSVP OPEN</Tag>
                : <Tag tone="flame" style={{ fontSize: 11, background: 'rgba(33,30,34,.55)', color: '#fff' }}>RSVP CLOSED</Tag>}
            </div>
          </div>
        </div>
      </section>

      {/* body */}
      <section style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 28px 80px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 44, alignItems: 'start' }} className="detail-grid">
          {/* left: content */}
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 1.4rem + 2vw, 3rem)', margin: '0 0 20px', lineHeight: 1.05 }}>{e.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 30 }}>
              <Fact icon="calendar" label={`${e.day} · ${e.date}, ${e.year}`} />
              <Fact icon="clock" label={e.time} />
              <Fact icon="map-pin" label={e.where} />
            </div>
            <h3 style={{ fontSize: 20, margin: '0 0 10px' }}>About this event</h3>
            <p style={{ fontSize: 16.5, color: 'var(--fg-muted)', lineHeight: 1.65, maxWidth: '62ch' }}>{e.desc}</p>
            <p style={{ fontSize: 16.5, color: 'var(--fg-muted)', lineHeight: 1.65, maxWidth: '62ch' }}>
              All ATX UXR gatherings are free and open to researchers at every level — students, job-seekers, and seasoned
              practitioners alike. Come as you are, bring a question, and meet the people-people of ATX.
            </p>

            {/* location block */}
            <h3 style={{ fontSize: 20, margin: '32px 0 12px' }}>Location</h3>
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ height: 150, background: 'repeating-linear-gradient(45deg, var(--sand), var(--sand) 14px, var(--neutral-100) 14px, var(--neutral-100) 28px)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-100%)', color: 'var(--primary)' }}><Icon name="map-pin" size={40} /></span>
              </div>
              <div style={{ background: 'var(--surface)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{e.where}</span>
                <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--orange-700)' }}>Get directions <Icon name="external-link" size={15} /></a>
              </div>
            </div>

            {/* share */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 30 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-subtle)' }}>Share</span>
              {['share-2', 'link', 'mail'].map((ic) => (
                <a key={ic} href="#" style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg-muted)' }}><Icon name={ic} size={17} /></a>
              ))}
            </div>
          </div>

          {/* right: RSVP card (sticky) */}
          <div style={{ position: 'sticky', top: 92 }} className="rsvp-card">
            <RSVPCard event={e} open={open} />
          </div>
        </div>
      </section>

      {/* related */}
      <section style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 28px' }}>
          <Eyebrow style={{ marginBottom: 14 }}>MORE GATHERINGS</Eyebrow>
          <h2 style={{ fontSize: 'var(--text-2xl)', margin: '0 0 26px' }}>You might also like</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {related.map((r, i) => <EventRow key={i} e={r} onOpen={openEvent} />)}
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}

function Fact({ icon, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-pill)', padding: '8px 15px', fontSize: 14, fontWeight: 600 }}>
      <span style={{ color: 'var(--primary)' }}><Icon name={icon} size={16} /></span>{label}
    </span>
  );
}

function RSVPCard({ event, open }) {
  const [done, setDone] = React.useState(false);
  const [guests, setGuests] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const inputStyle = { fontFamily: 'var(--font-sans)', fontSize: 15, padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)', width: '100%', boxSizing: 'border-box' };
  const submit = (ev) => { ev.preventDefault(); if (email.includes('@')) setDone(true); };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--neutral-950)', color: '#fff', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--orange-300)' }}>{event.day} · {event.date}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, whiteSpace: 'nowrap' }}>{event.time}</div>
        </div>
        <span style={{ width: 42, height: 42, borderRadius: '999px 999px 0 0', background: 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center' }}><Mark variant="white" height={22} /></span>
      </div>

      <div style={{ padding: 22 }}>
        {!open ? (
          <div style={{ textAlign: 'center', padding: '14px 6px' }}>
            <span style={{ display: 'inline-grid', placeItems: 'center', width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-sunk)', color: 'var(--fg-muted)', marginBottom: 14 }}><Icon name="calendar-x" size={26} /></span>
            <h4 style={{ fontSize: 19, margin: '0 0 6px' }}>RSVP is closed</h4>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: '0 0 18px' }}>This event has already happened — but more are on the way.</p>
            <Btn variant="ink" icon="calendar-heart" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.open('https://www.meetup.com/atxuxr/', '_blank')}>See upcoming on Meetup</Btn>
          </div>
        ) : done ? (
          <div style={{ textAlign: 'center', padding: '14px 6px' }}>
            <span style={{ display: 'inline-grid', placeItems: 'center', width: 56, height: 56, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', marginBottom: 14 }}><Icon name="check" size={30} /></span>
            <h4 style={{ fontSize: 20, margin: '0 0 6px' }}>You're going! 🎉</h4>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: '0 0 18px' }}>We sent the details to your inbox. {guests > 1 ? `Saved ${guests} spots.` : 'See you there.'}</p>
            <Btn variant="secondary" icon="calendar-plus" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.downloadICS(event)}>Add to calendar</Btn>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Save your spot</div>
            <input style={inputStyle} placeholder="Full name *" required />
            <input style={inputStyle} type="email" placeholder="Email *" required value={email} onChange={(ev) => setEmail(ev.target.value)} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>Guests</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)', width: 'fit-content', overflow: 'hidden' }}>
                <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} style={{ border: 'none', background: 'var(--surface-sunk)', cursor: 'pointer', width: 40, height: 40, fontSize: 20, color: 'var(--fg)' }}>–</button>
                <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{guests}</span>
                <button type="button" onClick={() => setGuests((g) => Math.min(9, g + 1))} style={{ border: 'none', background: 'var(--surface-sunk)', cursor: 'pointer', width: 40, height: 40, fontSize: 20, color: 'var(--fg)' }}>+</button>
              </div>
            </div>
            <Btn variant="primary" size="lg" type="submit" icon="calendar-check" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>RSVP — it's free</Btn>
            <p style={{ fontSize: 12, color: 'var(--fg-subtle)', textAlign: 'center', margin: 0 }}>Free for everyone · cancel anytime</p>
          </form>
        )}
      </div>
    </div>
  );
}

window.EventDetail = EventDetail;
