import { useState } from 'react';
import { api } from '../api.js';
import { TopBar, Avatar, Field, IconBtn } from '../components/Ui.jsx';
import Icon from '../components/Icon.jsx';
import { SPECIES, TONES, imageToBase64 } from '../constants.js';

const EMPTY = {
  name: '', species: 'perro', breed: '', sex: 'hembra', birth_date: '', weight: '',
  vet_name: '', vet_phone: '', personality_tone: 'cariñoso', avatar_base64: null
};

function fromPet(pet) {
  if (!pet) return EMPTY;
  return {
    ...EMPTY,
    ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, pet[k] ?? EMPTY[k]])),
    birth_date: pet.birth_date ? String(pet.birth_date).slice(0, 10) : '',
    weight: pet.weight ?? ''
  };
}

/**
 * Alta y edición de mascota.
 * - Sin `pet`: pantalla completa de alta.
 * - Con `pet` + `embedded`: ficha editable dentro de la mascota.
 */
export default function PetForm({ pet, embedded, isFirst, onSaved, onCancel, onDelete, onLogout, notify }) {
  const [form, setForm] = useState(fromPet(pet));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await imageToBase64(file);
      setForm((f) => ({ ...f, avatar_base64: b64 }));
    } catch (err) {
      notify?.(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      breed: form.breed.trim() || null,
      birth_date: form.birth_date || null,
      weight: form.weight === '' ? null : Number(form.weight),
      vet_name: form.vet_name.trim() || null,
      vet_phone: form.vet_phone.trim() || null,
      avatar_base64: form.avatar_base64 || null
    };
    try {
      const saved = pet ? await api.updatePet(pet.id, payload) : await api.createPet(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const body = (
    <form onSubmit={submit}>
      <div style={{ textAlign: 'center', margin: '8px 0 20px' }}>
        <label className="upload">
          <Avatar pet={{ ...form, species: form.species }} />
          <span className="cam"><Icon name="camera" size={16} /></span>
          <input type="file" accept="image/*" onChange={onPhoto} />
        </label>
        <div className="muted" style={{ marginTop: 8 }}>Tocá para subir su foto</div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <Field label="¿Cómo se llama?">
          <input className="input" required value={form.name} onChange={set('name')} placeholder="Lila" />
        </Field>
        <Field label="Es un…">
          <div className="pills">
            {SPECIES.map((s) => (
              <button type="button" key={s.value} className={`pill ${form.species === s.value ? 'on' : ''}`}
                onClick={() => setForm({ ...form, species: s.value })}>{s.emoji} {s.label}</button>
            ))}
          </div>
        </Field>
        <Field label="Sexo">
          <div className="pills">
            {['hembra', 'macho'].map((s) => (
              <button type="button" key={s} className={`pill ${form.sex === s ? 'on' : ''}`}
                onClick={() => setForm({ ...form, sex: s })}>{s === 'hembra' ? '♀ Hembra' : '♂ Macho'}</button>
            ))}
          </div>
        </Field>
        <div className="grid2">
          <Field label="Raza">
            <input className="input" value={form.breed || ''} onChange={set('breed')} placeholder="Caniche" />
          </Field>
          <Field label="Peso (kg)">
            <input className="input" type="number" step="0.1" min="0" value={form.weight} onChange={set('weight')} placeholder="8.5" />
          </Field>
        </div>
        <Field label="Fecha de nacimiento" hint="Así te avisa de su cumpleaños 🎂">
          <input className="input" type="date" value={form.birth_date} onChange={set('birth_date')} />
        </Field>
      </div>

      <div className="card">
        <div className="card-h"><h3>Su personalidad</h3></div>
        <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>Define cómo te va a escribir por WhatsApp.</p>
        <div className="pills">
          {TONES.map((t) => (
            <button type="button" key={t.value} className={`pill ${form.personality_tone === t.value ? 'on' : ''}`}
              onClick={() => setForm({ ...form, personality_tone: t.value })}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h3>Su veterinario</h3></div>
        <Field label="Nombre">
          <input className="input" value={form.vet_name || ''} onChange={set('vet_name')} placeholder="Dr. Claudio" />
        </Field>
        <Field label="Teléfono">
          <input className="input" inputMode="tel" value={form.vet_phone || ''} onChange={set('vet_phone')} placeholder="11 4444 5555" />
        </Field>
      </div>

      <button className="btn" disabled={saving}>{saving ? 'Guardando…' : pet ? 'Guardar cambios' : `Que ${form.name || 'mi mascota'} empiece a hablar`}{!saving && !pet && <span className="go"><Icon name="arrow" size={16} /></span>}</button>
      {onCancel && <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={onCancel}>Cancelar</button>}
      {onDelete && <button type="button" className="btn danger" style={{ marginTop: 24 }} onClick={onDelete}>Dar de baja a {pet.name}</button>}
    </form>
  );

  if (embedded) return body;

  return (
    <>
      <TopBar right={onLogout && <IconBtn icon="logout" onClick={onLogout} title="Salir" />} />
      <main className="content" style={{ paddingBottom: 40 }}>
        <h1 className="page-title">{isFirst ? 'Presentanos a tu mascota' : 'Nueva mascota'}</h1>
        <p className="page-sub">En un minuto te empieza a escribir por WhatsApp.</p>
        {body}
      </main>
    </>
  );
}
