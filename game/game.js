const MS_PER_FRAME = 30;

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Game state
    this.isRunning = false;
    this.requestedRedraw = null;

    // Canvas dimensions
    this.width = 800;
    this.height = 600;

    // Scene management
    this.scene = "level"; // comic|menus|level

    // Input handling
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      clicked: false,
    };

    // Initialize modules
    this.levelManager = new LevelManager(this, CURRENT_LEVEL);

    this.assetsPreloaded = false;
    this.loadedImages = new Map();

    this.fontsLoaded = false;
    this.init();
  }

  init() {
    // Set canvas size
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.setupEventListeners();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textRendering = "geometricPrecision";

    console.log("Game initialized");
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener("keydown", (e) => {
      if (this.handleKeyPress(e.code)) {
        e.preventDefault();
      }
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener("click", (e) => {
      this.mouse.clicked = true;
      this.handleMouseClick(this.mouse.x, this.mouse.y);
      e.preventDefault();
    });

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.render(); // Initial render
      console.log("Game started");

      this.preloadImages().then(() => {
        this.assetsPreloaded = true;
        this.requestRedraw();
      });

      this.preloadFonts().then(() => {
        this.fontsLoaded = true;
        this.requestRedraw();
      });
    }
  }

  requestRedraw() {
    if (this.isRunning) {
      if (this.requestedRedraw) clearTimeout(this.requestedRedraw);
      this.requestedRedraw = setTimeout(() => {
        this.render();
      }, MS_PER_FRAME);
    }
  }

  // Handle key presses based on current scene
  handleKeyPress(keyCode) {
    switch (this.scene) {
      case "level":
        if (!this.levelManager.handleInput(keyCode)) return false;
        break;
    }

    this.requestRedraw();
  }

  // Handle minimal mouse input (mainly for UI buttons)
  handleMouseClick(x, y) {
    this.requestRedraw();
  }

  render() {
    if (!this.assetsPreloaded) return;
    if (!this.fontsLoaded) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Set default styles
    this.ctx.fillStyle = "#fff";
    this.ctx.strokeStyle = "#fff";
    this.ctx.font = "16px Courier New";

    let anotherRender = false;

    // Render based on current scene
    switch (this.scene) {
      case "level":
        anotherRender = this.levelManager.renderGame(this.ctx);
        break;
    }

    if (anotherRender) {
      this.requestRedraw();
    }
  }

  async loadImage(src) {
    if (this.loadedImages.has(src)) {
      return this.loadedImages.get(src);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Preload multiple images
  async preloadImages() {
    try {
      await Promise.all(
        _flatten(SPRITESHEETS).map((path) => this.loadImage(path))
      );
      console.log("All images preloaded");
    } catch (error) {
      console.error("Error preloading images:", error);
    }
  }

  async preloadFonts() {
    try {
      await Promise.all(
        FONTS.map(([fontName, weights]) =>
          Promise.all(
            weights.map((weight) =>
              document.fonts.load(`${weight} 12px ${fontName}`)
            )
          )
        )
      );
      console.log("All fonts preloaded");
    } catch (error) {
      console.error("Error preloading fonts:", error);
    }
  }

  // Draw image utility
  drawImage(src, x, y, width = null, height = null, clip = {}) {
    const { x: clipX, y: clipY, width: clipWidth, height: clipHeight } = clip;
    const img = this.loadedImages.get(src);
    if (!img) {
      console.warn(`Image not loaded: ${src}`);
      return;
    }

    if (Object.keys(clip).length > 0) {
      this.ctx.drawImage(
        img,
        clipX,
        clipY,
        clipWidth,
        clipHeight,
        x,
        y,
        width,
        height
      );
    } else if (width && height) {
      this.ctx.drawImage(img, x, y, width, height);
    } else {
      this.ctx.drawImage(img, x, y);
    }
  }

  // Utility methods

  DRAW_PARAMS = {
    fill: "#fff",
    stroke: "#000",
    strokeWidth: 0,
  };

  getDrawParams(params = {}) {
    const result = {
      ...this.DRAW_PARAMS,
      ...params,
    };

    result.filled = !!result.fill;

    return result;
  }

  drawText(text, x, y, options = {}) {
    const {
      color = "#fff",
      font = "16px Courier New",
      align = "left",
      baseline = "top",
      lineSpacing = Number(font.match(/(\d+)px/)[1] || 16),
    } = options;

    if (typeof text === "object") {
      for (const line of text) {
        y = this.drawText(line, x, y, {
          ...options,
          lineSpacing: lineSpacing,
        });
      }
      return y;
    } else {
      this.ctx.fillStyle = color;
      this.ctx.font = font;
      this.ctx.textAlign = align;
      this.ctx.textBaseline = baseline;
      this.ctx.fillText(text, x, y);

      return y + lineSpacing;
    }
  }

  drawRect(x, y, width, height, params = {}) {
    const { fill, stroke, strokeWidth, filled } = this.getDrawParams(params);

    this.ctx.strokeStyle = stroke;
    this.ctx.fillStyle = fill;
    this.ctx.lineWidth = strokeWidth;

    if (filled) this.ctx.fillRect(x, y, width, height);
    if (strokeWidth) this.ctx.strokeRect(x, y, width, height);
  }

  drawPath(path, params = {}) {
    const { fill, stroke, strokeWidth, filled } = this.getDrawParams(params);

    this.ctx.strokeStyle = stroke;
    this.ctx.fillStyle = fill;
    this.ctx.lineWidth = strokeWidth;

    if (filled) this.ctx.fill(path);
    if (strokeWidth) this.ctx.stroke(path);
  }
}

// Initialize and start the game when the page loads
window.addEventListener("load", () => {
  const game = new Game();
  game.start();
});
