document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('gameContainer');
    const playerCircle = document.getElementById('playerCircle');

    // CONSTANTES CRÍTICAS DEL JUEGO
    const FLOOR_HEIGHT = 50; // ALTURA DEL SUELO (DEBE COINCIDIR CON CSS)
    const PLAYER_SIZE = 40; 
    
    // AJUSTES DE FÍSICA Y VELOCIDAD
    const gameSpeed = 3.5; 
    const gravity = 0.5;
    const jumpStrength = -10; // Fuerza del salto (negativo para ir hacia arriba)

    let playerX = 50;
    let playerY = FLOOR_HEIGHT; // El jugador empieza justo en el suelo
    let playerVelocityY = 0;
    let isJumping = false;

    // --- DEFINICIÓN DE LOS 3 PATRONES DE MAPA (ESTRUCTURA DE DATOS) ---
    // x: Posición horizontal relativa al inicio del patrón. y: Altura desde el fondo (incluyendo FLOOR_HEIGHT).
    const PATTERNS = [
        // PATRÓN 1 (Patrón Superior, ahora con un diseño más espaciado para asegurar la funcionalidad)
        [
            { type: 'spike', x: 50, y: FLOOR_HEIGHT },
            { type: 'platform', x: 150, y: FLOOR_HEIGHT + 70, w: 100 },
            { type: 'collectible', x: 200, y: FLOOR_HEIGHT + 110 },
            { type: 'platform', x: 400, y: FLOOR_HEIGHT + 100, w: 80 },
            { type: 'spike', x: 600, y: FLOOR_HEIGHT },
        ],
        // PATRÓN 2 (Patrón del Medio)
        [
            { type: 'platform', x: 100, y: FLOOR_HEIGHT + 50, w: 60 },
            { type: 'collectible', x: 115, y: FLOOR_HEIGHT + 90 },
            { type: 'spike', x: 300, y: FLOOR_HEIGHT },
            { type: 'platform', x: 450, y: FLOOR_HEIGHT + 100, w: 120 },
            { type: 'spike', x: 550, y: FLOOR_HEIGHT },
        ],
        // PATRÓN 3 (Patrón Inferior)
        [
            { type: 'spike', x: 50, y: FLOOR_HEIGHT },
            { type: 'platform', x: 200, y: FLOOR_HEIGHT + 30, w: 50 },
            { type: 'spike', x: 350, y: FLOOR_HEIGHT },
            { type: 'platform', x: 450, y: FLOOR_HEIGHT + 60, w: 100 },
            { type: 'collectible', x: 500, y: FLOOR_HEIGHT + 100 },
            { type: 'spike', x: 650, y: FLOOR_HEIGHT },
        ],
    ];

    let currentPatternIndex = 0;
    let isPatternLoading = false;
    let patternElements = []; // Almacena los elementos del patrón actual para su seguimiento

    // --- FUNCIONES DE GESTIÓN DE ELEMENTOS ---

    // Crea un elemento de juego y lo añade al DOM
    function createGameElement(type, x, y, width = 30) {
        const element = document.createElement('div');
        element.classList.add(type);
        element.style.left = x + 'px';
        element.style.bottom = y + 'px';

        if (type === 'platform') {
            element.style.width = width + 'px';
        }
        
        gameContainer.appendChild(element);
        return element;
    }

    // Carga el siguiente patrón completo
    function loadNextPattern() {
        if (isPatternLoading) return;
        isPatternLoading = true;
        
        const patternData = PATTERNS[currentPatternIndex];
        const containerWidth = gameContainer.offsetWidth;
        const initialOffset = 100; // Espacio inicial entre el borde derecho y el primer obstáculo

        patternData.forEach(item => {
            const element = createGameElement(
                item.type,
                containerWidth + item.x + initialOffset, // Posición inicial fuera de la pantalla
                item.y,
                item.w
            );
            patternElements.push(element);
        });

        // Preparamos para el siguiente ciclo
        currentPatternIndex = (currentPatternIndex + 1) % PATTERNS.length;
        isPatternLoading = false;
    }

    // Mueve los elementos y gestiona el bucle de patrones
    function moveGameElements() {
        let allElementsOut = true;

        // Itera sobre una copia del array para evitar problemas si se eliminan elementos
        patternElements = patternElements.filter(element => {
            let currentLeft = parseFloat(element.style.left) || 0;
            element.style.left = (currentLeft - gameSpeed) + 'px';

            // Si el elemento sigue en pantalla o cerca, no ha terminado el patrón
            if (currentLeft > -50) { 
                allElementsOut = false;
            }
            
            // Si el elemento ha salido de la pantalla, lo eliminamos y no lo mantenemos en el array.
            if (currentLeft < -50) {
                element.remove();
                return false; // Elimina este elemento del array patternElements
            }
            return true; // Mantiene este elemento en el array
        });

        // Lógica de bucle: si todos los elementos del patrón anterior salieron, carga el siguiente.
        if (allElementsOut && patternElements.length === 0 && !isPatternLoading) {
            loadNextPattern();
        }
    }


    // --- FÍSICA Y COLISIÓN ---

    // Actualiza la posición del jugador con gravedad
    function updatePlayerPosition() {
        playerY += playerVelocityY;
        playerVelocityY += gravity;

        // **SOLUCIÓN AL REBOTE Y DESAPARICIÓN:**
        if (playerY < FLOOR_HEIGHT) { 
            playerY = FLOOR_HEIGHT; // Fija la posición exactamente al nivel del suelo
            playerVelocityY = 0;    // Detiene el movimiento vertical
            isJumping = false;      // Permite volver a saltar
        }

        playerCircle.style.bottom = playerY + 'px';
        playerCircle.style.left = playerX + 'px';
    }

    // Detección de colisiones (simplificada)
    function checkCollisions() {
        // Obtenemos el rectángulo del jugador
        const playerRect = {
            left: playerX,
            right: playerX + PLAYER_SIZE,
            top: playerY, 
            bottom: playerY + PLAYER_SIZE
        };

        const elements = gameContainer.querySelectorAll('.platform, .collectible, .spike');
        elements.forEach(element => {
            // Obtenemos el rectángulo del obstáculo
            const elementLeft = parseFloat(element.style.left);
            const elementBottom = parseFloat(element.style.bottom);
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;
            
            const elementCollisionRect = {
                left: elementLeft,
                right: elementLeft + elementWidth,
                top: elementBottom, 
                bottom: elementBottom + elementHeight,
            };

            // Detección de intersección de rectángulos
            if (
                playerRect.left < elementCollisionRect.right &&
                playerRect.right > elementCollisionRect.left &&
                playerRect.top < elementCollisionRect.bottom &&
                playerRect.bottom > elementCollisionRect.top
            ) {
                if (element.classList.contains('collectible')) {
                    // Cubo amarillo: recolectado (desaparece)
                    element.remove(); 
                    // Además de eliminar del DOM, lo quitamos del array de seguimiento
                    patternElements = patternElements.filter(el => el !== element);
                    console.log('¡Cubo recolectado!');
                } else if (element.classList.contains('spike')) {
                    // Pincho: Game Over
                    alert('¡Ruta fallida! Tocaste un pincho. Recarga la página para empezar de nuevo.');
                    location.reload(); 
                }
            }
            
            // LÓGICA DE ATERRIZAJE EN PLATAFORMAS (Asegura que no caiga a través de ellas)
            if (element.classList.contains('platform')) {
                // Si el jugador está cayendo y la parte inferior del jugador está justo por encima de la plataforma
                if (playerVelocityY > 0 && 
                    playerRect.bottom >= elementCollisionRect.top && 
                    playerRect.bottom <= elementCollisionRect.top + playerVelocityY + 10 && // Check near top surface
                    playerRect.right > elementCollisionRect.left && 
                    playerRect.left < elementCollisionRect.right) {
                    
                    // Aterrizar en la plataforma
                    playerY = elementCollisionRect.top - PLAYER_SIZE; 
                    playerVelocityY = 0;
                    isJumping = false;
                }
            }
        });
    }

    // Maneja el salto (tecla espacio)
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

    // Inicialización: Carga el primer patrón
    document.addEventListener('keydown', handleKeyDown);
    loadNextPattern();
    gameLoop(); 
});
