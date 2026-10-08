// ---------------------------------------------------------------------------
//  Autenticación del equipo docente
//
//  Los ALUMNOS no se registran: entran con el código o el QR, como siempre.
//  Los DOCENTES entran una sola vez con su cuenta de Google y la sesión queda
//  recordada en su computadora.
//
//  La autorización real (quién puede revelar, bloquear o limpiar respuestas)
//  vive en las reglas de Firestore (firestore.rules): acá solo se pide la
//  identidad, no se decide el permiso.
// ---------------------------------------------------------------------------

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getAuth,
} from 'firebase/auth';
import app from './firebase';

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// Sugiere elegir cuenta, útil cuando en una misma computadora entran varios
// docentes con cuentas distintas.
provider.setCustomParameters({ prompt: 'select_account' });

export async function ingresarConGoogle() {
  return signInWithPopup(auth, provider);
}

export async function cerrarSesion() {
  return signOut(auth);
}

export function observarSesion(callback) {
  return onAuthStateChanged(auth, callback);
}

// Nombre corto para mostrar en pantalla (parte antes de la arroba).
export function nombreCorto(usuario) {
  if (!usuario) return '';
  if (usuario.displayName) return usuario.displayName.split(' ')[0];
  if (usuario.email) return usuario.email.split('@')[0];
  return 'Docente';
}

// Traduce los errores de Firebase a algo que se entienda en pantalla.
export function mensajeDeError(error) {
  const codigo = error?.code || '';
  switch (codigo) {
    case 'auth/popup-closed-by-user':
      return 'Se cerró la ventana de Google antes de terminar. Probá de nuevo.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes para este sitio y probá otra vez.';
    case 'auth/unauthorized-domain':
      return 'Esta dirección todavía no está autorizada en Firebase (Authentication → Configuración → Dominios autorizados).';
    case 'auth/network-request-failed':
      return 'No hay conexión con Google. Revisá internet e intentá de nuevo.';
    case 'auth/cancelled-popup-request':
      return 'Se canceló el ingreso anterior. Probá otra vez.';
    case 'auth/operation-not-allowed':
      return 'El ingreso con Google no está habilitado en Firebase.';
    case 'auth/api-key-not-valid':
      return 'La clave de Firebase que usa la app no es válida. Revisá el archivo .env (VITE_FIREBASE_API_KEY) y reiniciá el servidor.';
    case 'auth/configuration-not-found':
      return 'El servicio de identidad de Firebase no está habilitado en el proyecto. Habilitá la Identity Toolkit API en Google Cloud y probá de nuevo.';
    case 'auth/internal-error':
      return 'Firebase rechazó la operación (error interno). Si persiste, revisá que la Identity Toolkit API esté habilitada en el proyecto.';
    default:
      return 'No se pudo iniciar sesión: ' + (error?.message || 'error desconocido');
  }
}
