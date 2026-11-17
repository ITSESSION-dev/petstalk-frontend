import { useState } from 'react';
import { api } from '../api.js';
import { Field } from '../components/Ui.jsx';

const ROLES = [
  { value: 'owner', label: 'Dueño', emoji: '🏠' },
  { value: 'vet', label: 'Veterinaria', emoji: '🩺' },
  { value: 'shop', label: 'Pet shop', emoji: '🛍️' }
];

// Normaliza el celular argentino al formato que usa WhatsApp: 549 + área + número
export function normalizePhone(raw) {
  let p = String(raw).replace(/\D/g, '');
  if (!p) return '';
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('54')) {
    p = p.slice(2);
  } else if (p.length > 11) {
    return p; // número de otro país: lo dejamos como está
  }
  if (p.startsWith('9')) p = p.slice(1);
  if (p.startsWith('0')) p = p.slice(1);
  // quitar el "15" después del código de área (2, 3 o 4 dígitos)
  for (const len of [2, 3, 4]) {
    if (p.length === 12 && p.slice(len, len + 2) === '15') { p = p.slice(0, len) + p.slice(len + 2); break; }
  }
  return '549' + p;
}

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'owner' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      let res;
      if (mode === 'login') {
        res = await api.login(email, form.password);
      } else {
        if (form.password.length < 6) throw new Error('La contraseña tiene que tener al menos 6 caracteres');
        const phone = normalizePhone(form.phone);
        if (phone.length < 12) throw new Error('Revisá el celular: poné código de área y número');
        res = await api.register({ ...form, email, phone, name: form.name.trim() });
      }
      onLogin(res.token, res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="hero">
        <div className="paw">🐶</div>
        <h1>Pet's Talk</h1>
        <p>Tu mascota te habla por WhatsApp</p>
      </div>

      <form className="auth" onSubmit={submit}>
        <div className="card">
          <h3>{mode === 'login' ? '¡Hola de nuevo! 👋' : 'Creá tu cuenta'}</h3>

          {error && <div className="error">{error}</div>}

          {mode === 'register' && (
            <>
              <Field label="Soy…">
                <div className="roles">
                  {ROLES.map((r) => (
                    <button type="button" key={r.value} className={`role ${form.role === r.value ? 'on' : ''}`}
                      onClick={() => setForm({ ...form, role: r.value })}>
                      <span>{r.emoji}</span>{r.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Tu nombre">
                <input className="input" required value={form.name} onChange={set('name')} placeholder="Ariel" autoComplete="name" />
              </Field>
              <Field label="Celular con WhatsApp" hint="Con código de área, sin 0 ni 15. Ej: 11 6417 2248">
                <input className="input" required inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="11 6417 2248" autoComplete="tel" />
              </Field>
            </>
          )}

          <Field label="Email">
            <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="vos@email.com" autoComplete="email" />
          </Field>
          <Field label="Contraseña">
            <input className="input" type="password" required value={form.password} onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </Field>

          <button className="btn" disabled={loading}>
            {loading ? 'Un segundo…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </div>

        <p className="muted" style={{ textAlign: 'center' }}>
          {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
          <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Registrate' : 'Ingresá'}
          </button>
        </p>
      </form>
    </>
  );
}
