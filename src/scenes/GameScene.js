import * as Phaser from 'phaser'
import { Player } from '../objects/Player.js'
import { SmallParticle } from '../objects/SmallParticle.js'
import { BigParticle } from '../objects/BigParticle.js'
import { StaticObject } from '../objects/StaticObject.js'
import { Vehicle } from '../objects/Vehicle.js'
import { Level2Config } from '../config/Level2Config.js'

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
    }

    init(data) {
        this.level = data?.level || 1
        // Resetear estado del intro cuando se reinicia la escena
        this.isIntroActive = false
        this.introAButtonLast = false
        this.introContainer = null
        this.gameTimerActive = false
        this.lastTimerUpdate = 0
        this.timeLeft = 120
        this.gameWon = false
        this.maxMotorSounds = 2
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys()
        this.player = new Player(this, 400, 300)
        this.player.setDepth(10)

        // Música de gameplay
        this.gameMusic = this.sound.add('tasty_bounce', { loop: true, volume: 0.2 })
        this.gameMusic.play()
        this.events.once('shutdown', () => {
            if (this.gameMusic) {
                this.gameMusic.stop()
            }
        })

        // Soporte para joystick: guardamos el índice del gamepad
        this.padIndex = null
        this.gamepadDeadZone = 0.2
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

        // Si ya hay un gamepad conectado cuando se inicia la escena
        const connectedPads = navigator.getGamepads?.()
        if (connectedPads) {
            for (let i = 0; i < connectedPads.length; i++) {
                if (connectedPads[i]) {
                    this.padIndex = i
                    break
                }
            }
        }

        // Crear fondo para nivel 1 y nivel 2
        if (this.level === 1) {
            this.add.sprite(800, 600, 'background_1')
                .setOrigin(0.5)
                .setDepth(-1)
        } else if (this.level === 2) {
            this.add.sprite(800, 800, 'background_2')
                .setOrigin(0.5)
                .setDepth(-1)
        }

this.maskSource = this.add.graphics();

this.maskSource.fillStyle(0xffffff);
this.maskSource.fillCircle(0, 0, 140);

this.maskSource.setVisible(false);

this.space = this.add.image(0, 0, 'space_background').setOrigin(0);
this.space.setScrollFactor(0);

this.space.enableFilters();
this.space.filters.external.addMask(this.maskSource);


        // Eyes using graphics
        this.leftEye = this.add.graphics().fillStyle(0xffffff).fillCircle(0, 0, 3).setDepth(5)
        this.rightEye = this.add.graphics().fillStyle(0xffffff).fillCircle(0, 0, 3).setDepth(5)
        this.leftPupil = this.add.graphics().fillStyle(0x000000).fillCircle(0, 0, 1).setDepth(6)
        this.rightPupil = this.add.graphics().fillStyle(0x000000).fillCircle(0, 0, 1).setDepth(6)

        this.arrow = this.add.image(this.player.x, this.player.y, 'arrow')
            .setDepth(10)
            .setScale(0.5)
            .setOrigin(0.5)

        // Corner brackets para remarcar el target
        this.cornerBrackets = {
            topLeft: this.add.graphics().setDepth(9),
            topRight: this.add.graphics().setDepth(9),
            bottomLeft: this.add.graphics().setDepth(9),
            bottomRight: this.add.graphics().setDepth(9)
        }

        // ⚙️ Configuración de corner brackets (ajustable manualmente)
        this.bracketConfig = {
            cornerSize: 10,      // Tamaño de las esquinas (en píxeles)
            lineWidth: 2.5,      // Grosor de la línea
            padding: 8,          // Espaciado adicional alrededor del objeto
            alpha: 0.9           // Opacidad (0-1)
        }

        this.score = 0
        this.timeLeft = 180
        this.gameWon = false
        this.isIntroActive = false
        this.introAButtonLast = false
        this.lastTimerUpdate = 0

        // Detener cualquier HUDScene anterior antes de lanzar una nueva
        if (this.scene.get('HUDScene')) {
            this.scene.stop('HUDScene')
        }

        this.scene.launch('HUDScene')
        this.scene.bringToTop('HUDScene')
        this.hudScene = this.scene.get('HUDScene')
        
        // Esperar a que el HUD esté completamente creado antes de actualizar
        this.hudScene.events.once('create', () => {
            this.hudScene.setScore(this.score)
            this.hudScene.setTime(this.timeLeft)
        })

        if (this.level === 1) {
            this.showLevelIntro()
        } else {
            this.startGameTimers()
        }

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause()
            this.scene.launch('PauseMenuScene')
        })

        this.smallParticles = this.physics.add.group()
        this.bigParticles = this.physics.add.group()
        this.staticObjectsGroup = this.physics.add.staticGroup()
        this.vehicles = this.physics.add.group()
        this.projectiles = this.physics.add.group() // Proyectiles de tanques

        // Solo generar partículas en nivel 1
        if (this.level === 1) {
            this.physics.add.overlap(
                this.player,
                this.smallParticles,
                (player, obj) => {
                    player.grow(obj.getData('growAmount'))
                    this.score += 10
                    this.hudScene?.setScore(this.score)
                    this.checkWin()
                    // SONIDO: reproducir tierra1 o tierra2 aleatorio
                    const tierraSound = Phaser.Math.Between(0, 1) === 0 ? 'tierra1' : 'tierra2';
                    this.sound.play(tierraSound, { volume: 0.7 });
                    this.absorbObject(player, obj)
                },
                null,
                this
            )

            this.physics.add.collider(
                this.player,
                this.bigParticles,
                null,
                (player, obj) => player.sizeValue < 35,  // Necesitas 35 size para poder comer big particles (comer 15 small primero)
                this
            )

            this.physics.add.overlap(
                this.player,
                this.bigParticles,
                (player, obj) => {
                    if (player.sizeValue >= 35) {  // Necesitas 35 size para poder comer big particles (comer 15 small primero)
                        player.grow(obj.getData('growAmount'))
                        this.score += 50
                        this.hudScene?.setScore(this.score)
                        this.checkWin()
                        // SONIDO: reproducir tierra1 o tierra2 aleatorio
                        const tierraSound = Phaser.Math.Between(0, 1) === 0 ? 'tierra1' : 'tierra2';
                        this.sound.play(tierraSound, { volume: 0.7 });
                        this.absorbObject(player, obj)
                    }
                },
                null,
                this
            )

            // El spawneo y el contador empiezan una vez se presiona CONTINUAR en nivel 1
            if (this.level !== 1) {
                this.time.addEvent({ delay: 800, callback: this.spawnSmall, callbackScope: this, loop: true })
                this.time.addEvent({ delay: 2000, callback: this.spawnBig, callbackScope: this, loop: true })
            }
        }

        this.createLevelMap()
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

    startGameTimers() {
        this.gameTimerActive = true
        this.lastTimerUpdate = this.time.now
    }

    showLevelIntro() {
        this.isIntroActive = true

        const cam = this.cameras.main
        const overlay = this.add.graphics()
        overlay.fillStyle(0x000000, 0.62)
        overlay.fillRect(0, 0, cam.width, cam.height)

        const panelWidth = 400
        const panelHeight = 360
        const panelX = cam.centerX
        const panelY = cam.centerY
        const panelColor = 0x8086B7
        const panelBorderColor = 0x252736
        const panelBorderAlpha = 0.9

        const panel = this.add.graphics()
        panel.fillStyle(panelColor, 1)
        panel.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 24)
        panel.lineStyle(4, panelBorderColor, panelBorderAlpha)
        panel.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 24)

        const introText = this.add.text(panelX, panelY - 100, 'Usa las flechas o el stick izquierdo\npara controlar el agujero negro.\nCome todo lo que sea mas chico que vos', {
            fontSize: '20px',
            fill: '#111',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            wordWrap: { width: panelWidth - 60 }
        }).setOrigin(0.5)

        const arrowsIcon = this.add.image(panelX -80, panelY + 20, 'intro_arrows').setOrigin(0.5).setScale(0.25).setDepth(50)
        const stickIcon = this.add.image(panelX +80, panelY + 20, 'intro_stick').setOrigin(0.5).setScale(0.15).setDepth(50)

        const buttonBg = this.add.graphics()
        const buttonColor = 0xAFB7FA
        const buttonHoverColor = 0x99A7F0
        const buttonActiveColor = 0xD6DFFF
        const buttonBorderColor = 0x000000

        const drawButton = (color) => {
            buttonBg.clear()
            buttonBg.fillStyle(color, 1)
            buttonBg.fillRoundedRect(-100, -24, 200, 48, 14)
            buttonBg.lineStyle(2, buttonBorderColor, 0.9)
            buttonBg.strokeRoundedRect(-100, -24, 200, 48, 14)
        }

        drawButton(buttonColor)

        const buttonText = this.add.text(0, 0, 'Continuar', {
            fontSize: '22px',
            fill: '#000',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5)

        const hitBox = this.add.rectangle(0, 0, 0, 0, 0x000000, 0).setOrigin(0.5)

        const continueButton = this.add.container(panelX, panelY + 140, [buttonBg, buttonText, hitBox])
        continueButton.setSize(200, 48)
        hitBox.setInteractive(new Phaser.Geom.Rectangle(-100, -24, 200, 48), Phaser.Geom.Rectangle.Contains)
        hitBox.on('pointerover', () => {
            drawButton(buttonHoverColor)
        })
        hitBox.on('pointerout', () => {
            drawButton(buttonColor)
        })
        hitBox.on('pointerdown', () => {
            drawButton(buttonActiveColor)
            this.endLevelIntro()
        })

        this.introContainer = this.add.container(0, 0, [overlay, panel, introText, arrowsIcon, stickIcon, continueButton])
        this.introContainer.setScrollFactor(0)
        this.introContainer.setDepth(50)
    }

    endLevelIntro() {
        if (!this.isIntroActive) return
        this.isIntroActive = false
        this.introAButtonLast = false
        if (this.introContainer) {
            this.introContainer.destroy()
            this.introContainer = null
        }
        this.startGameTimers()
        if (this.level === 1) {
            this.time.addEvent({ delay: 800, callback: this.spawnSmall, callbackScope: this, loop: true })
            this.time.addEvent({ delay: 2000, callback: this.spawnBig, callbackScope: this, loop: true })
        }
    }

    checkIntroInput() {
        const pads = navigator.getGamepads?.()
        if (!pads || this.padIndex === null) return
        const pad = pads[this.padIndex]
        if (!pad || !pad.buttons) return

        const buttonA = pad.buttons[0]
        if (buttonA?.pressed && !this.introAButtonLast) {
            this.endLevelIntro()
        }
        this.introAButtonLast = buttonA?.pressed
    }

    updateTimer() {
        const currentTime = this.time.now
        if (currentTime - this.lastTimerUpdate >= 1000) {
            this.timeLeft--
            this.hudScene?.setTime(this.timeLeft)
            this.lastTimerUpdate = currentTime
            if (this.timeLeft <= 0 && !this.gameWon) {
                if (this.gameMusic) {
                    this.gameMusic.stop()
                }
                this.scene.pause()
                this.scene.launch('GameOverScene', { level: this.level })
                this.gameTimerActive = false
            }
        }
    }
    showWinScreen(score, timeLeft) {
    this.scene.pause()
    this.time.removeAllEvents()

    const cam = this.cameras.main
    const centerX = cam.scrollX + cam.width / 2
    const centerY = cam.scrollY + cam.height / 2

    const panelW = 340
    const panelH = 280

    const panel = this.add.graphics().setDepth(100)
    panel.fillStyle(0x444444, 0.95)
    panel.fillRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 20)
    panel.lineStyle(3, 0x888888, 1)
    panel.strokeRoundedRect(centerX - panelW/2, centerY - panelH/2, panelW, panelH, 20)

    this.add.text(centerX, centerY - 100, '¡Nivel Completado!', {
        fontSize: '26px', fill: '#66ff66', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101)

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    this.add.text(centerX, centerY - 45, `Tiempo restante: ${timeString}`, {
        fontSize: '20px', fill: '#cccccc', fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(101)

    this.add.text(centerX, centerY, `Puntos: ${score}`, {
        fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101)

    this.createWinButton(centerX - 85, centerY + 80, 'Volver al Menú', 0xff4444, () => {
        this.scene.stop('HUDScene')
        this.scene.start('MainMenuScene')
    })

    this.createWinButton(centerX + 85, centerY + 80, 'Siguiente Nivel', 0x44ff44, () => {
        this.scene.stop('HUDScene')
        this.scene.start('GameScene', { level: 2 })
    })
}

createWinButton(x, y, label, color, callback) {
    const bw = 150
    const bh = 50

    const bg = this.add.graphics().setDepth(101)
    bg.fillStyle(color, 0.85)
    bg.fillRoundedRect(x - bw/2, y - bh/2, bw, bh, 12)

    this.add.text(x, y, label, {
        fontSize: '16px', fill: '#000000', fontFamily: 'Arial, sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102)

    const hitArea = this.add.rectangle(x, y, bw, bh, 0xffffff, 0).setDepth(103)
    hitArea.setInteractive({ useHandCursor: true })
    hitArea.on('pointerdown', () => callback())
}

    checkWin() {
        // Para nivel 2, necesita llegar a size 400 (requiere comer los 2 edificios)
        if (this.level === 2) {
            if (!this.gameWon && this.player.sizeValue >= 260) {
                this.gameWon = true
                this.score += this.timeLeft
                this.hudScene?.setScore(this.score)
                this.player.playWinSound()
                if (this.gameMusic) {
                    this.gameMusic.stop()
                }
                this.scene.pause()
                this.scene.launch('WinScene', {
                    score: this.score,
                    timeLeft: this.timeLeft,
                    level: this.level
                })
                this.gameTimerActive = false
            }
        } else {
            // Nivel 1: necesita llegar a size 120 (15 small + 10 big particles)
            if (!this.gameWon && this.player.sizeValue >= 120) {
                this.gameWon = true
                this.score += this.timeLeft
                this.hudScene?.setScore(this.score)
                this.player.playWinSound()
                if (this.gameMusic) {
                    this.gameMusic.stop()
                }
                this.scene.pause()
                this.scene.launch('WinScene', {
                    score: this.score,
                    timeLeft: this.timeLeft,
                    level: this.level
                })
                this.gameTimerActive = false
            }
        }
    }

    spawnSmall() {
        SmallParticle.spawn(this.smallParticles, this)
    }

    spawnBig() {
        BigParticle.spawn(this.bigParticles, this)
    }

    absorbObject(player, obj) {
        // Desactivar la física del objeto para que no interfiera
        if (obj.body) {
            if (typeof obj.body.setVelocity === 'function') {
                obj.body.setVelocity(0, 0)
            }
            obj.body.enable = false
        }
        
        // Limpiar brackets cuando se absorbe el objeto
        this.clearCornerBrackets()
        
        // Animación estética: el objeto se encoge y se mueve hacia el centro del jugador
        this.tweens.add({
            targets: obj,
            displayWidth: { from: obj.displayWidth, to: 0 },
            displayHeight: { from: obj.displayHeight, to: 0 },
            x: player.x,
            y: player.y,
            duration: 250,
            ease: 'Power2.easeIn',
            onComplete: () => {
                obj.destroy()
            }
        })
    }

    createLevelMap() {
        if (this.level === 2) {
            // Usar Level2Config importado estáticamente
            this.levelWidth = Level2Config.width
            this.levelHeight = Level2Config.height
            this.roadPaths = Level2Config.roadPaths
            this.vehicleRoutes = Level2Config.vehicleRoutes
            this.staticObjectsData = Level2Config.staticObjectsData
        } else {
            this.levelWidth = 1600
            this.levelHeight = 1200
            this.roadPaths = []
            this.staticObjectsData = []
            this.vehicleRoutes = []
        }

        // Configuración de física y cámara (igual para ambos niveles)
        this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight)
        this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight)
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
        
        if (this.level === 2) {
            this.cameras.main.setZoom(1.2)
            // Mostrar el sprite del mapa de calles
            const roadsMap = this.add.sprite(800, 800, 'roads_map')
                .setOrigin(0.5)
                .setDepth(-1)
            this.drawStaticObjects()

            // Spawnear vehicles periódicamente
            this.time.addEvent({
                delay: 1800,
                callback: this.spawnVehicle,
                callbackScope: this,
                loop: true
            })

            // ⭐ COLISIONES DEL NIVEL 2

            // Colisión con objetos estáticos (solo cuando jugador es más pequeño)
            this.physics.add.collider(
                this.player,
                this.staticObjectsGroup,
                null,
                (player, obj) => player.sizeValue < obj.getData('sizeValue'),
                this
            )

            // Overlap para comer objetos estáticos (solo cuando jugador es más grande)
            this.physics.add.overlap(
                this.player,
                this.staticObjectsGroup,
                (player, obj) => {
                    if (player.sizeValue >= obj.getData('sizeValue')) {
                        const growthAmount = obj.getData('growth') || 0
                        player.grow(growthAmount)
                        this.score += 1
                        this.hudScene?.setScore(this.score)
                        this.checkWin()

                        const objectType = obj.getData('type')
                        if (objectType === 'TREE') {
                            const hojasSound = Phaser.Math.Between(0, 1) === 0 ? 'hojas1' : 'hojas2'
                            this.sound.play(hojasSound, { volume: 0.5 })
                        } else if (objectType === 'SMALL_HOUSE' || objectType === 'BIG_HOUSE' || objectType === 'BUILDING') {
                            const piedraSound = 'piedra' + Phaser.Math.Between(1, 3)
                            this.sound.play(piedraSound, { volume: 0.5 })
                        }

                        this.absorbObject(player, obj)
                    }
                },
                null,
                this
            )

            // Overlap para comer vehículos
            this.physics.add.overlap(
                this.player,
                this.vehicles,
                (player, vehicle) => {
                    if (player.sizeValue >= vehicle.getData('sizeValue')) {
                        if (vehicle.motorSound) {
                            vehicle.motorSound.stop()
                            vehicle.motorSound.destroy()
                            vehicle.motorSound = null
                        }

                        this.vehicles.remove(vehicle, false)

                        const crashIdx = Phaser.Math.Between(1, 4)
                        this.sound.play('crash' + crashIdx, { volume: 0.1 })

                        const vehicleType = vehicle.getData('type')
                        const typeData = Vehicle.TYPES[vehicleType]
                        const growthAmount = typeData.growth || 0

                        player.grow(growthAmount)
                        this.score += 1
                        this.hudScene?.setScore(this.score)
                        this.checkWin()
                        this.absorbObject(player, vehicle)
                    }
                },
                null,
                this
            )

            // Colisión para daño por vehículos agresivos
            this.physics.add.collider(
                this.player,
                this.vehicles,
                (player, vehicle) => {
                    if (vehicle.getData('state') === Vehicle.STATES.AGGRESSIVE) {
                        const vehicleType = vehicle.getData('type')
                        const currentTime = this.time.now
                        
                        if (vehicleType === 'POLICE_TRUCK') {
                            const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, player.x, player.y)
                            const pushForce = 350
                            player.body.setVelocity(
                                Math.cos(angle) * pushForce,
                                Math.sin(angle) * pushForce
                            )
                            
                            vehicle.setData('stunUntil', currentTime + 500)
                            
                            const lastDamageTime = vehicle.getData('lastDamageTime') || 0
                            if (currentTime >= lastDamageTime + 3000) {
                                const damageAmount = 5
                                player.receiveDamage(damageAmount)
                                this.hudScene?.setSizeValue(player.sizeValue)
                                vehicle.setData('lastDamageTime', currentTime)
                            }
                        } else if (vehicleType === 'TANK') {
                            if (player.sizeValue < vehicle.getData('sizeValue')) {
                                if (vehicle.motorSound) {
                                    vehicle.motorSound.stop();
                                }
                                player.die()
                                this.scene.pause()
                                this.scene.launch('GameOverScene', { level: this.level })
                                this.time.removeAllEvents()
                            }
                        }
                    }
                },
                null,
                this
            )

            // Colisión entre vehículos y objetos estáticos
            this.physics.add.collider(
                this.vehicles,
                this.staticObjectsGroup,
                null,
                null,
                this
            )

            // Colisión entre vehículos
            this.physics.add.collider(
                this.vehicles,
                this.vehicles,
                null,
                null,
                this
            )

            // Overlap de proyectiles con el jugador
            this.physics.add.overlap(
                this.player,
                this.projectiles,
                (player, projectile) => {
                    player.receiveDamage(3)
                    this.hudScene?.setSizeValue(player.sizeValue)
                    this.absorbObject(player, projectile)
                },
                null,
                this
            )
        } else {
            this.cameras.main.setZoom(1.5)
        }
    }

    drawRoads() {
        this.roadGraphics.clear()
        this.roadGraphics.lineStyle(2, 0x555555, 1)

        for (const path of this.roadPaths) {
            for (let i = 0; i < path.length - 1; i++) {
                const start = path[i]
                const end = path[i + 1]
                this.roadGraphics.strokeLineShape(new Phaser.Geom.Line(start.x, start.y, end.x, end.y))
            }
        }
    }

    drawStaticObjects() {
        for (const objData of this.staticObjectsData) {
            const obj = StaticObject.spawn(
                this,
                objData.x,
                objData.y,
                objData.type
            )
            this.staticObjectsGroup.add(obj)
        }
    }

    spawnVehicle() {
        if (this.vehicleRoutes.length === 0) return
        
        const routeIndex = Phaser.Math.Between(0, this.vehicleRoutes.length - 1)
        const route = this.vehicleRoutes[routeIndex]
        
        const vehicleTypes = [
            'CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR',
            'POLICE_TRUCK','POLICE_TRUCK','POLICE_TRUCK','POLICE_TRUCK',
            'TANK','TANK'
        ]
        const type = vehicleTypes[Phaser.Math.Between(0, vehicleTypes.length - 1)]
        
        // Usar Vehicle.spawn en lugar de crear rectángulo directamente
        const vehicle = Vehicle.spawn(this, route.spawnPoint.x, route.spawnPoint.y, routeIndex, type)
        
        this.vehicles.add(vehicle)
        
        vehicle.setData('waypoints', route.waypoints)
        vehicle.setData('currentWaypointIndex', 0)
        vehicle.setData('state', Vehicle.STATES.IDLE)
        vehicle.setData('fleeDirection', { x: 0, y: 0 })
        vehicle.setData('lastDamageTime', 0)
        vehicle.setData('stunUntil', 0)
        vehicle.setData('lastFireTime', 0)
    }

    findClosestTarget() {
    const player = this.player

    let bestBig = null
    let bestSmall = null
    let bestVehicle = null
    let bestStatic = null
    let bestBigDist = Infinity
    let bestSmallDist = Infinity
    let bestVehicleDist = Infinity
    let bestStaticDist = Infinity

    // 🔹 buscar big que pueda comer
    this.bigParticles.getChildren().forEach(obj => {
        if (!obj.active) return

        // En nivel 1, necesitas 35 size para comer big particles. En nivel 2, usa el size del objeto
        const requiredSize = this.level === 1 ? 35 : obj.getData('sizeValue')
        if (player.sizeValue >= requiredSize) {
            const d = Phaser.Math.Distance.Between(player.x, player.y, obj.x, obj.y)
            if (d < bestBigDist) {
                bestBigDist = d
                bestBig = obj
            }
        }
    })

    // 🔹 buscar vehículos comestibles
    this.vehicles.getChildren().forEach(vehicle => {
        if (!vehicle.active) return

        if (player.sizeValue >= vehicle.getData('sizeValue')) {
            const d = Phaser.Math.Distance.Between(player.x, player.y, vehicle.x, vehicle.y)
            if (d < bestVehicleDist) {
                bestVehicleDist = d
                bestVehicle = vehicle
            }
        }
    })

    // 🔹 buscar objetos estáticos comestibles (nivel 2)
    if (this.level === 2) {
        this.staticObjectsGroup.getChildren().forEach(obj => {
            if (!obj.active) return

            if (player.sizeValue >= obj.getData('sizeValue')) {
                const d = Phaser.Math.Distance.Between(player.x, player.y, obj.x, obj.y)
                if (d < bestStaticDist) {
                    bestStaticDist = d
                    bestStatic = obj
                }
            }
        })
    }

    // 🔹 buscar small
    this.smallParticles.getChildren().forEach(obj => {
        if (!obj.active) return

        const d = Phaser.Math.Distance.Between(player.x, player.y, obj.x, obj.y)
        if (d < bestSmallDist) {
            bestSmallDist = d
            bestSmall = obj
        }
    })

    const bestEdible = (() => {
        let candidate = bestSmall
        let candidateDist = bestSmallDist

        if (bestVehicle && bestVehicleDist < candidateDist) {
            candidate = bestVehicle
            candidateDist = bestVehicleDist
        }

        if (bestStatic && bestStaticDist < candidateDist) {
            candidate = bestStatic
            candidateDist = bestStaticDist
        }

        if (bestBig) {
            const preferBig = !candidate || bestBigDist <= candidateDist * 1.2 || bestBigDist <= 300
            return preferBig ? bestBig : candidate
        }

        return candidate
    })()

    return bestEdible
}

update() {
    const gamepadAxes = this.getGamepadAxes()

    if (this.isIntroActive) {
        this.checkIntroInput()
        return
    }

    this.player.update(this.cursors, gamepadAxes)

    this.maskSource.setPosition(this.player.x, this.player.y)
    this.maskSource.setScale(this.player.scale)
    
    // Actualizar tamaño en el HUD
    this.hudScene?.setSizeValue(this.player.sizeValue)

    // Actualizar timer si está activo
    if (this.gameTimerActive) {
        this.updateTimer()
    }

    // ⭐ Actualizar ojos INMEDIATAMENTE después de mover el jugador (sin retrasos)
    const eyeOffsetX = 4 * (this.player.spriteSize / 20)
    const eyeOffsetY = -2 * (this.player.spriteSize / 20)
    const scale = this.player.spriteSize / 20

    this.leftEye.setPosition(this.player.x - eyeOffsetX, this.player.y + eyeOffsetY).setScale(scale)
    this.rightEye.setPosition(this.player.x + eyeOffsetX, this.player.y + eyeOffsetY).setScale(scale)

    // Actualizar vehicles - con control de máximo 2 sonidos simultáneamente
    const vehicleDistances = []
    const stopDistance = 200 // Detener sonido si está a más de 200px
    
    this.vehicles.getChildren().forEach(vehicle => {
        Vehicle.update(vehicle, this)
        
        if (vehicle.motorSound) {
            const distance = Phaser.Math.Distance.Between(
                vehicle.x, vehicle.y,
                this.player.x, this.player.y
            )
            vehicleDistances.push({ vehicle, distance })
        }
    })
    
    // Ordenar por distancia (más cercanos primero)
    vehicleDistances.sort((a, b) => a.distance - b.distance)
    
    // Controlar qué sonidos están activos (máximo 2, y solo si están en rango)
    vehicleDistances.forEach((item, index) => {
        const vehicle = item.vehicle
        const distance = item.distance
        const isWithinRange = distance <= stopDistance
        const shouldPlay = isWithinRange && index < this.maxMotorSounds
        const isPlaying = vehicle.motorSound.isPlaying
        
        if (shouldPlay && !isPlaying) {
            // Reanudar sonido si está en rango y es uno de los 2 más cercanos
            vehicle.motorSound.play()
        } else if (!shouldPlay && isPlaying) {
            // Detener sonido completamente si está fuera de rango o no está en los 2 primeros
            vehicle.motorSound.stop()
        }
        
        // Ajustar volumen solo si está activo
        if (shouldPlay) {
            const maxDistance = stopDistance
            const maxVolume = 0.5
            const minVolume = 0.02
            const volume = Math.max(minVolume, maxVolume * (1 - distance / maxDistance))
            vehicle.motorSound.setVolume(volume)
        }
    })

    const cam = this.cameras.main
    this.smallParticles.getChildren().forEach(obj => {
        if (obj.x < cam.scrollX - 100 || obj.x > cam.scrollX + cam.width + 100) obj.destroy()
    })
    this.bigParticles.getChildren().forEach(obj => {
        if (obj.x < cam.scrollX - 100 || obj.x > cam.scrollX + cam.width + 100) obj.destroy()
    })

    // Limpiar proyectiles fuera de pantalla
    if (this.projectiles) {
        this.projectiles.getChildren().forEach(projectile => {
            if (projectile.x < cam.scrollX - 100 || projectile.x > cam.scrollX + cam.width + 100 ||
                projectile.y < cam.scrollY - 100 || projectile.y > cam.scrollY + cam.height + 100) {
                projectile.destroy()
            }
        })
    }

    const target = this.findClosestTarget()

    if (target) {
        const angle = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            target.x,
            target.y
        )

        // Move pupils towards target
        const pupilOffset = 1.5 * scale
        this.leftPupil.setPosition(
            this.leftEye.x + Math.cos(angle) * pupilOffset,
            this.leftEye.y + Math.sin(angle) * pupilOffset
        ).setScale(scale)
        this.rightPupil.setPosition(
            this.rightEye.x + Math.cos(angle) * pupilOffset,
            this.rightEye.y + Math.sin(angle) * pupilOffset
        ).setScale(scale)

        const targetDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y)
        const hideArrowDistance = Math.max(target.displayWidth, target.displayHeight) / 2 + this.player.spriteSize / 2 + 40
        const fadeStartDistance = hideArrowDistance + 100  // Comienza a desvanecer 200px antes

        // Calcular opacidad: 1 cuando está lejos, 0 cuando alcanza hideArrowDistance
        let opacity = 1
        if (targetDist <= fadeStartDistance) {
            opacity = Math.max(0, (targetDist - hideArrowDistance) / (fadeStartDistance - hideArrowDistance))
        }

        // Calcular color del target (necesario para flecha y brackets)
        const isBig = this.bigParticles.getChildren().includes(target)
        const isVehicle = this.vehicles.getChildren().includes(target)
        const isStatic = this.staticObjectsGroup.getChildren().includes(target)
        
        let arrowSizeLevel = 1
        let arrowColor = 0x784315
        
        if (this.level === 1) {
            arrowSizeLevel = isBig ? 3 : 1
            arrowColor = isBig ? 0x54460F : 0x784315
        } else if (this.level === 2) {
            if (isVehicle) {
                const vehicleType = target.getData('type')
                const vehicleTypeData = Vehicle.TYPES[vehicleType]
                arrowSizeLevel = vehicleType === 'TANK' ? 3 : 1
                arrowColor = vehicleTypeData.arrowColor || 0xFFFFFF
            } else if (isStatic) {
                const objectType = target.getData('type')
                const objectTypeData = StaticObject.TYPES[objectType]
                if (objectType === 'TREE') arrowSizeLevel = 2
                else if (objectType === 'SMALL_HOUSE') arrowSizeLevel = 3
                else if (objectType === 'BIG_HOUSE') arrowSizeLevel = 4
                else if (objectType === 'BUILDING') arrowSizeLevel = 5
                arrowColor = objectTypeData.arrowColor || 0xFFFFFF
            }
        }

        // Dibujar corner brackets siempre (sigan al objeto) con opacidad dinámica
        this.drawCornerBrackets(target, arrowColor, opacity)

        if (targetDist <= hideArrowDistance) {
            this.arrow.setVisible(false)
        } else {
            // posición: separada del player para que no quede pegada
            const distanceFromPlayer = this.player.spriteSize + 40
            const desiredX = this.player.x + Math.cos(angle) * distanceFromPlayer
            const desiredY = this.player.y + Math.sin(angle) * distanceFromPlayer

            this.arrow.x += (desiredX - this.arrow.x) * 0.15
            this.arrow.y += (desiredY - this.arrow.y) * 0.15

            // Convertir nivel (1-5) a escala de flecha
            const arrowScaleMap = { 1: 0.15, 2: 0.25, 3: 0.35, 4: 0.45, 5: 0.55 }
            const arrowScale = arrowScaleMap[arrowSizeLevel] || 0.2
            
            this.arrow.setScale(arrowScale)
            this.arrow.setTint(arrowColor)
            this.arrow.setAlpha(opacity)  // ⭐ Fade de la flecha

            const targetRotation = angle + Math.PI / 2
            this.arrow.rotation = Phaser.Math.Angle.RotateTo(this.arrow.rotation, targetRotation, 0.08)
            this.arrow.setVisible(true)
        }
    } else {
        // Reset pupils to center
        this.leftPupil.setPosition(this.leftEye.x, this.leftEye.y).setScale(scale)
        this.rightPupil.setPosition(this.rightEye.x, this.rightEye.y).setScale(scale)
        this.arrow.setVisible(false)
        this.arrow.clearTint()  // Limpiar tinte cuando no hay target
        this.clearCornerBrackets()
    }
}

