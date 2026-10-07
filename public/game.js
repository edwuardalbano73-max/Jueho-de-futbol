const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const game = document.getElementById("game");
const resultScreen = document.getElementById("resultScreen");

const playButton = document.getElementById("playButton");
const againButton = document.getElementById("againButton");
const menuButton = document.getElementById("menuButton");

const homeScoreEl = document.getElementById("homeScore");
const awayScoreEl = document.getElementById("awayScore");

const finalHome = document.getElementById("finalHome");
const finalAway = document.getElementById("finalAway");

const timerEl = document.getElementById("timer");
const goalMessage = document.getElementById("goalMessage");

const pauseButton = document.getElementById("pauseButton");

const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");

const passButton = document.getElementById("passButton");
const shootButton = document.getElementById("shootButton");
const sprintButton = document.getElementById("sprintButton");


/* =========================
   CANVAS
========================= */

let W = 1000;
let H = 600;

function resizeCanvas() {

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;

  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


/* =========================
   GAME STATE
========================= */

let running = false;
let paused = false;

let matchTime = 120;
let lastTime = 0;

let homeScore = 0;
let awayScore = 0;

let goalCooldown = 0;

let joystickX = 0;
let joystickY = 0;

let keys = {};

let sprinting = false;


/* =========================
   FIELD
========================= */

const field = {
  x: 35,
  y: 105,
  width: 0,
  height: 0
};

function updateField() {

  field.x = 30;
  field.y = 100;

  field.width = W - 60;
  field.height = H - 155;

  if (field.width < 500) {
    field.y = 90;
    field.height = H - 130;
  }
}


/* =========================
   PLAYERS
========================= */

const players = [];

function createPlayers() {

  players.length = 0;

  const centerY = field.y + field.height / 2;

  // Equipo azul

  players.push(
    createPlayer("home", "GK", field.x + 50, centerY),
    createPlayer("home", "DEF", field.x + 180, centerY - 100),
    createPlayer("home", "DEF", field.x + 180, centerY + 100),
    createPlayer("home", "MID", field.x + 330, centerY),
    createPlayer("home", "FWD", field.x + 470, centerY)
  );

  // Equipo rojo

  players.push(
    createPlayer("away", "GK", field.x + field.width - 50, centerY),
    createPlayer("away", "DEF", field.x + field.width - 180, centerY - 100),
    createPlayer("away", "DEF", field.x + field.width - 180, centerY + 100),
    createPlayer("away", "MID", field.x + field.width - 330, centerY),
    createPlayer("away", "FWD", field.x + field.width - 470, centerY)
  );

  player = players[4];

  ball.x = player.x + 22;
  ball.y = player.y;
}

function createPlayer(team, role, x, y) {

  return {
    team,
    role,

    x,
    y,

    vx: 0,
    vy: 0,

    radius: role === "GK" ? 15 : 13,

    speed:
      role === "FWD" ? 2.8 :
      role === "MID" ? 2.5 :
      2.2,

    hasBall: false,

    aiTimer: Math.random() * 2
  };
}


/* =========================
   BALL
========================= */

const ball = {
  x: 500,
  y: 300,

  vx: 0,
  vy: 0,

  radius: 7,

  friction: .985
};

let player = null;


/* =========================
   INPUT
========================= */

document.addEventListener("keydown", e => {

  keys[e.key.toLowerCase()] = true;

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
      .includes(e.key.toLowerCase())
  ) {
    e.preventDefault();
  }

  if (e.key === " ") {
    shoot();
  }

  if (e.key.toLowerCase() === "e") {
    pass();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});


/* =========================
   JOYSTICK
========================= */

let joystickActive = false;

function updateJoystick(clientX, clientY) {

  const rect = joystick.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = clientX - centerX;
  let dy = clientY - centerY;

  const max = rect.width * .34;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > max) {

    dx = dx / distance * max;
    dy = dy / distance * max;
  }

  joystickX = dx / max;
  joystickY = dy / max;

  joystickKnob.style.transform =
    `translate(${dx}px, ${dy}px)`;
}

