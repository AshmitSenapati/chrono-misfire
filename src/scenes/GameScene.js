import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.timeScale = 1.0;
    this.minTimeScale = 0.6;
    this.maxTimeScale = 4.0;

    this.correctHitDelta = -0.15;
    this.wrongHitDelta = +0.25;
    this.missDelta = +0.15;

    this.surviveTime = 60; // seconds to win
    this.elapsed = 0;

    this.spawnBaseDelay = 900; // ms
    this.spawnTimer = 0;

    this.gameOver = false;
  }

  create() {
    const { width, height } = this.scale;

    // ===== Background grid (simple)
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0f1a);

    // ===== Instructions
    this.helpText = this.add
      .text(
        16,
        12,
        "Chrono Misfire\nShoot ✔ targets. Avoid ✖.\nCorrect = slows time | Wrong/Miss = speeds time\nR = Restart",
        { fontSize: "16px", color: "#cbd5e1" }
      )
      .setDepth(10);

    // ===== UI
    this.timeScaleText = this.add
      .text(16, 120, "Time: 1.00x", { fontSize: "18px", color: "#e2e8f0" })
      .setDepth(10);

    this.timerText = this.add
      .text(16, 150, "Survive: 60s", { fontSize: "18px", color: "#e2e8f0" })
      .setDepth(10);

    this.statusText = this.add
      .text(width / 2, height / 2, "", {
        fontSize: "42px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(20);

    // ===== Player "gun" cursor indicator
    this.crosshair = this.add.circle(width / 2, height / 2, 6, 0xffffff).setDepth(10);

    // ===== Bullets
    this.bullets = this.physics.add.group({
      defaultKey: null,
      maxSize: 30
    });

    // ===== Targets
    this.targets = this.physics.add.group();

    // ===== Input
    this.input.on("pointermove", (pointer) => {
      this.crosshair.setPosition(pointer.x, pointer.y);
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.gameOver) return;
      this.shoot(pointer.x, pointer.y);
    });

    this.input.keyboard.on("keydown-R", () => {
      this.scene.restart();
    });

    // ===== Collisions
    this.physics.add.overlap(this.bullets, this.targets, (bullet, target) => {
      this.onBulletHitTarget(bullet, target);
    });

    // Spawn first wave quickly
    this.spawnTarget();
    this.spawnTarget();
  }

  shoot(x, y) {
    const { width, height } = this.scale;

    // Spawn bullet from bottom center
    const startX = width / 2;
    const startY = height - 40;

    const bullet = this.add.circle(startX, startY, 5, 0xffffff);
    this.physics.add.existing(bullet);
    bullet.body.setCircle(5);
    bullet.body.setAllowGravity(false);

    this.bullets.add(bullet);

    // Velocity toward mouse
    const dir = new Phaser.Math.Vector2(x - startX, y - startY).normalize();
    const speed = 700;
    bullet.body.setVelocity(dir.x * speed, dir.y * speed);

    // Bullet lifetime
    this.time.delayedCall(900, () => {
      if (!bullet.active) return;
      bullet.destroy();

      // If bullet expired without hitting a target => miss penalty
      this.applyTimeChange(this.missDelta);
    });
  }

  spawnTarget() {
    const { width, height } = this.scale;

    // Random correct/wrong
    const isCorrect = Math.random() < 0.65;

    const x = Phaser.Math.Between(80, width - 80);
    const y = Phaser.Math.Between(90, height - 200);

    const color = isCorrect ? 0x22c55e : 0xef4444;

    const target = this.add.circle(x, y, 22, color);
    this.physics.add.existing(target);
    target.body.setCircle(22);
    target.body.setAllowGravity(false);
    target.body.setImmovable(true);

    // Custom data
    target.isCorrect = isCorrect;

    // Label ✔ / ✖
    const label = this.add
      .text(x, y, isCorrect ? "✔" : "✖", {
        fontSize: "22px",
        color: "#0b0f1a",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    target.label = label;

    // Small movement (increases with timeScale)
    const vx = Phaser.Math.Between(-120, 120);
    const vy = Phaser.Math.Between(-80, 80);
    target.body.setVelocity(vx, vy);

    // Bounce inside bounds
    target.body.setCollideWorldBounds(true);
    target.body.setBounce(1, 1);

    this.targets.add(target);

    // Auto-despawn (forces pressure)
    this.time.delayedCall(2200, () => {
      if (!target.active) return;
      this.removeTarget(target);
      // Optional: treat as "miss" if correct target escaped
      if (isCorrect) this.applyTimeChange(this.missDelta);
    });
  }

  removeTarget(target) {
    if (target.label) target.label.destroy();
    target.destroy();
  }

  onBulletHitTarget(bullet, target) {
    bullet.destroy();

    // Apply twist
    if (target.isCorrect) {
      this.applyTimeChange(this.correctHitDelta);
    } else {
      this.applyTimeChange(this.wrongHitDelta);
    }

    // Destroy target
    this.removeTarget(target);
  }

  applyTimeChange(delta) {
    this.timeScale = Phaser.Math.Clamp(
      this.timeScale + delta,
      this.minTimeScale,
      this.maxTimeScale
    );

    // Lose condition
    if (this.timeScale >= this.maxTimeScale) {
      this.endGame(false);
    }
  }

  endGame(win) {
    this.gameOver = true;
    this.statusText.setText(win ? "YOU WIN 🎉" : "TIME OVERLOAD 💥");
    this.statusText.setColor(win ? "#22c55e" : "#ef4444");
  }

  update(_, dt) {
    if (this.gameOver) return;

    // Apply time scaling to gameplay
    const scaledDt = dt * this.timeScale;

    // Survival timer
    this.elapsed += scaledDt / 1000;
    const remaining = Math.max(0, this.surviveTime - this.elapsed);

    if (remaining <= 0) {
      this.endGame(true);
    }

    // Spawn logic scales with timeScale (harder when faster)
    this.spawnTimer += scaledDt;

    const dynamicDelay = this.spawnBaseDelay / this.timeScale;
    if (this.spawnTimer >= dynamicDelay) {
      this.spawnTimer = 0;
      this.spawnTarget();
    }

    // Update UI
    this.timeScaleText.setText(`Time: ${this.timeScale.toFixed(2)}x`);
    this.timerText.setText(`Survive: ${Math.ceil(remaining)}s`);

    // Keep target labels aligned
    this.targets.getChildren().forEach((t) => {
      if (t.label) t.label.setPosition(t.x, t.y);
    });
  }
}
