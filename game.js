document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('gameContainer');
    const playerCircle = document.getElementById('playerCircle');

    // CONSTANTES DEL JUEGO
    const FLOOR_HEIGHT = 50; // La altura del suelo (debe coincidir con .game-floor en CSS)
    const PLAYER_SIZE = 40; // Tamaño del círculo
    const gameSpeed = 3.5; // Velocidad de desplazamiento
    const gravity = 0.5;
    const jumpStrength = -10;

    let playerX = 50;
    let playerY = FLOOR_HEIGHT; // El jugador empieza justo en el suelo
    let playerVelocityY = 0;
    let isJumping = false;

    // --- DEFINICIÓN DE LOS 3 PATRONES DE MAPA (Basado en tu imagen) ---
    // Posición X es relativa al inicio del patrón. Posición Y es altura DESDE el suelo (FLOOR_HEIGHT).

    const PATTERNS = [
        // PATRÓN 1 (Arriba): Dos plataformas con un cubo central. Pinchos en el suelo.
        [
            // Pinchos en el suelo
            { type: 'spike', x: 100, y: FLOOR_HEIGHT },
            { type: 'spike', x: 300, y: FLOOR_HEIGHT },
            { type: 'spike', x: 500, y: FLOOR_HEIGHT },
            // Plataformas y Cubo
            { type: 'platform', x: 150, y: FLOOR_HEIGHT + 50, w: 100 },
            { type: 'collectible', x: 270, y: FLOOR_HEIGHT + 130 },
            { type: 'platform', x: 250, y: FLOOR_HEIGHT + 100, w: 70 },
            { type: 'platform', x: 450, y: FLOOR_HEIGHT + 70, w: 90 },
        ],
        // PATRÓN 2 (Medio): Plataforma baja, cubo y pinchos escalonados.
        [
            { type: 'platform', x: 150, y: FLOOR_HEIGHT + 50, w: 80 },
            { type: 'collectible', x: 165, y: FLOOR_HEIGHT + 90 },
            { type: 'spike', x: 300, y: FLOOR_HEIGHT },
            { type: 'platform', x: 400, y: FLOOR_HEIGHT + 70, w: 60 },
            { type: 'spike', x: 550, y: FLOOR_HEIGHT },
        ],
        // PATRÓN 3 (Abajo): Muchos pinchos y una plataforma con cubo.
        [
            { type: 'spike', x: 50, y: FLOOR_HEIGHT },
            { type: 'spike', x: 150, y: FLOOR_HEIGHT },
            { type: 'platform', x: 250, y: FLOOR_HEIGHT + 30, w: 50 },
            { type: 'spike', x: 350, y: FLOOR_HEIGHT },
            { type: 'collectible', x: 450, y: FLOOR_HEIGHT + 30 },
            { type: 'platform', x: 430, y: FLOOR_HEIGHT + 50, w: 70 },
            { type: 'spike', x: 600, y: FLOOR_HEIGHT },
        ],
    ];

    let currentPatternIndex = 0;
    let isPatternLoading = false;
    let lastElementX = 0; // Posición X del último elemento creado

    // Función para crear un elemento de juego a partir de los datos del patrón
    function createGameElement(type, x, y, width = 30) {
        const element = document.createElement('div');
        element.classList.add(type);
        element.style.left = x + 'px';
        element.style.bottom = y + 'px';

        if (type === 'platform') {
            element.style.width = width + 'px';
        }
        
        // Guardamos la posición original X para saber cuándo debe terminar el patrón
        element.dataset.originalX = x;

        gameContainer.appendChild(element);
        return element;
    }

    // Función para cargar el siguiente patrón
    function loadNextPattern() {
        if (isPatternLoading) return;

        isPatternLoading = true;
        const patternData = PATTERNS[currentPatternIndex];
        let maxElementX = 0;

        // Itera sobre los datos del patrón y crea los elementos.
        patternData.forEach(item => {
            const element = createGameElement(
                item.type,
                gameContainer.offsetWidth + lastElementX + item.x, // Aparece fuera de la pantalla + espacio
                item.y,
                item.w
            );
            
            // Encuentra la posición X más a la derecha para saber cuándo el patrón ha pasado.
            const elementRight = parseFloat(element.style.left) + (item.w || 30);
            if (elementRight > maxElementX) {
                maxElementX = elementRight;
            }
        });

        // La posición X del último elemento se establece para dejar un espacio entre patrones.
        lastElementX = maxElementX;
        isPatternLoading = false;
    }


    // Función para actualizar la posición del jugador
    function updatePlayerPosition() {
        playerY += playerVelocityY;
        playerVelocityY += gravity;

        // COLISIÓN CON EL SUELO
        if (playerY < FLOOR_HEIGHT) { 
            playerY = FLOOR_HEIGHT;
            playerVelocityY = 0;
            isJumping = false;
        }

        playerCircle.style.bottom = playerY + 'px';
        playerCircle.style.left = playerX + 'px';
    }

    // Función para mover los obstáculos y recompensas
    function moveGameElements() {
        const elements = gameContainer.querySelectorAll('.platform, .collectible, .spike');
        let oldestElementX = Infinity;
        let lastElementPassed = true;

        elements.forEach(element => {
            let currentLeft = parseFloat(element.style.left) || 0;
            element.style.left = (currentLeft - gameSpeed) + 'px';

            // Comprueba si algún elemento sigue siendo visible
            if (currentLeft > -50) { 
                lastElementPassed = false;
            }
            
            // Encuentra la posición más a la izquierda (para la limpieza)
            if (currentLeft < oldestElementX) {
                oldestElementX = currentLeft;
            }

            // Eliminar elementos que salen de la pantalla por la izquierda
            if (currentLeft < -50) {
                element.remove();
            }
        });

        // Lógica de bucle de patrones
        if (elements.length === 0 && !isPatternLoading) {
             // Si no quedan elementos, avanzamos al siguiente patrón.
            currentPatternIndex = (currentPatternIndex + 1) % PATTERNS.length;
            loadNextPattern();
        }
        
        // Carga el patrón inicial
        if (gameContainer.querySelectorAll('.platform, .collectible, .spike').length === 0 && !isPatternLoading) {
            loadNextPattern();
        }
    }


    // Detección de colisiones
    function checkCollisions() {
        // Obtenemos el rectángulo de colisión del jugador. Ajustamos para el tamaño real del círculo.
        const playerRect = {
            left: playerX,
            right: playerX + PLAYER_SIZE,
            top: gameContainer.clientHeight - playerY - PLAYER_SIZE,
            bottom: gameContainer.clientHeight - playerY
        };

        const elements = gameContainer.querySelectorAll('.platform, .collectible, .spike');
        elements.forEach(element => {
            const elementRect = element.getBoundingClientRect();
            const containerRect = gameContainer.getBoundingClientRect();
            
            // Normalizar las coordenadas del elemento al sistema del jugador (bottom/left del contenedor)
            const elementLeft = parseFloat(element.style.left);
            const elementBottom = parseFloat(element.style.bottom);
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;
            
            const elementCollisionRect = {
                left: elementLeft,
                right: elementLeft + elementWidth,
                top: elementBottom, // Coordenada bottom es la altura desde el suelo (FLOOR_HEIGHT)
                bottom: elementBottom + elementHeight,
            };

            // Colisión simple (intersección de rectángulos)
            if (
                playerRect.left < elementCollisionRect.right &&
                playerRect.right > elementCollisionRect.left &&
                playerY < elementCollisionRect.bottom &&
                playerY + PLAYER_SIZE > elementCollisionRect.top
            ) {
                if (element.classList.contains('collectible')) {
                    // Cubo amarillo: recolectado
                    element.remove(); 
                    console.log('¡Cubo recolectado!');
                } else if (element.classList.contains('spike')) {
                    // Pincho: Game Over
                    alert('¡Ruta fallida! El circulito tocó un pincho. Recarga la página para empezar de nuevo.');
                    location.reload(); 
                }
                // (Opcional) Aquí se podría añadir la lógica para que el jugador aterrice sobre una plataforma.
            }
        });
    }

    // Función para manejar el salto (tecla espacio)
    function handleKeyDown(event) {
        if (event.code === 'Space' && !isJumping) {
            playerVelocityY = jumpStrength;
            isJumping = true;
        }
    }

    // Bucle principal del juego
    function gameLoop() {
        updatePlayerPosition();
        moveGameElements();
        checkCollisions();
        requestAnimationFrame(gameLoop); 
    }

    // Inicialización
    document.addEventListener('keydown', handleKeyDown);
    gameLoop(); 
});
