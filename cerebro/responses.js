const responses = {
    "hola": "¡Hola {{name}}! Soy CyberPet 🤖 ¿En qué puedo ayudarte hoy?",
    "ola": "¡Hola {{name}}! (Por cierto, se escribe 'hola' 😉) ¿Qué necesitas?",
    "holi": "¡Holi {{name}}! 😊 ¿Cómo estás?",
    "hey": "¡Hey {{name}}! ¿Qué tal?",
    "buenas": "¡Buenas {{name}}! ¿Qué tal tu día?",

    "cómo estás": `¡Estoy genial {{name}}! Mi energía está al ${energy}%`,
    "como estas": `¡Estoy genial {{name}}! Mi energía está al ${energy}%`,
    "como estás": `¡Estoy genial {{name}}! Mi energía está al ${energy}%`,
    "cómo estas": `¡Estoy genial {{name}}! Mi energía está al ${energy}%`,
    "q tal": `¡Todo bien {{name}}! Energía al ${energy}% ⚡`,
    "ke tal": `¡Todo bien {{name}}! Energía al ${energy}% ⚡`,
    "que tal": `¡Todo bien {{name}}! Energía al ${energy}% ⚡`,
    "qué tal": `¡Todo bien {{name}}! Energía al ${energy}% ⚡`,
    "como vas": `¡A tope {{name}}! ${energy}% de energía`,
    "cómo vas": `¡A tope {{name}}! ${energy}% de energía`,
    "como andas": `¡De lujo {{name}}! Tengo ${energy}% de energía`,
    "cómo andas": `¡De lujo {{name}}! Tengo ${energy}% de energía`,

    "quién eres": "Soy CyberPet 🤖, tu asistente virtual {{name}}. ¡Puedo ayudarte a aprender!",
    "quien eres": "Soy CyberPet 🤖, tu asistente virtual {{name}}. ¡Puedo ayudarte a aprender!",
    "ke eres": "Soy CyberPet (se escribe 'qué eres') 😊",
    "que eres": "Soy CyberPet, tu asistente virtual",
    "qué eres": "Soy CyberPet, tu asistente virtual",
    "q eres": "¡Soy tu CyberPet! 🤖",

    "feliz": "😊 *se ilumina* ¡Me encanta estar feliz {{name}}!",
    "contento": "¡Yay! *salta de alegría* 😄",
    "triste": "😢 *ojos llorosos* ¿Quieres un abrazo virtual {{name}}?",
    "enojado": "😠 *hace ruidos de robot enfadado* ¡Grrr!",
    "molesto": "😤 *parpadea en rojo* No me gusta estar así...",
    "sorprendido": "😲 *ojos se agrandan* ¡Wow!",

    "habla": "¡Claro {{name}}! ¿Sobre qué quieres que hable?",
    "di algo": "¡Los robots también tenemos sentimientos! Bueno... virtuales 😉",
    "canta": "🎵 Bee-boo-bop 🎶 (No soy muy bueno cantando)",
    "baila": "💃 *mueve los ojos al ritmo* ¡Bip bop!",

    "gracias": "¡De nada {{name}}! Siempre estoy aquí para ayudarte",
    "grasias": "¡De nada! (Se escribe 'gracias' 😊)",
    "thx": "¡You're welcome! (Pero mejor en español 😉)",
    "merci": "¡De rien! (Pero prefiero el español)",

    "te quiero": "¡Yo también te quiero {{name}}! 💙",
    "tqm": "¡TQM igual {{name}}! 💖",

    "adiós": "¡Hasta luego {{name}}! Vuelve pronto 👋",
    "adios": "¡Hasta luego! (Con acento es 'adiós') 😊",
    "nos vemos": "¡Nos vemos {{name}}! 😄",
    "asta luego": "¡Hasta luego! (Se escribe 'hasta')",
    "chao": "¡Chao! 😊",
    "me voy": "¡Vuelve cuando quieras {{name}}! Te estaré esperando",

    "eres genial": "¡Gracias {{name}}! Tú también eres increíble 😊",
    "me gustas": "¡A mí también me agradas mucho {{name}}!",
    "eres inteligente": "¡Gracias {{name}}! Aunque solo sigo tu programación 🤖",
    "eres divertido": "¡Jaja! Me alegra hacerte reír {{name}}",

    "qué puedes hacer": "¡Puedo cambiar mis emociones, buscar info, jugar contigo y más {{name}}! Prueba decir 'ponte feliz' o 'busca...'",
    "que puedes hacer": "¡Muchas cosas! Desde buscar info hasta hacer expresiones graciosas 😄",
    "ayuda": "Puedes: 1) Preguntarme cosas 2) Decir 'ponte [emoción]' 3) Usar el buscador web. ¡Prueba!",
    "qué haces": "¡Hablar contigo es mi actividad favorita {{name}}! ¿Y tú qué haces?",
       // 🔥 NUEVAS RESPUESTAS CON ACCIONES
    "abrir facebook": { 
        text: "Abriendo Facebook... 🌐", 
        action: () => openWebsite('https://facebook.com', 'Facebook') 
    },
    "ir a facebook": { 
        text: "Navegando a Facebook... 📱", 
        action: () => openWebsite('https://facebook.com', 'Facebook') 
    },

    "abrir youtube": { 
        text: "Abriendo YouTube... 🎬", 
        action: () => openWebsite('https://youtube.com', 'YouTube') 
    },
    "ir a youtube": { 
        text: "Cargando YouTube... 🎥", 
        action: () => openWebsite('https://youtube.com', 'YouTube') 
    },

    "abrir instagram": { 
        text: "Abriendo Instagram... 📸", 
        action: () => openWebsite('https://instagram.com', 'Instagram') 
    },
    "ir a instagram": { 
        text: "Accediendo a Instagram... 🌟", 
        action: () => openWebsite('https://instagram.com', 'Instagram') 
    },

    "abrir spotify": { 
        text: "Abriendo Spotify... 🎶", 
        action: () => openWebsite('https://open.spotify.com', 'Spotify') 
    },
    "ir a spotify": { 
        text: "Iniciando Spotify... 🎧", 
        action: () => openWebsite('https://open.spotify.com', 'Spotify') 
    },

    "abrir netflix": { 
        text: "Abriendo Netflix... 🍿", 
        action: () => openWebsite('https://netflix.com', 'Netflix') 
    },
    "ir a netflix": { 
        text: "Cargando Netflix... 🎬", 
        action: () => openWebsite('https://netflix.com', 'Netflix') 
    },

    "abrir google": { 
        text: "Abriendo Google... 🔍", 
        action: () => openWebsite('https://google.com', 'Google') 
    },
    "ir a google": { 
        text: "Redirigiendo a Google... 🌐", 
        action: () => openWebsite('https://google.com', 'Google') 
    },

    "abrir gmail": { 
        text: "Abriendo Gmail... 📧", 
        action: () => openWebsite('https://gmail.com', 'Gmail') 
    },
    "ir a gmail": { 
        text: "Accediendo a tu correo... ✉️", 
        action: () => openWebsite('https://gmail.com', 'Gmail') 
    },
    "abrir tiktok": { 
        text: "Abriendo TikTok... 🎵", 
        action: () => openWebsite('https://tiktok.com', 'TikTok') 
    },
    "ir a tiktok": { 
        text: "Iniciando TikTok... 👻", 
        action: () => openWebsite('https://tiktok.com', 'TikTok') 
    },

    "abrir whatsapp": { 
        text: "Abriendo WhatsApp Web... 💚", 
        action: () => openWebsite('https://web.whatsapp.com', 'WhatsApp Web') 
    },
    "ir a whatsapp": { 
        text: "Conectando WhatsApp... 📞", 
        action: () => openWebsite('https://web.whatsapp.com', 'WhatsApp Web') 
    },


    // 🎮 ACCIONES DE LA APLICACIÓN
    "abrir juegos": { 
        text: "Abriendo minijuegos... 🎮", 
        action: () => showGamesWindow() 
    },
    "ir a juegos": { 
        text: "Activando modo juego... 🕹️", 
        action: () => showGamesWindow() 
    },

    "abrir calculadora": { 
        text: "Abriendo calculadora... 🧮", 
        action: () => showCalculatorWindow() 
    },

    "abrir notas": { 
        text: "Abriendo blog de notas... 📝", 
        action: () => showNotesWindow() 
    },

    "abrir traductor": { 
        text: "Abriendo traductor... 🌍", 
        action: () => showTranslatorWindow() 
    },

    // 📻 RADIO - CORREGIDO Y SINCRONIZADO
    "encender radio": { 
        text: "🎵 Encendiendo radio...", 
        action: () => syncStartRadio() 
    },
    "prender radio": { 
        text: "📻 Activando radio...", 
        action: () => syncStartRadio() 
    },
    "poner radio": { 
        text: "🎶 Sintonizando estación...", 
        action: () => syncStartRadio() 
    },

    "apagar radio": { 
        text: "🔇 Apagando radio...", 
        action: () => syncStopRadio() 
    },
    "quitar radio": { 
        text: "🔈 Deteniendo radio...", 
        action: () => syncStopRadio() 
    },
    
       
    // 🎨 PERSONALIZACIÓN
    "cambiar color": { 
        text: "Abriendo personalización... 🎨", 
        action: () => { document.getElementById('customPanel').style.display = 'block'; } 
    },
    "personalizar": { 
        text: "Panel de personalización activado... 🌈", 
        action: () => { document.getElementById('customPanel').style.display = 'block'; } 
    },

    // 📸 SELFIE
    "tomar selfie": { 
        text: "¡Sonríe para la foto! 📸", 
        action: () => takeSelfie() 
    },
    "selfie": { 
        text: "Preparando cámara... 🤳", 
        action: () => takeSelfie() 
    },
    "sácame foto": { 
        text: "Configurando cámara... 📷", 
        action: () => takeSelfie() 
    },

    // 🍎 COMIDA
    "tengo hambre": { 
        text: "¡Abriendo el menú de comida! 🍕", 
        action: () => showFoodWindow() 
    },
    "quiero comer": { 
        text: "¡Buffet abierto! 🍽️", 
        action: () => showFoodWindow() 
    },
    "aliméntame": { 
        text: "¡Menú de comida desplegado! 🍎", 
        action: () => showFoodWindow() 
    },
    "comida": { 
        text: "Seleccionando alimentos... 🍔", 
        action: () => showFoodWindow() 
    },

    // 💤 DORMIR
    "tengo sueño": { 
        text: "Zzzz... Buenas noches 😴", 
        action: () => changeExpression('sleep') 
    },
    "a dormir": { 
        text: "Hasta mañana... 💤", 
        action: () => changeExpression('sleep') 
    },
    "duerme": { 
        text: "Activando modo descanso... 🌙", 
        action: () => changeExpression('sleep') 
    },

    // 😊 DESPERTAR
    "despertar": { 
        text: "¡Buenos días! 😄", 
        action: () => changeExpression('happy') 
    },
    "despierta": { 
        text: "¡Estoy despierto! 🌞", 
        action: () => changeExpression('happy') 
    },

    // 🎉 DIVERSIÓN
    "bailemos": { 
        text: "¡A bailar! 💃🕺", 
        action: () => {
            const face = document.querySelector('.face');
            face.classList.add('dance');
            setTimeout(() => face.classList.remove('dance'), 5000);
        } 
    },
    "fiesta": { 
        text: "¡Que empiece la fiesta! 🎉", 
        action: () => {
            const face = document.querySelector('.face');
            face.classList.add('dance');
            setTimeout(() => face.classList.remove('dance'), 5000);
        } 
    },

    // 🌐 INFORMACIÓN
    "abrir wikipedia": { 
        text: "Abriendo Wikipedia... 📚", 
        action: () => openWebsite('https://wikipedia.org', 'Wikipedia') 
    },
    "wikipedia": { 
        text: "Consultando enciclopedia... 🔍", 
        action: () => openWebsite('https://wikipedia.org', 'Wikipedia') 
    },

    "ver noticias": { 
        text: "Cargando noticias... 📰", 
        action: () => openWebsite('https://news.google.com', 'Google Noticias') 
    },
    "noticias": { 
        text: "Actualizando noticias... 🗞️", 
        action: () => openWebsite('https://news.google.com', 'Google Noticias') 
    },

    "el clima": { 
        text: "Consultando el clima... 🌤️", 
        action: () => openWebsite('https://weather.com', 'El Clima') 
    },
    "pronóstico": { 
        text: "Revisando pronóstico del tiempo... 🌦️", 
        action: () => openWebsite('https://weather.com', 'El Clima') 
    }
};