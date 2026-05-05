import * as Phaser from 'phaser'

export class PauseMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseMenuScene' })
    }

    create() {
        const centerX = this.cameras.main.centerX
        const centerY = this.cameras.main.centerY

        // Background
        this.add.rectangle(centerX, centerY, 400, 300, 0x000000, 0.8).setDepth(10)

        // Title
        this.add.text(centerX, centerY - 100, 'Pausa', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5).setDepth(11)

        // Resume button
        const resumeButton = this.add.text(centerX, centerY - 50, 'Resumir', { fontSize: '24px', fill: '#0f0' }).setOrigin(0.5).setDepth(11)
        resumeButton.setInteractive()
        resumeButton.on('pointerdown', () => {
            this.scene.resume('GameScene')
            this.scene.stop()
        })

        // Restart button
        const restartButton = this.add.text(centerX, centerY, 'Reiniciar Nivel', { fontSize: '24px', fill: '#ff0' }).setOrigin(0.5).setDepth(11)
        restartButton.setInteractive()
        restartButton.on('pointerdown', () => {
            this.scene.stop('GameScene')
            this.scene.start('GameScene')
            this.scene.stop()
        })

        // Main Menu button
        const menuButton = this.add.text(centerX, centerY + 50, 'Volver al Menu', { fontSize: '24px', fill: '#f00' }).setOrigin(0.5).setDepth(11)
        menuButton.setInteractive()
        menuButton.on('pointerdown', () => {
            this.scene.stop('GameScene')
            this.scene.stop('HUDScene')
            this.scene.start('MainMenuScene')
            this.scene.stop()
        })

        // Keyboard controls
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.resume('GameScene')
            this.scene.stop()
        })
    }
}