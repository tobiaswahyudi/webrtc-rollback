const THUNK = () => {};

const Direction = {
  UP: "u",
  DOWN: "d",
  LEFT: "l",
  RIGHT: "r",
  SLEEP: "s",
};

class Position {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  toString() {
    return strPosition(this.x, this.y);
  }

  clone() {
    return new Position(this.x, this.y);
  }

  add(other) {
    if (!other) return this.clone();
    return new Position(this.x + other.x, this.y + other.y);
  }

  negate() {
    return this.clone().scale(-1);
  }

  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  randomize() {
    this.x = Math.random() * 2 - 1;
    this.y = Math.random() * 2 - 1;
    return this;
  }

  normalize() {
    const len = Math.hypot(this.x, this.y);
    this.x /= len;
    this.y /= len;
    return this;
  }

  scale(factor) {
    this.x *= factor;
    this.y *= factor;
    return this;
  }
}

const rotationFromRight = (direction) => {
  switch (direction) {
    case Direction.UP:
      return 1.5;
    case Direction.RIGHT:
      return 0;
    case Direction.DOWN:
      return 0.5;
    case Direction.LEFT:
      return 1;
  }
  return 0;
};

const rotCw = (direction) => {
  switch (direction) {
    case Direction.UP:
      return Direction.RIGHT;
    case Direction.RIGHT:
      return Direction.DOWN;
    case Direction.DOWN:
      return Direction.LEFT;
    case Direction.LEFT:
      return Direction.UP;
  }
  return direction;
};

const oppositeDirection = (direction) => {
  switch (direction) {
    case Direction.UP:
      return Direction.DOWN;
    case Direction.DOWN:
      return Direction.UP;
    case Direction.LEFT:
      return Direction.RIGHT;
    case Direction.RIGHT:
      return Direction.LEFT;
  }
  return direction;
};

const rotCcw = (direction) => {
  return rotCw(oppositeDirection(direction));
};

const getDirVec = (direction) => {
  switch (direction) {
    case Direction.UP:
      return new Position(0, -1);
    case Direction.DOWN:
      return new Position(0, 1);
    case Direction.LEFT:
      return new Position(-1, 0);
    case Direction.RIGHT:
      return new Position(1, 0);
  }
  return new Position(0, 0);
};

const strPosition = (x, y) => `${x},${y}`;
