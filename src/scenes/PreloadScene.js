import * as Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' })
    }

    preload() {
                this.load.audio('motor_sfx', '/sound/motor sfx.wav')
                this.load.audio('tanque_movimiento', '/sound/tanque movimiento.wav')
                this.load.audio('crash1', '/sound/crash 1.wav')
                this.load.audio('crash2', '/sound/crash 2.wav')
                this.load.audio('crash3', '/sound/crash 3.wav')
                this.load.audio('crash4', '/sound/crash 4.wav')
            // Sonidos
            this.load.audio('tierra1', '/sound/tierra 1.wav')
            this.load.audio('tierra2', '/sound/tierra 2.wav')
            this.load.audio('hojas1', '/sound/hojas 1.wav')
            this.load.audio('hojas2', '/sound/hojas 2.wav')
            this.load.audio('piedra1', '/sound/piedra 1.wav')
            this.load.audio('piedra2', '/sound/piedra 2.wav')
            this.load.audio('piedra3', '/sound/piedra 3.wav')
            this.load.audio('tanque disparo', '/sound/tanque disparo.wav')
            this.load.audio('player_idle1', '/sound/personaje idle 1.wav')
            this.load.audio('player_idle2', '/sound/personaje idle 2.wav')
            this.load.audio('player_idle3', '/sound/personaje idle 3.wav')
            this.load.audio('player_damage1', '/sound/personaje daño 1.wav')
            this.load.audio('player_damage2', '/sound/personaje daño 2.wav')
            this.load.audio('player_death', '/sound/personaje muerte.wav')
            this.load.audio('player_win', '/sound/personaje win.wav')
            this.load.audio('main_menu_music', '/sound/main menu music.mp3')
            this.load.audio('tasty_bounce', '/sound/TASTY BOUNCE.mp3')
        // Crear fondo
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // Título
        this.add.text(width / 2, height / 2 - 80, 'TASTY PLANET', {
            fontSize: '48px',
            fill: '#FFD700',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(10)

        // Barra de progreso (fondo)
        const progressBarWidth = 300
        const progressBarHeight = 30
        const progressBarX = width / 2 - progressBarWidth / 2
        const progressBarY = height / 2

        const barBg = this.add.graphics()
        barBg.fillStyle(0x333333, 1)
        barBg.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
        barBg.setDepth(10)

        // Barra de progreso (relleno)
        const progressBar = this.add.graphics()
        progressBar.setDepth(11)

        // Texto de porcentaje
        const percentText = this.add.text(width / 2, progressBarY + progressBarHeight + 30, '0%', {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(10)

        // Eventos de progreso
        this.load.on('progress', (progress) => {
            // Limpiar y redibujar barra
            progressBar.clear()
            progressBar.fillStyle(0x00FF00, 1)
            progressBar.fillRect(
                progressBarX,
                progressBarY,
                progressBarWidth * progress,
                progressBarHeight
            )

            // Actualizar porcentaje
            percentText.setText(Math.round(progress * 100) + '%')
        })

        this.load.on('complete', () => {
            this.scene.start('MainMenuScene')
        })

        // Cargar assets
        this.load.image('particle_small', '/assets/particle_small.png')
        this.load.image('particle_big', '/assets/particle_big.png')
        this.load.image('player', '/assets/player.png')
        this.load.image('arrow', '/assets/arrow.png')
        this.load.image('background_1', '/assets/background_1.png')
        this.load.image('background_2', '/assets/background_2.png')
        this.load.image('tree', '/assets/tree.png')
        this.load.image('car_1', '/assets/car_1.png')
        this.load.image('police_truck', '/assets/police_truck.png')
        this.load.image('small_house', '/assets/small_house.png')
        this.load.image('big_house', '/assets/big_house.png')
        this.load.image('building', '/assets/building.png')
        this.load.image('tank', '/assets/tank.png')
        this.load.image('road', '/assets/road.png')
        this.load.image('roads_map', '/assets/roads_map.png')
        this.load.image('corner_down_toleft', '/assets/corner_down_toleft.png')
        this.load.image('corner_down_toright', '/assets/corner_down_toright.png')
        this.load.image('corner_up_toleft', '/assets/corner_up_toleft.png')
        this.load.image('corner_up_toright', '/assets/corner_up_toright.png')
        this.load.image('space_background', '/assets/space_background.png')
        this.load.image('intro_arrows', '/assets/flechas png.png')
        this.load.image('intro_stick', '/assets/left stick png.png')
    }

    create() {
        // La escena se transiciona automáticamente cuando preload completa
    }
}
