# Seguridad de Firebase — Muro Digital Universitario

Guía para resolver el aviso de Firebase:

> **[Firebase] El acceso de clientes a tu base de datos de Cloud Firestore vencerá en 4 días**
> Proyecto: `muro-clases`

---

## 1. Qué está pasando

Cuando se crea una base de datos de Firestore desde la consola, Firebase ofrece
arrancar en **modo de prueba**. Ese modo publica estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;   // abre TODO, sin login
    }
  }
}
```

Ese `if true` es una puerta abierta: cualquiera en Internet puede leer y
escribir la base sin autenticarse. Por eso el modo de prueba **vence a los 30
días** de haberlo activado. Cuando venza, esas reglas se reemplazan por un
cierre total: **toda** solicitud de la app es rechazada.

Lo que dice el correo, traducido a la práctica:

| Momento | Qué pasa con la app |
|---|---|
| **Hoy** | Funciona. Y la base está **pública**: cualquiera que tenga el enlace puede leer y escribir todo. |
| **En ~4 días** | Las reglas vencen. Crear sesión, entrar con un código, enviar una opinión y verlas: **todo falla** con `permission-denied`. |

Lo de "3 días" que aparece en la consola suele ser la fecha de la **última
modificación** de las reglas, no la de creación. La fecha exacta de vencimiento
figura en la consola: **Firestore Database → pestaña Reglas** (en la variante en
inglés: *Rules → "Your rules expire on…"*).

Nota: `CLASES MURO` en el correo no es el proyecto. Es el nombre que le diste a
la colección, así que el aviso aplica a esa base y por extensión a todo el
proyecto `muro-clases`.

---

## 2. Por qué este proyecto era especialmente sensible

La app **no tiene login**: en la pantalla de inicio el usuario elige "Estudiante"
o "Docente / Proyector" con un botón, y esa elección es solo de interfaz. Las
operaciones que hace contra Firestore son:

| Operación | Quién la hace | Colección / documento |
|---|---|---|
| Crear sesión (`setDoc`) | cualquiera desde la home | `sessions/{CODIGO}` |
| Leer sesión (consigna) | alumno y docente | `sessions/{CODIGO}` |
| Bloquear/reanudar, revelar/ocultar (`updateDoc`) | "docente" (botón) | `sessions/{CODIGO}` |
| Enviar opinión (`addDoc`) | alumno | `sessions/{CODIGO}/responses/{autoId}` |
| Leer opiniones (`onSnapshot`) | proyector **y contador del alumno** | `sessions/{CODIGO}/responses` |
| Limpiar respuestas (`deleteDoc` masivo) | "docente" (botón) | `sessions/{CODIGO}/responses` |

Con `allow read, write: if true`, cualquier persona con el código de una sesión
(y los códigos son cortos y previsibles, del estilo `ADM-264`) podía:

- borrar todas las opiniones recibidas con el botón "Limpiar respuestas";
- sobrescribir la consigna de una clase en curso;
- revelar las opiniones antes de tiempo (arruinando la dinámica del aula);
- **listar y descargar la base completa**: nombres de materias, consignas y
  todas las opiniones de todos los cuatrimestres.

Esto no es hipotético. La sonda del repositorio confirma el estado actual:
una lectura anónima a la API REST de Firestore —usando la clave pública que va
incrustada en el bundle del navegador— devuelve sesiones reales:

```json
{ "documents": [
    { "name": ".../sessions/ADM-264",
      "fields": { "code": {"stringValue": "ADM-264"},
                  "title": {"stringValue": "Competencias Emprendedoras"} },
      "createTime": "2026-09-15T21:53:29Z" },
    ...
  ],
  "nextPageToken": "AFTOeJz2..." }
