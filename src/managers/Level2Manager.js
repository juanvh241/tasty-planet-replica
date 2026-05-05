import { Level2Config } from '../config/Level2Config.js'
import { Vehicle } from '../objects/Vehicle.js'
import { StaticObject } from '../objects/StaticObject.js'

/**
 * Manager para la creación y lógica del Nivel 2
 * Maneja: dibujado de rutas, objetos estáticos, spawn de vehículos, y colisiones
 */

export class Level2Manager {
    constructor(scene) {
        this.scene = scene
    }

    /**
     * Inicializa toda la configuración y lógica del Nivel 2
     */
    initialize() {
        // Cargar configuración
        this.scene.levelWidth = Level2Config.width
        this.scene.levelHeight = Level2Config.height
        this.scene.roadPaths = Level2Config.roadPaths
        this.scene.vehicleRoutes = Level2Config.vehicleRoutes
        this.scene.staticObjectsData = Level2Config.staticObjectsData

        // Configurar mundo y cámara
        this.scene.physics.world.setBounds(0, 0, this.scene.levelWidth, this.scene.levelHeight)
        this.scene.cameras.main.setBounds(0, 0, this.scene.levelWidth, this.scene.levelHeight)
        this.scene.cameras.main.setZoom(Level2Config.zoom)

        // Dibujar nivel
        this.scene.roadGraphics = this.scene.add.graphics().setDepth(0)
        this.drawRoads()
        this.drawStaticObjects()

        // Iniciar spawn de vehículos
        this.scene.time.addEvent({
            delay: 1800,
            callback: this.spawnVehicle.bind(this),
            loop: true
        })

        // Configurar colisiones
        this.setupCollisions()
    }

    /**
     * Dibuja las rutas visuales de las calles
     */
    drawRoads() {
        this.scene.roadGraphics.clear()
        this.scene.roadGraphics.lineStyle(2, 0x555555, 1)

        for (const path of this.scene.roadPaths) {
            for (let i = 0; i < path.length - 1; i++) {
                const start = path[i]
                const end = path[i + 1]
                this.scene.roadGraphics.strokeLineShape(
                    new Phaser.Geom.Line(start.x, start.y, end.x, end.y)
                )
            }
        }
    }

    /**
     * Dibuja y crea los objetos estáticos del nivel
     */
    drawStaticObjects() {
        for (const objData of this.scene.staticObjectsData) {
            const obj = StaticObject.spawn(
                this.scene,
                objData.x,
                objData.y,
                objData.type
            )
            this.scene.staticObjectsGroup.add(obj)
        }
    }

    /**
     * Spawnea un vehículo aleatorio en una ruta aleatoria
     */
    spawnVehicle() {
        if (this.scene.vehicleRoutes.length === 0) return

        // Elegir ruta aleatoria
        const routeIndex = Phaser.Math.Between(0, this.scene.vehicleRoutes.length - 1)
        const route = this.scene.vehicleRoutes[routeIndex]

        // Elegir tipo de vehículo: más autos, menos camiones, pocos tanques
        const vehicleTypes = [
            'CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR','CAR',
            'POLICE_TRUCK','POLICE_TRUCK','POLICE_TRUCK','POLICE_TRUCK',
            'TANK','TANK'
        ]
        const type = vehicleTypes[Phaser.Math.Between(0, vehicleTypes.length - 1)]
        const typeData = Vehicle.TYPES[type]

        // Crear vehículo
        const vehicle = this.scene.add.rectangle(
            route.spawnPoint.x,
            route.spawnPoint.y,
            typeData.width,
            typeData.height,
            typeData.color
        )

        this.scene.vehicles.add(vehicle)
        this.scene.physics.add.existing(vehicle, false)

        // Configurar hitbox
        const hitboxRadius = typeData.hitboxRadius || typeData.width / 2
        const offsetX = typeData.hitboxOffsetX || 0
        const offsetY = typeData.hitboxOffsetY || 0
        vehicle.body.setCircle(hitboxRadius, offsetX, offsetY)
        vehicle.body.setCollideWorldBounds(false)
        vehicle.body.setDrag(0)

        // Configurar datos del vehículo
        vehicle.setData('sizeValue', typeData.size)
        vehicle.setData('type', type)
        vehicle.setData('speed', typeData.speed)
        vehicle.setData('fleeRadius', typeData.fleeRadius)
        vehicle.setData('aggressiveRadius', typeData.aggressiveRadius || 0)
        vehicle.setData('routeIndex', routeIndex)
        vehicle.setData('waypoints', route.waypoints)
        vehicle.setData('currentWaypointIndex', 0)
        vehicle.setData('state', Vehicle.STATES.IDLE)
        vehicle.setData('fleeDirection', { x: 0, y: 0 })
        vehicle.setData('lastDamageTime', 0)
        vehicle.setData('stunUntil', 0)
        vehicle.setData('lastFireTime', 0)
    }

