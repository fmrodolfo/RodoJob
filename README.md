# RodoJob — Tu asistente de búsqueda de empleo

App moderna (React + Vite) con sincronización en Firebase, IA de Google Gemini (gratis) para adaptar CVs y cartas, ofertas reales vía Adzuna, búsqueda de empresas reales por ciudad/sector vía OpenStreetMap (gratis, sin clave), perfiles independientes, PDFs de candidatura y candidaturas unificadas. Diseñada para desplegar en Netlify.

## ✨ Funciones
- La IA lee tus CVs y busca ofertas por ti (sin escribir el puesto).
- Búsqueda en **varias ciudades a la vez** (separadas por comas), en ofertas y en empresas.
- Filtros por fecha (24 h / 7 / 15 / 30 días).
- Sube tu CV en **PDF**: la app extrae el texto para que la IA lo adapte.
- Buscador de **empresas reales** por ciudad y sector (OpenStreetMap) con enlace a su web.
- Botón por oferta/empresa para generar CV y carta adaptados y descargarlos en PDF.
- Pestaña "Mis candidaturas" con conmutador **Ofertas / Empresas** (sin repetir).
- Perfiles independientes con foto, sincronizados entre dispositivos con Firebase.

---

## 🚀 Puesta en marcha (una sola vez, ~15 min)

Necesitas 3 cosas **totalmente gratuitas**: **Firebase**, **Adzuna** y **Google Gemini** (la IA). Ninguna te pide tarjeta. Ya tienes Firebase y Netlify, así que vamos al grano.

### 1) Firebase (sincroniza tus teléfonos)

1. Entra en <https://console.firebase.google.com> → tu proyecto.
2. **Authentication** → *Sign-in method* → activa **Correo electrónico/contraseña**.
3. **Firestore Database** → *Crear base de datos* → modo producción → elige región.
4. **Reglas de seguridad** (para que solo tú veas tus datos): en Firestore → pestaña *Reglas* → pega el contenido de `firestore.rules` → Publicar.
5. **Configuración del proyecto** (⚙️) → *Tus apps* → crea una app **Web** (`</>`) → copia los 6 valores del objeto `firebaseConfig`.

> Nota: NO hace falta activar **Storage** (eso pide tarjeta). Las fotos y CVs se guardan en Firestore, que es gratis.

### 2) Adzuna (ofertas reales)

1. Regístrate gratis en <https://developer.adzuna.com/>.
2. Crea una app y copia tu **App ID** y **App Key**.

### 3) Google Gemini (la IA — GRATIS, sin tarjeta)

1. Entra en <https://aistudio.google.com/app/apikey> con tu cuenta de Google.
2. Pulsa **Create API key** y copia la clave. No hay que pagar ni poner tarjeta; la capa gratuita sobra para uso personal.

---

## 🌐 Desplegar en Netlify

1. Sube esta carpeta a un repositorio de GitHub (o arrástrala en Netlify → *Add new site*).
2. Netlify detectará la configuración de `netlify.toml` automáticamente
   (build: `npm run build`, carpeta: `dist`, funciones: `netlify/functions`).
3. En **Site settings → Environment variables**, añade estas variables:

| Variable | Valor | ¿Dónde? |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | de firebaseConfig | Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | de firebaseConfig | Firebase |
| `VITE_FIREBASE_PROJECT_ID` | de firebaseConfig | Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | de firebaseConfig | Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | de firebaseConfig | Firebase |
| `VITE_FIREBASE_APP_ID` | de firebaseConfig | Firebase |
| `GEMINI_API_KEY` | tu clave de Google AI Studio | Gemini |
| `ADZUNA_APP_ID` | tu App ID | Adzuna |
| `ADZUNA_APP_KEY` | tu App Key | Adzuna |

> ⚠️ Las que empiezan por `VITE_` van al navegador (las de Firebase son públicas por diseño).
> Las **secretas** (`GEMINI_API_KEY`, `ADZUNA_*`) **NO** llevan `VITE_`: se quedan en el
> servidor, dentro de las funciones de Netlify. Nunca se exponen en el navegador.

4. Pulsa **Deploy**. En 1-2 min tendrás tu URL (`https://tu-sitio.netlify.app`).
5. Ábrela en el móvil y añádela a la pantalla de inicio ("Añadir a inicio") para usarla como app.

---

## 💻 Probar en tu ordenador (opcional)

```bash
npm install
cp .env.example .env     # rellena los valores VITE_ de Firebase
npm run dev              # http://localhost:5173
```
> Nota: las funciones de IA y ofertas necesitan Netlify. Para probarlas en local usa
> `npm i -g netlify-cli` y `netlify dev` (con las variables secretas en tu `.env`).

---

## 📱 Cómo se usa

1. **Intro** animada con el logo RodoJob.
2. **Inicia sesión** con tu correo (el mismo en todos tus teléfonos → todo se sincroniza).
3. **Elige o crea un perfil** (uno para ti, otro para un familiar; son independientes, con foto).
4. **Perfil**: carga tus CVs (por sector) y cartas de motivación. La IA los usa como base.
5. **Ofertas**: escribe puesto, lugar y país. Salen ofertas reales + botones a jobup, Indeed, LinkedIn, etc.
   - **Ver y aplicar**: te lleva a la web de la empresa.
   - **Preparar con IA**: genera un CV y una carta adaptados a *esa* oferta y los descarga en PDF (solo si tú lo pides).
   - **Ya apliqué**: la oferta pasa a la pestaña *Aplicadas* y no vuelve a salir (sin repetidos).
6. **Empresas / hoteles / restaurantes**: tu lista para candidaturas espontáneas, con enlace a su web,
   botón de correo, redacción del correo con IA y opción de **tachar** al enviarlo.

---

## ❗ Nota honesta sobre "todos los portales"

Ninguna app puede conectarse legal y fiablemente a *todas* las webs de empleo (Indeed, LinkedIn,
jobup... no ofrecen acceso libre y bloquean el scraping). RodoJob usa la mejor combinación real:
**Adzuna** (que ya agrega ofertas de Indeed y muchos portales por país) **más enlaces de búsqueda
directos** a los principales portales de cada país, ya rellenados con tu búsqueda. Así cubres una
cantidad enorme de ofertas sin promesas falsas. Puedes añadir más portales fácilmente en
`src/lib/api.js` (objeto `JOB_PORTALS`).

## 🛠️ Estructura del código

```
src/
  components/   Intro, Auth, ProfileGate, Layout, CandidacyModal
  pages/        Search, Applied, Directory, Profile
  context/      AppContext (auth + Firestore + estado)
  lib/          api.js (ofertas/IA), pdf.js (generación PDF)
  firebase.js   configuración de Firebase
netlify/functions/
  jobs.js       proxy seguro a Adzuna
  gemini.js     proxy seguro a Google Gemini (IA gratis)
  companies.js  empresas reales vía OpenStreetMap (sin clave)
```
