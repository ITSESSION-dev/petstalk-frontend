import { useCallback, useEffect, useState } from 'react';
import { api, session } from './api.js';
import Auth from './screens/Auth.jsx';
import PetList from './screens/PetList.jsx';
import PetForm from './screens/PetForm.jsx';
import PetHome from './screens/PetHome.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [user, setUser] = useState(session.user);
  const [pets, setPets] = useState(null);
  const [view, setView] = useState({ name: 'list' }); // list | new | pet
  const [toast, setToast] = useState('');

  const notify = useCallback((msg) => setToast(msg), []);

  const loadPets = useCallback(async () => {
    try {
      const list = await api.listPets();
      setPets(list);
      return list;
    } catch (e) {
      notify(e.message);
      setPets([]);
      return [];
    }
  }, [notify]);

  // Al entrar: si tiene una sola mascota, vamos directo a ella
  useEffect(() => {
    if (!user) return;
    loadPets().then((list) => {
      if (list.length === 1) setView({ name: 'pet', id: list[0].id });
      else if (list.length === 0) setView({ name: 'new' });
    });
  }, [user, loadPets]);

  useEffect(() => {
    const onLogout = () => { setUser(null); setPets(null); notify('Tu sesión expiró, ingresá de nuevo'); };
    window.addEventListener('petstalk:logout', onLogout);
    return () => window.removeEventListener('petstalk:logout', onLogout);
  }, [notify]);

  function handleLogin(token, u) {
    session.save(token, u);
    setUser(u);
    setView({ name: 'list' });
  }

  function logout() {
    session.clear();
    setUser(null);
    setPets(null);
  }

  if (!user) {
    return (
      <div className="app">
        <Auth onLogin={handleLogin} />
        <Toast text={toast} onDone={() => setToast('')} />
      </div>
    );
  }

  const current = view.name === 'pet' ? pets?.find((p) => p.id === view.id) : null;

  return (
    <div className="app">
      {view.name === 'pet' && current ? (
        <PetHome
          pet={current}
          user={user}
          canGoBack={pets.length > 1}
          onBack={() => setView({ name: 'list' })}
          onPetChange={(updated) => setPets((ps) => ps.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))}
          onPetDeleted={async () => { const list = await loadPets(); setView(list.length ? { name: 'list' } : { name: 'new' }); }}
          onReload={loadPets}
          onLogout={logout}
          notify={notify}
        />
      ) : view.name === 'new' ? (
        <PetForm
          user={user}
          isFirst={!pets || pets.length === 0}
          onCancel={pets && pets.length ? () => setView({ name: 'list' }) : null}
          onSaved={async (pet) => { await loadPets(); setView({ name: 'pet', id: pet.id }); notify(`¡${pet.name} ya está en Pet's Talk! 🐾`); }}
          onLogout={logout}
          notify={notify}
        />
      ) : (
        <PetList
          user={user}
          pets={pets}
          onOpen={(id) => setView({ name: 'pet', id })}
          onNew={() => setView({ name: 'new' })}
          onLogout={logout}
        />
      )}
      <Toast text={toast} onDone={() => setToast('')} />
    </div>
  );
}
