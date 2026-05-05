import * as Phaser from 'phaser'

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' })
    }

    create() {
        const centerX = this.cameras.main.centerX
        const centerY = this.cameras.main.centerY

        // Fondo del espacio
        this.add.image(centerX, centerY, 'space_background')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
            .setOrigin(0.5)

        // Title con fuente Arial negrita
        this.add.text(centerX, centerY - 160, 'Tasty Planet', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5)

        // Array de botones para navegación con joystick
        this.menuButtons = []
        this.selectedButtonIndex = 0

        // Configuración de botones
        const buttonConfig = [
            { text: 'Nivel 1', level: 1, color: '#0f0', y: centerY - 40 },
            { text: 'Nivel 2', level: 2, color: '#0ff', y: centerY + 60 }
        ]

        // Crear botones cuadrados con esquinas redondeadas
        buttonConfig.forEach((config, index) => {
            const button = this.createMenuButton(centerX, config.y, config.text, config.color, config.level)
            this.menuButtons.push(button)
        })

        // Soporte para joystick
        this.padIndex = null
        this.gamepadDeadZone = 0.2
        this.lastVerticalInput = 0

        this.onGamepadConnected = (event) => {
            this.padIndex = event.gamepad.index
        }
        this.onGamepadDisconnected = (event) => {
            if (this.padIndex === event.gamepad.index) {
                this.padIndex = null
            }
        }
        window.addEventListener('gamepadconnected', this.onGamepadConnected)
        window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected)
        this.events.once('shutdown', () => {
            window.removeEventListener('gamepadconnected', this.onGamepadConnected)
            window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected)
        })

        // Si ya hay un gamepad conectado
        const connectedPads = navigator.getGamepads?.()
        if (connectedPads) {
            for (let i = 0; i < connectedPads.length; i++) {
                if (connectedPads[i]) {
                    this.padIndex = i
                    break
                }
            }
        }

        // Seleccionar el primer botón por defecto
        this.updateButtonSelection()

        // Música del menú principal
        this.menuMusic = this.sound.add('main_menu_music', { loop: true, volume: 0.5 })
        this.menuMusic.play()
        this.events.once('shutdown', () => {
            if (this.menuMusic) {
                this.menuMusic.stop()
            }
        })

        // Instructions
        this.add.text(centerX, centerY + 180, 'Usa mouse, teclado o joystick para seleccionar', {
            fontSize: '20px',
            fill: '#ccc',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5)
    }

    createMenuButton(x, y, text, color, level) {
        const buttonWidth = 200
        const buttonHeight = 60

        // Grupo del botón primero
        const button = this.add.container(x, y)

        // Fondo del botón con esquinas redondeadas (posiciones relativas al container)
        const buttonBg = this.add.graphics()
        buttonBg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.8)
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15)
        buttonBg.lineStyle(3, Phaser.Display.Color.HexStringToColor(color).color, 1)
        buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15)

        // Texto del botón (posiciones relativas al container)
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#000',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5)

        // Agregar elementos al container
        button.add([buttonBg, buttonText])

        // Hacer interactivo
        button.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains)

        // Eventos del mouse
        button.on('pointerover', () => this.onButtonHover(button))
        button.on('pointerout', () => this.onButtonOut(button))
        button.on('pointerdown', () => this.selectLevel(level))

        // Guardar referencias
        button.bg = buttonBg
        button.text = buttonText
        button.level = level
        button.normalColor = color
        button.hoverColor = Phaser.Display.Color.HexStringToColor(color).brighten(50).rgba

        return button
    }

    onButtonHover(button) {
        // Animación de hover
        this.tweens.add({
            targets: button.bg,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            ease: 'Power2'
        })
        this.tweens.add({
            targets: button.text,
            scale: 1.1,
            duration: 200,
            ease: 'Power2'
        })
    }

    onButtonOut(button) {
        // Volver al estado normal
        this.tweens.add({
            targets: button.bg,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Power2'
        })
        this.tweens.add({
            targets: button.text,
            scale: 1,
            duration: 200,
            ease: 'Power2'
        })
    }

    updateButtonSelection() {
        // Resetear todos los botones
        this.menuButtons.forEach((button, index) => {
            if (index === this.selectedButtonIndex) {
                // Botón seleccionado - animación similar al hover
                this.onButtonHover(button)
            } else {
                // Botón no seleccionado
                this.onButtonOut(button)
            }
        })
    }

    selectLevel(level) {
        this.scene.start('GameScene', { level: level })
    }

    update() {
        const gamepadAxes = this.getGamepadAxes()
        if (gamepadAxes) {
            this.handleGamepadInput(gamepadAxes)
        }

        // También permitir navegación con teclado
        const cursors = this.input.keyboard.createCursorKeys()
        if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.selectedButtonIndex > 0) {
            this.selectedButtonIndex--
            this.updateButtonSelection()
        } else if (Phaser.Input.Keyboard.JustDown(cursors.down) && this.selectedButtonIndex < this.menuButtons.length - 1) {
            this.selectedButtonIndex++
            this.updateButtonSelection()
        }

        // Seleccionar con Enter o Espacio
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)) ||
            Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
            const selectedButton = this.menuButtons[this.selectedButtonIndex]
            this.selectLevel(selectedButton.level)
        }
    }

    getGamepadAxes() {
        if (this.padIndex === null) return null
        const pads = navigator.getGamepads?.()
        if (!pads) return null
        const pad = pads[this.padIndex]
        if (!pad) return null

        const x = pad.axes?.[0] ?? 0
        const y = pad.axes?.[1] ?? 0
        const deadZone = this.gamepadDeadZone || 0.2

        return {
            x: Math.abs(x) > deadZone ? x : 0,
            y: Math.abs(y) > deadZone ? y : 0
        }
    }

    handleGamepadInput(axes) {
        // Navegación vertical con stick izquierdo
        const verticalInput = axes.y
        const threshold = 0.5

        if (verticalInput < -threshold && this.lastVerticalInput >= -threshold) {
            // Arriba
            if (this.selectedButtonIndex > 0) {
                this.selectedButtonIndex--
                this.updateButtonSelection()
            }
        } else if (verticalInput > threshold && this.lastVerticalInput <= threshold) {
            // Abajo
            if (this.selectedButtonIndex < this.menuButtons.length - 1) {
                this.selectedButtonIndex++
                this.updateButtonSelection()
            }
        }

        this.lastVerticalInput = verticalInput

        // Seleccionar con botón A (índice 0 en la mayoría de gamepads)
        const pads = navigator.getGamepads?.()
        if (pads && pads[this.padIndex]) {
            const pad = pads[this.padIndex]
            if (pad.buttons?.[0]?.pressed) { // Botón A
                const selectedButton = this.menuButtons[this.selectedButtonIndex]
                this.selectLevel(selectedButton.level)
            }
        }
    }
}