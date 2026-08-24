# Jibble Automation 🚀

Este proyecto automatiza los marcajes de entrada y salida en la plataforma Jibble 2 utilizando Node.js, Playwright y GitHub Actions (100% gratuito).

## Características Implementadas:
1. **Entrada Aleatoria**: Al marcar la entrada en las mañanas, se espera un tiempo aleatorio (jitter de 1 a 4 minutos) para simular un comportamiento humano y evitar un patrón idéntico de marcaje todos los días.
2. **Auto Clock Out (Opcional)**: En el momento de ingresar, el script intenta llenar el campo de salida programada según el horario proporcionado para cada día.
3. **Verificación de Salida**: En las tardes, verifica si ya fue desconectado. Si sigues activo, fuerza el marcaje de "Clock Out".
4. **Capturas por Fallos**: Si la automatización falla, se toma una captura de pantalla y se guarda como artefacto en GitHub Actions para depurar fácilmente.

---

## 🔒 Instrucciones de Despliegue (Importante)

Por tu seguridad y privacidad, **las credenciales no están quemadas en el código** ni debes subirlas a ningún archivo del repositorio. 

### 1. Crear el Repositorio en GitHub
1. Ingresa a tu cuenta de GitHub.
2. Crea un **nuevo repositorio** y asegúrate de marcarlo como **Privado (Private)**.
3. Sube el contenido de esta carpeta (`package.json`, `jibble.js`, `.github/` y este `README.md`) al repositorio.
   * *Ojo: No subas la carpeta `node_modules`.*

### 2. Configurar Secretos de Actions
Para que GitHub Actions pueda iniciar sesión, debes pasar tus credenciales como secretos de entorno:
1. En tu repositorio, ve a la pestaña **Settings**.
2. En el panel izquierdo, navega a **Secrets and variables** > **Actions**.
3. Haz clic en **New repository secret**.
4. Crea el primer secreto:
   * Name: `JIBBLE_EMAIL`
   * Secret: *(tu correo personal, ej: mcoronado@tynpu.com)*
5. Crea el segundo secreto:
   * Name: `JIBBLE_PASSWORD`
   * Secret: *(tu contraseña)*

### 3. Ejecución de Pruebas
1. Ve a la pestaña **Actions** en tu repositorio.
2. Selecciona el workflow **"Jibble Attendance Schedule"** en el panel izquierdo.
3. Haz clic en **Run workflow**. Puedes elegir en el menú desplegable si quieres probar una entrada (`IN`) o una verificación de salida (`VERIFY_OR_OUT`).
4. Revisa los logs en caso de que necesites ajustar los selectores (`button:has-text("...")`) en el archivo `jibble.js` si Jibble cambió recientemente los nombres de sus botones.

---

*Nota de Seguridad: Evita compartir tu repositorio o tu contraseña con terceros. Este código se entrega como base educativa para automatización.*
