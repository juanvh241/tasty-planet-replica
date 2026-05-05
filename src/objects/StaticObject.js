import * as Phaser from 'phaser'

export class StaticObject {
    // Tipos de objetos estáticos
    static TYPES = {
        TREE: {
            size: 60,
            width: 70,
            height: 70,
            color: 0x228B22,
            shape: 'circle',
            growth: 4,
            arrowColor: 0x084500,
            hitboxRadius: 35
        },  // Verde
        SMALL_HOUSE: {
            size: 80,
            width: 84,
            height: 84,
            color: 0x8B4513,
            shape: 'rect',
            growth: 4,
            arrowColor: 0x4D1806,
            hitboxWidth: 70,
            hitboxHeight: 70,
            hitboxOffsetX: 8,
            hitboxOffsetY: 8
        },  // Naranja
        BIG_HOUSE: {
            size: 135,
            width: 128,
            height: 128,
            color: 0xA0522D,
            shape: 'rect',
            growth: 10,
            arrowColor: 0xEBCFB4,
            hitboxWidth: 112,
            hitboxHeight: 112,
            hitboxOffsetX: 6,
            hitboxOffsetY: 6
        },  // Rojo
        BUILDING: {
            size: 185,
            width: 256,
            height: 128,
            color: 0x696969,
            shape: 'rect',
            growth: 20,
            arrowColor: 0x999999,
            hitboxWidth: 230,
            hitboxHeight: 90,
            hitboxOffsetX: 9,
            hitboxOffsetY: 16
        }   // Azul
    }

    static spawn(scene, x, y, type = 'TREE', color = null) {
        const typeData = this.TYPES[type] || this.TYPES.TREE
        const finalColor = color || typeData.color
        
        let obj
        if (type === 'TREE') {
            obj = scene.add.image(x, y, 'tree')
            obj.setDisplaySize(typeData.width, typeData.height)
        } else if (type === 'SMALL_HOUSE') {
            obj = scene.add.image(x, y, 'small_house')
            obj.setDisplaySize(typeData.width, typeData.height)
        } else if (type === 'BIG_HOUSE') {
            obj = scene.add.image(x, y, 'big_house')
            obj.setDisplaySize(typeData.width, typeData.height)
        } else if (type === 'BUILDING') {
            obj = scene.add.image(x, y, 'building')
            obj.setDisplaySize(typeData.width, typeData.height)
        } else {
            obj = scene.add.rectangle(x, y, typeData.width, typeData.height, finalColor)
        }
        
        // Agregar física estática
        scene.physics.add.existing(obj, true)
        
        // Configurar el cuerpo de colisión según el tipo
        if (obj.body) {
            if (typeData.shape === 'circle') {
                // Para círculos, establecer forma circular
                obj.body.setCircle(typeData.hitboxRadius || typeData.width / 2)
            } else {
                // Para rectángulos, ajustar manualmente el tamaño y offset si se definió
                const hitboxWidth = typeData.hitboxWidth || typeData.width
                const hitboxHeight = typeData.hitboxHeight || typeData.height
                const offsetX = typeData.hitboxOffsetX || 0
                const offsetY = typeData.hitboxOffsetY || 0
                obj.body.setSize(hitboxWidth, hitboxHeight)
                obj.body.setOffset(offsetX, offsetY)
            }
        }
        
        // Guardar datos
        obj.setData('sizeValue', typeData.size)
        obj.setData('type', type)
        obj.setData('growth', typeData.growth)
        
        return obj
    }
}
