import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.audio("shoot", "assets/sfx/shoot.wav");
    this.load.audio("correct", "assets/sfx/correct.wav");
    this.load.audio("wrong", "assets/sfx/wrong.wav");
    this.load.audio("win", "assets/sfx/win.wav");
    this.load.audio("lose", "assets/sfx/lose.wav");
  }

  create() {
    this.scene.start("MenuScene");
  }
}
