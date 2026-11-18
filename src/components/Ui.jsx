import Icon from './Icon.jsx';
import { speciesEmoji } from '../constants.js';

export function Brand() {
  return <div className="brand"><span className="logo"><Icon name="paw" size={18} /></span>Pet's Talk</div>;
}

export function TopBar({ left, right }) {
  return (
    <header className="topbar">
      {left || <Brand />}
      {right}
    </header>
  );
}

export function IconBtn({ icon, onClick, title }) {
  return <button className="icon-btn" onClick={onClick} title={title} aria-label={title}><Icon name={icon} size={19} /></button>;
}

export function Chip({ icon, tint = 'teal', size = 18 }) {
  return <span className={`chip-ic t-${tint}`}><Icon name={icon} size={size} /></span>;
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

export function CardHead({ title, action, onAction }) {
  return (
    <div className="card-h">
      <h3>{title}</h3>
      {action && <button className="more" onClick={onAction}>{action}<Icon name="right" size={15} /></button>}
    </div>
  );
}