function resetJoystick() {

  joystickActive = false;

  joystickX = 0;
  joystickY = 0;

  joystickKnob.style.transform =
    "translate(0, 0)";
}

joystick.addEventListener("pointerdown", e => {

  joystickActive = true;

  joystick.setPointerCapture(e.pointerId);

  updateJoystick(e.clientX, e.clientY);
});

joystick.addEventListener("pointermove", e => {

  if (!joystickActive) return;

  updateJoystick(e.clientX, e.clientY);
});

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);


/* =========================
   BUTTONS
========================= */

shootButton.addEventListener("pointerdown", shoot);
passButton.addEventListener("pointerdown", pass);

sprintButton.addEventListener("pointerdown", () => {
  sprinting = true;
});

sprintButton.addEventListener("pointerup", () => {
  sprinting = false;
});

sprintButton.addEventListener("pointercancel", () => {
  sprinting = false;
});


/* =========================
   START
========================= */

playButton.addEventListener("click", startGame);
againButton.addEventListener("click", startGame);

menuButton.addEventListener("click", () => {

  resultScreen.classList.add("hidden");
  game.classList.add("hidden");
  menu.classList.remove("hidden");

});

pauseButton.addEventListener("click", () => {

  paused = !paused;

  pauseButton.textContent =
    paused ? "▶" : "II";

});


function startGame() {

  menu.classList.add("hidden");
  resultScreen.classList.add("hidden");
  game.classList.remove("hidden");

  running = true;
  paused = false;

  matchTime = 120;

  homeScore = 0;
  awayScore = 0;

  homeScoreEl.textContent = "0";
  awayScoreEl.textContent = "0";

  goalCooldown = 0;

  updateField();
  createPlayers();

  lastTime = performance.now();

  requestAnimationFrame(gameLoop);
}


/* =========================
   GAME LOOP
========================= */

function gameLoop(time) {

  if (!running) return;

  const delta = Math.min(
    (time - lastTime) / 1000,
    .05
  );

  lastTime = time;

  if (!paused) {

    update(delta);
    draw();

  } else {

    draw();
    drawPause();

  }

  requestAnimationFrame(gameLoop);
}


/* =========================
   UPDATE
========================= */

function update(dt) {

  updateField();

  goalCooldown -= dt;

  matchTime -= dt;

  if (matchTime <= 0) {

    matchTime = 0;

    endGame();

    return;
  }

  updateTimer();

  updateUser();

  updateAI(dt);

  updateBall();

  checkBallOwner();

  checkGoal();
}


/* =========================
   USER
========================= */

function updateUser() {

  if (!player) return;

  let dx = joystickX;
  let dy = joystickY;

  if (keys["w"] || keys["arrowup"]) {
    dy -= 1;
  }

  if (keys["s"] || keys["arrowdown"]) {
    dy += 1;
  }

  if (keys["a"] || keys["arrowleft"]) {
    dx -= 1;
  }

  if (keys["d"] || keys["arrowright"]) {
    dx += 1;
  }

  const length = Math.sqrt(dx * dx + dy * dy);

  if (length > 1) {

    dx /= length;
    dy /= length;
  }

  const speed =
    player.speed *
    (sprinting ? 1.65 : 1);

  player.vx = dx * speed;
  player.vy = dy * speed;

  player.x += player.vx;
  player.y += player.vy;

  keepPlayerInside(player);

  if (player.hasBall) {

    ball.x =
      player.x +
      (dx || 1) * 20;

    ball.y =
      player.y +
      dy * 20;

    ball.vx = player.vx;
    ball.vy = player.vy;
  }
}


/* =========================
   AI
========================= */

