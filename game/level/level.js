const MOVE_ANIM_DUR = 4;

const SQUARE_SIZE = 48;
const SNAKE_TIMER = 3;
const DEST_HUE = -140;

class LevelManager {
  constructor(game, levelState) {
    this.game = game;
    this.history = new LevelHistory(levelState);
    this.frameCount = 0;
    this.animations = [];

    this.yelling = false;

    const { width, height } = this.game;
    const levelOffsetX = (width - levelState.cols * SQUARE_SIZE) / 2;
    const levelOffsetY = (height - levelState.rows * SQUARE_SIZE) / 2;

    this.pos = new Position(levelOffsetX, levelOffsetY);
  }

  get state() {
    return this.history.getCurrent();
  }

  handleInput(keyCode) {
    if (this.yelling) return false;

    switch (keyCode) {
      case "KeyZ":
        this.history.pop();
        return true;
      case "KeyR":
        this.restartLevel();
        return true;
    }

    if (this.state.gameOver) return false;

    switch (keyCode) {
      case "ArrowUp":
      case "KeyW":
        this.history.copyTop();
        if (!this.makeMove(Direction.UP)) this.history.pop();
        return true;
        break;
      case "ArrowDown":
      case "KeyS":
        this.history.copyTop();
        if (!this.makeMove(Direction.DOWN)) this.history.pop();
        return true;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.history.copyTop();
        if (!this.makeMove(Direction.LEFT)) this.history.pop();
        return true;
        break;
      case "ArrowRight":
      case "KeyD":
        this.history.copyTop();
        if (!this.makeMove(Direction.RIGHT)) this.history.pop();
        return true;
        break;
      case "Space":
        this.history.copyTop();
        this.yellAtSnake();
        return true;
        break;
      case "Escape":
        this.returnToZone(false);
        return true;
        break;
      default:
        // return false so it's not prevented
        return false;
    }
  }

  snakeHeadMoveCheck(newTail) {
    const snakeHead = this.state.snek[0];
    // can move forward?
    let ok = this.getMoveCollide(
      snakeHead.x,
      snakeHead.y,
      getDirVec(snakeHead.direction),
      {
        crate: true,
        snake: true,
      }
    );
    if (!ok || ok == newTail) return true;
    // snake turn right
    snakeHead.direction = rotCw(snakeHead.direction);
    ok = this.getMoveCollide(
      snakeHead.x,
      snakeHead.y,
      getDirVec(snakeHead.direction),
      {
        crate: true,
        snake: true,
      }
    );
    if (!ok || ok == newTail) return true;
    // snake turn left
    snakeHead.direction = oppositeDirection(snakeHead.direction);
    ok = this.getMoveCollide(
      snakeHead.x,
      snakeHead.y,
      getDirVec(snakeHead.direction),
      {
        crate: true,
        snake: true,
      }
    );
    if (!ok || ok == newTail) return true;
    // snake ded
    return false;
  }

  gameTick() {
    this.state.snakeTimer = (this.state.snakeTimer + 1) % SNAKE_TIMER;

    if (this.state.snakeTimer == 0) {
      const snakeTail = this.state.snek.pop();

      const snakeNewTail = this.state.snek.pop();
      this.state.snek.push(snakeNewTail);

      this.yelling = false;
      // SNAKE MOVES
      const exceptions = this.state.ouroborosMode ? snakeNewTail : undefined;
      if (!this.snakeHeadMoveCheck(exceptions)) {
        this.state.gameOver = true;
        this.state.gameOverMessage = "SNAKE'S DEAD";
        return;
      }

      this.state.snek[0].head = false;
      const newHead = this.state.snek[0].clone();
      newHead.head = true;
      this.tryMove(newHead, getDirVec(newHead.direction));

      this.state.snek.splice(0, 0, newHead);

      const eatApple = this.state.apples.find(
        (apple) => apple.x == newHead.x && apple.y == newHead.y
      );
      if (eatApple) {
        this.state.apples = this.state.apples.filter(
          (apple) => apple.x != newHead.x || apple.y != newHead.y
        );
        this.state.snek.push(snakeTail);
      }

      if (newHead.equals(this.state.player)) {
        this.state.gameOver = true;
        this.state.gameOverMessage = "YA GOT EATEN, YA DINGUS";
        return;
      }

      if(newHead.equals(snakeNewTail)) {
        this.state.gameOver = true;
        this.state.gameOverMessage = "OUROBOROS";
      }

      if (this.state.ouroborosMode && newHead.equals()) {
        this.state.gameOver = true;
        this.state.gameOverMessage = "YA GOT EATEN, YA DINGUS";
        return;
      }
    }
  }