    /**
     * Configura todas las colisiones y overlaps del Nivel 2
     */
    setupCollisions() {
        const scene = this.scene

        // Colisión con objetos estáticos (solo cuando el jugador es más pequeño)
        scene.physics.add.collider(
            scene.player,
            scene.staticObjectsGroup,
            null,
            (player, obj) => player.sizeValue < obj.getData('sizeValue'),
            scene
        )

        // Overlap para comer objetos estáticos (solo cuando el jugador es más grande)
        scene.physics.add.overlap(
            scene.player,
            scene.staticObjectsGroup,
            (player, obj) => {
                if (player.sizeValue >= obj.getData('sizeValue')) {
                    const growthAmount = obj.getData('growth') || 0
                    player.grow(growthAmount)
                    scene.score += 1
                    scene.hudScene?.setScore(scene.score)
                    scene.checkWin()
                    scene.absorbObject(player, obj)
                }
            },
            null,
            scene
        )

        // Overlap para comer vehículos
        scene.physics.add.overlap(
            scene.player,
            scene.vehicles,
            (player, vehicle) => {
                if (player.sizeValue >= vehicle.getData('sizeValue')) {
                    const vehicleType = vehicle.getData('type')
                    const typeData = Vehicle.TYPES[vehicleType]
                    const growthAmount = typeData.growth || 0

                    player.grow(growthAmount)
                    scene.score += 1
                    scene.hudScene?.setScore(scene.score)
                    scene.checkWin()
                    scene.absorbObject(player, vehicle)
                }
            },
            null,
            scene
        )

        // Colisión para daño por vehículos agresivos
        scene.physics.add.collider(
            scene.player,
            scene.vehicles,
            (player, vehicle) => {
                if (vehicle.getData('state') === Vehicle.STATES.AGGRESSIVE) {
                    const vehicleType = vehicle.getData('type')
                    const currentTime = scene.time.now

                    if (vehicleType === 'POLICE_TRUCK') {
                        // Empujar al jugador
                        const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, player.x, player.y)
                        const pushForce = 350
                        player.body.setVelocity(
                            Math.cos(angle) * pushForce,
                            Math.sin(angle) * pushForce
                        )

                        vehicle.setData('stunUntil', currentTime + 500)

                        // Daño cada 3 segundos
                        const lastDamageTime = vehicle.getData('lastDamageTime') || 0
                        if (currentTime >= lastDamageTime + 3000) {
                            const damageAmount = 5
                            player.receiveDamage(damageAmount)
                            scene.hudScene?.setSizeValue(player.sizeValue)
                            vehicle.setData('lastDamageTime', currentTime)
                        }
                    } else if (vehicleType === 'TANK') {
                        // Tanque instakill si el jugador es más pequeño
                        if (player.sizeValue < vehicle.getData('sizeValue')) {
                            if (vehicle.motorSound) {
                                vehicle.motorSound.stop();
                            }
                            if (scene.gameMusic) {
                                scene.gameMusic.stop()
                            }
                            player.die()
                            scene.scene.pause()
                            scene.scene.launch('GameOverScene', { level: scene.level })
                            scene.time.removeAllEvents()
                        }
                    }
                }
            },
            null,
            scene
        )

        // Colisión entre vehículos y objetos estáticos
        scene.physics.add.collider(
            scene.vehicles,
            scene.staticObjectsGroup,
            null,
            null,
            scene
        )

        // Colisión entre vehículos
        scene.physics.add.collider(
            scene.vehicles,
            scene.vehicles,
            null,
            null,
            scene
        )

        // Overlap de proyectiles con el jugador
        scene.physics.add.overlap(
            scene.player,
            scene.projectiles,
            (player, projectile) => {
                player.receiveDamage(3)
                scene.hudScene?.setSizeValue(player.sizeValue)
                scene.absorbObject(player, projectile)
            },
            null,
            scene
        )
    }
}
