document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('gameContainer');
    const playerCircle = document.getElementById('playerCircle');

    let playerX = 50; // Posición horizontal inicial
    let playerY = 50; // Posición vertical inicial (desde la base del gameContainer)
    let playerVelocityY = 0; // Velocidad de salto
    let isJumping = false;
    let gravity = 0.5; // Fuerza de la gravedad
    let jumpStrength = -10; // Fuerza del salto
    let gameSpeed = 3; // Velocidad de desplazamiento de los obstáculos

    // Función para actualizar la posición del jugador
    function updatePlayerPosition() {
        playerY += playerVelocityY;
        playerVelocityY += gravity;

        // Limitar la caída del jugador al "suelo" (altura base dentro del gameContainer)
        if (playerY < 50) { // Si el jugador está por debajo de la base
            playerY = 50;
            playerVelocityY = 0;
            isJumping = false;
        }

        playerCircle.style.bottom = playerY + 'px';
        playerCircle.style.left = playerX + 'px';
    }

    // Función para manejar el salto (tecla espacio)
    function handleKeyDown(event) {
        if (event.code === 'Space' && !isJumping) {
            playerVelocityY = jumpStrength;
            isJumping = true;
        }
    }

    // Función para mover los obstáculos y recompensas
    function moveGameElements() {
        const elements = gameContainer.querySelectorAll('.platform, .collectible, .spike');
        elements.forEach(element => {
            let currentLeft = parseFloat(element.style.left) || 0;
            element.style.left = (currentLeft - gameSpeed) + 'px';

            // Eliminar elementos que salen de la pantalla por la izquierda
            if (currentLeft < -50) {
                element.remove();
            }
        });

        // Regenerar elementos si es necesario (esto es una simplificación)
        // En un juego real, tendrías un sistema más sofisticado de generación
        if (Math.random() < 0.02) { // Probabilidad de generar un nuevo elemento
            generateGameElement();
        }
    }

    // Función para generar un nuevo elemento del juego (plataforma, cubo, pincho)
    function generateGameElement() {
        const elementType = Math.floor(Math.random() * 3); // 0: platform, 1: collectible, 2: spike
        let newElement;
        let elementBottom;
        let elementLeft = gameContainer.offsetWidth; // Empieza al final del contenedor

        switch (elementType) {
            case 0: // Plataforma
                newElement = document.createElement('div');
                newElement.classList.add('platform');
                newElement.style.width = (Math.random() * 100 + 70) + 'px'; // Ancho aleatorio
                elementBottom = Math.random() * (gameContainer.clientHeight / 2) + 50; // Altura aleatoria
                break;
            case 1: // Coleccionable (cubo amarillo)
                newElement = document.createElement('div');
                newElement.classList.add('collectible');
                elementBottom = Math.random() * (gameContainer.clientHeight / 2) + 100; // Un poco más alto
                break;
            case 2: // Pincho
                newElement = document.createElement('div');
                newElement.classList.add('spike');
                elementBottom = 50; // Siempre en el suelo
                break;
        }

        newElement.style.left = elementLeft + 'px';
        newElement.style.bottom = elementBottom + 'px';
        gameContainer.appendChild(newElement);
    }


    // Detección de colisiones
    function checkCollisions() {
        const playerRect = playerCircle.getBoundingClientRect();

        const elements = gameContainer.querySelectorAll('.platform, .collectible, .spike');
        elements.forEach(element => {
            const elementRect = element.getBoundingClientRect();

            // Colisión básica (intersección de rectángulos)
            if (
                playerRect.left < elementRect.right &&
                playerRect.right > elementRect.left &&
                playerRect.top < elementRect.bottom &&
                playerRect.bottom > elementRect.top
            ) {
                if (element.classList.contains('collectible')) {
                    // Si choca con un cubo amarillo
                    element.remove(); // El cubo desaparece
                    console.log('¡Cubo recolectado!');
                } else if (element.classList.contains('spike')) {
                    // Si choca con un pincho
                    alert('¡Oh no! Tocaste un pincho. Recarga la página para empezar de nuevo.');
                    location.reload(); // Recargar la página
                }
                // Aquí podrías añadir lógica para plataformas si el jugador está cayendo sobre ellas
            }
        });
    }

    // Bucle principal del juego
    function gameLoop() {
        updatePlayerPosition();
        moveGameElements();
        checkCollisions();
        requestAnimationFrame(gameLoop); // Llama a gameLoop en cada frame
    }

    // Iniciar el juego
    document.addEventListener('keydown', handleKeyDown);
    // Eliminar los elementos de ejemplo que se cargaron inicialmente en HTML
    gameContainer.querySelectorAll('.platform, .collectible, .spike').forEach(el => el.remove());
    
    // Generar algunos elementos iniciales de forma dinámica
    for(let i = 0; i < 5; i++) {
        generateGameElement();
    }
    gameLoop();
});
