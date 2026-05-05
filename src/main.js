import * as Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene.js'
import { MainMenuScene } from './scenes/MainMenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { HUDScene } from './scenes/HUDScene.js'
import { PauseMenuScene } from './scenes/PauseMenuScene.js'
import { WinScene } from './scenes/WinScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 },
            width: 1600,
            height: 1200
        }
    },
    scene: [PreloadScene, MainMenuScene, GameScene, HUDScene, PauseMenuScene, WinScene, GameOverScene]
}

const game = new Phaser.Game(config)