function updateAI(dt) {

  for (const p of players) {

    if (p === player) continue;

    let targetX = p.x;
    let targetY = p.y;

    const distanceToBall =
      Math.hypot(
        ball.x - p.x,
        ball.y - p.y
      );

    if (p.team === "away") {

      if (
        distanceToBall < 280 ||
        !hasTeamBall("away")
      ) {

        targetX = ball.x;
        targetY = ball.y;
      } else {

        targetX -= 0.3;
      }

    } else {

      if (distanceToBall < 220) {

        targetX = ball.x;
        targetY = ball.y;
      }
    }

    if (p.role === "GK") {

      targetY =
        field.y +
        field.height / 2;

      if (p.team === "home") {
        targetX = field.x + 50;
      } else {
        targetX =
          field.x +
          field.width -
          50;
      }
    }

    const dx = targetX - p.x;
    const dy = targetY - p.y;

    const distance =
      Math.sqrt(dx * dx + dy * dy);

    if (distance > 4) {

      p.vx = dx / distance * p.speed;
      p.vy = dy / distance * p.speed;

      p.x += p.vx;
      p.y += p.vy;

    } else {

      p.vx *= .8;
      p.vy *= .8;
    }

    keepPlayerInside(p);

    if (p.hasBall) {

      ball.x = p.x;
      ball.y = p.y;

      if (
        p.team === "away" &&
        ball.x < field.x + field.width * .55
      ) {

        if (Math.random() < .012) {
          aiShoot(p);
        }
      }
    }
  }
}


/* =========================
   BALL
========================= */

function updateBall() {

  ball.x += ball.vx;
  ball.y += ball.vy;

  ball.vx *= ball.friction;
  ball.vy *= ball.friction;

  const top = field.y;
  const bottom = field.y + field.height;

  if (ball.y < top + ball.radius) {

    ball.y = top + ball.radius;
    ball.vy *= -.65;
  }

  if (ball.y > bottom - ball.radius) {

    ball.y = bottom - ball.radius;
    ball.vy *= -.65;
  }

  const left = field.x;
  const right = field.x + field.width;

  const goalTop =
    field.y +
    field.height / 2 -
    60;

  const goalBottom =
    field.y +
    field.height / 2 +
    60;

  if (
    ball.x < left + ball.radius &&
    !(ball.y > goalTop && ball.y < goalBottom)
  ) {

    ball.x = left + ball.radius;
    ball.vx *= -.65;
  }

  if (
    ball.x > right - ball.radius &&
    !(ball.y > goalTop && ball.y < goalBottom)
  ) {

    ball.x = right - ball.radius;
    ball.vx *= -.65;
  }
}


/* =========================
   POSSESSION
========================= */

function checkBallOwner() {

  let closest = null;
  let closestDistance = Infinity;

  for (const p of players) {

    const distance =
      Math.hypot(
        ball.x - p.x,
        ball.y - p.y
      );

    if (
      distance < p.radius + 17 &&
      distance < closestDistance
    ) {

      closest = p;
      closestDistance = distance;
    }
  }

  if (closest) {

    const previous =
      players.find(p => p.hasBall);

    if (previous && previous !== closest) {
      previous.hasBall = false;
    }

    closest.hasBall = true;

    if (closest.team === "home") {
      player = closest;
    }
  }
}


/* =========================
   PASS
========================= */

function pass() {

  if (!player || !player.hasBall) return;

  const teammates =
    players.filter(
      p =>
        p.team === "home" &&
        p !== player
    );

  if (!teammates.length) return;

  let target = teammates[0];

  let bestScore = Infinity;

  for (const p of teammates) {

    const distance =
      Math.hypot(
        p.x - player.x,
        p.y - player.y
      );

    const score =
      distance -
      (p.x - player.x) * .3;

    if (score < bestScore) {

      bestScore = score;
      target = p;
    }
  }

  player.hasBall = false;

  ball.x = player.x;
  ball.y = player.y;

  const dx = target.x - player.x;
  const dy = target.y - player.y;

  const distance = Math.hypot(dx, dy);

  ball.vx = dx / distance * 8;
  ball.vy = dy / distance * 8;
}


