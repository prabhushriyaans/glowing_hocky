const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 300;

let gameState = {};

// Receive game updates from the server
socket.on("update", (state) => {
    gameState = state;
    document.getElementById("playerScore").textContent = gameState.scores.player;
    document.getElementById("aiScore").textContent = gameState.scores.ai;
    drawGame();
});

// Mouse movement event
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    socket.emit("movePaddle", { x, y });
});

// Touch movement event (for mobile)
canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    socket.emit("movePaddle", { x, y });
});

// Function to draw the game elements
function drawGame() {
    if (!gameState.puck) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw goalposts
    drawGoal(0, canvas.height / 2 - 40); // Left goal
    drawGoal(canvas.width - 20, canvas.height / 2 - 40); // Right goal

    // Draw puck
    ctx.fillStyle = "lime";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "lime";
    ctx.beginPath();
    ctx.arc(gameState.puck.x, gameState.puck.y, gameState.puck.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw user paddle (hollow ring)
    drawHollowCircle(gameState.paddles.user.x, gameState.paddles.user.y, gameState.paddles.user.radius, "red");

    // Draw AI paddle (hollow ring)
    drawHollowCircle(gameState.paddles.ai.x, gameState.paddles.ai.y, gameState.paddles.ai.radius, "blue");
}

// Function to draw a hollow ring
function drawHollowCircle(x, y, radius, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Function to draw goalposts
function drawGoal(x, y) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(x, y, 20, 80);
}
