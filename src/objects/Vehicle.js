import * as Phaser from 'phaser'

export class Vehicle {
    static STATES = {
        IDLE: 'idle',
        AGGRESSIVE: 'aggressive',
        FLEEING: 'fleeing'
    }

    static TYPES = {
        CAR: { 
            size: 20,  // Igual al player inicial, se puede comer de entrada
            width: 32, 
            height: 16, 
            color: 0xff0000,
            speed: 80,
            fleeRadius: 150,
            hitboxRadius: 12,
            hitboxOffsetX: 20,
            hitboxOffsetY: 6,
            growth: 1,
            arrowColor: 0xffffff  // Amarillo
        },
        POLICE_TRUCK: {
            size: 30,  // Se desbloquea después de 15 autos
            width: 42,
            height: 24,
            color: 0x0000ff,
            speed: 80,
            fleeRadius: 200,
            aggressiveRadius: 250,
            hitboxRadius: 14,
            hitboxOffsetX: 18,
            hitboxOffsetY: 6,
            growth: 2,
            arrowColor: 0x003FFF  // Cian
        },
        TANK: {
            size: 40,  // Ahora es más pequeño que los árboles grandes
            width: 56,
            height: 32,
            color: 0x808000,
            speed: 60,
            fleeRadius: 250,
            aggressiveRadius: 300,
            fireRate: 3000,
            hitboxRadius: 16,
            hitboxOffsetX: 15,
            hitboxOffsetY: 5,
            growth: 4,
            arrowColor: 0x86C90E  // Magenta
        }
    }

    static spawn(scene, x, y, routeIndex = 0, type = 'CAR') {
        const typeData = this.TYPES[type] || this.TYPES.CAR
        
        // Crear vehículo usando sprite
        let vehicle
        if (type === 'CAR') {
            vehicle = scene.add.sprite(x, y, 'car_1')
            vehicle.setOrigin(0.5)
            // Motor idle sound (volumen será ajustado por distancia)
            vehicle.motorSound = scene.sound.add('motor_sfx', { loop: true, volume: 0.2 })
            vehicle.motorSound.play()
        } else if (type === 'POLICE_TRUCK') {
            vehicle = scene.add.sprite(x, y, 'police_truck')
            vehicle.setOrigin(0.5)
            vehicle.motorSound = scene.sound.add('motor_sfx', { loop: true, volume: 0.2 })
            vehicle.motorSound.play()
        } else if (type === 'TANK') {
            vehicle = scene.add.sprite(x, y, 'tank')
            vehicle.setOrigin(0.5)
            // Motor de tanque (sonido diferente)
            vehicle.motorSound = scene.sound.add('tanque_movimiento', { loop: true, volume: 0.2 })
            vehicle.motorSound.play()
        } else {
            vehicle = scene.add.rectangle(x, y, typeData.width, typeData.height, typeData.color)
        }
        
        // Establecer display size antes de agregar física para sprites
        if (type === 'CAR' || type === 'POLICE_TRUCK' || type === 'TANK') {
            vehicle.setDisplaySize(typeData.width, typeData.height)
        }
        
        // Agregar física dinámica DESPUÉS de configurar el sprite
        scene.physics.add.existing(vehicle, false)
        
        // Configurar hitbox circular con offsets ajustables manualmente
        const hitboxRadius = typeData.hitboxRadius || typeData.width / 2
        const offsetX = typeData.hitboxOffsetX || 0
        const offsetY = typeData.hitboxOffsetY || 0
        vehicle.body.setCircle(hitboxRadius, offsetX, offsetY)
        
        // Configurar propiedades
        vehicle.body.setCollideWorldBounds(false)
        vehicle.body.setDrag(0)
        
        // Datos del vehículo
        vehicle.setData('sizeValue', typeData.size)
        vehicle.setData('type', type)
        vehicle.setData('speed', typeData.speed)
        vehicle.setData('fleeRadius', typeData.fleeRadius)
        vehicle.setData('aggressiveRadius', typeData.aggressiveRadius || 0)
        vehicle.setData('routeIndex', routeIndex)
        vehicle.setData('waypoints', []) // Se asigna en spawnVehicle
        vehicle.setData('currentWaypointIndex', 0)
        vehicle.setData('state', this.STATES.IDLE)
        vehicle.setData('fleeDirection', { x: 0, y: 0 })
        vehicle.setData('lastDamageTime', 0) // Para cooldown de daño
        vehicle.setData('stunUntil', 0) // Para stun después de golpear
        vehicle.setData('lastFireTime', 0) // Para cooldown de disparo (tanques)
        
        return vehicle
    }

    static update(vehicle, scene) {
        const player = scene.player
        const state = vehicle.getData('state')
        const fleeRadius = vehicle.getData('fleeRadius')
        const aggressiveRadius = vehicle.getData('aggressiveRadius')
        const distanceToPlayer = Phaser.Math.Distance.Between(vehicle.x, vehicle.y, player.x, player.y)
        const playerCanEat = player.sizeValue >= vehicle.getData('sizeValue')
        
        // Lógica de cambio de estado
        if (state === this.STATES.IDLE) {
            if (playerCanEat && distanceToPlayer <= fleeRadius) {
                vehicle.setData('state', this.STATES.FLEEING)
                const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, player.x, player.y)
                const fleeAngle = angle + Math.PI // Dirección opuesta
                vehicle.setData('fleeDirection', { 
                    x: Math.cos(fleeAngle), 
                    y: Math.sin(fleeAngle) 
                })
            } else if (aggressiveRadius > 0 && !playerCanEat && distanceToPlayer <= aggressiveRadius) {
                vehicle.setData('state', this.STATES.AGGRESSIVE)
            }
        } else if (state === this.STATES.AGGRESSIVE) {
            // Si el jugador se aleja o puede comerlo, volver a IDLE
            if (distanceToPlayer > aggressiveRadius || playerCanEat) {
                vehicle.setData('state', this.STATES.IDLE)
            }
        } else if (state === this.STATES.FLEEING) {
            // Una vez en estado de huida, se queda huyendo indefinidamente
            // No cambia de estado
        }
        
