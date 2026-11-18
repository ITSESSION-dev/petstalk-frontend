import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Avatar, Spinner, IconBtn, Chip, CardHead } from '../components/Ui.jsx';
import Icon from '../components/Icon.jsx';
import { SIMULATIONS, EVENT_LABELS, eventMeta, daysUntil, formatDate } from '../constants.js';
import Agenda from './Agenda.jsx';
import Preferences from './Preferences.jsx';
import PetForm from './PetForm.jsx';

const TABS = [
  { key: 'today', label: 'Inicio', icon: 'home' },
  { key: 'chat', label: 'Mensajes', icon: 'chat' },
  { key: 'agenda', label: 'Agenda', icon: 'calendar' },
  { key: 'prefs', label: 'Avisos', icon: 'bell' },
  { key: 'profile', label: 'Ficha', icon: 'paw' }
];

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export default function PetHome({ pet, user, canGoBack, onBack, onPetChange, onPetDeleted, onReload, onLogout, notify }) {
  const [tab, setTab] = useState('today');
  const [history, setHistory] = useState(null);
  const [agenda, setAgenda] = useState(null);
  const [sending, setSending] = useState('');

  const loadHistory = useCallback(async () => {
    try { setHistory(await api.history(pet.id, 60)); } catch { setHistory([]); }
  }, [pet.id]);

  const loadAgenda = useCallback(async () => {
    try { setAgenda(await api.listAgenda(pet.id)); } catch { setAgenda([]); }
  }, [pet.id]);

  useEffect(() => { setHistory(null); setAgenda(null); loadHistory(); loadAgenda(); }, [loadHistory, loadAgenda]);

  // Refresco periódico: muestra en vivo cuando el dueño responde por WhatsApp ("ya la paseé")
  useEffect(() => {
    if (tab !== 'today' && tab !== 'chat') return;
    const t = setInterval(() => { onReload(); loadHistory(); }, 15000);
    return () => clearInterval(t);
  }, [tab, onReload, loadHistory]);

  async function simulate(sim) {
    setSending(sim.type);
    try {
      const res = await api.trigger(pet.id, sim.type, sim.context || '');
      notify(res.status === 'sent' ? `${pet.name} te escribió por WhatsApp 📲` : 'Mensaje generado, pero WhatsApp no está conectado');
      await loadHistory();
    } catch (e) {
      notify(e.message);
    } finally {
      setSending('');
    }
  }

  async function deletePet() {
    if (!window.confirm(`¿Seguro que querés dar de baja a ${pet.name}? Va a dejar de enviarte mensajes.`)) return;
    try {
      await api.deletePet(pet.id);
      notify(`${pet.name} fue dado de baja`);
      onPetDeleted();
    } catch (e) { notify(e.message); }
  }

  const first = user.name.split(' ')[0];

  return (
    <>
      <header className="topbar">
        <div className="row" style={{ gap: 10 }}>
          {canGoBack && <IconBtn icon="left" onClick={onBack} title="Mis mascotas" />}
          <div className="hello"><b>Hola, {first} 👋</b><small>¿Cómo está {pet.name} hoy?</small></div>
        </div>
        <IconBtn icon="logout" onClick={onLogout} title="Salir" />
      </header>

      <main className="content">
        {tab === 'today' && (
          <Today pet={pet} first={first} history={history} agenda={agenda} sending={sending}
            onSimulate={simulate} goTo={setTab} />
        )}
        {tab === 'chat' && <Chat pet={pet} history={history} />}
        {tab === 'agenda' && <Agenda pet={pet} events={agenda} onChange={loadAgenda} notify={notify} />}
        {tab === 'prefs' && <Preferences pet={pet} notify={notify} />}
        {tab === 'profile' && (
          <>
            <h1 className="page-title">Ficha de {pet.name}</h1>
            <p className="page-sub">Sus datos, su personalidad y su veterinario.</p>
            <PetForm embedded pet={pet} notify={notify}
              onSaved={(p) => { onPetChange(p); notify('Cambios guardados ✅'); }}
              onDelete={deletePet} />
          </>
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
            <Icon name={t.icon} size={22} />{t.label}
          </button>
        ))}
      </nav>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Today({ pet, first, history, agenda, sending, onSimulate, goTo }) {
  const lastMsg = history?.[0];
  const thought = lastMsg?.message_text || pet.last_thought || `¡Hola ${first}! Soy ${pet.name}. Desde ahora te voy a escribir por WhatsApp 🐾`;

  const tasks = [
    { done: pet.walked_today, label: 'Paseo', icon: 'walk', tint: 'teal' },
    { done: pet.fed_today, label: 'Comida', icon: 'bowl', tint: 'peach' },
    { done: pet.watered_today, label: 'Agua', icon: 'drop', tint: 'sky' }
  ];
  const pct = Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);

  // Mensajes por día de los últimos 7 días (datos reales del historial)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
    const n = (history || []).filter((m) => new Date(m.sent_at).toDateString() === d.toDateString()).length;
    return { label: DAYS[d.getDay()], n, today: i === 6 };
  });
  const max = Math.max(3, ...week.map((w) => w.n));
  const todayCount = week[6].n;

  const upcoming = (agenda || []).filter((e) => daysUntil(e.event_date) >= 0).slice(0, 3);

  return (
    <>
      <div className="card pet-card">
        <Avatar pet={pet} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="thought" key={thought}>
            <div className="who"><Icon name="chat" size={12} />{pet.name} dice</div>
            {thought}
          </div>
        </div>
      </div>

      <div className="card">
        <CardHead title="Su día" />
        <div className="progress">
          <Ring pct={pct} />
          <div className="stat-list">
            {tasks.map((t) => (
              <div className="stat" key={t.label}>
                <span className={`ic-wrap t-${t.tint}`}><Icon name={t.icon} size={15} /></span>{t.label}
                <span className={`v ${t.done ? 'ok' : 'pend'}`}>{t.done ? 'Listo' : 'Pendiente'}</span>
              </div>
            ))}
            <div className="stat">
              <span className="ic-wrap t-lilac"><Icon name="chat" size={15} /></span>Mensajes
              <span className="v">{todayCount} hoy</span>
            </div>
          </div>
        </div>
        <p className="muted" style={{ margin: '14px 0 0' }}>Respondele por WhatsApp (ej: <i>"ya la paseé"</i>) y se actualiza solo.</p>
      </div>

      <div className="card">
        <CardHead title="Actividad semanal" action="Ver chat" onAction={() => goTo('chat')} />
        <div className="bars">
          {week.map((w, i) => (
            <div key={i} className={`bar ${w.today ? 'today' : ''}`}>
              {w.n > 0 && <b className="n">{w.n}</b>}
              <i style={{ height: `${Math.max(10, (w.n / max) * 78)}%` }} />
              <span>{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <CardHead title="Simular el collar" />
        <p className="muted" style={{ margin: '-6px 0 12px' }}>Elegí una situación y {pet.name} te escribe al instante.</p>
        <div className="grid2">
          {SIMULATIONS.map((s) => (
            <button key={s.type} className="qa" disabled={!!sending} onClick={() => onSimulate(s)}>
              {sending === s.type ? <span className="chip-ic t-teal"><span className="spinner" style={{ width: 16, height: 16, margin: 0, borderWidth: 2 }} /></span> : <Chip icon={s.icon} tint={s.tint} size={17} />}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <CardHead title="Próximos cuidados" action="Agenda" onAction={() => goTo('agenda')} />
        {!agenda ? <Spinner /> : upcoming.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No hay nada cargado. Agregá su próxima vacuna o pipeta y {pet.name} te lo recuerda.</p>
        ) : upcoming.map((e) => {
          const m = eventMeta(e.event_type); const d = daysUntil(e.event_date);
          return (
            <div className="item" key={e.id}>
              <Chip icon={m.icon} tint={m.tint} />
              <div><div className="t">{e.title}</div><div className="s">{formatDate(e.event_date)}</div></div>
              <div className={`when ${d <= 7 ? 'soon' : ''}`}>{d === 0 ? '¡Hoy!' : `en ${d} días`}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Ring({ pct }) {
  const r = 46; const c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#49c2a3" /><stop offset="1" stopColor="#2e9e84" />
          </linearGradient>
        </defs>
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(46,158,132,.12)" strokeWidth="11" />
        <circle cx="56" cy="56" r={r} fill="none" stroke="url(#rg)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .6s' }} />
      </svg>
      <div className="val"><div><b>{pct}%</b><small>cumplido</small></div></div>
    </div>
  );
}

function Chat({ pet, history }) {
  const msgs = history ? [...history].reverse() : null;
  let lastDay = '';
  return (
    <>
      <h1 className="page-title">Mensajes</h1>
      <p className="page-sub">Todo lo que {pet.name} te escribió por WhatsApp.</p>
      <div className="wa">
        <div className="wa-head">
          <Avatar pet={pet} size="sm" />
          <div><b>{pet.name}</b><small>en línea · Pet's Talk</small></div>
        </div>
        <div className="wa-body">
          {!msgs ? <Spinner /> : msgs.length === 0 ? (
            <div className="wa-empty">Todavía no hay mensajes. Andá a <b>Inicio</b> y simulá una situación para que {pet.name} te escriba.</div>
          ) : msgs.map((m) => {
            const day = new Date(m.sent_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
            const showDay = day !== lastDay; lastDay = day;
            return (
              <div key={m.id} style={{ display: 'contents' }}>
                {showDay && <div className="wa-day">{day}</div>}
                <div className={`wa-msg ${m.status === 'failed' ? 'failed' : ''}`}>
                  <div className="tag">{EVENT_LABELS[m.event_type] || m.event_type}{m.status === 'failed' ? ' · no enviado' : ''}</div>
                  <div>{m.message_text}</div>
                  <time>{new Date(m.sent_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
