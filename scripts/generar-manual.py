# -*- coding: utf-8 -*-
"""
Genera el manual de uso actualizado en formato Word (.docx).

Contenido: mantiene la estructura y la redaccion del manual original
(4 paginas, 5 secciones) y agrega todo lo que cambio en la aplicacion:
el ingreso del equipo docente con Google, los dos niveles de permisos,
el boton de borrar sesion y las preguntas frecuentes nuevas.
"""

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.shared import Pt, Cm

SALIDA = "Manual de Uso - Muro Digital Universitario (actualizado).docx"
URL = "https://app-muro-texto.vercel.app"

doc = Document()

# --- Estilo general: letra legible, margenes comodos ---
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)
for section in doc.sections:
    section.top_margin = Cm(2.2)
    section.bottom_margin = Cm(2.2)
    section.left_margin = Cm(2.4)
    section.right_margin = Cm(2.4)

# --- Portada ---
titulo = doc.add_heading("Manual de Uso: Muro Digital de Interacción en el Aula", level=0)
sub = doc.add_paragraph("Guía Operativa para el Equipo Docente y Ayudantes de Cátedra")
sub.alignment = WD_ALIGN_PARAGRAPH.LEFT
sub.runs[0].italic = True
doc.add_paragraph("Universidad Nacional de Luján · Herramienta web de participación en el aula")
doc.add_paragraph("")


