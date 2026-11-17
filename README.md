# Pet's Talk — Frontend (v3)

App web de Pet's Talk: el dueño registra a su mascota, carga su agenda de salud,
elige qué avisos recibir y la mascota le escribe por WhatsApp.

- API: https://pets-api.sessian.tech (repo `petstalk-backend`)
- Producción: https://pets-app.sessian.tech (Easypanel, build con `Dockerfile`, puerto 80)

## Desarrollo local
```
npm install
npm run dev     # http://localhost:3001
```
Para apuntar a otra API: variable de build `VITE_API_URL`.
