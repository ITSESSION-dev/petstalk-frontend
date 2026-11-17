// ════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════
const API = 'https://pets-api.sessian.tech';
let token = localStorage.getItem('pt_token') || '';
let userRole = localStorage.getItem('pt_role') || '';
let userName = localStorage.getItem('pt_name') || '';
let currentPet = null;
let currentPrefs = null;

const SPECIES_ICON = { perro: '🐕', gato: '🐈', conejo: '🐇' };

// ════════════════════════════════════════
// NAVEGACIÓN
// ════════════════════════════════════════
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

async function showApp() {
  if (userRole === 'vet' || userRole === 'shop') {
    showScreen('vet');
    renderVetTab('resumen');
  } else {
    showScreen('app');
    await loadMyPet();
    renderTab('dashboard');
  }
}

function switchTab(tab, el) {
  document.querySelectorAll('#screen-app .nav-item').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTab(tab);
}

function switchVetTab(tab, el) {
  document.querySelectorAll('#screen-vet .nav-item').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderVetTab(tab);
}

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════
function selectRole(el, role) {
  document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('reg-role').value = role;
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim().replace(/\D/g,'');
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;

  if (!name || !email || !phone || !password) { showToast('Completá todos los campos'); return; }

  try {
    const r = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, email, phone, password, role})
    });
    const data = await r.json();
    if (!r.ok) { showToast(data.error || 'Error al registrar'); return; }
    saveSession(data);
    showToast('¡Bienvenido/a ' + name.split(' ')[0] + '!');
    await showApp();
  } catch(e) { showToast('Error de conexión'); }
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showToast('Completá los campos'); return; }

  try {
    const r = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await r.json();
    if (!r.ok) { showToast(data.error || 'Credenciales incorrectas'); return; }
    saveSession(data);
    await showApp();
  } catch(e) { showToast('Error de conexión'); }
}

function saveSession(data) {
  token = data.token;
  userRole = data.user.role;
  userName = data.user.name;
  localStorage.setItem('pt_token', token);
  localStorage.setItem('pt_role', userRole);
  localStorage.setItem('pt_name', userName);
}

function doLogout() {
  localStorage.clear();
  token = ''; userRole = ''; userName = ''; currentPet = null; currentPrefs = null;
  showScreen('onboarding');
}

// ════════════════════════════════════════
// CARGA DE MASCOTA (persistencia real)
// ════════════════════════════════════════
async function loadMyPet() {
  try {
    const r = await fetch(`${API}/api/pets`, { headers: {'Authorization':'Bearer '+token} });
    if (!r.ok) return;
    const pets = await r.json();
    currentPet = pets && pets.length > 0 ? pets[0] : null;
    if (currentPet) {
      await loadPreferences();
    }
  } catch(e) {
    console.error('Error cargando mascota', e);
  }
}

async function loadPreferences() {
  if (!currentPet) return;
  try {
    const r = await fetch(`${API}/api/pets/${currentPet.id}/preferences`, { headers: {'Authorization':'Bearer '+token} });
    if (r.ok) currentPrefs = await r.json();
  } catch(e) {}
}

// ════════════════════════════════════════
// TABS - DUEÑO
// ════════════════════════════════════════
async function renderTab(tab) {
  const c = document.getElementById('tab-content');
  if (tab === 'dashboard') await renderDashboard(c);
  else if (tab === 'mascota') renderMascota(c);
  else if (tab === 'agenda') await renderAgenda(c);
  else if (tab === 'preferencias') await renderPreferencias(c);
}

function avatarHtml(pet, size) {
  const icon = SPECIES_ICON[pet?.species] || '🐾';
  if (pet?.avatar_base64) {
    return `<img src="${pet.avatar_base64}" alt="${pet.name}">`;
  }
  return icon;
}