```

El `nextPageToken` confirma que hay más páginas: toda la base es recorrible sin
credenciales. Por eso el correo dice "completamente expuesta a Internet": es
literalmente así.

Para verificar por tu cuenta si además acepta escrituras anónimas:

```bash
node scripts/probar-permisos-firestore.mjs
```

- `ESCRITURA_ANONIMA_HTTP 200` → la puerta sigue abierta (crea y borra un
  documento de prueba `ZZZ-PRUEBA-SEGURIDAD`).
- `ESCRITURA_ANONIMA_HTTP 403` → las reglas ya vencieron o ya fueron corregidas.

---

## 3. Qué se hizo y qué falta

### Estado actual

| Paso | Estado |
|---|---|
| Ingreso con Google habilitado en Firebase (Authentication → Google) | **Hecho** (nombre público: "Muro Digital Universitario UNLu") |
| La app pide la cuenta docente y protege los controles del proyector | **Hecho** (ver sección 3.1) |
| Publicar las reglas de `firestore.rules` con el UID del docente | **Pendiente** (ver sección 3.2) |

### 3.1 Cómo se comporta la app ahora

- **Alumnos:** entran con el código o el QR, sin cuenta y sin contraseña. Nada
  cambió para ellos.
- **Docentes:** ven un botón **Ingresar con Google** en la barra superior y en la
  pantalla de inicio. Después de ingresar una vez, la sesión queda recordada en
  esa computadora.
- **Sin sesión iniciada:** la pantalla de inicio no permite crear sesiones y el
  panel del proyector muestra un aviso en lugar de los controles. La consigna y
  el contador en vivo se siguen viendo, así que la clase no se interrumpe.

### 3.2 Publicar las reglas (5 minutos, una sola vez)

1. Entrá a la app con **Ingresar con Google** usando tu cuenta de docente.
2. En Firebase: **Authentication → Usuarios** y copiá tu **User UID** (un texto
   largo, del estilo `aB3dEfGhIjKlMnOpQrStUvWxYz1234567890`).
3. Abrí `firestore.rules` y pegá ese UID donde dice
   `REEMPLAZAR_POR_UID_DEL_DOCENTE` (dejá las comillas simples).
4. Copiá todo el archivo y pegalo en **Firestore Database → Reglas → Publicar**.
5. Fijate que desaparezca el aviso de "las reglas vencerán".

**Sumar otro docente (30 segundos, cuando haga falta):**

1. Que esa persona entre una vez a la app con su cuenta de Google.
2. En **Authentication → Usuarios**, copiá su **User UID**.
3. En **Firestore Database → Datos**, creá (si no existe) la colección
   `docentes` y, adentro, un documento cuyo **ID** sea ese UID. Podés dejar el
   documento vacío o ponerle un campo `email` con su correo, para acordarte de
   quién es.
4. Ya está: esa persona puede revelar, bloquear y limpiar respuestas.

**Dar de baja a alguien:** borrá su documento de la colección `docentes`.
También conviene borrar su usuario en Authentication.

**Si algún día te quedás afuera de la app:** la lista de docentes se puede
editar desde **Firestore → Datos** (la consola no pasa por estas reglas), así
que siempre vas a poder restablecer tu propio acceso.

### Camino mínimo (solo para ganar tiempo)

Si la clase es antes de que puedas hacer los pasos de arriba, publicá estas
reglas en lugar de las definitivas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read: if true;
      allow create: if request.resource.data.code == sessionId
        && request.resource.data.title is string
        && request.resource.data.title.size() > 0
        && request.resource.data.prompt is string
        && request.resource.data.prompt.size() > 0
        && request.resource.data.createdAt == request.time;
      match /responses/{responseId} {
        allow read, create: if true;
      }
    }
  }
}
```

Con esto la app sigue funcionando para la clase de hoy: crear sesión, entrar y
enviar opiniones. Lo que queda cerrado es lo peligroso: el borrado masivo de
opiniones y el resto de la base (ya no se puede recorrer ni vaciar todo).

Lo que **no** funciona con este parche: los botones de bloquear, revelar y
limpiar respuestas (fallan con `permission-denied`).

---

## 4. Verificar que quedó bien