def bullets(items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        if isinstance(item, tuple):
            run = p.add_run(item[0])
            run.bold = True
            p.add_run(item[1])
        else:
            p.add_run(item)


def marcar_fila(fila, encabezado=False):
    """Evita que una fila se corte entre dos paginas y repite el encabezado."""
    props = fila._tr.get_or_add_trPr()
    props.append(OxmlElement("w:cantSplit"))
    if encabezado:
        props.append(OxmlElement("w:tblHeader"))


# =========================================================================
doc.add_heading("1. Propósito Pedagógico y Características Generales", level=1)
doc.add_paragraph(
    "La aplicación Muro Digital de Interacción en el Aula es una herramienta web "
    "ligera diseñada específicamente para relevar opiniones, respuestas y argumentos "
    "de los estudiantes en tiempo real durante el desarrollo de clases presenciales o "
    "sincrónicas. Su arquitectura está orientada a maximizar la participación y "
    "garantizar la integridad pedagógica de las intervenciones."
)
doc.add_paragraph("Los principios fundamentales que rigen esta herramienta son:")
bullets([
    ("Sin fricción: ", "se ha eliminado cualquier barrera de acceso para los estudiantes; "
     "no requieren crear cuentas, gestionar usuarios ni recordar contraseñas para participar."),
    ("Cero sesgo (efecto anclaje): ", "con el fin de evitar que los alumnos se copien o "
     "condicionen sus ideas por las respuestas de sus pares, las opiniones permanecen "
     "ocultas en el proyector mientras el proceso de respuesta está activo."),
    ("Multi-comisión: ", "el sistema permite la creación de múltiples sesiones simultáneas "
     "con códigos independientes (por ejemplo: ADM-101, ADM-202), asegurando que los datos "
     "no se mezclen entre distintos docentes o materias."),
    ("Costo cero y alta disponibilidad: ", "la plataforma se encuentra alojada en Vercel y "
     "utiliza Google Firebase Firestore para la sincronización de datos en tiempo real, "
     "garantizando un servicio estable y gratuito."),
    ("Acceso del equipo docente protegido: ", "las acciones de gestión (revelar, pausar, "
     "limpiar y borrar) requieren una cuenta de Google autorizada por la cátedra. Los "
     "estudiantes no necesitan cuenta."),
])

# =========================================================================
doc.add_heading("2. Acceso y Roles del Sistema", level=1)
doc.add_paragraph("Para comenzar a utilizar la herramienta, acceda a la siguiente dirección:")
p = doc.add_paragraph()
p.add_run(URL).bold = True
doc.add_paragraph(
    "El sistema opera bajo tres niveles de acceso con funciones diferenciadas. Los "
    "estudiantes no requieren cuenta ni contraseña; el equipo docente sí, y lo hace una "
    "sola vez por computadora (después la sesión queda recordada)."
)
bullets([
    ("Rol Docente / Proyector: ", "es el perfil encargado de la gestión de la dinámica. "
     "Para ingresar debe pulsar el botón \"Ingresar docente\" y autorizar con su cuenta de "
     "Google habilitada por la cátedra. Sus funciones incluyen abrir la sesión, proyectar "
     "la consigna y el código QR, monitorear el contador de respuestas recibidas, pausar la "
     "recepción de datos, revelar las tarjetas con las opiniones y exportar el informe "
     "final de la actividad."),
    ("Rol Responsable del Proyecto: ", "es la cuenta administradora de la herramienta. "
     "Además de todas las funciones del rol docente, es la única que puede eliminar una "
     "sesión completa (botón \"Borrar sesión\") y dar de alta a nuevos docentes del equipo."),
    ("Rol Estudiante: ", "es el perfil de participación. El alumno escanea el código QR "
     "desde su dispositivo móvil o ingresa el código de sesión, redacta su opinión "
     "(pudiendo incluir su nombre de forma opcional o participar de manera anónima) y "
     "envía su respuesta al muro, sin registrarse."),
])
doc.add_paragraph(
    "Nota: el botón \"Borrar sesión\" sólo es visible para la cuenta responsable. Si otro "
    "docente intentara realizar esa acción, el sistema la rechaza automáticamente."
)

# =========================================================================
doc.add_heading("3. Protocolo Operativo en el Aula (Paso a Paso)", level=1)
doc.add_paragraph("Para una implementación exitosa durante la clase, siga este protocolo:")
bullets([
    ("Paso 0 · Ingreso del docente: ", "antes de comenzar, inicie sesión con la cuenta "
     "docente autorizada mediante el botón \"Ingresar docente\" de la barra superior. La "
     "primera vez en cada computadora; luego la sesión queda recordada."),
    ("Paso 1 · Creación de la sesión: ", "complete los campos de Materia/Tema y redacte la "
     "consigna disparadora. Asigne un código de sesión específico o utilice la opción de "
     "autogenerar. Finalice pulsando el botón \"Crear sesión de clase\" y, posteriormente, "
     "\"Abrir Proyector Ahora\"."),
    ("Paso 2 · Proyección y relevamiento inicial: ", "una vez abierto el proyector, se "
     "visualizará la consigna en tamaño destacado y el código QR. El contador de respuestas "
     "en vivo iniciará en 0 y las opiniones enviadas se mantendrán ocultas automáticamente."),
    ("Paso 3 · Participación de los estudiantes: ", "los alumnos deben escanear el QR o "
     "ingresar manualmente el código de sesión en la web. Una vez dentro, procederán a la "
     "redacción y envío de sus respuestas."),
    ("Paso 4 · Cierre de recepción: ", "cuando el docente considere que el tiempo de "
     "participación ha concluido, debe utilizar el botón \"Pausar envíos\" para congelar el "
     "formulario en los dispositivos móviles de los alumnos. El mismo botón permite "
     "reanudar la recepción si fuera necesario."),
    ("Paso 5 · Revelado y debate colectivo: ", "accione el botón \"Revelar opiniones\". "
     "Esto iniciará una animación que mostrará las tarjetas para la lectura compartida. En "
     "esta etapa se recomienda realizar la categorización temática y fomentar el debate "
     "sobre los puntos expuestos."),
    ("Paso 6 · Resguardo y evidencias: ", "para documentar la actividad, utilice el botón "
     "\"Guardar PDF\" (hoja de impresión formateada, apta para subir a plataformas como "
     "Moodle). También existe la opción \"Copiar texto\" para un uso rápido de la "
     "información y la descarga en archivo .txt."),
])

# =========================================================================
doc.add_heading("4. Gestión de Comisiones y Limpieza de Datos", level=1)
doc.add_paragraph("El sistema ofrece flexibilidad para diferentes escenarios académicos:")
bullets([
    ("Reutilización de sesiones: ", "si desea emplear la misma consigna y código para dos "
     "comisiones que se dictan de forma consecutiva, puede vaciar el muro rápidamente "
     "mediante el botón \"Limpiar respuestas\" (ícono de papelera). La sesión queda lista "
     "para volver a usarse con el mismo código y el contador vuelve a cero. Esta acción "
     "puede realizarla cualquier docente autorizado."),
    ("Eliminación definitiva de una sesión: ", "el botón \"Borrar sesión\" (visible sólo "
     "para la cuenta responsable) elimina la sesión y todas sus respuestas de forma "
     "permanente. Esta acción no se puede deshacer; para reutilizar un código conviene "
     "emplear \"Limpiar respuestas\" en lugar de borrar."),
    ("Sesiones simultáneas: ", "en caso de requerir clases al mismo tiempo o con distintos "
     "ayudantes, se deben crear sesiones independientes con códigos diferenciados para "
     "mantener la integridad de la información de cada grupo."),
])

# =========================================================================
doc.add_heading("5. Preguntas Frecuentes y Plan de Contingencias", level=1)

filas = [
    ("La cámara del celular no reconoce el QR",
     "El estudiante debe ingresar directamente a la URL de la aplicación y digitar el "
     "código de sesión en la sección \"Unirse a una Sesión\"."),
    ("Comentarios inapropiados o repetidos",
     "El docente tiene la facultad de moderar el contenido una vez reveladas las "
     "respuestas, o de limpiar los datos de la sesión para reiniciar la actividad."),
    ("Anonimato vs. identificación",
     "El registro de nombres es opcional; si la dinámica lo requiere, el docente debe "
     "instruir a los alumnos para que completen el campo de nombre antes de enviar."),
    ("Problemas de Wi-Fi o conexión",
     "Al ser una herramienta web ligera, requiere conexión mínima. Si la conexión falla, "
     "se recomienda refrescar el proyector una vez restablecida; los datos en Firebase se "
     "sincronizarán automáticamente."),
    ("¿Los estudiantes necesitan crear una cuenta?",
     "No. Participan únicamente con el código de sesión o el código QR, sin registro ni "
     "contraseña."),
    ("¿Por qué el docente debe iniciar sesión con Google?",
     "Por seguridad de la información: sólo las cuentas autorizadas por la cátedra pueden "
     "revelar, pausar, limpiar o borrar sesiones. Así, ninguna persona ajena puede alterar "
     "las opiniones ni los datos de una clase. El ingreso se realiza una sola vez por "
     "computadora."),
    ("No puedo iniciar sesión o mi cuenta no aparece habilitada",
     "Verifique que esté usando la cuenta de Google autorizada por la cátedra. Si es la "
     "primera vez que participa como docente, solicite al responsable del proyecto que "
     "habilite su cuenta. Como alternativa, intente en una ventana de incógnito para "
     "descartar problemas de sesión guardada."),
    ("¿Se puede recuperar una sesión o una respuesta eliminada?",
     "No. Tanto \"Limpiar respuestas\" como \"Borrar sesión\" son acciones definitivas. Si "
     "necesita conservar un registro de la actividad, descargue el PDF o el archivo .txt "
     "antes de limpiar los datos."),
    ("¿La herramienta tiene costo o vencimiento?",
     "No. La aplicación se ejecuta sobre el plan gratuito de Firebase y las reglas de "
     "seguridad vigentes no tienen fecha de vencimiento."),
]

tabla = doc.add_table(rows=1, cols=2)
tabla.style = "Light Grid Accent 1"
encabezados = tabla.rows[0].cells
encabezados[0].text = "Situación"
encabezados[1].text = "Acción recomendada"
for celda in encabezados:
    for parrafo in celda.paragraphs:
        for run in parrafo.runs:
            run.bold = True
marcar_fila(tabla.rows[0], encabezado=True)

for situacion, accion in filas:
    celdas = tabla.add_row().cells
    celdas[0].text = situacion
    celdas[1].text = accion
    marcar_fila(tabla.rows[-1])

doc.add_paragraph("")

# =========================================================================
doc.add_heading("6. Seguridad y Administración de la Herramienta", level=1)
doc.add_paragraph(
    "La información de las clases (consignas, opiniones y nombres) se almacena en Google "
    "Firebase Firestore, protegida por reglas de seguridad que impiden el acceso de "
    "personas ajenas. La lectura de la consigna es pública para que los estudiantes puedan "
    "participar, pero la escritura, el revelado y el borrado requieren autorización."
)
bullets([
    ("Sumar un docente al equipo: ", "el responsable del proyecto habilita la cuenta desde "
     "la consola de Firebase (Authentication → Usuarios, para obtener el identificador, y "
     "Firestore → Datos, colección \"docentes\"). Una vez habilitada, esa persona puede "
     "gestionar el proyector con su propia cuenta."),
    ("Dar de baja a un docente: ", "se elimina su registro de la colección \"docentes\". "
     "No es necesario modificar la aplicación."),
    ("Resguardo de los datos de clase: ", "se recomienda descargar el PDF o el archivo .txt "
     "de cada actividad al finalizar, y limpiar las respuestas antes de reutilizar el "
     "código con otra comisión."),
])

doc.add_paragraph("")
nota = doc.add_paragraph()
nota.add_run(
    "Documento actualizado tras la incorporación del ingreso del equipo docente con "
    "Google y de las reglas de seguridad de la base de datos."
).italic = True

doc.save(SALIDA)
print("Documento generado: %s" % SALIDA)
print("Parrafos: %d | Tablas: %d" % (len(doc.paragraphs), len(doc.tables)))
