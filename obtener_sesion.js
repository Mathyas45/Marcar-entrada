const { chromium } = require('playwright');
const fs = require('fs');

async function obtenerSesion() {
    console.log("🚀 Abriendo navegador para iniciar sesión manualmente...");
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🌐 Ve a la ventana emergente, inicia sesión en Jibble como lo harías normalmente.");
    console.log("⏳ Esperando a que llegues al panel principal de Jibble...");

    await page.goto('https://web.jibble.io/login');

    // Esperar a que el usuario inicie sesión y salga de la página de login
    await page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 0 });

    console.log("✅ ¡Has entrado al panel! Capturando tu sesión secreta...");
    
    // Esperar un par de segundos para asegurar que las cookies se asienten
    await page.waitForTimeout(5000);

    // Guardar el estado de almacenamiento
    await context.storageState({ path: 'estado.json' });

    console.log("🎉 ¡Éxito! Se ha creado un archivo llamado 'estado.json' en esta carpeta.");
    console.log("Por favor, abre el archivo estado.json, copia todo su texto y ponlo en GitHub Secrets con el nombre JIBBLE_SESSION.");
    
    await browser.close();
}

obtenerSesion().catch(console.error);