  renderGame() {
    const { width, height } = this.game;

    this.frameCount++;
    let anotherRender = false;

    // Game area background
    this.game.drawRect(0, 0, width, height, { fill: "#444444" });

    this.game.drawImage(
      ASSETS.SPRITE.PLAYER.sheet,
      this.pos.x + this.state.player.x * SQUARE_SIZE,
      this.pos.y + this.state.player.y * SQUARE_SIZE,
      SQUARE_SIZE,
      SQUARE_SIZE,
      {
        x: ASSETS.SPRITE.PLAYER.x,
        y: ASSETS.SPRITE.PLAYER.y,
        width: ASSETS.SPRITE.PLAYER.width,
        height: ASSETS.SPRITE.PLAYER.height,
      }
    );

    this.game.ctx.save();

    this.state.snek.forEach((seg, idx, arr) => {
      this.renderSnakeBody(seg, idx, arr);
    });
    // re-draw the head so it stacks over the tail
    this.renderSnakeBody(this.state.snek[0], 0, this.state.snek);

    this.game.ctx.filter = undefined;

    this.state.crates.forEach((crate) => {
      this.game.drawImage(
        ASSETS.SPRITE.CRATE.sheet,
        this.pos.x + crate.x * SQUARE_SIZE,
        this.pos.y + crate.y * SQUARE_SIZE,
        SQUARE_SIZE,
        SQUARE_SIZE,
        {
          x: ASSETS.SPRITE.CRATE.x,
          y: ASSETS.SPRITE.CRATE.y,
          width: ASSETS.SPRITE.CRATE.width,
          height: ASSETS.SPRITE.CRATE.height,
        }
      );
    });

    this.state.blocks.forEach((block) => {
      this.game.drawImage(
        ASSETS.SPRITE.BLOCK.sheet,
        this.pos.x + block.x * SQUARE_SIZE,
        this.pos.y + block.y * SQUARE_SIZE,
        SQUARE_SIZE,
        SQUARE_SIZE,
        {
          x: ASSETS.SPRITE.BLOCK.x,
          y: ASSETS.SPRITE.BLOCK.y,
          width: ASSETS.SPRITE.BLOCK.width,
          height: ASSETS.SPRITE.BLOCK.height,
        }
      );
    });

    this.state.apples.forEach((apple) => {
      this.game.drawImage(
        ASSETS.SPRITE.APPLE.sheet,
        this.pos.x + apple.x * SQUARE_SIZE,
        this.pos.y + apple.y * SQUARE_SIZE,
        SQUARE_SIZE,
        SQUARE_SIZE,
        {
          x: ASSETS.SPRITE.APPLE.x,
          y: ASSETS.SPRITE.APPLE.y,
          width: ASSETS.SPRITE.APPLE.width,
          height: ASSETS.SPRITE.APPLE.height,
        }
      );
    });

    anotherRender = anotherRender || this.animations.length > 0;
    this.animations.forEach((anim) => anim.tick(this.game));
    this.animations = this.animations.filter((anim) => !anim.finished);

    if (this.state.gameOver) {
      this.game.drawText(
        this.state.gameOverMessage,
        width / 2,
        height / 2 - 30,
        {
          color: "#FFFFFF",
          font: "64px Tiny5",
          align: "center",
        }
      );

      this.game.drawText(
        "Press Z to undo or R to restart",
        width / 2,
        height / 2 + 30,
        {
          color: "#FFFFFF",
          font: "24px Tiny5",
          align: "center",
        }
      );
    }

    this.game.drawText(
      `SNAKE MOVES IN ${SNAKE_TIMER - this.state.snakeTimer}`,
      20,
      20,
      {
        color: "#FFFFFF",
        font: "24px Tiny5",
      }
    );

    if (this.state.ouroborosMode) {
      this.game.drawText("all apples eaten", width / 2, 30, {
        color: "#FFFFFF",
        font: "24px Tiny5",
        align: "center",
      });
      if (this.frameCount % 30 < 15) {
        this.game.drawText("IT'S OUROBOROS TIME", width / 2, 54, {
          color: `hsl(${Math.floor(this.frameCount / 30) * 30}, 100%, 50%)`,
          font: "32px Tiny5",
          align: "center",
        });
      }

      anotherRender = true;
    }

    if (this.yelling) {
      // uhh maybe this isnt tbe best but idk whatever man
      if (this.frameCount % 7 == 0) {
        this.gameTick();
      }
      anotherRender = true;
    }

    return anotherRender;
  }

