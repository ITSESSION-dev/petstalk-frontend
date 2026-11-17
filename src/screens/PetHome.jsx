import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { TopBar, Avatar, Brand, Spinner } from '../components/Ui.jsx';
import { SIMULATIONS, EVENT_LABELS, eventMeta, daysUntil, formatDate, formatTime } from '../constants.js';
import Agenda from './Agenda.jsx';
import Preferences from './Preferences.jsx';
import PetForm from './PetForm.jsx';

const TABS = [
  { key: 'today', label: 'Hoy', emoji: '🏠' },
  { key: 'chat', label: 'Mensajes', emoji: '💬' },
  { key: 'agenda', label: 'Agenda', emoji: '📅' },
  { key: 'prefs', label: 'Avisos', emoji: '🔔' },
  { key: 'profile', label: 'Ficha', emoji: '🐾' }
];

export default function PetHome({ pet, user, canGoBack, onBack, onPetChange, onPetDeleted, onReload, onLogout, notify }) {
  const [tab, setTab] = useState('today');
  const [history, setHistory] = useState(null);
  const [agenda, setAgenda] = useState(null);
  const [sending, setSending] = useState('');

  const loadHistory = useCallback(async () => {
    try { setHistory(await api.history(pet.id, 30)); } catch { setHistory([]); }
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
      notify(res.status === 'sent' ? `📲 ${pet.name} te escribió por WhatsApp` : '⚠️ Mensaje generado, pero WhatsApp no está conectado');
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

  const lastMsg = history?.[0];
  const thought = lastMsg?.message_text || pet.last_thought || `¡Hola ${user.name.split(' ')[0]}! Soy ${pet.name}. Desde ahora te voy a escribir por WhatsApp 🐾`;
  const upcoming = (agenda || []).filter((e) => daysUntil(e.event_date) >= 0).slice(0, 2);

  return (
    <>
      <TopBar
        left={canGoBack ? <button className="icon-btn" onClick={onBack} title="Mis mascotas">‹</button> : <Brand />}
        right={<button className="icon-btn" onClick={onLogout} title="Salir">🚪</button>}
      />

      <main className="content">
        {tab === 'today' && (
          <>
            <section className="pet-hero">
              <div className="bubble" key={thought}>{thought}</div>
              <Avatar pet={pet} />
              <h1 className="pet-name">{pet.name}</h1>
              <div className="muted">{pet.breed || (pet.species === 'gato' ? 'Gatito' : 'Perrito')} · tono {pet.personality_tone}</div>
            </section>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="row between"><h3 style={{ margin: 0 }}>Su día</h3><span className="muted">se reinicia a medianoche</span></div>
              <div className="grid3" style={{ marginTop: 12 }}>
                <Status done={pet.walked_today} emoji="🦮" label="Paseo" />
                <Status done={pet.fed_today} emoji="🍖" label="Comida" />
                <Status done={pet.watered_today} emoji="💧" label="Agua" />
              </div>
              <p className="muted" style={{ marginBottom: 0 }}>Respondele por WhatsApp (ej: <i>"ya la paseé"</i>) y se actualiza solo.</p>
            </div>

            <div className="card">
              <h3>Simular lo que detecta el collar</h3>
              <p className="muted" style={{ marginTop: -6 }}>Elegí una situación y {pet.name} te escribe al instante.</p>
              <div className="grid3">
                {SIMULATIONS.map((s) => (
                  <button key={s.type} className="sim-btn" disabled={!!sending} onClick={() => simulate(s)}>
                    <span>{sending === s.type ? '⏳' : s.emoji}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="row between">
                <h3 style={{ margin: 0 }}>Próximos cuidados</h3>
                <button className="link" onClick={() => setTab('agenda')}>Ver agenda</button>
              </div>
              {!agenda ? <Spinner /> : upcoming.length === 0 ? (
                <p className="muted">No hay nada cargado. Agregá su próxima vacuna o pipeta y {pet.name} te lo recuerda.</p>
              ) : upcoming.map((e) => {
                const m = eventMeta(e.event_type); const d = daysUntil(e.event_date);
                return (
                  <div className="event" key={e.id}>
                    <div className="ico">{m.emoji}</div>
                    <div><b>{e.title}</b><div className="muted">{formatDate(e.event_date)}</div></div>
                    <div className={`when ${d <= 7 ? 'soon' : ''}`}>{d === 0 ? '¡Hoy!' : `en ${d} días`}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'chat' && <Chat pet={pet} history={history} />}
        {tab === 'agenda' && <Agenda pet={pet} events={agenda} onChange={loadAgenda} notify={notify} />}
        {tab === 'prefs' && <Preferences pet={pet} notify={notify} />}
        {tab === 'profile' && (
          <>
            <h2 style={{ fontSize: 24, margin: '8px 0 4px' }}>Ficha de {pet.name}</h2>
            <PetForm
              embedded
              pet={pet}
              notify={notify}
              onSaved={(p) => { onPetChange(p); notify('Cambios guardados ✅'); }}
              onDelete={deletePet}
            />
          </>
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </nav>
    </>
  );
}

function Status({ done, emoji, label }) {
  return (
    <div className={`status ${done ? 'done' : ''}`}>
      <span>{emoji}</span>{label}<br />{done ? '✓ Listo' : 'Pendiente'}
    </div>
  );
}

function Chat({ pet, history }) {
  const msgs = history ? [...history].reverse() : null;
  return (
    <div className="wa">
      <div className="wa-head">
        <Avatar pet={pet} size="sm" />
        <div><b>{pet.name}</b><small>en línea · Pet's Talk</small></div>
      </div>
      <div className="wa-body">
        {!msgs ? <Spinner /> : msgs.length === 0 ? (
          <div className="wa-empty">Todavía no hay mensajes. Andá a <b>Hoy</b> y simulá una situación para que {pet.name} te escriba.</div>
        ) : msgs.map((m) => (
          <div key={m.id} className={`wa-msg ${m.status === 'failed' ? 'failed' : ''}`}>
            <div className="tag">{EVENT_LABELS[m.event_type] || m.event_type}{m.status === 'failed' ? ' · no enviado' : ''}</div>
            <div>{m.message_text}</div>
            <time>{formatTime(m.sent_at)}</time>
          </div>
        ))}
      </div>
    </div>
  );
}