        if (state === this.STATES.IDLE) {
            this.updateIdle(vehicle, scene)
        } else if (state === this.STATES.AGGRESSIVE) {
            this.updateAggressive(vehicle, scene)
        } else if (state === this.STATES.FLEEING) {
            this.updateFleeing(vehicle, scene)
        }
        
        // Destruir si sale demasiado de la pantalla
        const cam = scene.cameras.main
        if (vehicle.x < cam.scrollX - 1700 || vehicle.x > cam.scrollX + cam.width + 1700 ||
            vehicle.y < cam.scrollY - 1700 || vehicle.y > cam.scrollY + cam.height + 1700) {
            if (vehicle.motorSound) vehicle.motorSound.stop()
            vehicle.destroy()
        }
    }
    
    static updateIdle(vehicle, scene) {
        const waypoints = vehicle.getData('waypoints')
        
        if (!waypoints || waypoints.length === 0) return
        
        // Obtener el waypoint actual
        let currentWaypointIndex = vehicle.getData('currentWaypointIndex')
        const currentWaypoint = waypoints[currentWaypointIndex]
        
        if (!currentWaypoint) {
            // Fin de la ruta, destruir
            if (vehicle.motorSound) vehicle.motorSound.stop()
            vehicle.destroy()
            return
        }
        
        // Distancia al waypoint actual
        const distance = Phaser.Math.Distance.Between(vehicle.x, vehicle.y, currentWaypoint.x, currentWaypoint.y)
        const speed = vehicle.getData('speed')
        const stoppingDistance = speed * 0.1 // Distancia de parada para cambiar de waypoint
        
        if (distance <= stoppingDistance) {
            // Llegó al waypoint, pasar al siguiente
            currentWaypointIndex++
            vehicle.setData('currentWaypointIndex', currentWaypointIndex)
            
            if (currentWaypointIndex >= waypoints.length) {
                // Fin de la ruta, destruir
                if (vehicle.motorSound) vehicle.motorSound.stop()
                vehicle.destroy()
                return
            }
            return // Recalcular con el nuevo waypoint en el siguiente frame
        }
        
        // Mover hacia el waypoint actual
        const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, currentWaypoint.x, currentWaypoint.y)
        
        vehicle.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        )
        
        // Rotar el auto hacia la dirección de movimiento
        vehicle.rotation = angle
    }
    
    static updateAggressive(vehicle, scene) {
        const player = scene.player
        const speed = vehicle.getData('speed')
        const type = vehicle.getData('type')
        
        // Verificar si está en stun (parado después de golpear)
        const stunUntil = vehicle.getData('stunUntil') || 0
        if (scene.time.now < stunUntil) {
            // Quedarse quieto durante el stun
            vehicle.body.setVelocity(0, 0)
            return
        }
        
        // Perseguir al jugador
        const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, player.x, player.y)
        
        vehicle.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        )
        
        // Rotar hacia la dirección de persecución
        vehicle.rotation = angle
        
        // Si es tanque, disparar al jugador
        if (type === 'TANK') {
            this.fireProjectile(vehicle, scene, player)
        }
    }
    
    static fireProjectile(vehicle, scene, player) {
        const typeData = Vehicle.TYPES.TANK
        const currentTime = scene.time.now
        const lastFireTime = vehicle.getData('lastFireTime') || 0
        
        if (currentTime - lastFireTime >= typeData.fireRate) {
            // Calcular ángulo hacia el jugador
            const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, player.x, player.y)
            
            // Crear proyectil pequeño
            const projectile = scene.add.circle(
                vehicle.x,
                vehicle.y,
                5, // Radio pequeño
                0xFF0000 // Naranja
            )
            
            // Agregar a grupo de proyectiles (physics group automáticamente da física)
            scene.projectiles.add(projectile)
            projectile.body.setCircle(5)
            projectile.body.setVelocity(
                Math.cos(angle) * 150, // Velocidad lenta
                Math.sin(angle) * 150
            )
            
            projectile.setData('spawnTime', currentTime)
            vehicle.setData('lastFireTime', currentTime)
            scene.sound.play('tanque disparo', { volume: 0.1 })
        }
    }
    
    static updateFleeing(vehicle, scene) {
        const fleeDirection = vehicle.getData('fleeDirection')
        const speed = vehicle.getData('speed')
        
        // Huir en línea recta, sin intentar volver al path
        vehicle.body.setVelocity(
            fleeDirection.x * speed,
            fleeDirection.y * speed
        )
        
        // Rotar el auto hacia la dirección de huida
        const angle = Math.atan2(fleeDirection.y, fleeDirection.x)
        vehicle.rotation = angle
    }
}