async function renderDashboard(c) {
  removeFab();
  const firstName = userName.split(' ')[0];

  if (!currentPet) {
    c.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🐾</div>
        <h3>Hola ${firstName}, ¡bienvenido!</h3>
        <p>Todavía no registraste tu mascota.<br>Hacelo para que empiece a hablarte por WhatsApp.</p>
        <div style="margin-top:20px">
          <button class="btn-primary" style="max-width:240px;margin:0 auto" onclick="switchTab('mascota', document.querySelectorAll('.nav-item')[3])">Registrar mi mascota 🐾</button>
        </div>
      </div>`;
    return;
  }

  const age = petAge(currentPet.birth_date);
  const thought = currentPet.last_thought || defaultThought(currentPet);

  // Alertas dinámicas según preferencias y estado
  const alerts = [];
  if (!currentPrefs || currentPrefs.notify_walk) {
    if (!currentPet.walked_today) {
      alerts.push({ icon:'🦮', cls:'alert-orange', text:`${currentPet.name} todavía no salió a pasear hoy`, sub:'Te avisaremos por WhatsApp si pasa mucho tiempo' });
    } else {
      alerts.push({ icon:'✅', cls:'alert-mint', text:`${currentPet.name} ya salió a pasear hoy`, sub:'¡Buen trabajo!' });
    }
  }
  if (!currentPrefs || currentPrefs.notify_food) {
    if (!currentPet.fed_today) {
      alerts.push({ icon:'🍖', cls:'alert-orange', text:`${currentPet.name} todavía no comió hoy`, sub:'Recordatorio automático activado' });
    }
  }

  c.innerHTML = `
    <div class="pet-hero">
      <div class="pet-avatar-wrap">
        <div class="pet-avatar-big">${avatarHtml(currentPet)}</div>
      </div>
      <div class="pet-hero-name">${currentPet.name}</div>
      <div class="pet-hero-meta">${currentPet.breed || currentPet.species}${age ? ' · ' + age : ''}</div>

      <div class="thought-bubble">
        <div class="thought-label">💭 ${currentPet.name} piensa...</div>
        ${thought}
      </div>
    </div>

    <div class="section-title">⚡ Hoy</div>
    ${alerts.map(a => `
      <div class="alert-item ${a.cls}">
        <span class="alert-icon">${a.icon}</span>
        <div>
          <div>${a.text}</div>
          <div class="alert-text-sub">${a.sub}</div>
        </div>
      </div>`).join('')}

    <div class="section-title">💬 Últimos mensajes</div>
    <div class="wa-chat" id="wa-history">
      <div class="empty-state" style="padding:24px">
        <p>Cargando historial...</p>
      </div>
    </div>
  `;

  loadMessageHistory();
}

function defaultThought(pet) {
  const thoughts = {
    perro: 'Todo tranquilo por aquí... ¡esperando noticias tuyas! 🐾',
    gato: 'Observando el mundo desde la ventana... 🐾',
    conejo: 'Mordisqueando algo rico por aquí 🥬'
  };
  return thoughts[pet.species] || 'Todo bien por aquí 🐾';
}

function petAge(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) years--;
  if (years <= 0) {
    let m = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  }
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

async function loadMessageHistory() {
  const wrap = document.getElementById('wa-history');
  if (!wrap || !currentPet) return;
  try {
    const r = await fetch(`${API}/api/messages/history/${currentPet.id}?limit=5`, { headers: {'Authorization':'Bearer '+token} });
    if (!r.ok) throw new Error();
    const msgs = await r.json();
    if (!msgs || msgs.length === 0) {
      wrap.innerHTML = `<div class="empty-state" style="padding:24px"><div class="es-icon">💬</div><h3>Sin mensajes aún</h3><p>${currentPet.name} todavía no te escribió. ¡Pronto lo hará!</p></div>`;
      return;
    }
    wrap.innerHTML = msgs.map(m => `
      <div class="wa-bubble">
        ${m.message_text}
        <div class="wa-meta">${formatTime(m.sent_at)} <span class="wa-check">✓✓</span></div>
      </div>
    `).join('');
  } catch(e) {
    wrap.innerHTML = `<div class="empty-state" style="padding:24px"><div class="es-icon">💬</div><h3>Sin mensajes aún</h3><p>${currentPet.name} todavía no te escribió. ¡Pronto lo hará!</p></div>`;
  }
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
}

// ════════════════════════════════════════
// MASCOTA (form + avatar)
// ════════════════════════════════════════
let pendingAvatarBase64 = null;

function renderMascota(c) {
  removeFab();
  let petData = currentPet || {};
  pendingAvatarBase64 = null;

  const avatarPreview = petData.avatar_base64
    ? `<img src="${petData.avatar_base64}" alt="avatar">`
    : (SPECIES_ICON[petData.species] || '🐾');

  c.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;font-family:'Fredoka',sans-serif">🐾 ${currentPet ? 'Mi mascota' : 'Registrar mascota'}</div>

    <div class="pet-form-card">
      <h3>Foto de perfil</h3>
      <div class="avatar-uploader">
        <div class="avatar-preview" id="avatar-preview" onclick="document.getElementById('avatar-file-input').click()">${avatarPreview}</div>
        <div class="avatar-uploader-text">
          Subí una foto desde tu PC o celular.<br>
          <span onclick="document.getElementById('avatar-file-input').click()">Elegir imagen</span>
        </div>
      </div>
    </div>

    <div class="pet-form-card">
      <h3>Datos de la mascota</h3>
      <div class="form-group"><label>Nombre</label><input type="text" id="pet-name" value="${petData.name||''}" placeholder="Lila"></div>
      <div class="form-row">
        <div class="form-group"><label>Especie</label>
          <select id="pet-species">
            <option value="perro" ${petData.species==='perro'?'selected':''}>🐕 Perro</option>
            <option value="gato" ${petData.species==='gato'?'selected':''}>🐈 Gato</option>
            <option value="conejo" ${petData.species==='conejo'?'selected':''}>🐇 Conejo</option>
          </select>
        </div>
        <div class="form-group"><label>Sexo</label>
          <select id="pet-sex">
            <option value="macho" ${petData.sex==='macho'?'selected':''}>♂ Macho</option>
            <option value="hembra" ${petData.sex==='hembra'?'selected':''}>♀ Hembra</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Raza</label><input type="text" id="pet-breed" value="${petData.breed||''}" placeholder="Golden Retriever"></div>
      <div class="form-row">
        <div class="form-group"><label>Fecha de nacimiento</label><input type="date" id="pet-birth" value="${petData.birth_date ? petData.birth_date.split('T')[0] : ''}"></div>
        <div class="form-group"><label>Peso (kg)</label><input type="number" id="pet-weight" value="${petData.weight||''}" placeholder="28"></div>
      </div>
    </div>
    <div class="pet-form-card">
      <h3>Veterinario</h3>
      <div class="form-group"><label>Nombre del veterinario</label><input type="text" id="pet-vet" value="${petData.vet_name||''}" placeholder="Dr. Claudio"></div>
      <div class="form-group"><label>Teléfono veterinario</label><input type="text" id="pet-vet-phone" value="${petData.vet_phone||''}" placeholder="+54 9 11 1234-5678"></div>
    </div>
    <div class="pet-form-card">
      <h3>Personalidad de los mensajes</h3>
      <div class="form-group">
        <label>Tono</label>
        <select id="pet-tone">
          <option value="cariñoso" ${petData.personality_tone==='cariñoso'?'selected':''}>❤️ Cariñoso</option>
          <option value="juguetón" ${petData.personality_tone==='juguetón'?'selected':''}>🎾 Juguetón</option>
          <option value="serio" ${petData.personality_tone==='serio'?'selected':''}>😐 Serio</option>
          <option value="dramático" ${petData.personality_tone==='dramático'?'selected':''}>😱 Dramático</option>
        </select>
      </div>
    </div>
    <button class="btn-primary" style="max-width:100%" onclick="savePet()">
      ${currentPet ? 'Guardar cambios' : 'Registrar mascota 🐾'}
    </button>
  `;
}

// Manejar selección de archivo de avatar
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('avatar-file-input');
  if (input) {
    input.addEventListener('change', handleAvatarFile);
  }
});

function handleAvatarFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('La imagen es muy grande (máx 2MB)');
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingAvatarBase64 = ev.target.result;
    const preview = document.getElementById('avatar-preview');
    if (preview) preview.innerHTML = `<img src="${pendingAvatarBase64}" alt="avatar">`;
  };
  reader.readAsDataURL(file);
}

async function savePet() {
  const data = {
    name: document.getElementById('pet-name').value.trim(),
    species: document.getElementById('pet-species').value,
    sex: document.getElementById('pet-sex').value,
    breed: document.getElementById('pet-breed').value.trim(),
    birth_date: document.getElementById('pet-birth').value || null,
    weight: parseFloat(document.getElementById('pet-weight').value) || null,
    vet_name: document.getElementById('pet-vet').value.trim(),
    vet_phone: document.getElementById('pet-vet-phone').value.trim(),
    personality_tone: document.getElementById('pet-tone').value,
  };
  if (pendingAvatarBase64) data.avatar_base64 = pendingAvatarBase64;

  if (!data.name) { showToast('El nombre es requerido'); return; }

  try {
    let r, result;
    if (currentPet) {
      r = await fetch(`${API}/api/pets/${currentPet.id}`, { method:'PUT', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify(data) });
    } else {
      r = await fetch(`${API}/api/pets`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify(data) });
    }
    result = await r.json();
    if (!r.ok) { showToast(result.error || 'Error'); return; }
    currentPet = result;
    await loadPreferences();
    showToast('✅ ' + (currentPet ? 'Mascota guardada' : 'Mascota registrada'));
    switchTab('dashboard', document.querySelectorAll('.nav-item')[0]);
  } catch(e) { showToast('Error de conexión'); }
}

