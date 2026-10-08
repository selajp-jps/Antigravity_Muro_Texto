// Verificacion: intenta crear UN documento de sesion desde un cliente anonimo,
// igual que lo haria cualquier visitante con el enlace de la app.
//   - Si responde 403 -> las reglas nuevas estan activas y la base esta cerrada.
//   - Si responde 200 -> la base sigue abierta (las reglas no se publicaron).
// Al final intenta borrar el documento de prueba (si las reglas ya estan
// activas, ese borrado tambien sera rechazado: es lo esperado).
const KEY = process.env.FIREBASE_API_KEY || 'AIzaSyDEzEW03OccBfD30gqWCxWJOVEeXEy4Sq0';
const PROJECT = process.env.FIREBASE_PROJECT_ID || 'muro-clases';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const docId = 'ZZZ-PRUEBA-SEGURIDAD';
const url = `${BASE}/sessions/${docId}?key=${KEY}`;

async function main() {
  // 1) Lectura publica (debe seguir permitida: la necesitan los alumnos)
  const readRes = await fetch(`${BASE}/sessions?pageSize=1&mask.fieldPaths=code&key=${KEY}`);
  console.log('LECTURA_ANONIMA_HTTP', readRes.status);

  // 2) Escritura anonima (debe fallar con 403)
  const body = JSON.stringify({
    fields: {
      code: { stringValue: docId },
      title: { stringValue: '__PRUEBA_DE_DIAGNOSTICO__' },
      prompt: { stringValue: 'prueba' },
      locked: { booleanValue: false },
      revealed: { booleanValue: false },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  });

  const writeRes = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  console.log('ESCRITURA_ANONIMA_HTTP', writeRes.status);
  console.log((await writeRes.text()).slice(0, 300));

  // 3) Limpieza
  const delRes = await fetch(url, { method: 'DELETE' });
  console.log('LIMPIEZA_HTTP', delRes.status);
}

main().catch((err) => {
  console.error('Error de red al probar:', err.message);
  process.exitCode = 1;
});
