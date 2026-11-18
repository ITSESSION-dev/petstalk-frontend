import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Switch, Spinner, Chip, CardHead } from '../components/Ui.jsx';
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
      setPrefs(await api.savePreferences(pet.id, next));
    } catch (e) {
      notify(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return <Spinner />;
  const on = PREFS.filter((p) => prefs[p.key] !== false).length;

  return (
    <>
      <h1 className="page-title">Avisos</h1>
      <p className="page-sub">{saving ? 'Guardando…' : `${pet.name} te avisa de ${on} de ${PREFS.length} cosas por WhatsApp.`}</p>

      <div className="card">
        <CardHead title="Horarios" />
        <p className="muted" style={{ margin: '-6px 0 10px' }}>Si a esa hora todavía no pasó, {pet.name} te escribe.</p>
        <HourRow icon="walk" tint="teal" label="Paseo" value={prefs.walk_reminder_hour ?? 18}
          onChange={(h) => save({ ...prefs, walk_reminder_hour: h })} />
        <HourRow icon="bowl" tint="peach" label="Comida" value={prefs.food_reminder_hour ?? 20}
          onChange={(h) => save({ ...prefs, food_reminder_hour: h })} />
      </div>

      <div className="card">
        <CardHead title="¿De qué querés que te hable?" />
        {PREFS.map((p) => (
          <div className="toggle-row" key={p.key}>
            <Chip icon={p.icon} tint={p.tint} size={17} />
            <div className="lbl">{p.label}</div>
            <Switch checked={prefs[p.key] !== false} onChange={(v) => save({ ...prefs, [p.key]: v })} />
          </div>
        ))}
      </div>
    </>
  );
}

function HourRow({ icon, tint, label, value, onChange }) {
  return (
    <div className="toggle-row">
      <Chip icon={icon} tint={tint} size={17} />
      <div className="lbl">{label}</div>
      <select className="input" style={{ width: 104, padding: '9px 12px' }} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
      </select>
    </div>
  );
}