// ════════════════════════════════════════
// PREFERENCIAS DE NOTIFICACIÓN
// ════════════════════════════════════════
const PREF_CONFIG = [
  { key: 'notify_walk', icon: '🦮', title: 'Paseo', sub: 'Avisame si no salió a pasear', hasTime: 'walk_reminder_hour' },
  { key: 'notify_food', icon: '🍖', title: 'Comida', sub: 'Avisame si no comió', hasTime: 'food_reminder_hour' },
  { key: 'notify_water', icon: '💧', title: 'Agua', sub: 'Avisame si no tomó agua' },
  { key: 'notify_sleep', icon: '😴', title: 'Descanso', sub: 'Avisame si durmió poco' },
  { key: 'notify_vaccine', icon: '💉', title: 'Vacunas', sub: 'Recordatorios de vencimiento' },
  { key: 'notify_pipette', icon: '🧴', title: 'Pipeta', sub: 'Recordatorio de renovación' },
  { key: 'notify_antiparasitic', icon: '🐛', title: 'Antiparasitario', sub: 'Recordatorio periódico' },
  { key: 'notify_birthday', icon: '🎂', title: 'Cumpleaños', sub: 'Mensaje especial del día' },
  { key: 'notify_heat_cycle', icon: '❤️', title: 'Ciclo de celo', sub: 'Alertas de cuidado' },
  { key: 'notify_offers', icon: '🏷️', title: 'Ofertas', sub: 'Promos de tu veterinaria' },
];

async function renderPreferencias(c) {
  removeFab();

  if (!currentPet) {
    c.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🔔</div>
        <h3>Primero registrá tu mascota</h3>
        <p>Necesitamos saber quién recibirá los avisos.</p>
      </div>`;
    return;
  }

  if (!currentPrefs) await loadPreferences();
  const p = currentPrefs || {};

  c.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:6px;font-family:'Fredoka',sans-serif">🔔 Avisos de ${currentPet.name}</div>
    <div style="font-size:13px;color:var(--text-soft);font-weight:600;margin-bottom:18px">
      Elegí qué tipo de mensajes querés recibir automáticamente por WhatsApp. ${currentPet.name} te va a avisar solo/a, ¡sin que tengas que hacer nada!
    </div>
    <div class="pref-grid" id="pref-grid">
      ${PREF_CONFIG.map(cfg => `
        <div class="pref-card ${p[cfg.key] !== false ? 'active' : ''}" id="pref-${cfg.key}">
          <div class="pref-card-top">
            <div class="pref-icon">${cfg.icon}</div>
            <div class="toggle ${p[cfg.key] !== false ? 'on' : ''}" onclick="togglePref('${cfg.key}')"></div>
          </div>
          <div class="pref-title">${cfg.title}</div>
          <div class="pref-sub">${cfg.sub}</div>
          ${cfg.hasTime ? `
            <select class="time-select" id="time-${cfg.hasTime}" onchange="prefsChanged()">
              ${hourOptions(p[cfg.hasTime] || (cfg.key === 'notify_walk' ? 18 : 20))}
            </select>` : ''}
        </div>
      `).join('')}
    </div>
    <button class="btn-primary" style="max-width:100%;margin-top:20px" onclick="savePreferences()">Guardar avisos 🔔</button>
  `;
}

function hourOptions(selected) {
  let html = '';
  for (let h = 6; h <= 23; h++) {
    const label = `${h.toString().padStart(2,'0')}:00 hs`;
    html += `<option value="${h}" ${h === selected ? 'selected' : ''}>${label}</option>`;
  }
  return html;
}

function togglePref(key) {
  const card = document.getElementById('pref-' + key);
  const toggle = card.querySelector('.toggle');
  const isOn = toggle.classList.contains('on');
  toggle.classList.toggle('on', !isOn);
  card.classList.toggle('active', !isOn);
}

function prefsChanged() { /* placeholder para futuros cambios en vivo */ }

async function savePreferences() {
  if (!currentPet) return;
  const data = {};
  PREF_CONFIG.forEach(cfg => {
    const card = document.getElementById('pref-' + cfg.key);
    data[cfg.key] = card.querySelector('.toggle').classList.contains('on');
    if (cfg.hasTime) {
      const sel = document.getElementById('time-' + cfg.hasTime);
      data[cfg.hasTime] = parseInt(sel.value);
    }
  });

  try {
    const r = await fetch(`${API}/api/pets/${currentPet.id}/preferences`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify(data)
    });
    if (!r.ok) { showToast('Error al guardar'); return; }
    currentPrefs = await r.json();
    showToast('✅ Avisos guardados — ' + currentPet.name + ' te va a escribir solo/a 🐾');
  } catch(e) { showToast('Error de conexión'); }
}

