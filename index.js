//#region Base game code variables

const statusEnum = Object.freeze({
  'STOPPED': 'Stopped',
  'FINISHED': 'Finished',
  'RUNNING': 'Running',
  'PAUSED': 'Paused',
});

let gameStatus = statusEnum.STOPPED;
let animationFrameId = 0;
let framesCounter = 0;
let startTime;
let fpsInterval = 1000 / 60;

//#endregion

const gameScene = document.getElementById('game');
const statusInfo = document.getElementById('status');
const velocityInfo = document.getElementById('velocity');
const scoreInfo = document.getElementById('score');

let dino;
let cactuses = [];
let velocity = 4;
let jumping = false;

function keydown(event) {
  if (event.code === 'Space') {
    if (gameStatus === statusEnum.STOPPED) {
      startGame();
    } else if (gameStatus === statusEnum.PAUSED) {
      continueGame();
    } else if (gameStatus === statusEnum.RUNNING) {
      const topPosition = parseInt(dino.style.top);
      if (gameScene.clientHeight / 2 <= topPosition) {
        jumping = true;
      }
    }
  } else if (event.code === 'Escape') {
    if (gameStatus === statusEnum.RUNNING) {
      pauseGame();
    }
  }
}

function startGame() {
  gameStatus = statusEnum.RUNNING;
  statusInfo.style.display = 'none';

  dino = spawnDino(gameScene.clientHeight / 2, 50);
  gameScene.appendChild(dino);

  animationFrameId = window.requestAnimationFrame(gameLoop);
}

function pauseGame() {
  gameStatus = statusEnum.PAUSED;
  statusInfo.style.display = 'flex';
  statusInfo.innerText = `Paused (press 'Space' to continue)`;
  window.cancelAnimationFrame(animationFrameId);
}

function continueGame() {
  gameStatus = statusEnum.RUNNING;
  statusInfo.style.display = 'none';
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

function restartGame() {
  gameScene.removeChild(dino);

  cactuses.forEach((cactus) => {
    gameScene.removeChild(cactus);
  });

  cactuses = [];
  framesCounter = 0;
  velocity = 4;
  jumping = false;

  startGame();
}

function gameLoop(timestamp) {
  animationFrameId = window.requestAnimationFrame(gameLoop);
  framesCounter++;

  if (startTime === undefined) {
    startTime = timestamp;
  }
  const elapsed = timestamp - startTime;

  if (elapsed >= fpsInterval) {
    updateCactusSpwan();
    updateDinoPosition();
  
    if (dinoCollided()) {
      const dinoImg = dino.getElementsByTagName('img')[0];
      if (dinoImg) {
        dinoImg.src = './imgs/dino-dead.png';
      }

      gameStatus = statusEnum.FINISHED;
      statusInfo.style.display = 'flex';
      statusInfo.innerText = 'You lose! Do you want to try again?';
  
      const restartBtn = document.createElement('button');
      restartBtn.innerText = 'Yes!';
      restartBtn.onclick = () => restartGame();
      statusInfo.appendChild(restartBtn);
  
      window.cancelAnimationFrame(animationFrameId);
    } else {
      updateVelocity();
      updateInfo();
    }
  }

}

function updateCactusSpwan() {
  // Each 200, 450, 1000 iterations spawn new cactus
  if (framesCounter === 0 || framesCounter % 200 === 0 || framesCounter % 450 === 0 || framesCounter % 1000 === 0) {
    const cactus = spawnCactus(gameScene.clientHeight / 2, gameScene.clientWidth);
    gameScene.appendChild(cactus);
    cactuses.push(cactus);
  }

  cactuses.forEach((cactus) => {
    const leftPosition = parseInt(cactus.style.left);
    const cactusSize = parseInt(cactus.style.width);

    // Remove off-screen elements
    if (leftPosition < 0 && (leftPosition * -1) > cactusSize) {
      cactus.style.display = 'none';
      gameScene.removeChild(cactus);
    } else {
      cactus.style.left = `${(leftPosition - velocity)}px`;
    }
  });

  // Clean non displayed cactuses
  cactuses = cactuses.filter((cactus) => cactus.style.display !== 'none');
}

function updateVelocity() {
  // Duble velocity over time each 1000 framesCounter
  if (framesCounter !== 0 && framesCounter % 1000 === 0) {
    velocity = (velocity * 1.2).toFixed(2);
  }
}

function updateInfo() {
  velocityInfo.innerText = velocity;
  scoreInfo.innerText = framesCounter;
}

function updateDinoPosition() {
  const maxJumpPosition = (gameScene.clientHeight / 2) - (parseInt(dino.style.height) * 2.5);
  const topPosition = parseInt(dino.style.top);
  const dinoImg = dino.getElementsByTagName('img')[0];

  if (jumping) {
    if (topPosition > maxJumpPosition) {
      if (dinoImg) {
        dinoImg.src = './imgs/dino-jumping.png';
      }

      dino.style.top = `${(topPosition * 0.98 - 2)}px`;
    } else {
      jumping = false;

      if (dinoImg) {
        dinoImg.src = './imgs/dino-running.gif';
      }
    }
  } else {
    if (gameScene.clientHeight / 2 >= topPosition) {
      dino.style.top = `${(topPosition / 0.98)}px`;
    }
  }
}

function dinoCollided() {
  let collieded = false;

  const firstCactus = cactuses[0];

  if (firstCactus) {
    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = firstCactus.getBoundingClientRect();

    const horizontalCollition = dinoRect.left <= cactusRect.left && cactusRect.left <= dinoRect.right - 20 ||
      dinoRect.left <= cactusRect.right - 20 && cactusRect.right <= dinoRect.right;

    const verticalCollition = dinoRect.bottom - 20 >= cactusRect.top;

    if (horizontalCollition && verticalCollition) {
      collieded = true;
    }
  }

  return collieded;
}

/**
 * 
 * @param x position in pixels 
 * @param y position in pixels
 * @param width in pixels (20px by default)
 * @param height in pixels (20px by default)
 * @returns div box
 */
function spawnCactus(x, y, width, height) {
  const div = document.createElement('div');
  div.style.display = 'inline-block';
  div.style.position = 'fixed';
  div.style.width = width ? `${width}px` : '40px';
  div.style.height = height ? `${height}px` : '70px';
  div.style.top = `${x}px`;
  div.style.left = `${y}px`;

  const img = document.createElement('img');
  img.src = './imgs/cactus.png';
  img.style.maxHeight = '100%';
  img.style.maxWidth = '100%';
  div.appendChild(img);

  return div;
}

/**
 * 
 * @param x position in pixels 
 * @param y position in pixels
 * @param width in pixels (20px by default)
 * @param height in pixels (20px by default)
 * @returns div box
 */
function spawnDino(x, y, width, height) {
  const div = document.createElement('div');
  div.style.display = 'inline-block';
  div.style.position = 'fixed';
  div.style.width = width ? `${width}px` : '54px';
  div.style.height = height ? `${height}px` : '60px';
  div.style.top = `${x}px`;
  div.style.left = `${y}px`;
  div.style.zIndex = 1;

  const img = document.createElement('img');
  img.src = './imgs/dino-running.gif';
  img.style.maxHeight = '100%';
  img.style.maxWidth = '100%';
  div.appendChild(img);

  return div;
}
