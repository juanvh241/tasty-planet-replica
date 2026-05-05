import * as Phaser from 'phaser'

export class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' })
    }

    init(data) {
        this.score = data?.score || 0
        this.timeLeft = data?.timeLeft || 0
        this.level = data?.level || 1
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Fondo
        this.add.rectangle(centerX, centerY, 480, 320, 0x000000, 0.8).setDepth(10);

        // Título
        this.add.text(centerX, centerY - 100, '¡Nivel Completado!', {
            fontSize: '36px', fill: '#fff', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        // Info
        this.add.text(centerX, centerY - 30, `Tiempo restante: ${this.timeLeft}`, {
            fontSize: '22px', fill: '#ccc', fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(11);
        this.add.text(centerX, centerY + 10, `Puntos: ${this.score}`, {
            fontSize: '22px', fill: '#fff', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);

        // Botones
        this.menuButtons = [];
        this.selectedButtonIndex = 0;
        this.lastAButtonPressed = false;

        const nextBtn = this.add.text(centerX - 100, centerY + 80, 'Siguiente nivel', {
            fontSize: '24px', fill: '#0f0', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12).setInteractive();
        nextBtn.action = 'next';
        this.menuButtons.push(nextBtn);

        const menuBtn = this.add.text(centerX + 100, centerY + 80, 'Volver al menu', {
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
        let left = false, right = false, aPressed = false;
        if (pad) {
            const x = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
            left = x < -0.5;
            right = x > 0.5;
            aPressed = pad.buttons[0]?.pressed;
        }
        const cursors = this.input.keyboard.createCursorKeys();
        if ((Phaser.Input.Keyboard.JustDown(cursors.left) || left) && this.selectedButtonIndex > 0) {
            this.selectedButtonIndex--;
            this.updateButtonSelection();
        } else if ((Phaser.Input.Keyboard.JustDown(cursors.right) || right) && this.selectedButtonIndex < this.menuButtons.length - 1) {
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
        } else if (action === 'next') {
            this.sound.stopAll();
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene', { level: 2 });
        }
        this.scene.stop();
    }
    }
