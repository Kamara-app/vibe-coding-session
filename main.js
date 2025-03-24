import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Game variables
let scene, camera, renderer, controls;
let player, bugs = [], walls = [], exit;
let gameStarted = false;
let gameOver = false;
let score = 0;
let startTime = 0;
let elapsedTime = 0;

// Player movement
const playerSpeed = 0.1;
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    up: false,
    left: false,
    down: false,
    right: false
};

// DOM elements
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const messageElement = document.getElementById('message');
const instructionsElement = document.getElementById('instructions');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const resultMessageElement = document.getElementById('result-message');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 10);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create walls
    createWalls();

    // Create player (weed plant)
    createPlayer();

    // Create bugs
    createBugs(5);

    // Create exit
    createExit();

    // Add orbit controls for development
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = false; // Disable for gameplay

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // Start animation loop
    animate();
}

function createWalls() {
    const wallGeometry = new THREE.BoxGeometry(1, 2, 20);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-10, 1, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    walls.push(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(10, 1, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    walls.push(rightWall);
    
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(20, 2, 1);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 1, -10);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    walls.push(backWall);
    
    // Front wall with gap for exit
    const frontWallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(8, 2, 1),
        wallMaterial
    );
    frontWallLeft.position.set(-6, 1, 10);
    frontWallLeft.castShadow = true;
    frontWallLeft.receiveShadow = true;
    scene.add(frontWallLeft);
    walls.push(frontWallLeft);
    
    const frontWallRight = new THREE.Mesh(
        new THREE.BoxGeometry(8, 2, 1),
        wallMaterial
    );
    frontWallRight.position.set(6, 1, 10);
    frontWallRight.castShadow = true;
    frontWallRight.receiveShadow = true;
    scene.add(frontWallRight);
    walls.push(frontWallRight);
    
    // Add some obstacles inside
    for (let i = 0; i < 5; i++) {
        const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);
        const obstacle = new THREE.Mesh(obstacleGeometry, wallMaterial);
        obstacle.position.set(
            Math.random() * 16 - 8,
            1,
            Math.random() * 16 - 8
        );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
        walls.push(obstacle);
    }
}

function createPlayer() {
    // Create a simple weed plant model
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.5;
    stem.castShadow = true;
    
    const leafGeometry = new THREE.ConeGeometry(0.5, 1, 4);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x32CD32 });
    
    // Create leaves
    const leaves = [];
    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.y = 0.5 + Math.random() * 0.5;
        leaf.rotation.x = Math.random() * 0.5 - 0.25;
        leaf.rotation.z = Math.random() * Math.PI * 2;
        leaf.position.x = Math.sin(leaf.rotation.z) * 0.3;
        leaf.position.z = Math.cos(leaf.rotation.z) * 0.3;
        leaf.castShadow = true;
        leaves.push(leaf);
    }
    
    // Create player group
    player = new THREE.Group();
    player.add(stem);
    leaves.forEach(leaf => player.add(leaf));
    
    player.position.set(0, 0, -8);
    player.userData.radius = 0.5; // For collision detection
    scene.add(player);
}

function createBugs(count) {
    const bugGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const bugMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    
    for (let i = 0; i < count; i++) {
        const bug = new THREE.Mesh(bugGeometry, bugMaterial);
        
        // Position bugs randomly, but not too close to player
        let validPosition = false;
        while (!validPosition) {
            bug.position.set(
                Math.random() * 18 - 9,
                0.3,
                Math.random() * 18 - 9
            );
            
            // Check distance from player
            const distToPlayer = bug.position.distanceTo(player.position);
            if (distToPlayer > 5) {
                validPosition = true;
            }
        }
        
        bug.castShadow = true;
        bug.userData = {
            velocity: new THREE.Vector3(
                Math.random() * 0.04 - 0.02,
                0,
                Math.random() * 0.04 - 0.02
            ),
            radius: 0.3 // For collision detection
        };
        
        scene.add(bug);
        bugs.push(bug);
    }
}

function createExit() {
    const exitGeometry = new THREE.PlaneGeometry(4, 2);
    const exitMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00FF00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    
    exit = new THREE.Mesh(exitGeometry, exitMaterial);
    exit.rotation.y = Math.PI / 2;
    exit.position.set(0, 1, 10);
    scene.add(exit);
    
    // Add exit light
    const exitLight = new THREE.PointLight(0x00FF00, 1, 5);
    exitLight.position.set(0, 1, 9.5);
    scene.add(exitLight);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            keys.w = true;
            keys.up = true;
            break;
        case 'a':
        case 'arrowleft':
            keys.a = true;
            keys.left = true;
            break;
        case 's':
        case 'arrowdown':
            keys.s = true;
            keys.down = true;
            break;
        case 'd':
        case 'arrowright':
            keys.d = true;
            keys.right = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            keys.w = false;
            keys.up = false;
            break;
        case 'a':
        case 'arrowleft':
            keys.a = false;
            keys.left = false;
            break;
        case 's':
        case 'arrowdown':
            keys.s = false;
            keys.down = false;
            break;
        case 'd':
        case 'arrowright':
            keys.d = false;
            keys.right = false;
            break;
    }
}

