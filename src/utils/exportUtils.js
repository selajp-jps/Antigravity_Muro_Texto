/**
 * Utility functions for exporting and sharing responses
 */

export function formatSessionSummary(session, responses) {
  const dateStr = new Date().toLocaleString('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  let text = `====================================================\n`;
  text += `REPORTE DE INTERACCIÓN EN AULA - MURO DE CLASES\n`;
  text += `====================================================\n\n`;
  text += `Materia / Cátedra : ${session?.title || 'Sin título'}\n`;
  text += `Código de Sesión : ${session?.code || 'N/A'}\n`;
  text += `Fecha y Hora     : ${dateStr}\n`;
  text += `Total Aportes    : ${responses?.length || 0} respuestas\n\n`;
  text += `CONSIGNA / PREGUNTA DISPARADORA:\n`;
  text += `"${session?.prompt || ''}"\n\n`;
  text += `====================================================\n`;
  text += `RESPUESTAS DE LOS ESTUDIANTES:\n`;
  text += `====================================================\n\n`;

  if (!responses || responses.length === 0) {
    text += `(No se registraron respuestas en esta sesión)\n`;
  } else {
    responses.forEach((resp, index) => {
      const author = resp.isAnonymous ? 'Anónimo' : (resp.author || 'Estudiante');
      let timeStr = '';
      if (resp.createdAt?.toDate) {
        timeStr = resp.createdAt.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      } else if (resp.createdAt instanceof Date) {
        timeStr = resp.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      }

      text += `[#${index + 1}] ${author} ${timeStr ? `(${timeStr})` : ''}:\n`;
      text += `${resp.text.trim()}\n\n`;
      text += `----------------------------------------------------\n\n`;
    });
  }

  return text;
}

export async function copyResponsesToClipboard(session, responses) {
  const formatted = formatSessionSummary(session, responses);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(formatted);
    return true;
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = formatted;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

export function downloadResponsesAsText(session, responses) {
  const formatted = formatSessionSummary(session, responses);
  const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeCode = (session?.code || 'SESION').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateTag = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `Muro_Respuestas_${safeCode}_${dateTag}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
