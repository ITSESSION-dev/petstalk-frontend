import { speciesEmoji } from '../constants.js';

export function Brand() {
  return <div className="brand">🐾 <span><b>Pet's</b> <i>Talk</i></span></div>;
}

export function TopBar({ left, right }) {
  return (
    <header className="topbar">
      {left || <Brand />}
      {right}
    </header>
  );
}

export function Avatar({ pet, size = '' }) {
  const src = pet?.avatar_base64 || pet?.photo_url;
  if (src) return <img className={`avatar ${size}`} src={src} alt={pet.name} />;
  return <div className={`avatar ${size}`}>{speciesEmoji(pet?.species)}</div>;
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Switch({ checked, onChange }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
    </label>
  );
}

export function Spinner() {
  return <div className="spinner" aria-label="Cargando" />;
}
