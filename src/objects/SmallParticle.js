import { FoodObject } from './FoodObject.js'
import * as Phaser from 'phaser'

export class SmallParticle {
    static spawn(group, scene) {
        const cam = scene.cameras.main
        const fromLeft = Phaser.Math.Between(0, 1) === 0
        const x = fromLeft ? cam.scrollX - 20 : cam.scrollX + cam.width + 20
        const y = Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height)
        const speed = Phaser.Math.FloatBetween(40, 100)
        const vx = fromLeft ? speed : -speed
        const vy = Phaser.Math.FloatBetween(-40, 40)
        return FoodObject.spawn(group, x, y, 'particle_small', 16, 30, 40, 40, 8, 1, vx, vy)
    }
}