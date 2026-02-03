// Alexa Assistant - Versión compatible con móviles
class AlexaAssistant {
    constructor() {
        this.isActive = false;
        this.isListening = false; // Cambiado a false inicialmente
        this.isSpeaking = false;
        this.recognition = null;
        this.wakeWord = "alexa";
        this.currentUtterance = null;
        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        this.toggleAlexa = this.toggleAlexa.bind(this);
        this.setupRecognition = this.setupRecognition.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        setTimeout(() => this.initialize(), 100);
    }
    
    initialize() {
        console.log('Inicializando Alexa Assistant (Móvil: ' + this.isMobile + ')...');
        this.setupRecognition();
        this.setupButton();
        this.setupVisibilityListener();
    }
    
    setupRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.warn('Navegador no soporta reconocimiento de voz');
            this.showStatusIndicator('❌ Voz no soportada', false, false);
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // ⚠️ CONFIGURACIÓN PARA MÓVILES
        if (this.isMobile) {
            this.recognition.continuous = false; // ❗️ DESACTIVADO en móviles
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            // Configuraciones específicas para móviles
            this.recognition.onspeechstart = () => {
                console.log('🎤 Habla detectada en móvil');
                this.showStatusIndicator('🎤 Escuchando...', true);
            };
        } else {
            // Configuración original para PC
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
        }
        
        this.recognition.lang = 'es-ES';
        
