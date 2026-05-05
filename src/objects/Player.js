import * as Phaser from 'phaser'

export class Player extends Phaser.GameObjects.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'player')

        scene.add.existing(this)
        scene.physics.add.existing(this, false)

        this.spriteSize = 20
        this.sizeValue = 20
        
        // Le damos la forma circular tomando la textura ORIGINAL (this.width).
        // Al hacer esto, Phaser se encarga de que la hitbox arranque centrada joya.
        this.body.setCircle(this.width / 2)

        this.speed = 200
        this.acceleration = 2200
        this.drag = 800

        // Ahora, al setear el display size, Phaser escala la imagen Y la hitbox juntas
        this.setDisplaySize(this.spriteSize, this.spriteSize)
        this.body.setAllowGravity(false)
        this.body.setDrag(this.drag, this.drag)
        this.body.setCollideWorldBounds(true)
    }

    update(cursors, gamepadAxes = null) {
        let ax = 0
        let ay = 0

        if (gamepadAxes && (gamepadAxes.x !== 0 || gamepadAxes.y !== 0)) {
            ax = gamepadAxes.x
            ay = gamepadAxes.y
        } else {
            if (cursors.left.isDown) ax = -1
            else if (cursors.right.isDown) ax = 1

            if (cursors.up.isDown) ay = -1
            else if (cursors.down.isDown) ay = 1
        }

        if (ax !== 0 && ay !== 0) {
            ax *= Math.SQRT1_2
            ay *= Math.SQRT1_2
        }

        this.body.setAcceleration(ax * this.acceleration, ay * this.acceleration)

        const vx = this.body.velocity.x
        const vy = this.body.velocity.y
        const currentSpeed = Math.sqrt(vx * vx + vy * vy)

        if (currentSpeed > this.speed) {
            const scale = this.speed / currentSpeed
            this.body.setVelocity(vx * scale, vy * scale)
        }
    }

    grow(value) {
        const oldSize = this.sizeValue
        const newSize = oldSize + value

        this.sizeValue = newSize
        this.spriteSize = newSize

        this.scene.tweens.add({
            targets: this,
            displayWidth: newSize,
            displayHeight: newSize,
            duration: Math.max(200, Math.abs(newSize - oldSize) * 30),
            ease: 'Linear'
        })

        this.playRandomIdleSound()
    }

    receiveDamage(value) {
        const oldSize = this.sizeValue
        const newSize = Math.max(20, oldSize - value)

        this.sizeValue = newSize
        this.spriteSize = newSize

        this.scene.tweens.add({
            targets: this,
            displayWidth: newSize,
            displayHeight: newSize,
            duration: Math.max(200, Math.abs(newSize - oldSize) * 30),
            ease: 'Linear'
        })

        this.playDamageSound()
    }

    die() {
        this.scene.sound.play('player_death', { volume: 0.75 })
    }

    playRandomIdleSound() {
        // Baja probabilidad de emitir un sonido al comer algo
        if (Phaser.Math.Between(0, 9) !== 0) return
        const soundKey = 'player_idle' + Phaser.Math.Between(1, 3)
        this.scene.sound.play(soundKey, { volume: 0.65 })
    }

    playDamageSound() {
        const soundKey = 'player_damage' + Phaser.Math.Between(1, 2)
        this.scene.sound.play(soundKey, { volume: 0.7 })
    }

    playWinSound() {
        this.scene.sound.play('player_win', { volume: 0.75 })
    }

    shrink(value) {
        const oldSize = this.sizeValue
        const newSize = Math.max(20, oldSize - value)

        this.sizeValue = newSize
        this.spriteSize = newSize

        this.scene.tweens.add({
            targets: this,
            displayWidth: newSize,
            displayHeight: newSize,
            duration: Math.max(200, Math.abs(newSize - oldSize) * 30),
            ease: 'Linear'
        })
    }
}