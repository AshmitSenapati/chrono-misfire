import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    // ===== Core Twist: Time changes based on accuracy
    this.timeScale = 1.0;
    this.minTimeScale = 0.6;
    this.maxTimeScale = 4.0;

    // Base deltas
    this.correctHitDelta = -0.15;
    this.wrongHitDelta = +0.25;
    this.missDelta = +0.10; // reduced for fairness

    // Win condition
    this.surviveTime = 60;
    this.elapsed = 0;

    // Spawning
    this.spawnBaseDelay = 900;
    this.spawnTimer = 0;

    // Combo system
    this.combo = 0;
    this.maxComboBonus = 0.18; // extra slow-down at high streaks

    // Waves / progression
    this.wave = 1;
    this.waveThresholds = [0, 15, 30, 45]; // seconds elapsed -> wave changes

    this.gameOver = false;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0f1a);

    // Title + help
    this.add.text(16, 10, "Chrono Misfire", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    });

    this.helpText = this.add.text(
      16,
      40,
      "Shoot ✔ targets | Avoid ✖\nCorrect = slows time | Wrong/Miss = speeds time\nR = Restart",
      { fontSize: "16px", color: "#cbd5e1" }
    );

    // UI
    this.timeScaleText = this.add.text(16, 105, "Time: 1.00x", {
      fontSize: "18px",
      color: "#e2e8f0"
    });

    this.timerText = this.add.text(16, 130, "Survive: 60s", {
      fontSize: "18px",
      color: "#e2e8f0"
    });

    this.waveText = this.add.text(16, 155, "Wave: 1", {
      fontSize: "18px",
      color: "#e2e8f0"
    });

    this.comboText = this.add.text(16, 180, "Combo: 0", {
      fontSize: "18px",
      color: "#e2e8f0"
    });

    // Time bar background
    this.timeBarBg = this.add.rectangle(16, 215, 220, 14, 0x1f2937).setOrigin(0, 0.5);
    this.timeBarFill = this.add.rectangle(16, 215, 220, 14, 0x22c55e).setOrigin(0, 0.5);

    // Status text
    this.statusText = this.add
      .text(width / 2, height / 2, "", {
        fontSize: "44px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(50);

    // Crosshair
    this.crosshair = this.add.circle(width / 2, height / 2, 6, 0xffffff).setDepth(10);

    // Groups
    this.bullets = this.physics.add.group({ maxSize: 40 });
    this.targets = this.physics.add.group();

    // Input
    this.input.on("pointermove", (pointer) => {
      this.crosshair.setPosition(pointer.x, pointer.y);
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.gameOver) return;
      this.shoot(pointer.x, pointer.y);
    });

    this.input.keyboard.on("keydown-M", () => {
    this.scene.start("MenuScene");
    });

    this.input.keyboard.on("keydown-R", () => {
      this.scene.restart();
    });

    // Collision
    this.physics.add.overlap(this.bullets, this.targets, (bullet, target) => {
      this.onBulletHitTarget(bullet, target);
    });

    // Spawn initial targets
    this.spawnTarget();
    this.spawnTarget();
    this.spawnTarget();
  }

  // ===== Shooting
  shoot(x, y) {
    const { width, height } = this.scale;

    this.sound.play("shoot", { volume: 0.35 });

    const startX = width / 2;
    const startY = height - 40;

    const bullet = this.add.circle(startX, startY, 5, 0xffffff);
    this.physics.add.existing(bullet);
    bullet.body.setCircle(5);
    bullet.body.setAllowGravity(false);

    this.bullets.add(bullet);

    const dir = new Phaser.Math.Vector2(x - startX, y - startY).normalize();
    const speed = 720;

    bullet.body.setVelocity(dir.x * speed, dir.y * speed);

    // Lifetime
    this.time.delayedCall(900, () => {
      if (!bullet.active) return;
      bullet.destroy();

      // Miss penalty (small)
      this.onMiss();
    });
  }

  // ===== Targets
  spawnTarget() {
    const { width, height } = this.scale;

    // Wave influences probability and movement
    const correctChance = this.wave === 1 ? 0.75 : this.wave === 2 ? 0.65 : 0.55;
    const isCorrect = Math.random() < correctChance;

    const x = Phaser.Math.Between(90, width - 90);
    const y = Phaser.Math.Between(100, height - 220);

    const color = isCorrect ? 0x22c55e : 0xef4444;

    const target = this.add.circle(x, y, 22, color);
    this.physics.add.existing(target);
    target.body.setCircle(22);
    target.body.setAllowGravity(false);
    target.body.setImmovable(true);

    target.isCorrect = isCorrect;

    const label = this.add
      .text(x, y, isCorrect ? "✔" : "✖", {
        fontSize: "22px",
        color: "#0b0f1a",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    target.label = label;

    // Movement scales by wave + timeScale
    let baseMove = this.wave === 1 ? 60 : this.wave === 2 ? 120 : 170;
    baseMove *= this.timeScale;

    const vx = Phaser.Math.Between(-baseMove, baseMove);
    const vy = Phaser.Math.Between(-baseMove * 0.7, baseMove * 0.7);

    target.body.setVelocity(vx, vy);
    target.body.setCollideWorldBounds(true);
    target.body.setBounce(1, 1);

    this.targets.add(target);

    // Despawn time reduces with waves
    const lifetime = this.wave === 1 ? 2600 : this.wave === 2 ? 2300 : 2000;

    this.time.delayedCall(lifetime, () => {
      if (!target.active) return;

      const wasCorrect = target.isCorrect;
      this.removeTarget(target);

      // Only punish if a correct target escaped
      if (wasCorrect) this.onMiss();
    });
  }

  removeTarget(target) {
    if (target.label) target.label.destroy();
    target.destroy();
  }

  // ===== Hit Logic
  onBulletHitTarget(bullet, target) {
    bullet.destroy();

    if (target.isCorrect) {
      this.onCorrectHit();
    } else {
      this.onWrongHit();
    }

    // Feedback pop
    this.flashAt(target.x, target.y, target.isCorrect);

    this.removeTarget(target);
  }

  onCorrectHit() {
    this.combo += 1;

    this.sound.play("correct", { volume: 0.5 });

    // Combo bonus: more reward for consistent accuracy
    const comboFactor = Phaser.Math.Clamp(this.combo / 10, 0, 1);
    const bonus = comboFactor * this.maxComboBonus;

    this.applyTimeChange(this.correctHitDelta - bonus);
    this.pulseUI(true);
  }

  onWrongHit() {
    this.combo = 0;

    this.sound.play("wrong", { volume: 0.6 });

    this.applyTimeChange(this.wrongHitDelta);
    this.pulseUI(false);
    this.cameras.main.shake(90, 0.006);
  }

  onMiss() {
    this.combo = 0;
    this.applyTimeChange(this.missDelta);
    this.pulseUI(false);
  }

  // ===== Time System
  applyTimeChange(delta) {
    this.timeScale = Phaser.Math.Clamp(
      this.timeScale + delta,
      this.minTimeScale,
      this.maxTimeScale
    );

    if (this.timeScale >= this.maxTimeScale) {
      this.endGame(false);
    }
  }

  // ===== Feedback Helpers
  pulseUI(good) {
    const color = good ? "#22c55e" : "#ef4444";
    this.timeScaleText.setColor(color);
    this.comboText.setColor(color);

    this.time.delayedCall(120, () => {
      if (!this.timeScaleText) return;
      this.timeScaleText.setColor("#e2e8f0");
      this.comboText.setColor("#e2e8f0");
    });
  }

  flashAt(x, y, good) {
    const c = good ? 0x22c55e : 0xef4444;
    const ring = this.add.circle(x, y, 30, c, 0.25).setDepth(30);

    this.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy()
    });
  }

  // ===== End Game
  endGame(win) {
    this.gameOver = true;

    this.sound.play(win ? "win" : "lose", { volume: 0.7 });

    this.statusText.setText(win ? "YOU WIN 🎉" : "TIME OVERLOAD 💥");
    this.statusText.setColor(win ? "#22c55e" : "#ef4444");

    this.add
  .text(this.scale.width / 2, this.scale.height / 2 + 90, "Click to go to Menu", {
    fontSize: "18px",
    color: "#cbd5e1"
  })
  .setOrigin(0.5)
  .setDepth(50);

    this.input.once("pointerdown", () => {
    this.scene.start("MenuScene");
    });

  }

  // ===== Update Loop
  update(_, dt) {
    if (this.gameOver) return;

    // Scale gameplay time
    const scaledDt = dt * this.timeScale;

    // Update survival timer
    this.elapsed += scaledDt / 1000;
    const remaining = Math.max(0, this.surviveTime - this.elapsed);

    if (remaining <= 0) {
      this.endGame(true);
      return;
    }

    // Update wave based on elapsed time
    const e = this.elapsed;
    if (e >= this.waveThresholds[3]) this.wave = 4;
    else if (e >= this.waveThresholds[2]) this.wave = 3;
    else if (e >= this.waveThresholds[1]) this.wave = 2;
    else this.wave = 1;

    // Spawn rate increases as time gets faster + later waves
    this.spawnTimer += scaledDt;

    const waveFactor = this.wave === 1 ? 1.0 : this.wave === 2 ? 0.85 : this.wave === 3 ? 0.72 : 0.62;
    const dynamicDelay = (this.spawnBaseDelay * waveFactor) / this.timeScale;

    if (this.spawnTimer >= dynamicDelay) {
      this.spawnTimer = 0;
      this.spawnTarget();
    }

    // Keep labels aligned
    this.targets.getChildren().forEach((t) => {
      if (t.label) t.label.setPosition(t.x, t.y);
    });

    // UI update
    this.timeScaleText.setText(`Time: ${this.timeScale.toFixed(2)}x`);
    this.timerText.setText(`Survive: ${Math.ceil(remaining)}s`);
    this.waveText.setText(`Wave: ${this.wave}`);
    this.comboText.setText(`Combo: ${this.combo}`);

    // Time bar fill (green -> red as time increases)
    const pct = (this.timeScale - this.minTimeScale) / (this.maxTimeScale - this.minTimeScale);
    const w = Phaser.Math.Clamp(220 * (1 - pct), 0, 220);
    this.timeBarFill.width = w;

    // Change bar color based on danger
    if (pct < 0.35) this.timeBarFill.fillColor = 0x22c55e;
    else if (pct < 0.7) this.timeBarFill.fillColor = 0xf59e0b;
    else this.timeBarFill.fillColor = 0xef4444;
  }
}