/* =========================
   SHOOT
========================= */

function shoot() {

  if (!player || !player.hasBall) return;

  player.hasBall = false;

  const goalX =
    field.x + field.width;

  const goalY =
    field.y + field.height / 2;

  const dx = goalX - player.x;
  const dy = goalY - player.y;

  const distance = Math.hypot(dx, dy);

  ball.x = player.x;
  ball.y = player.y;

  ball.vx = dx / distance * 11;
  ball.vy = dy / distance * 11;
}


function aiShoot(p) {

  p.hasBall = false;

  const goalX = field.x;
  const goalY =
    field.y + field.height / 2;

  const dx = goalX - p.x;
  const dy = goalY - p.y;

  const distance = Math.hypot(dx, dy);

  ball.x = p.x;
  ball.y = p.y;

  ball.vx = dx / distance * 9;
  ball.vy = dy / distance * 9;
}


/* =========================
   GOAL
========================= */

function checkGoal() {

  if (goalCooldown > 0) return;

  const centerY =
    field.y + field.height / 2;

  const goalTop = centerY - 60;
  const goalBottom = centerY + 60;

  if (
    ball.x <= field.x - 5 &&
    ball.y > goalTop &&
    ball.y < goalBottom
  ) {

    scoreGoal("away");
  }

  if (
    ball.x >= field.x + field.width + 5 &&
    ball.y > goalTop &&
    ball.y < goalBottom
  ) {

    scoreGoal("home");
  }
}


function scoreGoal(team) {

  goalCooldown = 2;

  if (team === "home") {

    homeScore++;

    homeScoreEl.textContent =
      homeScore;

  } else {

    awayScore++;

    awayScoreEl.textContent =
      awayScore;
  }

  goalMessage.classList.remove("hidden");

  setTimeout(() => {

    goalMessage.classList.add("hidden");

  }, 1500);

  resetAfterGoal();
}


function resetAfterGoal() {

  for (const p of players) {
    p.hasBall = false;
  }

  updateField();

  const centerX =
    field.x + field.width / 2;

  const centerY =
    field.y + field.height / 2;

  ball.x = centerX;
  ball.y = centerY;

  ball.vx = 0;
  ball.vy = 0;

  player =
    players.find(
      p =>
        p.team === "home" &&
        p.role === "FWD"
    );

  player.x = field.x + field.width * .42;
  player.y = centerY;

  player.hasBall = true;
}


/* =========================
   HELPERS
========================= */

function keepPlayerInside(p) {

  const minX = field.x + 15;
  const maxX =
    field.x + field.width - 15;

  const minY = field.y + 15;
  const maxY =
    field.y + field.height - 15;

  p.x = Math.max(
    minX,
    Math.min(maxX, p.x)
  );

  p.y = Math.max(
    minY,
    Math.min(maxY, p.y)
  );
}


function hasTeamBall(team) {

  return players.some(
    p => p.team === team && p.hasBall
  );
}


function updateTimer() {

  const minutes =
    Math.floor(matchTime / 60);

  const seconds =
    Math.floor(matchTime % 60);

  timerEl.textContent =
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");
}


/* =========================
   DRAW
========================= */

function draw() {

  ctx.clearRect(0, 0, W, H);

  drawBackground();
  drawField();
  drawPlayers();
  drawBall();
}


function drawBackground() {

  ctx.fillStyle = "#08130c";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );
}