**Antes de publicar las reglas** (con las reglas viejas de prueba todavía
activas) se puede comprobar que el ingreso funciona: en la pantalla de inicio,
el botón **Ingresar con Google** debe abrir la ventana de Google, y al volver la
barra superior tiene que mostrar el nombre y el correo del docente.

**Después de publicar las reglas**, con la app abierta, probá esta secuencia:

1. Crear una sesión nueva desde la pantalla de inicio → debe entrar al modal de
   confirmación con el QR.
2. Abrir el enlace de estudiante, enviar una opinión → el contador del proyector
   sube en vivo.
3. Botones "Revelar opiniones" y "Pausar envíos" → cambian el estado.
4. Botón "Limpiar respuestas" → borra las opiniones.
5. Cerrar la sesión docente (barra superior) y abrir de nuevo el panel del
   proyector → debe aparecer el aviso de ingreso, sin los controles.
6. En Firestore → Reglas, confirmá que ya no figura el aviso de vencimiento.

Y la prueba negativa, para confirmar que ya no está abierta:
`node scripts/probar-permisos-firestore.mjs` debe devolver `403` en la escritura.

Si al crear una sesión aparece un error de permisos, la causa más probable es
que las reglas se publicaron pero el UID del docente no quedó bien copiado en
`firestore.rules` (o que falta publicar).

---

## 5. Ideas para más adelante (no bloquean hoy)

- **Opiniones no públicas antes de revelarlas.** Hoy la vista del alumno escucha
  la subcolección `responses` solo para mostrar el contador en vivo, y eso obliga
  a que la lectura sea pública: un alumno curioso puede leer las opiniones de sus
  compañeros antes del debate. Se arregla manteniendo un contador en el documento
  de la sesión (por ejemplo `responseCount`) y dejando la lectura de `responses`
  solo para el docente.
- **Autenticación anónima para alumnos.** Con `signInAnonymously()` se puede
  exigir `request.auth != null` en las escrituras, lo que frena el spam automatizado
  sin pedirle nada al alumno.
- **Freno al abuso.** Las reglas nuevas ya limitan el tamaño del texto; si hiciera
  falta, se puede sumar App Check o limitar la cantidad de opiniones por sesión.
- **Rotación de la clave.** El `apiKey` de Firebase no es un secreto (va en el
  bundle del navegador), así que no hace falta rotarlo. Lo que sí conviene cuidar
  es quién figura en la lista de docentes: si alguien deja el equipo, borrá su
  documento de la colección `docentes`.
- **Storage.** La app declara `VITE_FIREBASE_STORAGE_BUCKET` pero no sube
  archivos. Si algún día se habilita Cloud Storage, hay que publicar también sus
  reglas: por defecto las bases nuevas también arrancan en modo de prueba.
- **Reglas dentro del repositorio.** Quedaron versionadas en `firestore.rules`
  y `firebase.json`, así que se pueden desplegar desde la terminal con la CLI
  (`firebase deploy --only firestore:rules`) en lugar de copiar y pegar en la
  consola.

---

## 6. Archivos de esta guía

| Archivo | Para qué sirve |
|---|---|
| [firestore.rules](firestore.rules) | Reglas de seguridad para publicar (login del equipo docente). |
| [src/auth.js](src/auth.js) | Ingreso y cierre de sesión con Google dentro de la app. |
| [src/components/Navbar.jsx](src/components/Navbar.jsx) | Barra superior: muestra la cuenta docente y permite ingresar o salir. |
| [src/views/HomeView.jsx](src/views/HomeView.jsx) | Pantalla de inicio: pide la cuenta docente para crear sesiones. |
| [src/views/TeacherView.jsx](src/views/TeacherView.jsx) | Panel del proyector: exige la cuenta docente para los controles. |
| [firebase.json](firebase.json) | Configuración de la CLI para desplegar `firestore.rules`. |
| [scripts/probar-permisos-firestore.mjs](scripts/probar-permisos-firestore.mjs) | Sonda de diagnóstico: confirma si la base acepta escrituras anónimas. |
