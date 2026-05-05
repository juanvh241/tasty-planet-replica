import * as Phaser from 'phaser'

export class FoodObject {
    static spawn(group, x, y, textureKey, displaySize, circleRadius, offsetX, offsetY, size, growAmount, vx, vy) {
        const obj = group.create(x, y, textureKey)
        obj.setDisplaySize(displaySize, displaySize)
        obj.body.setAllowGravity(false)
        obj.body.setCircle(circleRadius, offsetX, offsetY)
        obj.setData('sizeValue', size)
        obj.setData('growAmount', growAmount)
        obj.setVelocity(vx, vy)
        return obj
    }
}