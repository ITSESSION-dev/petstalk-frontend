export const SPECIES = [
  { value: 'perro', label: 'Perro', emoji: '🐶' },
  { value: 'gato', label: 'Gato', emoji: '🐱' },
  { value: 'otro', label: 'Otro', emoji: '🐾' }
];

export const TONES = [
  { value: 'cariñoso', label: 'Cariñoso 🥰' },
  { value: 'juguetón', label: 'Juguetón 🎾' },
  { value: 'dramático', label: 'Dramático 🎭' },
  { value: 'gruñón', label: 'Gruñón 😤' }
];

export const EVENT_TYPES = [
  { value: 'vaccine', label: 'Vacuna', emoji: '💉', icon: 'syringe', tint: 'teal' },
  { value: 'pipette', label: 'Pipeta', emoji: '🧴', icon: 'shield', tint: 'peach' },
  { value: 'antiparasitic', label: 'Antiparasitario', emoji: '💊', icon: 'pill', tint: 'lilac' },
  { value: 'vet_visit', label: 'Consulta veterinaria', emoji: '🩺', icon: 'steth', tint: 'sky' },
  { value: 'birthday', label: 'Cumpleaños', emoji: '🎂', icon: 'cake', tint: 'rose' },
  { value: 'heat_cycle', label: 'Celo', emoji: '🌸', icon: 'flower', tint: 'rose' }
];

export const RECURRENCES = [
  { value: 'none', label: 'Una vez' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' }
];

// Eventos que se pueden simular (lo que en el futuro detectará el collar)
export const SIMULATIONS = [
  { type: 'no_walk', label: 'No salió a pasear', emoji: '🦮', icon: 'walk', tint: 'teal' },
  { type: 'no_food', label: 'No comió', emoji: '🍖', icon: 'bowl', tint: 'peach' },
  { type: 'no_water', label: 'No tomó agua', emoji: '💧', icon: 'drop', tint: 'sky' },
  { type: 'insufficient_sleep', label: 'Durmió poco', emoji: '😴', icon: 'moon', tint: 'lilac' },
  { type: 'birthday', label: 'Cumpleaños', emoji: '🎂', icon: 'cake', tint: 'rose' },
  { type: 'commercial_offer', label: 'Oferta de la vete', emoji: '🏷️', icon: 'tag', tint: 'peach', context: 'La veterinaria del barrio tiene 20% OFF en alimento balanceado y lo lleva a domicilio' }
];

export const EVENT_LABELS = {
  no_walk: 'Paseo', no_food: 'Comida', no_water: 'Agua', insufficient_sleep: 'Descanso',
  heat_cycle: 'Celo', birthday: 'Cumpleaños', commercial_offer: 'Oferta', custom: 'Mensaje',
  vaccine_reminder: 'Vacuna', pipette_reminder: 'Pipeta', antiparasitic_reminder: 'Antiparasitario',
  vet_visit_reminder: 'Consulta', birthday_reminder: 'Cumpleaños', heat_cycle_reminder: 'Celo'
};

export const PREFS = [
  { key: 'notify_walk', label: 'Paseos', emoji: '🦮', icon: 'walk', tint: 'teal' },
  { key: 'notify_food', label: 'Comida', emoji: '🍖', icon: 'bowl', tint: 'peach' },
  { key: 'notify_water', label: 'Agua', emoji: '💧', icon: 'drop', tint: 'sky' },
  { key: 'notify_sleep', label: 'Descanso', emoji: '😴', icon: 'moon', tint: 'lilac' },
  { key: 'notify_vaccine', label: 'Vacunas y consultas', emoji: '💉', icon: 'syringe', tint: 'teal' },
  { key: 'notify_pipette', label: 'Pipetas', emoji: '🧴', icon: 'shield', tint: 'peach' },
  { key: 'notify_antiparasitic', label: 'Antiparasitarios', emoji: '💊', icon: 'pill', tint: 'lilac' },
  { key: 'notify_birthday', label: 'Cumpleaños', emoji: '🎂', icon: 'cake', tint: 'rose' },
  { key: 'notify_heat_cycle', label: 'Celo', emoji: '🌸', icon: 'flower', tint: 'rose' },
  { key: 'notify_offers', label: 'Ofertas de veterinarias y pet shops', emoji: '🏷️', icon: 'tag', tint: 'peach' }
];

export function speciesEmoji(species) {
  return SPECIES.find((s) => s.value === species)?.emoji || '🐾';
}

export function eventMeta(type) {
  return EVENT_TYPES.find((e) => e.value === type) || { label: type, emoji: '📅', icon: 'calendar', tint: 'teal' };
}

export function daysUntil(dateStr) {
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

export function formatDate(dateStr) {
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(ts) {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? time : `${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} ${time}`;
}

// Achica la foto a 480px y la pasa a base64 (JPEG) para no superar el límite del servidor
export function imageToBase64(file, max = 480) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('El archivo tiene que ser una imagen'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
