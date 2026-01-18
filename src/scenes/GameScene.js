import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init() {
    // ===== Difficulty (UNCHANGED)
    this.timeScale = 1.0;
    this.minTimeScale = 1.0;
    this.maxTimeScale = 6.0;

    this.correctHitDelta = -0.20;
    this.wrongHitDelta = +0.30;
    this.missDelta = +0.10;

    // Win condition
    this.surviveTime = 60;
    this.elapsed = 0;

    // Runner
    this.baseRunSpeed = 220;
    this.groundY = 430;

    // Target spawning
    this.spawnBaseDelay = 850;
    this.spawnTimer = 0;

    // Combo
    this.combo = 0;
    this.maxComboBonus = 0.25;

    // Waves
    this.wave = 1;
    this.waveThresholds = [0, 15, 30, 45];

    // Ammo system
    this.maxAmmo = 8;
    this.ammo = this.maxAmmo;
    this.reloadTimeMs = 900;
    this.reloading = false;

    // Gates
    this.gateSpawnTimer = 0;
    this.gateBaseDelay = 3200;

    // Game state
    this.gameOver = false;
  }

  create() {
    const { width, height } = this.scale;

    // ===== Parallax background (simple)
    this.bgGraphics1 = this.add.graphics();
    this.bgGraphics2 = this.add.graphics();
    this.drawBackground();

    // Ground line
    this.add.rectangle(width / 2, this.groundY + 30, width, 4, 0x334155);

    // ===== UI
    this.add.text(16, 10, "Chrono Misfire: Runner Mode", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    });

    this.add.text(
      16,
      40,
      "Auto-run → Shoot ✔ targets | Avoid ✖\nCorrect slows time | Wrong/Miss speeds time\nR Restart | M Menu | Space Reload",
      { fontSize: "16px", color: "#cbd5e1" }
    );

    this.timeScaleText = this.add.text(16, 105, "Speed: 2.00x", {
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

    this.ammoText = this.add.text(16, 205, `Ammo: ${this.ammo}/${this.maxAmmo}`, {
      fontSize: "18px",
      color: "#e2e8f0"
    });

    this.timeBarBg = this.add.rectangle(16, 235, 220, 14, 0x1f2937).setOrigin(0, 0.5);
    this.timeBarFill = this.add.rectangle(16, 235, 220, 14, 0x22c55e).setOrigin(0, 0.5);

    this.statusText = this.add
      .text(width / 2, height / 2, "", {
        fontSize: "44px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(200);

    // ===== Player
    this.player = this.add.rectangle(140, this.groundY, 42, 58, 0x60a5fa);
    this.physics.add.existing(this.player);
    this.player.body.setAllowGravity(false);
    this.player.body.setImmovable(true);

    this.gunTip = this.add.circle(this.player.x + 26, this.player.y - 10, 4, 0xffffff);

    // Crosshair
    this.crosshair = this.add.circle(width / 2, height / 2, 6, 0xffffff).setDepth(10);

    // ===== Groups
    this.bullets = this.physics.add.group({ maxSize: 60 });
    this.targets = this.physics.add.group();
    this.gates = this.physics.add.group();

    // ===== Keyboard (restart fix)
    this.keys = this.input.keyboard.addKeys({
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      menu: Phaser.Input.Keyboard.KeyCodes.M,
      reload: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // ===== Mouse input
    this.input.on("pointermove", (pointer) => {
      this.crosshair.setPosition(pointer.x, pointer.y);
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.gameOver) return;
      this.tryShoot(pointer.x, pointer.y);
    });

    // ===== Collisions
    this.physics.add.overlap(this.bullets, this.targets, (bullet, target) => {
      this.onBulletHitTarget(bullet, target);
    });

    this.physics.add.overlap(this.player, this.gates, (player, gate) => {
      if (!gate.isOpen) this.endGame(false);
    });

    // ===== Initial spawns
    this.spawnTarget();
    this.spawnTarget();
    this.spawnTarget();
  }

  // ===== Parallax background draw
  drawBackground() {
    const { width, height } = this.scale;

    // Layer 1 (far)
    this.bgGraphics1.clear();
    this.bgGraphics1.fillStyle(0x0b0f1a, 1);
    this.bgGraphics1.fillRect(0, 0, width, height);

    this.bgGraphics1.fillStyle(0x111827, 1);
    for (let i = 0; i < 18; i++) {
      const x = i * 80;
      const h = 60 + (i % 4) * 25;
      this.bgGraphics1.fillRect(x, height - 160 - h, 50, h);
    }

    // Layer 2 (near)
    this.bgGraphics2.clear();
    this.bgGraphics2.fillStyle(0x1f2937, 0.9);
    for (let i = 0; i < 24; i++) {
      const x = i * 60;
      const h = 35 + (i % 5) * 18;
      this.bgGraphics2.fillRect(x, height - 110 - h, 40, h);
    }
  }

  // ===== Restart cleanup
  safeRestart() {
    this.time.removeAllEvents();

    const clearGroup = (grp) => {
      if (!grp) return;
      grp.getChildren().forEach((o) => {
        if (o.label) o.label.destroy();
        o.destroy();
      });
      grp.clear(true, true);
    };

    clearGroup(this.bullets);
    clearGroup(this.targets);
    clearGroup(this.gates);

    this.scene.restart();
  }

  // ===== Ammo
  tryShoot(x, y) {
    if (this.reloading) return;

    if (this.ammo <= 0) {
      this.startReload();
      return;
    }

    this.ammo -= 1;
    this.updateAmmoUI();
    this.shoot(x, y);

    if (this.ammo <= 0) {
      this.startReload();
    }
  }

  startReload() {
    if (this.reloading) return;

    this.reloading = true;
    this.ammoText.setText("Reloading...");
    this.ammoText.setColor("#f59e0b");

    this.time.delayedCall(this.reloadTimeMs, () => {
      this.ammo = this.maxAmmo;
      this.reloading = false;
      this.updateAmmoUI();
    });
  }

  updateAmmoUI() {
    this.ammoText.setText(`Ammo: ${this.ammo}/${this.maxAmmo}`);
    this.ammoText.setColor("#e2e8f0");
  }

  // ===== Shooting
  shoot(x, y) {
    if (this.sound && this.sound.get("shoot")) {
      this.sound.play("shoot", { volume: 0.35 });
    }

    const startX = this.player.x + 28;
    const startY = this.player.y - 10;

    const bullet = this.add.circle(startX, startY, 5, 0xffffff);
    this.physics.add.existing(bullet);
    bullet.body.setCircle(5);
    bullet.body.setAllowGravity(false);

    this.bullets.add(bullet);

    const dir = new Phaser.Math.Vector2(x - startX, y - startY).normalize();
    const speed = 850;

    bullet.body.setVelocity(dir.x * speed, dir.y * speed);

    // Miss penalty
    this.time.delayedCall(850, () => {
      if (!bullet.active) return;
      bullet.destroy();
      this.onMiss();
    });
  }

  // ===== Targets
  spawnTarget() {
    const { width } = this.scale;

    const correctChance =
      this.wave === 1 ? 0.75 : this.wave === 2 ? 0.62 : this.wave === 3 ? 0.55 : 0.5;

    const isCorrect = Math.random() < correctChance;

    const x = width + Phaser.Math.Between(40, 200);

    const yChoices = [this.groundY - 70, this.groundY - 20, this.groundY - 120];
    const y = Phaser.Utils.Array.GetRandom(yChoices);

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
    target.passed = false;

    // Zigzag movement
    target.zigzag = Math.random() < 0.35;
    target.zigzagDir = Math.random() < 0.5 ? -1 : 1;

    this.targets.add(target);
  }

  removeTarget(target) {
    if (target.label) target.label.destroy();
    target.destroy();
  }

  // ===== Gates
  spawnGate() {
    const { width } = this.scale;

    const x = width + Phaser.Math.Between(120, 260);
    const y = this.groundY - 20;

    const gate = this.add.rectangle(x, y, 28, 120, 0xa855f7);
    this.physics.add.existing(gate);
    gate.body.setAllowGravity(false);
    gate.body.setImmovable(true);

    gate.isOpen = false;
    gate.hp = 2;

    gate.label = this.add
      .text(x, y - 80, "GATE", { fontSize: "14px", color: "#e9d5ff", fontStyle: "bold" })
      .setOrigin(0.5);

    this.gates.add(gate);
  }

  openGate(gate) {
    gate.isOpen = true;
    gate.fillColor = 0x22c55e;

    if (gate.label) gate.label.setText("OPEN");

    gate.body.setEnable(false);

    this.time.delayedCall(400, () => {
      if (gate.label) gate.label.destroy();
      gate.destroy();
    });
  }

  // ===== Hit logic
  onBulletHitTarget(bullet, target) {
    bullet.destroy();

    if (target.isCorrect) this.onCorrectHit();
    else this.onWrongHit();

    this.flashAt(target.x, target.y, target.isCorrect);
    this.removeTarget(target);
  }

  onCorrectHit() {
    this.combo += 1;

    if (this.sound && this.sound.get("correct")) {
      this.sound.play("correct", { volume: 0.5 });
    }

    const comboFactor = Phaser.Math.Clamp(this.combo / 10, 0, 1);
    const bonus = comboFactor * this.maxComboBonus;

    this.applyTimeChange(this.correctHitDelta - bonus);
    this.pulseUI(true);

    // Gate interaction: correct hits damage closest gate
    const gates = this.gates.getChildren();
    if (gates.length > 0) {
      const closest = gates[0];
      if (closest && !closest.isOpen) {
        closest.hp -= 1;
        if (closest.hp <= 0) this.openGate(closest);
      }
    }
  }

  onWrongHit() {
    this.combo = 0;

    if (this.sound && this.sound.get("wrong")) {
      this.sound.play("wrong", { volume: 0.6 });
    }

    this.applyTimeChange(this.wrongHitDelta);
    this.pulseUI(false);
    this.cameras.main.shake(90, 0.007);
  }

  onMiss() {
    this.combo = 0;
    this.applyTimeChange(this.missDelta);
    this.pulseUI(false);
  }

  // ===== Time system
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

  // ===== Feedback
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

  // ===== End
  endGame(win) {
    this.gameOver = true;

    if (this.sound) {
      const key = win ? "win" : "lose";
      if (this.sound.get(key)) this.sound.play(key, { volume: 0.7 });
    }

    this.statusText.setText(win ? "YOU WIN 🎉" : "TIME OVERLOAD 💥");
    this.statusText.setColor(win ? "#22c55e" : "#ef4444");

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 70, "Press R to Restart | M for Menu", {
        fontSize: "18px",
        color: "#cbd5e1"
      })
      .setOrigin(0.5)
      .setDepth(200);
  }

  update(_, dt) {
    // Always allow restart/menu
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.safeRestart();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.menu)) {
      this.scene.start("MenuScene");
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.reload)) {
      this.startReload();
    }

    if (this.gameOver) return;

    // Parallax movement
    this.bgGraphics1.x -= 0.15 * this.timeScale;
    this.bgGraphics2.x -= 0.35 * this.timeScale;

    if (this.bgGraphics1.x <= -120) this.bgGraphics1.x = 0;
    if (this.bgGraphics2.x <= -120) this.bgGraphics2.x = 0;

    const scaledDt = dt * this.timeScale;

    // Timer
    this.elapsed += scaledDt / 1000;
    const remaining = Math.max(0, this.surviveTime - this.elapsed);

    if (remaining <= 0) {
      this.endGame(true);
      return;
    }

    // Waves
    const e = this.elapsed;
    if (e >= this.waveThresholds[3]) this.wave = 4;
    else if (e >= this.waveThresholds[2]) this.wave = 3;
    else if (e >= this.waveThresholds[1]) this.wave = 2;
    else this.wave = 1;

    // Runner movement illusion
    const runSpeed = this.baseRunSpeed * this.timeScale;

    // Move targets left + zigzag
    this.targets.getChildren().forEach((t) => {
      t.x -= (runSpeed * scaledDt) / 1000;

      if (t.zigzag) {
        t.y += t.zigzagDir * (70 * scaledDt) / 1000;
        if (t.y < this.groundY - 150) t.zigzagDir = 1;
        if (t.y > this.groundY - 10) t.zigzagDir = -1;
      }

      if (t.label) t.label.setPosition(t.x, t.y);

      // Passed player => miss if correct
      if (!t.passed && t.x < this.player.x - 30) {
        t.passed = true;
        if (t.isCorrect) this.onMiss();
        this.removeTarget(t);
      }
    });

    // Move gates left
    this.gates.getChildren().forEach((g) => {
      g.x -= (runSpeed * scaledDt) / 1000;
      if (g.label) g.label.setPosition(g.x, g.y - 80);

      if (g.x < -80) {
        if (g.label) g.label.destroy();
        g.destroy();
      }
    });

    // Spawn targets (same logic)
    this.spawnTimer += scaledDt;

    const waveFactor =
      this.wave === 1 ? 1.0 : this.wave === 2 ? 0.85 : this.wave === 3 ? 0.72 : 0.62;

    const dynamicDelay = (this.spawnBaseDelay * waveFactor) / this.timeScale;

    if (this.spawnTimer >= dynamicDelay) {
      this.spawnTimer = 0;
      this.spawnTarget();
    }

    // Spawn gates (mild frequency)
    this.gateSpawnTimer += scaledDt;
    if (this.gateSpawnTimer >= this.gateBaseDelay) {
      this.gateSpawnTimer = 0;
      this.spawnGate();
    }

    // Update gun tip
    this.gunTip.setPosition(this.player.x + 26, this.player.y - 10);

    // UI
    this.timeScaleText.setText(`Speed: ${this.timeScale.toFixed(2)}x`);
    this.timerText.setText(`Survive: ${Math.ceil(remaining)}s`);
    this.waveText.setText(`Wave: ${this.wave}`);
    this.comboText.setText(`Combo: ${this.combo}`);

    if (!this.reloading) {
      this.updateAmmoUI();
    }

    // Time bar
    const pct = (this.timeScale - this.minTimeScale) / (this.maxTimeScale - this.minTimeScale);
    const w = Phaser.Math.Clamp(220 * (1 - pct), 0, 220);
    this.timeBarFill.width = w;

    if (pct < 0.35) this.timeBarFill.fillColor = 0x22c55e;
    else if (pct < 0.7) this.timeBarFill.fillColor = 0xf59e0b;
    else this.timeBarFill.fillColor = 0xef4444;
  }
}
