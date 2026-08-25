const { chromium } = require('playwright');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomJitter = (minMinutes, maxMinutes) => {
    const minMs = minMinutes * 60 * 1000;
    const maxMs = maxMinutes * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
};

async function run() {
    const email = process.env.JIBBLE_EMAIL;
    const password = process.env.JIBBLE_PASSWORD;
    const actionType = process.env.ACTION_TYPE || 'IN'; 

    // ---- LÓGICA DE FERIADOS ----
    const limaTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Lima"}));
    const mm = String(limaTime.getMonth() + 1).padStart(2, '0');
    const dd = String(limaTime.getDate()).padStart(2, '0');
    const todayStr = `${mm}-${dd}`;
    
    // Lista de feriados (Mes-Día)
    const holidays = ['10-08', '12-08', '12-09', '12-25'];
    
    if (holidays.includes(todayStr) && !process.env.TEST_MODE) {
        console.log(`🌴 Hoy es feriado en Perú (${todayStr}). El bot descansará y no marcará asistencia.`);
        process.exit(0);
    }
    // ----------------------------

    if (!email || !password) {
        console.error("❌ Error: Faltan las variables de entorno JIBBLE_EMAIL o JIBBLE_PASSWORD.");
        process.exit(1);
    }

    console.log(`🚀 Iniciando automatización Jibble - Acción: ${actionType}`);

    if (actionType === 'IN') {
        const jitterMs = process.env.TEST_MODE ? 0 : getRandomJitter(1, 4);
        console.log(`⏳ Aplicando retardo aleatorio de ${Math.round(jitterMs / 1000)} segundos...`);
        await delay(jitterMs);
    }

    const browser = await chromium.launch({ headless: true }); 
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        locale: 'es-PE',
        timezoneId: 'America/Lima',
        permissions: ['geolocation', 'notifications']
    });
    const page = await context.newPage();

    try {
        console.log("🌐 Navegando a Jibble...");
        await page.goto('https://web.jibble.io/login', { waitUntil: 'networkidle' });

        console.log("🔑 Iniciando sesión...");
        
        const emailSelector = '[data-testid="emailOrPhone"]';
        await page.waitForSelector(emailSelector, { timeout: 15000 });
        await page.type(emailSelector, email, { delay: 50 });
        
        const pwdSelector = 'input[type="password"]';
        await page.waitForSelector(pwdSelector, { timeout: 10000 });
        await page.type(pwdSelector, password, { delay: 50 });
        
        const submitBtnSelector = '[data-testid="login-button"]';
        await page.waitForSelector(submitBtnSelector, { timeout: 5000 });
        
        await page.waitForFunction((selector) => {
            const btn = document.querySelector(selector);
            return btn && !btn.disabled;
        }, submitBtnSelector);
        
        await page.click(submitBtnSelector);

        console.log("⏳ Esperando a que cargue el dashboard...");
        await page.waitForSelector('.q-header', { timeout: 30000 });
        await delay(4000); 
        console.log("✅ Inicio de sesión exitoso y Dashboard cargado.");

        if (actionType === 'IN') {
            await handleClockIn(page);
        } else if (actionType === 'VERIFY_OR_OUT') {
            await handleVerifyOrOut(page);
        }

    } catch (error) {
        console.error("❌ Ocurrió un error global durante la automatización:", error);
        await page.screenshot({ path: `debug-error-${Date.now()}.png` });
        process.exit(1);
    } finally {
        await browser.close();
        console.log("🛑 Navegador cerrado.");
    }
}

