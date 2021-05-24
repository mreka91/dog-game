import { none } from 'html-webpack-plugin/lib/chunksorter';
import Phaser from 'phaser';

let score;
let scoreText;

const createLooped = (scene, totalWidth, texture, scrollFactor) => {
  const w = scene.textures.get(texture).getSourceImage().width;

  const count = Math.ceil(totalWidth / w) * scrollFactor;

  let x = 0;
  for (let i = 0; i < count; ++i) {
    const m = scene.add
      .image(x, scene.scale.height, texture)
      .setOrigin(0, 1)
      .setScrollFactor(scrollFactor);

    x += m.width;
  }
};

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.score = 0;
  }

  preload() {
    this.load.image('sky', './assets/sky.png');
    this.load.image('mountain', './assets/mountains.png');
    this.load.image('plateau', './assets/plateau.png');
    this.load.image('ground', './assets/ground.png');
    this.load.image('plant', './assets/plant.png');
    this.load.image('carrot-sm', './assets/carrot-sm.png');
    this.load.image('banana-sm', './assets/banana-sm.png');
    this.load.image('strawberry-sm', './assets/strawberry-sm.png');
    this.load.image('vacuum', './assets/vacuum-cleaner.png');
    this.load.spritesheet('dog', './assets/dog1.png', {
      frameWidth: 111,
      frameHeight: 103,
    });
    this.load.spritesheet('dogleft', './assets/dogleft.png', {
      frameWidth: 111,
      frameHeight: 103,
    });
    this.load.spritesheet('jump', './assets/jump.png', {
      frameWidth: 111,
      frameHeight: 103,
    });
    this.load.audio('jump', '../../assets/music/jump.mp3');
    this.load.audio('eat', '../../assets/music/ra.mp3');
    // ./assets/music/jump.mp3, ./assets/music/ra.mp3
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const totalWidth = width * 10; //width * width om vi vill göra det infinite
    this.cursors = this.input.keyboard.createCursorKeys();
    this.add.image(width * 0.5, height * 0.5, 'sky').setScrollFactor(0);
    this.jumpMusic = this.sound.add('jump');
    this.eatMusic = this.sound.add('eat');

    createLooped(this, totalWidth, 'mountain', 0.25);
    createLooped(this, totalWidth, 'plateau', 0.5);
    createLooped(this, totalWidth, 'ground', 1);
    createLooped(this, totalWidth, 'plant', 1.25);

    // WORLD BOUNDS (also on line ~155 as comment)
    this.physics.world.setBounds(0, 0, width * 3.5, height - 160);

    /*  GAME ITEMS
    ------------------------------------------ */
    // Banana
    this.bananas = this.physics.add.group({
      key: 'banana-sm',
      repeat: 11,
      setXY: { x: 12, y: 635, stepX: 350 },
    });

    Phaser.Actions.Call(this.bananas.getChildren(), function (banana) {
      banana.body.allowGravity = false;
    });

    // Strawberry
    this.strawberry = this.physics.add.group({
      key: 'strawberry-sm',
      repeat: 11,
      setXY: { x: 80, y: 600, stepX: 600 },
    });

    Phaser.Actions.Call(this.strawberry.getChildren(), function (strawber) {
      strawber.body.allowGravity = false;
    });

    // Carrot
    this.carrots = this.physics.add.group({
      key: 'carrot-sm',
      repeat: 4,
      setXY: { x: 200, y: 450, stepX: 800 },
    });

    Phaser.Actions.Call(this.carrots.getChildren(), function (carrot) {
      carrot.body.allowGravity = false;
    });

    // Vacuums (static group?)
    this.vacuum2 = this.add.image(900, 650, 'vacuum');
    this.vacuum2.setScale(0.05);

    this.vacuum3 = this.add.image(2300, 650, 'vacuum');
    this.vacuum3.setScale(0.05);

    this.vacuumBig = this.add.image(3150, 500, 'vacuum');
    this.vacuumBig.setScale(0.13);

    var tweenBig = this.tweens.add({
      targets: this.vacuumBig,
      y: '-=128',
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 1000,
    });

    var tween2 = this.tweens.add({
      targets: this.vacuum2,
      y: '-=128',
      duration: 2500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 1000,
    });

    var tween3 = this.tweens.add({
      targets: this.vacuum3,
      y: '-=128',
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 1000,
    });

    // Corgi Player
    let player;
    this.player = this.physics.add.sprite(width * 0.5, height * 0.5, 'dog');

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    
    // Flyttade upp till början av create()
       // this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height - 160);
       // this.physics.world.setBounds(0, 0, width * 3.5, height - 160);

  /* OVERLAPS - PLAYER AND ITEMS
  ----------------------------------------------------- */
    this.physics.add.overlap(
      this.player,
      this.bananas,
      this.collectBananas,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.strawberry,
      this.collectStrawberry,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.carrots,
      this.collectCarrots,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.vacuum,
      this.fuckingVacuumer,
      null,
      this
    );

    /* CORGI PLAYER POSITIONS 
    -------------------------------------------*/
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'dog', frame: 2 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dogleft', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'turn',
      frames: [{ key: 'dog', frame: 2 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dog', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

     // CAMERA MOVEMENT
     this.cameras.main.setBounds(0, 0, width * 3.5, height);
     this.cameras.main.startFollow(this.player);

     // 'BUTTON' TO NEW LEVEL
     let goalText = this.add.text(3700, 200, 'Level 1 Completed!', {
      font: '40px Arial Black',
      fill: '#f6d55c',
      backgroundColor: '#173f5f',
      padding: 10,
      wordWrap: { width: 250 },
    });
    let newLevelText = this.add.text(3700, 300, 'Click here for the Next Level', {
      font: '25px Arial Black',
      fill: '#f6d55c',
      backgroundColor: '#173f5f',
      padding: 10,
      wordWrap: { width: 200 },
    });

    // Player stops on overlap (lite onödigt kanske?)
    //this.player.setMaxVelocity(3750);

    //if (this.player. GET X VALUE SOMEHOW === )
    // this.physics.add.overlap(
    //   this.player,
    //   this.newLevelText,
    //   // this.player.setVelocityX(0), // player rör sig inte i x-led
    //   this.player.anims.stop(null, true), // player image "springer" inte
    //   null,
    //   this
    // );

    newLevelText.setInteractive({ useHandCursor: true });
    newLevelText.on('pointerdown', () => this.newLevel());

    scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      font: '28px Arial Black',
      fill: '#173f5f',
      backgroundColor: '#f6d55c',
      padding: 15,
    });
    scoreText.setScrollFactor(0, 0);
  }

  /* FUNCTIONS 
  ------------------------------------------*/
  newLevel() {
    this.scene.start('WinterScene', { totalScore: this.score });
  }

  fuckingVacuumer(player, vacuum) {
    this.score -= 10;
    scoreText.setText(`Score: ${score}`);
  }

  collectBananas(player, bananas) {
    bananas.destroy();
    this.score += 10;
    scoreText.setText(`Score: ${this.score}`);
    this.eatMusic.play();
  }

  collectStrawberry(player, strawberry) {
    strawberry.destroy();
    this.score += 5;
    scoreText.setText(`Score: ${this.score}`);
    this.eatMusic.play();
  }

  collectCarrots(player, carrots) {
    carrots.destroy();
    this.score += 15;
    scoreText.setText(`Score: ${this.score}`);
    this.eatMusic.play();
  }

  update() {
    const cam = this.cameras.main;
    const speed = 30;

    if (this.cursors.left.isDown) {
      cam.scrollX -= speed;
      this.player.setVelocityX(-160);
      this.player.anims.play('left', true);
    } else if (this.cursors.right.isDown) {
      cam.scrollX += speed;
      this.player.setVelocityX(160);
      this.player.anims.play('right', true); 
    } else {
      this.player.setVelocityX(0);
      this.player.anims.stop(null, true);
    }

    if (this.cursors.up.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-150);
      this.jumpMusic.play();
    } else if (this.cursors.space.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-260);
      this.jumpMusic.play();
    }

    // if (this.player./* SOMETHING */ == 800) {
    //   this.player.setVelocityX(0);
    //   this.player.anims.stop(null, true);
    // }
  }
}

export default GameScene;