  renderSnakeBody(seg, idx, arr) {
    this.game.ctx.save();
    this.game.ctx.translate(
      this.pos.x + (seg.x + 0.5) * SQUARE_SIZE,
      this.pos.y + (seg.y + 0.5) * SQUARE_SIZE
    );

    let bodyPart = ASSETS.SPRITE.SNEK.body;
    if (seg.head) bodyPart = ASSETS.SPRITE.SNEK.head;
    else if (idx === arr.length - 1) bodyPart = ASSETS.SPRITE.SNEK.tail;
    else if (seg.direction !== arr[idx + 1].direction) {
      bodyPart = ASSETS.SPRITE.SNEK.curve;
    }

    if (bodyPart == ASSETS.SPRITE.SNEK.curve) {
      const prevDir = arr[idx + 1].direction;
      const nowDir = seg.direction;

      if (rotCcw(prevDir) == nowDir) {
        this.game.ctx.rotate(rotationFromRight(prevDir) * Math.PI);
      } else {
        this.game.ctx.rotate((rotationFromRight(prevDir) + 1) * Math.PI);
        this.game.ctx.scale(-1, 1);
      }
    } else {
      this.game.ctx.rotate(rotationFromRight(seg.direction) * Math.PI);
    }

    this.game.ctx.filter = `hue-rotate(${
      DEST_HUE * (this.state.snakeTimer / SNAKE_TIMER)
    }deg)`;

    this.game.drawImage(
      bodyPart.sheet,
      -SQUARE_SIZE / 2,
      -SQUARE_SIZE / 2,
      SQUARE_SIZE,
      SQUARE_SIZE,
      {
        x: bodyPart.x,
        y: bodyPart.y,
        width: bodyPart.width,
        height: bodyPart.height,
      }
    );
    this.game.ctx.restore();
  }

  getMoveCollide(
    srcX,
    srcY,
    { x: moveX, y: moveY },
    collides = { crate: false, snake: false }
  ) {
    const newX = srcX + moveX;
    const newY = srcY + moveY;
    if (
      newX < 0 ||
      newX >= this.state.cols ||
      newY < 0 ||
      newY >= this.state.rows
    ) {
      return "out";
    }
    const findBlock = this.state.blocks.find(
      (block) => block.x === newX && block.y === newY
    );
    if (findBlock) return findBlock;
    const findCrate = this.state.crates.find(
      (crate) => crate.x === newX && crate.y === newY
    );
    if (collides.crate && findCrate) return findCrate;
    const findSnake = this.state.snek.find(
      (snek) => snek.x === newX && snek.y === newY
    );
    if (collides.snake && findSnake) return findSnake;
    return false;
  }

  tryMove(src, dirVec, checks) {
    const { x: moveX, y: moveY } = dirVec;
    if (this.getMoveCollide(src.x, src.y, dirVec, checks)) return false;
    src.x += moveX;
    src.y += moveY;
    return true;
  }

  makeMove(direction) {
    if (this.levelIsDone) return;
    const originalPlayer = this.state.player.clone();
    const dirVec = getDirVec(direction);
    const ok = this.tryMove(this.state.player, dirVec, { snake: true });
    if (!ok) return false;

    const crate = this.state.crates.find(
      (crate) =>
        crate.x === this.state.player.x && crate.y === this.state.player.y
    );
    if (crate) {
      const ok = this.tryMove(crate, dirVec, { snake: true });
      if (!ok) {
        this.state.player = originalPlayer;
        return false;
      }
    }

    this.gameTick();
    this.checkLevelStatus();
    return true;
  }

  yellAtSnake() {
    this.animations.push(
      new EtherealAnimation(
        this.pos.x + (this.state.player.x + 0.5) * SQUARE_SIZE,
        this.pos.y + (this.state.player.y + 0.5) * SQUARE_SIZE,
        ASSETS.SPRITE.PLAYER,
        1.5 * SQUARE_SIZE
      )
    );
    this.yelling = true;
    const snakeHead = this.state.snek[0];
    const snakeLeft = rotCcw(snakeHead.direction);
    const snakeRight = rotCw(snakeHead.direction);
    if (this.state.player.equals(snakeHead.add(getDirVec(snakeLeft)))) {
      snakeHead.direction = snakeRight;
    } else if (this.state.player.equals(snakeHead.add(getDirVec(snakeRight)))) {
      snakeHead.direction = snakeLeft;
    }
    this.makeMove(Direction.SLEEP);
  }

  // Check if level is completed, failed, etc.
  checkLevelStatus() {
    // if (this.state.gobbos.length === 0) {
    // this.levelIsDone = true;
    // }
  }

  checkLevelDone() {
    if (
      this.levelIsDone &&
      !this.levelIsTransitioning &&
      this.animations.length === 0
    ) {
      this.levelIsTransitioning = true;
      this.returnToZone(true);
    }
  }

  restartLevel() {
    this.state.turnCount = 0;
    this.canHandleInput = false;
    this.restartHeldSince = null;
    this.history.reset();
  }
}