async function handleClockIn(page) {
    console.log("🕒 Iniciando proceso de entrada (Clock In)...");
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`\n--- Intento de Entrada ${attempt}/${MAX_RETRIES} ---`);
            
            // Buscar un botón de Quasar (.q-btn) que sea rojo o verde, y esperar hasta 15 segundos
            const actionBtn = await page.waitForSelector('.q-btn.bg-positive, .q-btn.bg-green, .q-btn.bg-negative, .q-btn.bg-red', { timeout: 15000 });
            const btnClass = await actionBtn.evaluate(el => el.className);
            
            if (btnClass.includes('negative') || btnClass.includes('red')) {
                console.log("⚠️ Ya estás Clocked In (Botón rojo de Detener detectado). No se requiere acción.");
                return;
            }

            console.log("▶️ Botón verde detectado. Haciendo clic para marcar entrada...");
            // Forzamos el clic por si algún mensaje de "Bienvenido a Jibble" lo está tapando
            await actionBtn.click({ force: true });

            console.log("⚙️ Esperando formulario de confirmación...");
            await delay(2500); 

            // Dejamos el formulario intacto, tal como solicitó el usuario, y solo presionamos Guardar.
            const confirmBtn = await page.waitForSelector('button:has-text("Save"), button:has-text("Confirm"), button:has-text("Guardar"), button:has-text("Confirmar")', { timeout: 5000 });
            console.log("💾 Presionando botón Guardar...");
            await confirmBtn.click();
            
            await delay(3000);

            const errorVisible = await page.evaluate(() => {
                const text = document.body.innerText.toLowerCase();
                return text.includes('time mismatch') || text.includes('invalid time');
            });
            
            const isModalStillOpen = await confirmBtn.isVisible().catch(() => false);

            if (errorVisible || isModalStillOpen) {
                throw new Error("Desfase de hora detectado ('time mismatch' / 'invalid time') o el modal no se cerró.");
            }

            console.log("✅ Entrada marcada exitosamente.");
            return; 

        } catch (error) {
            console.log(`❌ Error en el intento ${attempt}: ${error.message}`);
            if (attempt < MAX_RETRIES) {
                console.log("🔄 Recargando la página y reintentando en 3 segundos...");
                await page.reload({ waitUntil: 'networkidle' });
                await delay(3000);
            } else {
                throw new Error("Se agotaron los 3 reintentos para Clock In.");
            }
        }
    }
}

async function handleVerifyOrOut(page) {
    console.log("🕒 Iniciando proceso de salida (Clock Out)...");
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`\n--- Intento de Salida ${attempt}/${MAX_RETRIES} ---`);
            
            // Buscar un botón de Quasar (.q-btn) que sea rojo o verde, y esperar hasta 15 segundos
            const actionBtn = await page.waitForSelector('.q-btn.bg-positive, .q-btn.bg-green, .q-btn.bg-negative, .q-btn.bg-red', { timeout: 15000 });
            const btnClass = await actionBtn.evaluate(el => el.className);
            
            if (btnClass.includes('positive') || btnClass.includes('green')) {
                console.log("✅ El usuario ya está desconectado (Botón verde detectado). Finalizando con éxito...");
                return;
            }

            console.log("⏹️ Botón rojo detectado. Forzando Clock Out...");
            // Forzamos el clic por si algún mensaje de "Bienvenido a Jibble" lo está tapando
            await actionBtn.click({ force: true });

            console.log("⚙️ Esperando formulario de confirmación...");
            await delay(2500);

            const confirmBtn = await page.waitForSelector('button:has-text("Save"), button:has-text("Confirm"), button:has-text("Guardar"), button:has-text("Confirmar")', { timeout: 5000 });
            console.log("💾 Presionando botón Guardar...");
            await confirmBtn.click();
            
            await delay(3000);

            const errorVisible = await page.evaluate(() => {
                const text = document.body.innerText.toLowerCase();
                return text.includes('time mismatch') || text.includes('invalid time');
            });
            
            const isModalStillOpen = await confirmBtn.isVisible().catch(() => false);

            if (errorVisible || isModalStillOpen) {
                throw new Error("Desfase de hora detectado ('time mismatch' / 'invalid time') o el modal no se cerró.");
            }

            console.log("✅ Salida (Clock Out) registrada correctamente.");
            return;
            
        } catch (error) {
            console.log(`❌ Error en el intento ${attempt}: ${error.message}`);
            if (attempt < MAX_RETRIES) {
                console.log("🔄 Recargando la página y reintentando en 3 segundos...");
                await page.reload({ waitUntil: 'networkidle' });
                await delay(3000);
            } else {
                throw new Error("Se agotaron los 3 reintentos para Clock Out.");
            }
        }
    }
}

run();
