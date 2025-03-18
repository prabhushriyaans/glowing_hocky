const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const gameWidth = 600;
const gameHeight = 300;
const paddleRadius = 25;

const gameState = {
    puck: { x: gameWidth / 2, y: gameHeight / 2, vx: 4, vy: 3, radius: 10 },
    paddles: {
        user: { x: gameWidth / 4, y: gameHeight / 2, radius: paddleRadius },
        ai: { x: (3 * gameWidth) / 4, y: gameHeight / 2, radius: paddleRadius }
    },
    scores: { player: 0, ai: 0 }
};

// Initial toss with higher speed
function initialToss() {
    let direction = Math.random() < 0.5 ? -1 : 1;
    gameState.puck.vx = 6 * direction; // Increased speed
    gameState.puck.vy = (Math.random() > 0.5 ? 1 : -1) * 4; // Increased speed
}

// Handle paddle collision with speed boost
function checkPaddleCollision() {
    const userPaddle = gameState.paddles.user;
    const aiPaddle = gameState.paddles.ai;

    // User paddle collision
    if (Math.hypot(gameState.puck.x - userPaddle.x, gameState.puck.y - userPaddle.y) < userPaddle.radius + gameState.puck.radius) {
        gameState.puck.vx = Math.abs(gameState.puck.vx) * 1.05; // Increase speed slightly
        gameState.puck.vy *= 1.05; // Increase Y speed slightly
    }

    // AI paddle collision
    if (Math.hypot(gameState.puck.x - aiPaddle.x, gameState.puck.y - aiPaddle.y) < aiPaddle.radius + gameState.puck.radius) {
        gameState.puck.vx = -Math.abs(gameState.puck.vx) * 1.05; // Increase speed slightly
        gameState.puck.vy *= 1.05; // Increase Y speed slightly
    }
}

// Reset puck after goal with higher speed
function resetPuck() {
    gameState.puck.x = gameWidth / 2;
    gameState.puck.y = gameHeight / 2;
    initialToss();
}


// AI Decision Making using a smarter predictive algorithm
// Improved AI Decision Making with Full Range Movement
function aiMove() {
    let predictionTime = (gameState.paddles.ai.x - gameState.puck.x) / gameState.puck.vx;
    let predictedY = gameState.puck.y + gameState.puck.vy * predictionTime;
    let predictedX = gameState.puck.x + gameState.puck.vx * predictionTime;

    // Ensure AI stays within bounds
    predictedY = Math.max(30, Math.min(gameHeight - 30, predictedY));
    predictedX = Math.max(gameWidth / 2 + 30, Math.min(gameWidth - 30, predictedX));

    let dx = predictedX - gameState.paddles.ai.x;
    let dy = predictedY - gameState.paddles.ai.y;

    // Increase AI speed when the puck is moving towards it
    let speedFactor = gameState.puck.vx > 0 ? 0.12 : 0.06;

    // Move AI both horizontally and vertically
    gameState.paddles.ai.x += dx * speedFactor;
    gameState.paddles.ai.y += dy * speedFactor;

    // Restrict AI within its half
    gameState.paddles.ai.x = Math.max(gameWidth / 2 + 30, Math.min(gameWidth - 30, gameState.paddles.ai.x));
}

io.on("connection", (socket) => {
    console.log("A user connected");
    initialToss();
    socket.emit("update", gameState);

    socket.on("movePaddle", (position) => {
        gameState.paddles.user.x = Math.max(30, Math.min(gameWidth / 2 - 10, position.x));
        gameState.paddles.user.y = Math.max(30, Math.min(gameHeight - 30, position.y));
    });
});

// Game Loop
function gameLoop() {
    gameState.puck.x += gameState.puck.vx;
    gameState.puck.y += gameState.puck.vy;

    // Bounce off top and bottom walls
    if (gameState.puck.y - gameState.puck.radius < 0 || gameState.puck.y + gameState.puck.radius > gameHeight) {
        gameState.puck.vy *= -1;
    }

    // AI Movement
    aiMove();

    checkPaddleCollision();
    checkGoal();
    io.emit("update", gameState);
}

// Handle paddle collision
function checkPaddleCollision() {
    const userPaddle = gameState.paddles.user;
    const aiPaddle = gameState.paddles.ai;

    // User paddle collision
    if (Math.hypot(gameState.puck.x - userPaddle.x, gameState.puck.y - userPaddle.y) < userPaddle.radius + gameState.puck.radius) {
        gameState.puck.vx = Math.abs(gameState.puck.vx);
    }

    // AI paddle collision
    if (Math.hypot(gameState.puck.x - aiPaddle.x, gameState.puck.y - aiPaddle.y) < aiPaddle.radius + gameState.puck.radius) {
        gameState.puck.vx = -Math.abs(gameState.puck.vx);
    }
}

// Check for goal scoring
function checkGoal() {
    if (gameState.puck.x < 8) {
        gameState.scores.ai += 1;
        resetPuck();
    } else if (gameState.puck.x > gameWidth - 8) {
        gameState.scores.player += 1;
        resetPuck();
    }
}

// Reset puck after goal
function resetPuck() {
    gameState.puck.x = gameWidth / 2;
    gameState.puck.y = gameHeight / 2;
    initialToss();
}

// Run game loop every 16ms (~60 FPS)
setInterval(gameLoop, 16);

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