// ════════════════════════════════════════
// AGENDA
// ════════════════════════════════════════
async function renderAgenda(c) {
  let events = [];
  if (currentPet) {
    try {
      const r = await fetch(`${API}/api/agenda/${currentPet.id}`, { headers:{'Authorization':'Bearer '+token} });
      if (r.ok) events = await r.json();
    } catch(e) {}
  }

  const typeConfig = {
    vaccine: { icon:'💉', label:'Vacuna' },
    antiparasitic: { icon:'🐛', label:'Antiparasitario' },
    pipette: { icon:'🧴', label:'Pipeta' },
    birthday: { icon:'🎂', label:'Cumpleaños' },
    vet_visit: { icon:'🩺', label:'Consulta' },
    heat_cycle: { icon:'❤️', label:'Ciclo de celo' },
  };

  const eventsHtml = events.length === 0
    ? `<div class="empty-state"><div class="es-icon">📅</div><h3>Sin eventos</h3><p>Agregá vacunas, pipetas y más con el botón +</p></div>`
    : events.map(e => {
        const cfg = typeConfig[e.event_type] || { icon:'📌', label:'Evento' };
        const date = new Date(e.event_date);
        const dateStr = date.toLocaleDateString('es-AR', { day:'numeric', month:'short' });
        return `<div class="agenda-card">
          <div class="agenda-icon">${cfg.icon}</div>
          <div class="agenda-info">
            <div class="agenda-title">${e.title}</div>
            <div class="agenda-sub">${cfg.label}</div>
          </div>
          <div class="agenda-date">${dateStr}</div>
        </div>`;
      }).join('');

  c.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;font-family:'Fredoka',sans-serif">📅 Agenda de ${currentPet ? currentPet.name : 'tu mascota'}</div>
    ${!currentPet ? `<div class="alert-item alert-orange"><span class="alert-icon">⚠️</span><div>Primero registrá tu mascota</div></div>` : ''}
    ${eventsHtml}
  `;

  if (currentPet) {
    showFab(() => openModal('modal-agenda'));
  } else {
    removeFab();
  }
}

function showFab(onClick) {
  removeFab();
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.innerHTML = '+';
  fab.onclick = onClick;
  document.body.appendChild(fab);
}
function removeFab() {
  const old = document.querySelector('.fab');
  if (old) old.remove();
}

async function saveAgendaEvent() {
  if (!currentPet) { showToast('Primero registrá tu mascota'); return; }
  const data = {
    pet_id: currentPet.id,
    event_type: document.getElementById('event-type').value,
    title: document.getElementById('event-title').value.trim(),
    event_date: document.getElementById('event-date').value,
  };
  if (!data.title || !data.event_date) { showToast('Completá todos los campos'); return; }
  try {
    const r = await fetch(`${API}/api/agenda`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify(data) });
    if (!r.ok) { showToast('Error al guardar'); return; }
    closeModal('modal-agenda');
    showToast('✅ Evento guardado');
    renderAgenda(document.getElementById('tab-content'));
  } catch(e) { showToast('Error de conexión'); }
}

// ════════════════════════════════════════
// TABS - VETERINARIA
// ════════════════════════════════════════
function renderVetTab(tab) {
  removeFab();
  const c = document.getElementById('vet-content');
  if (tab === 'resumen') renderVetResumen(c);
  else if (tab === 'pacientes') renderVetPacientes(c);
  else if (tab === 'turnos') renderVetTurnos(c);
  else if (tab === 'ofertas') renderVetOfertas(c);
}

function renderVetResumen(c) {
  const vetName = userName.split(' ')[0];
  c.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;font-family:'Fredoka',sans-serif">📊 Panel — ${vetName}</div>
    <div class="vet-stats">
      <div class="vet-stat"><div class="vet-stat-num">156</div><div class="vet-stat-label">Pacientes</div></div>
      <div class="vet-stat"><div class="vet-stat-num">12</div><div class="vet-stat-label">Hoy</div></div>
      <div class="vet-stat"><div class="vet-stat-num">8</div><div class="vet-stat-label">Alertas</div></div>
    </div>
    <div class="section-title">📋 Paciente destacado</div>
    <div class="patient-card">
      <div class="patient-header">
        <div class="patient-avatar">🐕</div>
        <div>
          <div class="patient-name">Lila</div>
          <div class="patient-breed">Golden · 5 años</div>
        </div>
        <span class="badge badge-warn">⚠️ Vacuna vence</span>
      </div>
      <div class="patient-details">
        <div class="detail-item"><span class="detail-key">Última consulta</span><span class="detail-val">15/01/2026</span></div>
        <div class="detail-item"><span class="detail-key">Peso</span><span class="detail-val">28 kg</span></div>
        <div class="detail-item"><span class="detail-key">Antiparasitario</span><span class="detail-val" style="color:var(--mint-dark)">✅ Al día</span></div>
        <div class="detail-item"><span class="detail-key">Dueño</span><span class="detail-val">Ariel G.</span></div>
      </div>
    </div>
    <div class="offer-banner" style="margin-top:16px">
      <h3>📢 Publicar oferta</h3>
      <p>Creá una promo que llega como mensaje de la mascota a sus dueños</p>
      <button class="btn-white" onclick="openModal('modal-oferta')">+ Nueva oferta</button>
    </div>
  `;
}

