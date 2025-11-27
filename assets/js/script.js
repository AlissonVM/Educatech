document.addEventListener('DOMContentLoaded', () => {
    // Variables principales
    const root = document.documentElement;
    const body = document.body;
    const contrastToggle = document.getElementById('contrast-toggle');
    const fontToggle = document.getElementById('font-toggle');
    const readerToggle = document.getElementById('reader-toggle');

    // Estado de accesibilidad
    let currentFontSize = 100;
    let ttsActive = false;
    
    // Elementos de menú
    const userProfile = localStorage.getItem('userProfile');
    const dashboardLinkLi = document.getElementById('nav-dashboard-link');
    const loginLinkLi = document.getElementById('nav-login-link');
    const logoutLinkLi = document.getElementById('nav-logout-link');
    const logoutButton = document.getElementById('logout-button');

    // --- FUNCIONES DE ACCESIBILIDAD Y ESTADO ---
    function speakText(text) {
        if (!ttsActive || !window.speechSynthesis) return;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'es-ES'; 
        window.speechSynthesis.speak(speech);
    }

    function setupTTSListeners() {
        const interactives = document.querySelectorAll('a:not(.disabled), button:not(.disabled), [role="button"], input[type="submit"]');
        interactives.forEach(element => {
            element.addEventListener('focus', function() {
                let textToSpeak = element.getAttribute('aria-label') || element.textContent;
                speakText(textToSpeak.trim());
            });
            element.addEventListener('blur', function() {
                if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
            });
        });
    }

    function loadAccessibilityState() {
        // Cargar estado persistente (si existe)
        if (localStorage.getItem('contrastMode') === 'active') body.classList.add('high-contrast');
        if (localStorage.getItem('fontSize')) {
            currentFontSize = parseInt(localStorage.getItem('fontSize'));
            root.style.fontSize = currentFontSize + '%';
        }
        if (localStorage.getItem('ttsActive') === 'true') {
            ttsActive = true;
            if (readerToggle) readerToggle.textContent = 'Lector 🔇';
            setupTTSListeners();
        }
        
        // Lógica de Bienvenida en Dashboard
        const welcomeMessage = document.getElementById('welcome-banner');
        if (welcomeMessage && localStorage.getItem('showWelcome') === 'true') {
            setTimeout(() => {
                welcomeMessage.classList.add('active'); 
                speakText("¡Bienvenido/a! Tu sesión adaptada está lista.");
            }, 100);
            localStorage.removeItem('showWelcome');
        }
    }
    
    // --- EVENTOS DEL WIDGET ---
    if (contrastToggle) {
        contrastToggle.addEventListener('click', () => {
            body.classList.toggle('high-contrast');
            localStorage.setItem('contrastMode', body.classList.contains('high-contrast') ? 'active' : 'inactive');
        });
    }

    if (fontToggle) {
        fontToggle.addEventListener('click', () => {
            if (currentFontSize === 150) currentFontSize = 100;
            else currentFontSize += 10;
            root.style.fontSize = currentFontSize + '%';
            localStorage.setItem('fontSize', currentFontSize);
        });
    }
    
    if (readerToggle) {
        readerToggle.addEventListener('click', () => {
            ttsActive = !ttsActive;
            localStorage.setItem('ttsActive', ttsActive);
            body.classList.toggle('reader-active', ttsActive);

            if (ttsActive) {
                readerToggle.textContent = 'Lector 🔇';
                speakText("Lector de pantalla activado.");
                setupTTSListeners();
            } else {
                readerToggle.textContent = 'Lector 🔊';
                if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
            }
        });
    }


    // --- LÓGICA DE LOGIN Y MENÚ DINÁMICO (CRÍTICO) ---
    
    // 1. Configuración del menú al cargar la página
    if (userProfile) {
        if (loginLinkLi) loginLinkLi.style.display = 'none';
        if (logoutLinkLi) logoutLinkLi.style.display = 'list-item';
        
        if (dashboardLinkLi) {
            let dashboardText = userProfile.includes('teacher') ? 'Mi Dashboard Docente' : 'Mi Dashboard Alumno';
            let dashboardFile = userProfile.includes('teacher') ? 'dashboard-teacher.html' : 'dashboard.html';
            
            const aTag = dashboardLinkLi.querySelector('a');
            if(aTag) { 
                aTag.textContent = dashboardText;
                
                // Asegurar que el href sea correcto desde cualquier ruta
                const path = window.location.pathname;
                const prefix = (path.includes('/pages/') || path.includes('/docs/')) ? '' : 'pages/';
                aTag.href = prefix + dashboardFile;
            }
        }
    } else {
        if (logoutLinkLi) logoutLinkLi.style.display = 'none';
        // Asegurar que el link de Dashboard Alumno apunte a su login
        if (dashboardLinkLi) {
            const aTag = dashboardLinkLi.querySelector('a');
            if(aTag) aTag.href = (window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/')) ? 'login-student-classic.html' : 'pages/login-student-classic.html'; 
        }
    }
    
    // 2. Función Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userProfile');
            localStorage.setItem('contrastMode', 'inactive'); // Limpiar estado adaptado
            localStorage.setItem('fontSize', 100);
            localStorage.removeItem('showWelcome');
            // Redirigir al inicio 
            const path = window.location.pathname;
            const target = path.includes('/pages/') || path.includes('/docs/') || path.includes('/classes/') ? '../index.html' : 'index.html';
            window.location.href = target; 
        });
    }


    // --- LÓGICA DE ACCESO ADAPTADO (pages/login.html) ---
    const profileSelector = document.querySelector('.profile-selector');
    if (profileSelector) {
        profileSelector.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                const profile = button.getAttribute('data-profile');
                
                // Lógica de Adaptación Inicial (Activación Condicional)
                if (profile.includes('Visual')) {
                    localStorage.setItem('contrastMode', 'active');
                    localStorage.setItem('fontSize', 120);
                    localStorage.setItem('ttsActive', 'true');
                } else {
                    localStorage.setItem('contrastMode', 'inactive');
                    localStorage.setItem('fontSize', 100);
                    localStorage.setItem('ttsActive', 'false');
                }
                
                localStorage.setItem('userProfile', profile);
                localStorage.setItem('showWelcome', 'true');
                
                // Redirección Final (Ruta simple, ya que está en la misma carpeta pages/)
                window.location.href = 'dashboard.html'; 
            });
        });
    }

    // Cargar el estado al iniciar
    loadAccessibilityState();

})();