function drawField() {

  const x = field.x;
  const y = field.y;
  const w = field.width;
  const h = field.height;

  // Césped

  ctx.fillStyle = "#16783b";

  ctx.fillRect(
    x,
    y,
    w,
    h
  );

  // Franjas

  const stripeWidth = w / 10;

  for (let i = 0; i < 10; i++) {

    if (i % 2 === 0) {

      ctx.fillStyle =
        "rgba(255,255,255,.035)";

      ctx.fillRect(
        x + i * stripeWidth,
        y,
        stripeWidth,
        h
      );
    }
  }

  // Líneas

  ctx.strokeStyle =
    "rgba(255,255,255,.8)";

  ctx.lineWidth = 3;

  ctx.strokeRect(
    x,
    y,
    w,
    h
  );

  // Medio campo

  ctx.beginPath();

  ctx.moveTo(
    x + w / 2,
    y
  );

  ctx.lineTo(
    x + w / 2,
    y + h
  );

  ctx.stroke();

  // Círculo central

  ctx.beginPath();

  ctx.arc(
    x + w / 2,
    y + h / 2,
    65,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.arc(
    x + w / 2,
    y + h / 2,
    5,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "white";
  ctx.fill();


  // Áreas

  const boxW = 125;
  const boxH = 250;

  ctx.strokeRect(
    x,
    y + h / 2 - boxH / 2,
    boxW,
    boxH
  );

  ctx.strokeRect(
    x + w - boxW,
    y + h / 2 - boxH / 2,
    boxW,
    boxH
  );


  // Áreas pequeñas

  const smallW = 50;
  const smallH = 130;

  ctx.strokeRect(
    x,
    y + h / 2 - smallH / 2,
    smallW,
    smallH
  );

  ctx.strokeRect(
    x + w - smallW,
    y + h / 2 - smallH / 2,
    smallW,
    smallH
  );


  // Porterías

  const goalH = 120;

  ctx.strokeStyle =
    "rgba(255,255,255,.95)";

  ctx.lineWidth = 5;

  ctx.strokeRect(
    x - 15,
    y + h / 2 - goalH / 2,
    15,
    goalH
  );

  ctx.strokeRect(
    x + w,
    y + h / 2 - goalH / 2,
    15,
    goalH
  );
}


function drawPlayers() {

  for (const p of players) {

    ctx.save();

    // Sombra

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y + 12,
      p.radius * 1.2,
      p.radius * .45,
      0,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(0,0,0,.25)";

    ctx.fill();


    // Jugador

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.radius,
      0,
      Math.PI * 2
    );

    if (p.team === "home") {

      ctx.fillStyle =
        p === player
          ? "#58a8ff"
          : "#1670d5";

    } else {

      ctx.fillStyle =
        "#df3645";
    }

    ctx.fill();


    ctx.lineWidth =
      p === player ? 4 : 2;

    ctx.strokeStyle =
      p === player
        ? "#ffffff"
        : "rgba(255,255,255,.55)";

    ctx.stroke();


    // Número

    ctx.fillStyle = "white";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      p.role === "GK" ? "1" : "9",
      p.x,
      p.y
    );

    ctx.restore();
  }
}


function drawBall() {

  ctx.save();

  // Sombra

  ctx.beginPath();

  ctx.ellipse(
    ball.x,
    ball.y + 7,
    8,
    3,
    0,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "rgba(0,0,0,.3)";

  ctx.fill();


  // Balón

  ctx.beginPath();

  ctx.arc(
    ball.x,
    ball.y,
    ball.radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "white";
  ctx.fill();

  ctx.strokeStyle =
    "rgba(0,0,0,.4)";

  ctx.lineWidth = 1;

  ctx.stroke();

  ctx.restore();
}


function drawPause() {

  ctx.fillStyle =
    "rgba(0,0,0,.45)";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.fillStyle = "white";

  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    "PAUSADO",
    W / 2,
    H / 2
  );
}


/* =========================
   END
========================= */

function endGame() {

  running = false;

  finalHome.textContent =
    homeScore;

  finalAway.textContent =
    awayScore;

  resultScreen.classList.remove(
    "hidden"
  );
}
