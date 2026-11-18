import { useState } from 'react';
import { api } from '../api.js';
import { Field, Spinner, Chip } from '../components/Ui.jsx';
import Icon from '../components/Icon.jsx';
import { EVENT_TYPES, eventMeta, daysUntil, formatDate } from '../constants.js';

export default function Agenda({ pet, events, onChange, notify }) {
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState('next');
  const [form, setForm] = useState({ event_type: 'vaccine', title: '', event_date: '' });
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
        event_date: form.event_date
      });
      notify(`Agendado. ${pet.name} te avisa 30, 15, 7 y 1 día antes`);
      setForm({ event_type: 'vaccine', title: '', event_date: '' });
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
  const past = (events || []).filter((e) => daysUntil(e.event_date) < 0).reverse();
  const list = view === 'next' ? future : past;

  return (
    <>
      <div className="row between">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-sub">Vacunas, pipetas y controles de {pet.name}.</p>
        </div>
        {!adding && <button className="icon-btn" style={{ background: 'var(--teal)', color: '#fff' }} onClick={() => setAdding(true)} aria-label="Agregar"><Icon name="plus" size={20} /></button>}
      </div>

      {adding && (
        <form className="card" onSubmit={save}>
          <div className="card-h"><h3>Nuevo cuidado</h3><button type="button" className="more" onClick={() => setAdding(false)}><Icon name="x" size={18} /></button></div>
          <Field label="¿Qué es?">
            <div className="pills">
              {EVENT_TYPES.map((t) => (
                <button type="button" key={t.value} className={`pill ${form.event_type === t.value ? 'on' : ''}`}
                  onClick={() => setForm({ ...form, event_type: t.value })}><Icon name={t.icon} size={14} />{t.label}</button>
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
        </form>
      )}

      <div className="seg">
        <button className={view === 'next' ? 'on' : ''} onClick={() => setView('next')}>Próximos ({future.length})</button>
        <button className={view === 'past' ? 'on' : ''} onClick={() => setView('past')}>Historial ({past.length})</button>
      </div>

      <div className="card">
        {!events ? <Spinner /> : list.length === 0 ? (
          <p className="muted center" style={{ margin: '8px 0' }}>{view === 'next' ? 'Nada pendiente 🎉 Tocá + para agregar un cuidado.' : 'Todavía no hay historial.'}</p>
        ) : list.map((e) => {
          const m = eventMeta(e.event_type); const d = daysUntil(e.event_date);
          return (
            <div className="item" key={e.id}>
              <Chip icon={m.icon} tint={m.tint} />
              <div style={{ minWidth: 0 }}><div className="t">{e.title}</div><div className="s">{m.label} · {formatDate(e.event_date)}</div></div>
              <div className={`when ${view === 'past' ? 'past' : d <= 7 ? 'soon' : ''}`}>{view === 'past' ? 'hecho' : d === 0 ? '¡Hoy!' : `en ${d} días`}</div>
              <button className="del" onClick={() => remove(e)} aria-label="Borrar"><Icon name="x" size={16} /></button>
            </div>
          );
        })}
      </div>
    </>
  );
}
