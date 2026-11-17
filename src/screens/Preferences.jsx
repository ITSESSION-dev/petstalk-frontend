import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Switch, Spinner } from '../components/Ui.jsx';
import { PREFS } from '../constants.js';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function Preferences({ pet, notify }) {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getPreferences(pet.id).then(setPrefs).catch((e) => { notify(e.message); setPrefs({}); });
  }, [pet.id, notify]);

  async function save(next) {
    setPrefs(next);
    setSaving(true);
    try {
      const saved = await api.savePreferences(pet.id, next);
      setPrefs(saved);
    } catch (e) {
      notify(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return <Spinner />;

  return (
    <>
      <h2 style={{ fontSize: 24, margin: '8px 0 4px' }}>¿De qué te avisa {pet.name}?</h2>
      <p className="muted" style={{ marginTop: 0 }}>Elegí qué mensajes querés recibir por WhatsApp. {saving ? 'Guardando…' : ''}</p>

      <div className="card">
        {PREFS.map((p) => (
          <div className="toggle-row" key={p.key}>
            <div className="lbl"><span>{p.emoji}</span>{p.label}</div>
            <Switch checked={prefs[p.key] !== false} onChange={(v) => save({ ...prefs, [p.key]: v })} />
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Horarios</h3>
        <p className="muted" style={{ marginTop: -6 }}>Si a esa hora todavía no pasó, {pet.name} te escribe.</p>
        <HourRow label="🦮 Recordatorio de paseo" value={prefs.walk_reminder_hour ?? 18}
          onChange={(h) => save({ ...prefs, walk_reminder_hour: h })} />
        <HourRow label="🍖 Recordatorio de comida" value={prefs.food_reminder_hour ?? 20}
          onChange={(h) => save({ ...prefs, food_reminder_hour: h })} />
      </div>
    </>
  );
}

function HourRow({ label, value, onChange }) {
  return (
    <div className="toggle-row">
      <div className="lbl">{label}</div>
      <select className="input" style={{ width: 110 }} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
      </select>
    </div>
  );
}