function renderVetPacientes(c) {
  c.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;font-family:'Fredoka',sans-serif">🐾 Pacientes</div>
    ${[
      {name:'Lila', breed:'Golden · 5 años', icon:'🐕', warn:true},
      {name:'Mishi', breed:'Gato persa · 3 años', icon:'🐈', warn:false},
      {name:'Rocky', breed:'Labrador · 2 años', icon:'🐕', warn:false},
    ].map(p => `
      <div class="patient-card">
        <div class="patient-header">
          <div class="patient-avatar">${p.icon}</div>
          <div><div class="patient-name">${p.name}</div><div class="patient-breed">${p.breed}</div></div>
          <span class="badge ${p.warn ? 'badge-warn' : 'badge-ok'}">${p.warn ? '⚠️ Alerta' : '✅ OK'}</span>
        </div>
      </div>`).join('')}
  `;
}

function renderVetTurnos(c) {
  c.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;font-family:'Fredoka',sans-serif">📅 Turnos de hoy</div>
    <div style="background:white;border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow)">
      ${[
        {time:'10:00', pet:'🐕 Lila', type:'Control + vacuna'},
        {time:'11:30', pet:'🐈 Mishi', type:'Castración'},
        {time:'14:00', pet:'🐕 Rocky', type:'Consulta general'},
        {time:'16:30', pet:'🐇 Coco', type:'Control de peso'},
      ].map(t => `
        <div class="turno-item">
          <div class="turno-time">${t.time}</div>
          <div><div class="turno-pet">${t.pet}</div><div class="turno-type">${t.type}</div></div>
        </div>`).join('')}
    </div>
  `;
}

function renderVetOfertas(c) {
  c.innerHTML = `
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;font-family:'Fredoka',sans-serif">🏷️ Mis ofertas</div>
    <div class="offer-banner">
      <h3>📢 Nueva oferta</h3>
      <p>Los dueños la reciben como mensaje de su mascota</p>
      <button class="btn-white" onclick="openModal('modal-oferta')">+ Publicar</button>
    </div>
    <div style="background:white;border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow);margin-top:16px">
      <div style="font-size:14px;color:var(--text-soft);text-align:center;padding:20px;font-weight:600">No hay ofertas activas todavía</div>
    </div>
  `;
}

function publishOffer() {
  const titulo = document.getElementById('oferta-titulo').value.trim();
  if (!titulo) { showToast('Completá el título'); return; }
  closeModal('modal-oferta');
  showToast('✅ Oferta publicada — los dueños recibirán el mensaje 🐾');
}

// ════════════════════════════════════════
// UTILS
// ════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ════════════════════════════════════════
// INIT — auto-login si hay token guardado
// ════════════════════════════════════════
window.onload = () => {
  if (token && userRole) {
    showApp();
  }
};
