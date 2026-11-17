import { TopBar, Avatar, Spinner } from '../components/Ui.jsx';
import { SPECIES } from '../constants.js';

export default function PetList({ user, pets, onOpen, onNew, onLogout }) {
  return (
    <>
      <TopBar right={<button className="icon-btn" onClick={onLogout} title="Salir">🚪</button>} />
      <main className="content">
        <h2 style={{ fontSize: 26, margin: '8px 0 4px' }}>Hola, {user.name.split(' ')[0]} 👋</h2>
        <p className="muted" style={{ marginTop: 0 }}>¿Con quién querés hablar hoy?</p>

        {!pets ? <Spinner /> : pets.map((p) => (
          <button key={p.id} className="card pet-item" onClick={() => onOpen(p.id)}>
            <Avatar pet={p} size="sm" />
            <div>
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <div className="muted">{SPECIES.find((s) => s.value === p.species)?.label || p.species}{p.breed ? ` · ${p.breed}` : ''}</div>
            </div>
            <span className="go">›</span>
          </button>
        ))}

        <button className="btn orange" onClick={onNew}>+ Agregar mascota</button>
      </main>
    </>
  );
}
