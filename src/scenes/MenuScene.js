import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0f1a);

    this.add
      .text(width / 2, height / 2 - 120, "CHRONO MISFIRE", {
        fontSize: "52px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 50, "Twisted Mechanic: Accuracy controls time speed", {
        fontSize: "18px",
        color: "#cbd5e1"
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 + 10,
        "✔ Correct Hit → slows time\n✖ Wrong Hit / Miss → speeds time\nIf time reaches 4.0x → TIME OVERLOAD",
        { fontSize: "18px", color: "#e2e8f0", align: "center" }
      )
      .setOrigin(0.5);

    const playText = this.add
      .text(width / 2, height / 2 + 120, "CLICK TO PLAY", {
        fontSize: "26px",
        color: "#22c55e",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 40, "Controls: Mouse Aim + Left Click Shoot | R Restart", {
        fontSize: "16px",
        color: "#94a3b8"
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: playText,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.once("pointerdown", () => {
      this.scene.start("GameScene");
    });
  }
}
