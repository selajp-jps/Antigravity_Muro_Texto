# Muro de Clases • Interacción Universitaria en Tiempo Real

Aplicación web moderna, limpia y responsive para dinamizar la interacción en el aula universitaria mediante lluvia de ideas, preguntas disparadoras y puesta en común de opiniones. Desarrollada con **React, Vite, Tailwind CSS y Firebase Firestore**.

---

## 🚀 Inicio Rápido

### 1. Iniciar el servidor de desarrollo
Para iniciar la aplicación y permitir que dispositivos en la misma red Wi-Fi (como los teléfonos de los estudiantes) puedan acceder:

```bash
npm run dev
```

Vite iniciará el servidor y te mostrará tanto la dirección local (`http://localhost:5173`) como la dirección de red (`http://192.168.x.x:5173`).

> **Tip para el aula**: Si proyectas desde tu laptop abriendo la IP de red (`http://192.168.x.x:5173`), el código QR generado apuntará directamente a esa IP para que los estudiantes conectados al Wi-Fi del aula o mediante internet puedan entrar sin inconvenientes.

---

## 🎯 Dinámica de Uso en el Aula

### 1. Creación de la Sesión (Pantalla Principal)
- El docente o ayudante ingresa el **Nombre de la Materia / Comisión** y la **Consigna o Pregunta disparadora**.
- Puede ingresar un código personalizado (ej. `ADM-101`) o dejar que el sistema genere uno aleatorio.
- Al hacer clic en **"Crear sesión de clase"**, se generan dos accesos directos:
  - **Enlace y QR para Estudiantes**.
  - **Enlace de Control / Proyector para el Docente**.

### 2. Vista Docente / Proyector
- Diseñada con tipografía de alto contraste legible a más de 10 metros en proyectores de aula.
- **Modo Oculto (Por Defecto)**: Las respuestas de los alumnos quedan ocultas mientras responden para no condicionar u homogeneizar el pensamiento. Muestra un código QR grande y un contador en vivo con animación.
- **Barra de herramientas del Docente**:
  - 👁️ **Revelar / Ocultar opiniones**: Despliega las tarjetas de los alumnos en un muro ordenado con animación de confeti.
  - 🔒 **Pausar / Reanudar envíos**: Bloquea el formulario de los estudiantes para cerrar el tiempo de respuesta.
  - 🖨️ **Imprimir / Guardar en PDF**: Hoja de estilos de impresión limpia para archivar o subir el reporte de la actividad a Moodle / Campus Virtual.
  - 📋 **Copiar texto / Descargar (.txt)**: Exporta un resumen formateado de todos los aportes al portapapeles o como archivo de texto.
  - 🧹 **Limpiar respuestas**: Reinicia la actividad a 0 respuestas para reutilizar el mismo código de sesión con otra comisión o turno sin crear una sesión nueva.
  - ⛶ **Pantalla completa**: Maximiza la vista para cañones de proyección.

### 3. Vista Móvil del Estudiante
- Acceso directo mediante escaneo de QR o ingresando el código (sin registros ni contraseñas).
- Muestra la consigna de la cátedra de forma destacada.
- Permite escribir la respuesta y elegir si enviar con nombre o como anónimo.
- Al enviar, bloquea el formulario e indica: *"¡Respuesta enviada con éxito! Esperando que el docente comparta las opiniones en pantalla"*.
- Si el docente pausó las respuestas, el estudiante ve una alerta clara indicando que la sesión está cerrada.

---

## 🛠️ Tecnologías Utilizadas
- **React 19** + **Vite 8**
- **Tailwind CSS v3** (con fuentes de alta legibilidad y estilos `@media print`)
- **Firebase Firestore v12** (`onSnapshot` para sincronización en tiempo real sin recarga)
- **qrcode.react** (Generación de códigos QR vectoriales SVG en el navegador)
- **lucide-react** (Iconografía limpia y moderna)
- **canvas-confetti** (Efectos visuales en hitos de clase)