drawCornerBrackets(target, color, opacity = 0.9) {
    const cfg = this.bracketConfig
    const isVehicle = this.vehicles.getChildren().includes(target)
    
    // Calcular dimensiones del objeto
    const width = target.displayWidth + cfg.padding * 2
    const height = target.displayHeight + cfg.padding * 2
    const left = target.x - width / 2
    const right = target.x + width / 2
    const top = target.y - height / 2
    const bottom = target.y + height / 2

    // Limpiar gráficos anteriores
    for (const corner of Object.values(this.cornerBrackets)) {
        corner.clear()
    }

    // Calcular rotación si es un vehículo
    const velocity = isVehicle ? target.body?.velocity : { x: 0, y: 0 }
    let autoRotation = 0
    if (isVehicle && velocity && (Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1)) {
        autoRotation = Phaser.Math.Angle.Between(0, 0, velocity.x, velocity.y)
    }

    // Función para rotación de puntos alrededor del centro
    const rotatePoint = (x, y, cx, cy, angle) => {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const dx = x - cx
        const dy = y - cy
        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        }
    }

    // Función para dibujar una L (esquina)
    const drawCorner = (graphics, cornerX, cornerY, endX, endY) => {
        graphics.lineStyle(cfg.lineWidth, color, opacity)
        graphics.beginPath()
        graphics.moveTo(cornerX, cornerY)
        graphics.lineTo(endX, cornerY)    // Línea horizontal
        graphics.moveTo(cornerX, cornerY)
        graphics.lineTo(cornerX, endY)    // Línea vertical
        graphics.strokePath()
    }

    if (isVehicle && autoRotation !== 0) {
        // Para vehículos: rotar las esquinas según la dirección del movimiento
        const cx = target.x
        const cy = target.y

        // Esquina superior izquierda (L arriba-derecha)
        const tl_corner = rotatePoint(left, top, cx, cy, autoRotation)
        const tl_h = rotatePoint(left + cfg.cornerSize, top, cx, cy, autoRotation)
        const tl_v = rotatePoint(left, top + cfg.cornerSize, cx, cy, autoRotation)
        
        this.cornerBrackets.topLeft.lineStyle(cfg.lineWidth, color, opacity)
        this.cornerBrackets.topLeft.beginPath()
        this.cornerBrackets.topLeft.moveTo(tl_corner.x, tl_corner.y)
        this.cornerBrackets.topLeft.lineTo(tl_h.x, tl_h.y)
        this.cornerBrackets.topLeft.moveTo(tl_corner.x, tl_corner.y)
        this.cornerBrackets.topLeft.lineTo(tl_v.x, tl_v.y)
        this.cornerBrackets.topLeft.strokePath()

        // Esquina superior derecha (L arriba-izquierda)
        const tr_corner = rotatePoint(right, top, cx, cy, autoRotation)
        const tr_h = rotatePoint(right - cfg.cornerSize, top, cx, cy, autoRotation)
        const tr_v = rotatePoint(right, top + cfg.cornerSize, cx, cy, autoRotation)
        
        this.cornerBrackets.topRight.lineStyle(cfg.lineWidth, color, opacity)
        this.cornerBrackets.topRight.beginPath()
        this.cornerBrackets.topRight.moveTo(tr_corner.x, tr_corner.y)
        this.cornerBrackets.topRight.lineTo(tr_h.x, tr_h.y)
        this.cornerBrackets.topRight.moveTo(tr_corner.x, tr_corner.y)
        this.cornerBrackets.topRight.lineTo(tr_v.x, tr_v.y)
        this.cornerBrackets.topRight.strokePath()

        // Esquina inferior izquierda (L abajo-derecha)
        const bl_corner = rotatePoint(left, bottom, cx, cy, autoRotation)
        const bl_h = rotatePoint(left + cfg.cornerSize, bottom, cx, cy, autoRotation)
        const bl_v = rotatePoint(left, bottom - cfg.cornerSize, cx, cy, autoRotation)
        
        this.cornerBrackets.bottomLeft.lineStyle(cfg.lineWidth, color, opacity)
        this.cornerBrackets.bottomLeft.beginPath()
        this.cornerBrackets.bottomLeft.moveTo(bl_corner.x, bl_corner.y)
        this.cornerBrackets.bottomLeft.lineTo(bl_h.x, bl_h.y)
        this.cornerBrackets.bottomLeft.moveTo(bl_corner.x, bl_corner.y)
        this.cornerBrackets.bottomLeft.lineTo(bl_v.x, bl_v.y)
        this.cornerBrackets.bottomLeft.strokePath()

        // Esquina inferior derecha (L abajo-izquierda)
        const br_corner = rotatePoint(right, bottom, cx, cy, autoRotation)
        const br_h = rotatePoint(right - cfg.cornerSize, bottom, cx, cy, autoRotation)
        const br_v = rotatePoint(right, bottom - cfg.cornerSize, cx, cy, autoRotation)
        
        this.cornerBrackets.bottomRight.lineStyle(cfg.lineWidth, color, opacity)
        this.cornerBrackets.bottomRight.beginPath()
        this.cornerBrackets.bottomRight.moveTo(br_corner.x, br_corner.y)
        this.cornerBrackets.bottomRight.lineTo(br_h.x, br_h.y)
        this.cornerBrackets.bottomRight.moveTo(br_corner.x, br_corner.y)
        this.cornerBrackets.bottomRight.lineTo(br_v.x, br_v.y)
        this.cornerBrackets.bottomRight.strokePath()
    } else {
        // Para objetos estáticos: sin rotación (L simples y limpias)
        
        // Esquina superior izquierda
        drawCorner(this.cornerBrackets.topLeft, left, top, left + cfg.cornerSize, top + cfg.cornerSize)

        // Esquina superior derecha
        drawCorner(this.cornerBrackets.topRight, right, top, right - cfg.cornerSize, top + cfg.cornerSize)

        // Esquina inferior izquierda
        drawCorner(this.cornerBrackets.bottomLeft, left, bottom, left + cfg.cornerSize, bottom - cfg.cornerSize)

        // Esquina inferior derecha
        drawCorner(this.cornerBrackets.bottomRight, right, bottom, right - cfg.cornerSize, bottom - cfg.cornerSize)
    }
}

clearCornerBrackets() {
    for (const corner of Object.values(this.cornerBrackets)) {
        corner.clear()
    }
}
}