        this.recognition.onstart = () => {
            console.log('🎤 Reconocimiento iniciado');
            this.showStatusIndicator('🎤 Escuchando...', true);
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Escuché:', transcript);
            
            // Detectar palabra de activación
            if (this.isActive && transcript.includes(this.wakeWord)) {
                console.log('✅ "' + this.wakeWord + '" detectado');
                this.playBeep(800, 0.2);
                
                // Detener si está hablando
                if (this.isSpeaking) {
                    this.stopSpeakingCompletely();
                }
                
                // Procesar comando
                this.processAlexaCommand(transcript);
                
                // En móviles, parar el reconocimiento después de procesar
                if (this.isMobile) {
                    setTimeout(() => {
                        if (this.isActive) {
                            this.restartListening();
                        }
                    }, 1000);
                }
            } else if (this.isActive && !transcript.includes(this.wakeWord)) {
                console.log('No se detectó la palabra clave');
                this.showStatusIndicator('Di "' + this.wakeWord + '"', false);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.log('Error reconocimiento:', event.error);
            
            // Manejar errores comunes en móviles
            if (event.error === 'no-speech') {
                console.log('No se detectó voz');
                this.showStatusIndicator('Di "' + this.wakeWord + '"', false);
            } else if (event.error === 'audio-capture') {
                console.log('Error de micrófono');
                this.showStatusIndicator('🎤 Error micrófono', false, true);
            }
            
            // Reiniciar si hubo error
            if (this.isActive) {
                setTimeout(() => this.restartListening(), 1000);
            }
        };
        
        this.recognition.onend = () => {
            console.log('Reconocimiento terminado');
            
            // ⚠️ COMPORTAMIENTO DIFERENTE PARA MÓVILES
            if (this.isMobile) {
                // En móviles, NO reiniciamos automáticamente el reconocimiento continuo
                // En su lugar, solo reiniciamos si está activo y no estamos hablando
                if (this.isActive && !this.isSpeaking) {
                    // Pequeño delay antes de reiniciar
                    setTimeout(() => {
                        if (this.isActive && !this.isSpeaking) {
                            this.startListening();
                        }
                    }, 2000); // Delay más largo en móviles
                }
            } else {
                // Para PC: reiniciar siempre si está activo
                if (this.isActive) {
                    setTimeout(() => {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            setTimeout(() => this.startListening(), 1000);
                        }
                    }, 100);
                }
            }
        };
    }
    
    // 🔊 SONIDOS (optimizados para móviles)
    playBeep(freq, duration) {
        try {
            // Usar AudioContext si está disponible
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + duration);
                
                // Cerrar contexto después de usar (importante para móviles)
                setTimeout(() => {
                    audioContext.close();
                }, duration * 2000);
            } else {
                // Fallback simple para móviles antiguos
                const audio = new Audio();
                audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ';
                audio.volume = 0.1;
                audio.play().catch(e => console.log('Error sonido:', e));
            }
        } catch (e) {
            console.log('No se pudo reproducir sonido:', e);
        }
    }
    
    setupButton() {
        const alexaBtn = document.getElementById('alexaBtn');
        if (alexaBtn) {
            // Limpiar eventos anteriores
            alexaBtn.removeEventListener('click', this.toggleAlexa);
            alexaBtn.addEventListener('click', this.toggleAlexa);
            
            // Añadir evento táctil para mejor respuesta en móviles
            alexaBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                alexaBtn.classList.add('touch-active');
            });
            
            alexaBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                alexaBtn.classList.remove('touch-active');
            });
        }
    }
    
    // Manejar cambios de visibilidad (pestaña/ventana)
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Página no visible - detener reconocimiento para ahorrar batería
            if (this.isActive) {
                console.log('Página oculta - deteniendo reconocimiento');
                this.stopListening();
            }
        } else {
            // Página visible nuevamente - reiniciar si estaba activo
            if (this.isActive) {
                console.log('Página visible - reiniciando reconocimiento');
                setTimeout(() => this.restartListening(), 500);
            }
        }
    }
    
    toggleAlexa() {
        const alexaBtn = document.getElementById('alexaBtn');
        
        if (!this.isActive) {
            // ACTIVAR
            this.isActive = true;
            this.isListening = true;
            
            alexaBtn.classList.add('active');
            alexaBtn.innerHTML = '🎤';
            
            this.startListening();
            this.showStatusIndicator('Di "Alexa"', false);
            console.log('✅ Alexa ACTIVADA');
            
        } else {
            // DESACTIVAR
            this.isActive = false;
            this.isListening = false;
            
            alexaBtn.classList.remove('active');
            alexaBtn.innerHTML = '🤖';
            
            this.stopListening();
            this.hideStatusIndicator();
            this.stopSpeakingCompletely();
            console.log('⏸️ Alexa DESACTIVADA');
        }
    }
    
    // Método optimizado para móviles
    startListening() {
        if (!this.recognition) {
            console.error('Reconocimiento no inicializado');
            return;
        }
        
        if (!this.isActive || this.isSpeaking) return;
        
        try {
            // En móviles, verificar permisos primero
            if (this.isMobile) {
                this.requestMicrophonePermission().then(hasPermission => {
                    if (hasPermission && this.isActive) {
                        this.recognition.start();
                    }
                }).catch(error => {
                    console.error('Error permisos:', error);
                    this.showStatusIndicator('🎤 Sin permisos', false, true);
                });
            } else {
                this.recognition.start();
            }
        } catch (error) {
            console.error('Error iniciando reconocimiento:', error);
            // Intentar nuevamente después de un delay
            setTimeout(() => {
                if (this.isActive) {
                    this.startListening();
                }
            }, 1000);
        }
    }
    
    // Solicitar permiso de micrófono (especial para móviles)
    async requestMicrophonePermission() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return false;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true,
                video: false 
            });
            
            // Detener stream inmediatamente (solo necesitamos el permiso)
            stream.getTracks().forEach(track => track.stop());
            return true;
            
        } catch (error) {
            console.error('Permiso de micrófono denegado:', error);
            
            // Mostrar mensaje amigable
            if (error.name === 'NotAllowedError') {
                this.showStatusIndicator('🎤 Permiso denegado', false, true);
                alert('Por favor, permite el acceso al micrófono en la configuración del navegador para usar Alexa.');
            }
            
            return false;
        }
    }
    
    stopListening() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.log('Error deteniendo reconocimiento:', error);
            }
        }
    }
    
    // Reiniciar escucha (método seguro)
    restartListening() {
        if (!this.isActive || this.isSpeaking) return;
        
        this.stopListening();
        
        // Delay antes de reiniciar
        setTimeout(() => {
            if (this.isActive && !this.isSpeaking) {
                this.startListening();
            }
        }, this.isMobile ? 3000 : 1000); // Delay más largo en móviles
    }
    
    processAlexaCommand(transcript) {
        console.log('Procesando comando:', transcript);
        
        let command = '';
        
        // Extraer comando después de "alexa"
        const alexaIndex = transcript.indexOf(this.wakeWord);
        if (alexaIndex !== -1) {
            command = transcript.substring(alexaIndex + this.wakeWord.length).trim();
        }
        
        // Limpiar puntuación
        command = command.replace(/[.,!?]/g, '').trim();
        
        console.log('Comando limpio:', command);
        
        // Comandos de detener (funcionan inmediatamente)
        if (this.isStopCommand(command)) {
            console.log('🚫 Comando DETENER detectado');
            this.playBeep(400, 0.3);
            this.stopSpeakingCompletely();
            this.showStatusIndicator('🛑 Detenido', false, true);
            
            setTimeout(() => {
                if (this.isActive) {
                    this.showStatusIndicator('Di "Alexa"', false);
                    this.restartListening();
                }
            }, 1500);
            return;
        }
        
        // Comando vacío o solo "alexa"
        if (!command) {
            this.speakResponse('¿Sí? ¿En qué puedo ayudarte?');
            return;
        }
        
        // Procesar pregunta
        this.processQuestion(command);
    }
    
    isStopCommand(command) {
        const stopCommands = [
            'para', 'detente', 'cállate', 'callate', 'silencio', 'basta',
            'alto', 'cancela', 'cancelar', 'para ya', 'detén', 'quieto',
            'deja de hablar', 'calla', 'cierra el pico', 'basta ya',
            'para ahora', 'detente ahora', 'cállate ya', 'no hables'
        ];
        
        return stopCommands.some(stopWord => 
            command === stopWord || command.startsWith(stopWord + ' ')
        );
    }
    
    stopSpeakingCompletely() {
        console.log('🔇 Deteniendo habla...');
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Detener animación de boca
        const mouth = document.getElementById('mouth');
        if (mouth) {
            mouth.classList.remove('surprised');
            mouth.classList.add('happy');
        }
        
        this.isSpeaking = false;
        this.currentUtterance = null;
    }
    
    processQuestion(question) {
        console.log('Procesando pregunta:', question);
        
        // Mostrar que estamos procesando
        this.showStatusIndicator('🤔 Procesando...', false);
        
        // Buscar respuesta
        this.searchForAlexa(question);
    }
    
    async searchForAlexa(query) {
        console.log('Buscando:', query);
        
        // Intentar respuesta predefinida primero
        if (typeof getPredefinedResponse === 'function') {
            const response = getPredefinedResponse(query);
            if (response) {
                let responseText = '';
                
                if (typeof response === 'object' && response.action) {
                    responseText = response.text;
                    this.speakResponse(responseText);
                    
                    // Ejecutar acción después de hablar
                    setTimeout(() => {
                        if (response.action) {
                            response.action();
                        }
                    }, 1000);
                } else {
                    responseText = response;
                    this.speakResponse(responseText);
                }
                return;
            }
        }
        
        // Si no hay respuesta predefinida, usar búsqueda web
        if (typeof searchWeb === 'function') {
            try {
                await this.captureSearchWebResponse(query);
            } catch (error) {
                console.error('Error en búsqueda:', error);
                this.speakResponse('No pude encontrar información sobre eso.');
            }
        } else {
            this.speakResponse('Lo siento, no puedo buscar información en este momento.');
        }
    }
    
    async captureSearchWebResponse(query) {
        return new Promise((resolve) => {
            // Guardar funciones originales
            const originalAddMessage = window.addMessage;
            let responseCaptured = false;
            
            // Interceptar mensajes
            window.addMessage = (text, sender) => {
                if (sender === 'bot' && !responseCaptured) {
                    const cleanText = this.removeEmojis(text);
                    
                    // Filtrar mensajes de sistema
                    if (cleanText.length > 10 && 
                        !cleanText.includes('Buscando') && 
                        !cleanText.includes('Cargando') &&
                        !cleanText.includes('Hola! Soy CyberPet')) {
                        
                        responseCaptured = true;
                        this.speakResponse(cleanText);
                        
                        // Restaurar función original
                        window.addMessage = originalAddMessage;
                        resolve();
                        return;
                    }
                }
                
                // Pasar a función original si existe
                if (originalAddMessage) {
                    originalAddMessage(text, sender);
                }
            };
            
            // Ejecutar búsqueda
            try {
                searchWeb(query);
                
                // Timeout por seguridad
                setTimeout(() => {
                    if (!responseCaptured) {
                        window.addMessage = originalAddMessage;
                        this.speakResponse('No encontré información sobre eso.');
                        resolve();
                    }
                }, 8000);
                
            } catch (error) {
                window.addMessage = originalAddMessage;
                this.speakResponse('Hubo un error al buscar.');
                resolve();
            }
        });
    }
    
    removeEmojis(str) {
        return str.replace(/[\p{Extended_Pictographic}]/gu, '').trim();
    }
    
    speakResponse(text) {
        console.log('Hablando:', text.substring(0, 50) + '...');
        
        if (!window.speechSynthesis) {
            console.error('Síntesis de voz no disponible');
            this.showStatusIndicator('🗣️ Voz no disponible', false, true);
            return;
        }
        
        this.isSpeaking = true;
        const cleanText = this.removeEmojis(text);
        
        // Detener cualquier habla previa
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;
        
        // Configurar eventos
        utterance.onstart = () => {
            console.log('🗣️ Empezó a hablar');
            this.showStatusIndicator('🗣️ Hablando...', false);
            
            // Animación de boca
            const mouth = document.getElementById('mouth');
            if (mouth) {
                this.talkInterval = setInterval(() => {
                    mouth.classList.toggle('surprised');
                }, 200);
            }
            
            // Detener reconocimiento mientras habla
            this.stopListening();
        };
        
        utterance.onend = () => {
            console.log('✅ Terminó de hablar');
            this.isSpeaking = false;
            
            // Detener animación
            if (this.talkInterval) {
                clearInterval(this.talkInterval);
            }
            
            const mouth = document.getElementById('mouth');
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            // Reiniciar reconocimiento si está activo
            if (this.isActive) {
                setTimeout(() => {
                    this.showStatusIndicator('Di "Alexa"', false);
                    this.restartListening();
                }, 500);
            }
        };
        
        utterance.onerror = (event) => {
            console.error('Error al hablar:', event);
            this.isSpeaking = false;
            
            if (this.talkInterval) {
                clearInterval(this.talkInterval);
            }
            
            const mouth = document.getElementById('mouth');
            if (mouth) {
                mouth.classList.remove('surprised');
                mouth.classList.add('happy');
            }
            
            // Reiniciar si hay error
            if (this.isActive) {
                setTimeout(() => {
                    this.showStatusIndicator('Di "Alexa"', false);
                    this.restartListening();
                }, 1000);
            }
        };
        
        // Hablar
        window.speechSynthesis.speak(utterance);
    }
    
    showStatusIndicator(text, isListening = false, isError = false) {
        let container = document.getElementById('alexaStatusContainer');
        if (!container) {
            // Crear contenedor si no existe
            container = document.createElement('div');
            container.id = 'alexaStatusContainer';
            container.style.cssText = `
                margin: 10px 0;
                padding: 8px;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid var(--main-color, #0ff);
            `;
            
            const statsPanel = document.getElementById('statsPanel');
            if (statsPanel) {
                statsPanel.appendChild(container);
            }
        }
        
        let indicator = document.getElementById('alexaStatus');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'alexaStatus';
            indicator.className = 'alexa-status';
            indicator.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: 'Orbitron', sans-serif;
                font-size: 14px;
            `;
            container.appendChild(indicator);
        }
        
        // Crear pulso visual
        let pulse = '';
        if (isListening) {
            pulse = `<div style="width: 10px; height: 10px; background: #0ff; border-radius: 50%; animation: pulse 1s infinite;"></div>`;
        } else if (isError) {
            pulse = `<div style="width: 10px; height: 10px; background: #f00; border-radius: 50%;"></div>`;
        } else {
            pulse = `<div style="width: 10px; height: 10px; background: #0f0; border-radius: 50%;"></div>`;
        }
        
        indicator.innerHTML = pulse + `<span style="color: ${isError ? '#f00' : '#fff'}">${text}</span>`;
        container.style.display = 'block';
    }
    
    hideStatusIndicator() {
        const container = document.getElementById('alexaStatusContainer');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    // Limpiar recursos al cerrar
    cleanup() {
        this.stopListening();
        this.stopSpeakingCompletely();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            const assistant = new AlexaAssistant();
            window.alexaAssistant = assistant;
            console.log('✅ Alexa Assistant inicializado');
            
            // Limpiar al descargar la página
            window.addEventListener('beforeunload', () => {
                if (assistant.cleanup) {
                    assistant.cleanup();
                }
            });
        } catch (error) {
            console.error('Error inicializando Alexa:', error);
        }
    }, 1500);
});

// Añadir estilos CSS necesarios
if (!document.querySelector('#alexa-styles')) {
    const style = document.createElement('style');
    style.id = 'alexa-styles';
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 0.5; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0.5; transform: scale(0.8); }
        }
        
        #alexaBtn.active {
            background: #ff3366 !important;
            box-shadow: 0 0 20px #ff3366 !important;
            animation: pulse 2s infinite;
        }
        
        #alexaBtn.touch-active {
            transform: scale(0.9);
            transition: transform 0.1s;
        }
        
        .alexa-pulse {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }
        
        .alexa-pulse.listen {
            background: #0ff;
            animation: pulse 1s infinite;
        }
        
        .alexa-pulse.wake {
            background: #0f0;
        }
        
        .alexa-pulse.stop {
            background: #f00;
        }
        
        @media (max-width: 768px) {
            #alexaStatusContainer {
                font-size: 12px !important;
                padding: 6px !important;
                margin: 5px 0 !important;
            }
        }
    `;
    document.head.appendChild(style);
}
