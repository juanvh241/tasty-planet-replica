import * as Phaser from 'phaser'

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' })
    }

    init(data) {
        this.level = data?.level || 1
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Fondo
        this.add.rectangle(centerX, centerY, 480, 320, 0x000000, 0.8).setDepth(10);

        // Título
        this.add.text(centerX, centerY - 100, 'Nivel Fallido', {
            fontSize: '36px', fill: '#fff', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        // Mensaje
        this.add.text(centerX, centerY - 30, 'Has sido destruido,\nevita todo lo que sea más grande que vos', {
            fontSize: '20px', fill: '#ccc', fontFamily: 'Arial, sans-serif', align: 'center'
        }).setOrigin(0.5).setDepth(11);

        // Botones
        this.menuButtons = [];
        this.selectedButtonIndex = 0;
        this.lastAButtonPressed = false;

        const retryBtn = this.add.text(centerX, centerY + 60, 'Reintentar', {
            fontSize: '24px', fill: '#0f0', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12).setInteractive();
        retryBtn.action = 'retry';
        this.menuButtons.push(retryBtn);

        const menuBtn = this.add.text(centerX, centerY + 100, 'Volver al Menú', {
            fontSize: '24px', fill: '#f00', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12).setInteractive();
        menuBtn.action = 'menu';
        this.menuButtons.push(menuBtn);

        this.menuButtons.forEach((btn, idx) => {
            btn.on('pointerover', () => {
                this.selectedButtonIndex = idx;
                this.updateButtonSelection();
            });
            btn.on('pointerdown', () => {
                this.selectOption(btn.action);
            });
        });
        this.updateButtonSelection();

        // Soporte joystick: la navegación y selección se maneja en update()
    }

    update() {
        // Navegación con joystick o teclado
        const pad = this.input.gamepad && this.input.gamepad.total ? this.input.gamepad.getPad(0) : null;
        let up = false, down = false, aPressed = false;
        if (pad) {
            const y = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
            up = y < -0.5;
            down = y > 0.5;
            aPressed = pad.buttons[0]?.pressed;
        }
        const cursors = this.input.keyboard.createCursorKeys();
        if ((Phaser.Input.Keyboard.JustDown(cursors.up) || up) && this.selectedButtonIndex > 0) {
            this.selectedButtonIndex--;
            this.updateButtonSelection();
        } else if ((Phaser.Input.Keyboard.JustDown(cursors.down) || down) && this.selectedButtonIndex < this.menuButtons.length - 1) {
            this.selectedButtonIndex++;
            this.updateButtonSelection();
        }
        // Selección con botón A del gamepad o Enter/Espacio
        if ((aPressed && !this.lastAButtonPressed) || Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)) || Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
            this.selectOption(this.menuButtons[this.selectedButtonIndex].action);
        }
        this.lastAButtonPressed = aPressed;
    }

    updateButtonSelection() {
        this.menuButtons.forEach((btn, idx) => {
            btn.setStyle({ fontSize: idx === this.selectedButtonIndex ? '28px' : '24px' });
            btn.setScale(idx === this.selectedButtonIndex ? 1.2 : 1);
        });
    }

    selectOption(action) {
        if (action === 'menu') {
            this.sound.stopAll();
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MainMenuScene');
        } else if (action === 'retry') {
            this.sound.stopAll();
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene', { level: this.level });
        }
        this.scene.stop();
    }
}