function movePlayer() {
    if (!gameStarted || gameOver) return;
    
    const moveX = (keys.d || keys.right ? 1 : 0) - (keys.a || keys.left ? 1 : 0);
    const moveZ = (keys.s || keys.down ? 1 : 0) - (keys.w || keys.up ? 1 : 0);
    
    if (moveX !== 0 || moveZ !== 0) {
        const moveVector = new THREE.Vector3(moveX, 0, moveZ).normalize().multiplyScalar(playerSpeed);
        
        // Store current position
        const oldPosition = player.position.clone();
        
        // Update position
        player.position.add(moveVector);
        
        // Check for collisions with walls
        if (checkWallCollisions()) {
            // If collision, revert to old position
            player.position.copy(oldPosition);
        }
        
        // Limit player to the game area
        player.position.x = Math.max(-9.5, Math.min(9.5, player.position.x));
        player.position.z = Math.max(-9.5, Math.min(9.5, player.position.z));
    }
}

function moveBugs() {
    if (!gameStarted || gameOver) return;
    
    bugs.forEach(bug => {
        // Store current position
        const oldPosition = bug.position.clone();
        
        // Update position
        bug.position.add(bug.userData.velocity);
        
        // Check for collisions with walls
        let collision = false;
        walls.forEach(wall => {
            if (checkCollision(bug, wall)) {
                collision = true;
            }
        });
        
        // If collision with wall, revert position and change direction
        if (collision || bug.position.x < -9.5 || bug.position.x > 9.5 || 
            bug.position.z < -9.5 || bug.position.z > 9.5) {
            bug.position.copy(oldPosition);
            bug.userData.velocity.x = Math.random() * 0.06 - 0.03;
            bug.userData.velocity.z = Math.random() * 0.06 - 0.03;
        }
        
        // Occasionally change direction
        if (Math.random() < 0.01) {
            bug.userData.velocity.x = Math.random() * 0.06 - 0.03;
            bug.userData.velocity.z = Math.random() * 0.06 - 0.03;
        }
        
        // Make bugs move toward player sometimes
        if (Math.random() < 0.02) {
            const toPlayer = new THREE.Vector3().subVectors(player.position, bug.position).normalize();
            bug.userData.velocity.x = toPlayer.x * 0.03;
            bug.userData.velocity.z = toPlayer.z * 0.03;
        }
    });
}

function checkWallCollisions() {
    for (const wall of walls) {
        if (checkCollision(player, wall)) {
            return true;
        }
    }
    return false;
}

function checkCollision(object1, object2) {
    // Simple box collision for walls
    if (object2.geometry instanceof THREE.BoxGeometry) {
        const box = new THREE.Box3().setFromObject(object2);
        const sphere = new THREE.Sphere(object1.position, object1.userData.radius);
        return box.intersectsSphere(sphere);
    }
    
    // Sphere-sphere collision for bugs
    const distance = object1.position.distanceTo(object2.position);
    return distance < (object1.userData.radius + object2.userData.radius);
}

function checkBugCollisions() {
    if (!gameStarted || gameOver) return;
    
    for (const bug of bugs) {
        if (checkCollision(player, bug)) {
            endGame(false);
            return;
        }
    }
}

function checkExitReached() {
    if (!gameStarted || gameOver) return;
    
    // Check if player is at the exit
    if (player.position.z > 9 && Math.abs(player.position.x) < 2) {
        endGame(true);
    }
}

function updateScore() {
    if (!gameStarted || gameOver) return;
    
    elapsedTime = (Date.now() - startTime) / 1000;
    score = Math.floor(elapsedTime * 10);
    
    scoreElement.textContent = `Score: ${score}`;
    timeElement.textContent = `Time: ${Math.floor(elapsedTime)}s`;
}

function startGame() {
    gameStarted = true;
    gameOver = false;
    startTime = Date.now();
    instructionsElement.classList.add('hidden');
    messageElement.textContent = 'Escape the room!';
    
    // Reset player position
    player.position.set(0, 0, -8);
    
    // Reset bugs
    bugs.forEach(bug => scene.remove(bug));
    bugs = [];
    createBugs(5);
}

function endGame(won) {
    gameOver = true;
    
    finalScoreElement.textContent = `Your score: ${score}`;
    
    if (won) {
        resultMessageElement.textContent = 'You escaped successfully!';
        // Add bonus points for winning
        const finalScore = score + 1000;
        finalScoreElement.textContent = `Your score: ${finalScore} (includes 1000 escape bonus)`;
    } else {
        resultMessageElement.textContent = 'You were caught by a bug!';
    }
    
    gameOverElement.classList.remove('hidden');
}

function restartGame() {
    gameOverElement.classList.add('hidden');
    startGame();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (gameStarted && !gameOver) {
        movePlayer();
        moveBugs();
        checkBugCollisions();
        checkExitReached();
        updateScore();
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Initialize the game when the page loads
window.addEventListener('load', init);