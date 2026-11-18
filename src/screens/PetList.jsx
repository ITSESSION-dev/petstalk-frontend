import { Avatar, Spinner, IconBtn } from '../components/Ui.jsx';
import Icon from '../components/Icon.jsx';
import { SPECIES } from '../constants.js';

export default function PetList({ user, pets, onOpen, onNew, onLogout }) {
  return (
    <>
      <header className="topbar">
        <div className="hello"><b>Hola, {user.name.split(' ')[0]} 👋</b><small>¿Con quién querés hablar hoy?</small></div>
        <IconBtn icon="logout" onClick={onLogout} title="Salir" />
      </header>
      <main className="content">
        {!pets ? <Spinner /> : pets.map((p) => (
          <div key={p.id} role="button" tabIndex={0} className="card pet-tile" onClick={() => onOpen(p.id)}>
            <Avatar pet={p} size="md" />
            <div>
              <h3 style={{ fontSize: 18 }}>{p.name}</h3>
              <div className="muted">{SPECIES.find((s) => s.value === p.species)?.label || p.species}{p.breed ? ` · ${p.breed}` : ''}</div>
            </div>
            <span className="go"><Icon name="right" size={18} /></span>
          </div>
        ))}

        <button className="btn light" onClick={onNew}><Icon name="plus" size={18} />Agregar mascota</button>
      </main>
    </>
  );
}
