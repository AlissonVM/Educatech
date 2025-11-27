/**
 * Lógica de Accesibilidad y Persistencia de Sesión
 * Controla la activación condicional de la accesibilidad y la redirección.
 */
(function() {
    const root = document.documentElement;
    const body = document.body;
    const contrastToggle = document.getElementById('contrast-toggle');
    const fontToggle = document.getElementById('font-toggle');
    const readerToggle = document.getElementById('reader-toggle');
    
    // Configuración Inicial y Persistencia
    let currentFontSize = 100; // Almacenado como porcentaje
    let ttsActive = false;
    
    // Elementos de menú
    const userProfile = localStorage.getItem('userProfile');
    const dashboardLinkLi = document.getElementById('nav-dashboard-link');
    const loginLinkLi = document.getElementById('nav-login-link');
    const logoutLinkLi = document.getElementById('nav-logout-link');
    const logoutButton = document.getElementById('logout-button');

    // --- 1. Funciones Centrales de Accesibilidad ---

    function speakText(text) {
        if (!ttsActive || !window.speechSynthesis) return;
        
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'es-ES'; 
        window.speechSynthesis.speak(speech);
    }

    function setupTTSListeners() {
        const interactives = document.querySelectorAll('a:not(.disabled), button:not(.disabled), [role="button"], input[type="submit"]');

        interactives.forEach(element => {
            element.addEventListener('focus', function() {
                let textToSpeak = element.getAttribute('aria-label') || element.textContent;
                
                const describedById = element.getAttribute('aria-describedby');
                if (describedById) {
                    const describedByElement = document.getElementById(describedById);
                    if (describedByElement) {
                        textToSpeak += `. Información adicional: ${describedByElement.textContent}`;
                    }
                }

                speakText(textToSpeak.trim());
            });
            element.addEventListener('blur', function() {
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }
            });
        });
    }

    function loadAccessibilityState() {
        // Cargar estado persistente (si existe)
        if (localStorage.getItem('contrastMode') === 'active') {
            body.classList.add('high-contrast');
        }

        if (localStorage.getItem('fontSize')) {
            currentFontSize = parseInt(localStorage.getItem('fontSize'));
            root.style.fontSize = currentFontSize + '%';
        }

        if (localStorage.getItem('ttsActive') === 'true') {
            ttsActive = true;
            if (readerToggle) readerToggle.textContent = 'Lector 🔇';
            setupTTSListeners();
        }
        
        // --- Lógica de Bienvenida en Dashboard ---
        const welcomeMessage = document.getElementById('welcome-banner');
        if (welcomeMessage && localStorage.getItem('showWelcome') === 'true') {
            setTimeout(() => {
                welcomeMessage.classList.add('active'); 
                speakText("¡Bienvenido/a! Tu sesión adaptada está lista.");
            }, 100);
            localStorage.removeItem('showWelcome');
        }
    }


    // --- 2. Escuchadores de Eventos del Widget ---
    
    if (contrastToggle) {
        contrastToggle.addEventListener('click', () => {
            body.classList.toggle('high-contrast');
            localStorage.setItem('contrastMode', body.classList.contains('high-contrast') ? 'active' : 'inactive');
        });
    }

    if (fontToggle) {
        fontToggle.addEventListener('click', () => {
            if (currentFontSize === 150) {
                currentFontSize = 100;
            } else {
                currentFontSize += 10;
            }
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
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }
            }
        });
    }

    // --- 3. Lógica de Login Adaptado y Menú Dinámico ---

    // Función de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userProfile');
            localStorage.setItem('contrastMode', 'inactive'); 
            localStorage.setItem('fontSize', 100);
            localStorage.setItem('ttsActive', 'false');
            localStorage.removeItem('showWelcome');
            // Redirigir al inicio 
            const path = window.location.pathname;
            const target = path.includes('/pages/') || path.includes('/docs/') || path.includes('/classes/') ? '../index.html' : 'index.html';
            window.location.href = target; 
        });
    }

    // Lógica del menú dinámico (omitiendo por brevedad, se mantiene el código anterior)
    if (userProfile) {
        if (loginLinkLi) loginLinkLi.style.display = 'none';
        if (logoutLinkLi) logoutLinkLi.style.display = 'list-item';
        
        if (dashboardLinkLi) {
            let dashboardText = userProfile.includes('teacher') ? 'Mi Dashboard Docente' : 'Mi Dashboard Alumno';
            let dashboardFile = userProfile.includes('teacher') ? 'dashboard-teacher.html' : 'dashboard.html';
            
            const aTag = dashboardLinkLi.querySelector('a');
            if(aTag) { 
                aTag.textContent = dashboardText;
                const path = window.location.pathname;
                const prefix = (path.includes('/pages/') || path.includes('/docs/')) ? '' : 'pages/';
                aTag.href = prefix + dashboardFile;
            }
        }
    } else {
        if (logoutLinkLi) logoutLinkLi.style.display = 'none';
    }

    // Lógica de Acceso Adaptado (pages/login.html)
    const profileSelector = document.querySelector('.profile-selector');
    if (profileSelector) {
        profileSelector.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                const profile = button.getAttribute('data-profile');
                
                // RESTABLECER PRIMERO
                localStorage.setItem('contrastMode', 'inactive');
                localStorage.setItem('fontSize', 100);
                localStorage.setItem('ttsActive', 'false');
                root.style.fontSize = '100%';
                body.classList.remove('high-contrast');
                
                // ACTIVACIÓN CONDICIONAL DE SIMULACIÓN VISUAL
                if (profile === "student-visual") {
                    localStorage.setItem('contrastMode', 'active');
                    localStorage.setItem('fontSize', 120);
                    localStorage.setItem('ttsActive', 'true');
                }
                
                // Redirigir al perfil correcto
                localStorage.setItem('userProfile', profile.includes('teacher') ? 'teacher' : 'student');
                localStorage.setItem('showWelcome', 'true');
                
                const targetDashboard = profile.includes('teacher') ? 'dashboard-teacher.html' : 'dashboard.html';
                window.location.href = targetDashboard; // Redirección final
            });
        });
    }


    // Lógica de Login Clásico (Alumno/Docente)
    const studentLoginForm = document.getElementById('student-login-form');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('userProfile', 'student');
            localStorage.setItem('showWelcome', 'true');
            window.location.href = 'dashboard.html'; 
        });
    }

    const teacherLoginForm = document.getElementById('teacher-login-form');
    if (teacherLoginForm) {
        teacherLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('userProfile', 'teacher');
            localStorage.setItem('showWelcome', 'true');
            window.location.href = 'dashboard-teacher.html';
        });
    }

    // Cargar el estado al iniciar la página (Dashboard, Class, etc.)
    loadAccessibilityState();

})();
