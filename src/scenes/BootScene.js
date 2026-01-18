import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    // No assets needed (we use simple shapes)
    this.scene.start("GameScene");
  }
}
