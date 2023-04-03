export const FlappyBird = (() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius,
    strokeColor,
    fillColor
  ) {
    if (typeof strokeColor === 'undefined') {
      strokeColor = 'black';
    }
    if (typeof fillColor === 'undefined') {
      fillColor = 'transparent';
    }

    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();

    this.strokeStyle = strokeColor;
    this.stroke();
    this.fillStyle = fillColor;
    this.fill();
  };

  // 遊戲狀態
  let gameState = 'ready'; // ready, playing, gameover

  // 計數器和分數
  let frames = 0;
  let score = 0;

  let mouseX, mouseY, bird;

  // 鳥的相關參數
  const birdWidth = 34;
  const birdHeight = 24;
  const birdX = 50;
  let birdY = canvas.height / 2 - birdHeight / 2;
  let birdSpeed = 0;
  const birdGravity = 0.5;
  const birdJump = -5;

  // 管道的相關參數
  const pipeWidth = 52;
  const pipeGap = 120;
  const pipeSpawnRate = 90;
  const pipeSpeed = 2;
  const minPipeHeight = 100;
  const maxPipeHeight = canvas.height - minPipeHeight - pipeGap;
  let pipes = [];

  // 開始按鈕
  const startButton = {
    x: canvas.width / 2 - 50,
    y: canvas.height / 2 - 25,
    width: 100,
    height: 50,
    text: 'Start',
  };

  // 重新開始按鈕
  const restartButton = {
    x: canvas.width / 2 - 50,
    y: canvas.height / 2 - 25,
    width: 100,
    height: 50,
    text: 'Restart',
  };

  canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX - canvas.offsetLeft;
    mouseY = event.clientY - canvas.offsetTop;
  });

  function drawButton(text, x, y, width, height, onClick, mouseX, mouseY) {
    // 檢測游標是否在按鈕範圍内
    const isHovered = mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;

    // 繪製按鈕外框
    ctx.lineWidth = 10;
    const strokeColor = isHovered ? '#2d5e6e' : '#3a8ea7';

    // 繪製底色
    ctx.roundRect(x, y, width, height, height / 5, strokeColor, isHovered ? '#53b6c7' : '#70c5ce');

    // 繪製按鈕文字
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(text, x + width / 2 - ctx.measureText(text).width / 2, y + height / 2 + 8);

    // 添加點擊事件監聽器
    if (isHovered) {
      canvas.style.cursor = 'pointer';
      canvas.addEventListener('click', onClick);
    } else {
      canvas.style.cursor = 'initial';
      canvas.removeEventListener('click', onClick);
    }
  }

  // 更新分數
  function updateScore() {
    if (gameState === 'playing') {
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText(`Score: ${score}`, 10, 30);
    }
  }

  // 獲取兩個矩形的相交部分
  function getIntersection(rect1, rect2) {
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    const w = Math.max(0, x2 - x1);
    const h = Math.max(0, y2 - y1);
    return {
      x: x1,
      y: y1,
      width: w,
      height: h,
    };
  }

  // 繪製兩個矩形及其相交部分
  function drawRect(rect) {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }

  const rect1 = {x: 100, y: 100, width: 100, height: 100};
  const rect2 = {x: 150, y: 150, width: 100, height: 100};
  const intersection = getIntersection(rect1, rect2);

  ctx.fillStyle = 'blue';
  drawRect(rect1);

  ctx.fillStyle = 'red';
  drawRect(rect2);

  if (intersection) {
    ctx.fillStyle = 'green';
    drawRect(intersection);
  }

  function checkPixelCollision(bird, pipe) {
    // 創建畫面和上下文
    const birdCanvas = document.createElement('canvas');
    const birdCtx = birdCanvas.getContext('2d');
    const pipeCanvas = document.createElement('canvas');
    const pipeCtx = pipeCanvas.getContext('2d');

    // 設置畫面大小
    birdCanvas.width = bird.width;
    birdCanvas.height = bird.height;
    pipeCanvas.width = pipe.width;
    pipeCanvas.height = pipe.height;

    // 繪製鳥和管道到畫面上
    birdCtx.drawImage(bird.image, 0, 0);
    pipeCtx.drawImage(pipe.image, 0, 0);

    // 獲取鳥和管道的像素數據
    const birdData = birdCtx.getImageData(0, 0, birdCanvas.width, birdCanvas.height);
    const pipeData = pipeCtx.getImageData(0, 0, pipeCanvas.width, pipeCanvas.height);

    // 遍歷像素數據，檢查是否有相同的像素座標
    for (let i = 0; i < birdData.data.length; i += 4) {
      const birdPixel = birdData.data.slice(i, i + 4);
      const pipePixel = pipeData.data.slice(i, i + 4);

      if (birdPixel[ 3 ] !== 0 && pipePixel[ 3 ] !== 0) {
        return true;
      }
    }

    return false;
  }

  // 檢測碰撞
  function checkCollision() {
    // 鳥的位置和大小
    const birdX = bird.x + bird.width / 2;
    const birdY = bird.y + bird.height / 2;
    const birdRadius = bird.width / 2;

    // 檢測與邊界的碰撞
    if (birdY - birdRadius < 0 || birdY + birdRadius > canvas.height) {
      return true;
    }

    // 檢測與管道的碰撞
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[ i ];

      // 管道的上下邊界
      const top = p.topHeight;
      const bottom = p.topHeight + pipeGap;

      if (birdX + birdRadius > p.x && birdX - birdRadius < p.x + pipeWidth) {
        if (birdY - birdRadius < top || birdY + birdRadius > bottom) {
          return true;
        }
      }
    }

    return false;
  }

  // 鳥的類
  class Bird {
    constructor() {
      this.x = birdX;
      this.y = birdY;
      this.width = birdWidth;
      this.height = birdHeight;
      this.speed = birdSpeed;
      this.jump = birdJump;
      this.gravity = birdGravity;
    }

    // 更新鳥的狀態
    update() {
      this.speed += this.gravity;
      this.y += this.speed;
    }

    // 繪製鳥
    draw() {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // 處理鳥的跳躍事件
    flap() {
      this.speed = this.jump;
    }

    reset() {
      this.x = birdX;
      this.y = birdY;
      this.speed = birdSpeed;
    }
  }

  class Pipe {
    constructor() {
      this.x = canvas.width;
      this.topHeight = Math.floor(
        Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight
      );
      this.bottomHeight = canvas.height - this.topHeight - pipeGap;
      this.passed = false; // 是否已經通過了該管道
    }

    // 更新管道狀態
    update() {
      this.x -= pipeSpeed;

      // 檢查是否被通過
      if (!this.passed && birdX >= this.x + pipeWidth) {
        this.passed = true;
        score++;
      }
    }

    // 繪製管道
    draw() {
      ctx.fillStyle = 'green';
      ctx.fillRect(this.x, 0, pipeWidth, this.topHeight);
      ctx.fillRect(this.x, canvas.height - this.bottomHeight, pipeWidth, this.bottomHeight);
    }

    // 檢查是否超出畫面
    isOutOfCanvas() {
      return this.x + pipeWidth < 0;
    }

    // 檢查是否通過了通道
    isPassed() {
      if (this.passed) {
        // 如果已經通過，則不再計算分數
        return false;
      }

      if (this.x + pipeWidth < birdX) {
        // 如果鳥已經飛過了這個管道，則標記為已通過，並回傳 true
        this.passed = true;
        return true;
      }

      return false;
    }
  }

  // 生成管道
  function spawnPipe() {
    const p = new Pipe();
    pipes.push(p);
  }

  // 移除管道
  function removePipe() {
    pipes = pipes.filter((p) => !p.isOutOfCanvas());
  }

  // 繪製遊戲畫面
  function drawGame() {
    // 繪製背景
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製鳥
    bird.draw();

    // 繪製管道
    pipes.forEach((p) => p.draw());

    // 繪製分數
    updateScore();

    // 繪製按鈕
    if (gameState === 'ready') {
      // 繪製開始按鈕
      drawButton(
        startButton.text,
        startButton.x,
        startButton.y,
        startButton.width,
        startButton.height,
        () => {
          gameState = 'playing';
        }
      );
    } else if (gameState === 'gameover') {
      // 繪製重新開始按鈕
      drawButton(
        restartButton.text,
        restartButton.x,
        restartButton.y,
        restartButton.width,
        restartButton.height,
        () => {
          gameState = 'ready';
          score = 0;
          bird.reset();
          pipes = [];
        }
      );
    }

    // 如果遊戲狀態為 'gameover'，顯示遊戲結束畫面
    if (gameState === 'gameover') {
      ctx.fillStyle = '#00000080';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2 - 20);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Your Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 20);

      drawButton(
        restartButton.text,
        restartButton.x,
        restartButton.y,
        restartButton.width,
        restartButton.height,
        () => {
          gameState = 'ready';
          score = 0;
          bird.reset();
          pipes = [];
        }
      );
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      bird.flap();
    }
  });

  // 更新遊戲狀態
  function updateGame() {
    // 判斷鳥是否離開畫面
    if (bird.y < 0 || bird.y + bird.height > canvas.height) {
      gameState = 'gameover';
    }

    // 更新鳥的狀態
    bird.update();
    // 更新管道的狀態
    pipes.forEach((p) => p.update());

    // 移除已經超過畫面的管道
    removePipe();

    // 生成新的管道
    if (frames % pipeSpawnRate === 0) {
      spawnPipe();
    }

    // 檢查是否通過了通道
    pipes.forEach((p) => {
      if (p.isPassed()) {
        score++;
      }
    });

    // 檢查碰撞
    let hasCollided = false;
    if (checkCollision()) {
      hasCollided = true;
    }

    if (birdY < 0 || birdY + birdHeight > canvas.height || hasCollided) {
      gameState = 'gameover';
    }

    // 檢查遊戲狀態
    if (gameState === 'ready') {
      drawButton('Start', canvas.offsetWidth / 2, canvas.offsetHeight / 2, 100, 50);
    } else if (gameState === 'playing') {
      drawGame();
    } else if (gameState === 'gameover') {
      drawGame();
      drawButton('ReStart', canvas.offsetWidth / 2, canvas.offsetHeight / 2, 100, 50);
    }
  }

  function gameLoop() {
    frames++;

    // 根據遊戲狀態處理要執行的動作
    if (gameState === 'ready') {
      // 用戶輸入處理
      canvas.addEventListener('click', () => {
        if (gameState === 'ready') {
          gameState = 'playing';
        } else if (gameState === 'gameover') {
          gameState = 'ready';
          score = 0;
          bird.reset();
          pipes = [];
        }
      });
    } else if (gameState === 'playing') {
      // 更新遊戲狀態
      updateGame();
    } else if (gameState === 'gameover') {
      // 用戶輸入處理
      canvas.addEventListener(
        'click',
        function onClick() {
          gameState = 'ready';
          score = 0;
          bird.reset();
          pipes = [];

          // 當遊戲開始移除事件監聽
          canvas.removeEventListener('click', onClick);

          // 重新產生遊戲開始按鈕
          drawButton('Start', canvas.width / 2, canvas.height / 2, 100, 50, function () {
            gameState = 'playing';
          });
        },
        {once: true}
      );
    }

    // 繪製遊戲畫面
    drawGame();

    // 循環遊戲用的循環函數
    requestAnimationFrame(gameLoop);
  }

  // 初始化遊戲
  function initGame() {
    // 創建鳥的實體
    bird = new Bird();
    // 綁定遊戲循環函數
    requestAnimationFrame(gameLoop);
  }

  initGame();
});