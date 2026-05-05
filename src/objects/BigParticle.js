import { FoodObject } from './FoodObject.js'
import * as Phaser from 'phaser'

export class BigParticle {
    static spawn(group, scene) {
        const cam = scene.cameras.main
        const fromLeft = Phaser.Math.Between(0, 1) === 0
        const x = fromLeft ? cam.scrollX - 40 : cam.scrollX + cam.width + 40
        const y = Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height)
        const speed = Phaser.Math.FloatBetween(30, 70)
        const vx = fromLeft ? speed : -speed
        const vy = Phaser.Math.FloatBetween(-30, 30)
        const obj = FoodObject.spawn(group, x, y, 'particle_big', 40, 45, 20, 20, 35, 8, vx, vy)
        obj.body.setImmovable(true)
        return obj
    }
}