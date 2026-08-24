# Jibble Automation 🚀

Este proyecto automatiza los marcajes de entrada y salida en la plataforma Jibble 2 utilizando Node.js, Playwright y GitHub Actions (100% gratuito).

## Características Implementadas:
1. **Entrada Aleatoria**: Al marcar la entrada en las mañanas, se espera un tiempo aleatorio (jitter de 1 a 4 minutos) para simular un comportamiento humano y evitar un patrón idéntico de marcaje todos los días.
2. **Auto Clock Out (Opcional)**: En el momento de ingresar, el script intenta llenar el campo de salida programada según el horario proporcionado para cada día.
3. **Verificación de Salida**: En las tardes, verifica si ya fue desconectado. Si sigues activo, fuerza el marcaje de "Clock Out".
4. **Capturas por Fallos**: Si la automatización falla, se toma una captura de pantalla y se guarda como artefacto en GitHub Actions para depurar fácilmente.

---
