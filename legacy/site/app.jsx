/* global React, ReactDOM, Nav, Home, Events, Simple, EventDetail, Footer */
function App() {
  const [view, setView] = React.useState('home');
  const [event, setEvent] = React.useState(null);
  const openEvent = (e) => { setEvent(e); setView('detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  // nav between top-level views resets the active state highlight
  const navView = view === 'detail' ? 'events' : view;
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
  return (
    <React.Fragment>
      <Nav view={navView} setView={setView} />
      {view === 'home' && <Home setView={setView} openEvent={openEvent} />}
      {view === 'events' && <Events openEvent={openEvent} />}
      {view === 'detail' && <EventDetail event={event} setView={setView} openEvent={openEvent} />}
      {(view === 'volunteer' || view === 'donate') && <Simple kind={view} setView={setView} />}
      <Footer setView={setView} />
    </React.Fragment>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
