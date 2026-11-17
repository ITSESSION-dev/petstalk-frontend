import { useState } from 'react';
import { api } from '../api.js';
import { Field, Spinner } from '../components/Ui.jsx';
import { EVENT_TYPES, eventMeta, daysUntil, formatDate } from '../constants.js';

export default function Agenda({ pet, events, onChange, notify }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ event_type: 'vaccine', title: '', event_date: '', description: '' });
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const meta = eventMeta(form.event_type);
      await api.createAgenda({
        pet_id: pet.id,
        event_type: form.event_type,
        title: form.title.trim() || meta.label,
        description: form.description.trim() || null,
        event_date: form.event_date
      });
      notify(`📅 Agendado. ${pet.name} te avisa 30, 15, 7 y 1 día antes`);
      setForm({ event_type: 'vaccine', title: '', event_date: '', description: '' });
      setAdding(false);
      onChange();
    } catch (err) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(ev) {
    if (!window.confirm(`¿Borrar "${ev.title}" de la agenda?`)) return;
    try { await api.deleteAgenda(ev.id); onChange(); } catch (err) { notify(err.message); }
  }

  const future = (events || []).filter((e) => daysUntil(e.event_date) >= 0);
  const past = (events || []).filter((e) => daysUntil(e.event_date) < 0);

  return (
    <>
      <h2 style={{ fontSize: 24, margin: '8px 0 4px' }}>Agenda de {pet.name}</h2>
      <p className="muted" style={{ marginTop: 0 }}>Vacunas, pipetas y controles. {pet.name} te los recuerda por WhatsApp.</p>

      {adding ? (
        <form className="card" onSubmit={save}>
          <h3>Nuevo cuidado</h3>
          <Field label="¿Qué es?">
            <div className="chips">
              {EVENT_TYPES.map((t) => (
                <button type="button" key={t.value} className={`chip ${form.event_type === t.value ? 'on' : ''}`}
                  onClick={() => setForm({ ...form, event_type: t.value })}>{t.emoji} {t.label}</button>
              ))}
            </div>
          </Field>
          <Field label="Detalle" hint="Opcional. Ej: Antirrábica, Séxtuple, Pipeta Frontline">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={eventMeta(form.event_type).label} />
          </Field>
          <Field label="Fecha">
            <input className="input" type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </Field>
          <button className="btn" disabled={saving}>{saving ? 'Guardando…' : 'Agendar'}</button>
          <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={() => setAdding(false)}>Cancelar</button>
        </form>
      ) : (
        <button className="btn orange" style={{ marginBottom: 16 }} onClick={() => setAdding(true)}>+ Agregar cuidado</button>
      )}

      <div className="card">
        <h3>Próximos</h3>
        {!events ? <Spinner /> : future.length === 0 ? <p className="muted">Nada pendiente 🎉</p> : future.map((e) => (
          <EventRow key={e.id} ev={e} onDelete={() => remove(e)} />
        ))}
      </div>

      {past.length > 0 && (
        <div className="card">
          <h3>Historial</h3>
          {past.map((e) => <EventRow key={e.id} ev={e} onDelete={() => remove(e)} past />)}
        </div>
      )}
    </>
  );
}

function EventRow({ ev, onDelete, past }) {
  const m = eventMeta(ev.event_type);
  const d = daysUntil(ev.event_date);
  return (
    <div className="event" style={past ? { opacity: 0.6 } : null}>
      <div className="ico">{m.emoji}</div>
      <div><b>{ev.title}</b><div className="muted">{m.label} · {formatDate(ev.event_date)}</div></div>
      <div className={`when ${!past && d <= 7 ? 'soon' : ''}`}>{past ? 'hecho' : d === 0 ? '¡Hoy!' : `en ${d} días`}</div>
      <button className="del" onClick={onDelete} title="Borrar">✕</button>
    </div>
  );
}
