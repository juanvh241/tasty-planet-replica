/**
 * Configuración completa del Nivel 2
 * Incluye: rutas de calles, waypoints de vehículos, y posición de objetos estáticos
 */

export const Level2Config = {
    // Dimensiones del nivel
    width: 1600,
    height: 1600,
    zoom: 0.005,  // Zoom inicial de la cámara para mostrar más del nivel

    // Rutas de calles (para renderizado visual)
    roadPaths: [
        // 0: vertical izquierda
        [{ x: 200, y: 0 }, { x: 200, y: 1100 }],
        // 1: horizontal chiquita 1
        [{ x: 200, y: 1100 }, { x: 600, y: 1100 }],
        // 2: linea horizontal de arriba
        [{ x: 200, y: 700 }, { x: 1600, y: 700 }],
        // 3: linea horizontal chiquita arriba
        [{ x: 800, y: 300 }, { x: 1200, y: 300 }],
        // 4: vertical chiquita arriba
        [{ x: 800, y: 0 }, { x: 800, y: 300 }],
        // 5: vertical del medio
        [{ x: 600, y: 700 }, { x: 600, y: 1700 }],
        // 6: vertical derecha
        [{ x: 1200, y: 0 }, { x: 1200, y: 1700 }],
        // 7: horizontal abajo
        [{ x: 850, y: 1300 }, { x: 1600, y: 1300 }],
        // 8: vertical chiquita abajo
        [{ x: 850, y: 1300 }, { x: 850, y: 1700 }],
    ],

    // Rutas de waypoints para vehículos
    vehicleRoutes: [
        // RUTA 0: Vertical izquierda down → Horizontal → Vertical medio up
        {
            spawnPoint: { x: 200, y: 0 },
            waypoints: [
                { x: 200, y: 0 },
                { x: 200, y: 1100 },
                { x: 600, y: 1100 },
                { x: 600, y: 700 },
                { x: 1600, y: 700 }
            ]
        },
        {
            spawnPoint: { x: 200, y: 0 },
            waypoints: [
                { x: 200, y: 0 },
                { x: 200, y: 1100 },
                { x: 600, y: 1100 },
                { x: 600, y: 1700 },
            ]
        },
        {
            spawnPoint: { x: 200, y: 0 },
            waypoints: [
                { x: 200, y: 0 },
                { x: 200, y: 1100 },
                { x: 600, y: 1100 },
                { x: 600, y: 700 },
                { x: 1200, y: 700 },
                { x: 1200, y: 1700 }
            ]
        },
        {
            spawnPoint: { x: 200, y: 0 },
            waypoints: [
                { x: 200, y: 0 },
                { x: 200, y: 700 },
                { x: 1600, y: 700 },
            ]
        },
        {
            spawnPoint: { x: 200, y: 0 },
            waypoints: [
                { x: 200, y: 0 },
                { x: 200, y: 700 },
                { x: 600, y: 700 },
                { x: 600, y: 1700 }
            ]
        },
        // RUTA 1: Vertical arriba → Horizontal arriba → Vertical derecha
        {
            spawnPoint: { x: 800, y: 0 },
            waypoints: [
                { x: 800, y: 0 },
                { x: 800, y: 300 },
                { x: 1200, y: 300 },
                { x: 1200, y: 0 }
            ]
        },
        {
            spawnPoint: { x: 800, y: 0 },
            waypoints: [
                { x: 800, y: 0 },
                { x: 800, y: 300 },
                { x: 1200, y: 300 },
                { x: 1200, y: 1700 }
            ]
        },
        {
            spawnPoint: { x: 800, y: 0 },
            waypoints: [
                { x: 800, y: 0 },
                { x: 800, y: 300 },
                { x: 1200, y: 300 },
                { x: 1200, y: 700 },
                { x: 1700, y: 700 }
            ]
        },
        // RUTA 2: Vertical derecha straight
        {
            spawnPoint: { x: 1200, y: 0 },
            waypoints: [
                { x: 1200, y: 0 },
                { x: 1200, y: 1700 }
            ]
        },
        {
            spawnPoint: { x: 1200, y: 0 },
            waypoints: [
                { x: 1200, y: 0 },
                { x: 1200, y: 700 },
                { x: 1600, y: 700 }
            ]
        },
    ],

    // Posición y tipo de objetos estáticos
    staticObjectsData: [
        // Formato: {x, y, type}
        // ÁRBOLES (tamaño 35)
        { x: 450, y: 100, type: 'TREE' },
        { x: 880, y: 220, type: 'TREE' },
        { x: 1500, y: 100, type: 'TREE' },
        { x: 1000, y: 500, type: 'TREE' },
        { x: 1530, y: 500, type: 'TREE' },
        { x: 400, y: 900, type: 'TREE' },
        { x: 530, y: 1160, type: 'TREE' },
        { x: 230, y: 1230, type: 'TREE' },
        { x: 80, y: 1560, type: 'TREE' },

        // CASAS PEQUEÑAS (tamaño 50)
        // 3 casas a la izquierda
        { x: 1270, y: 620, type: 'SMALL_HOUSE' },
        { x: 1380, y: 620, type: 'SMALL_HOUSE' },
        { x: 1490, y: 620, type: 'SMALL_HOUSE' },
        // casas horizontales centrales
        { x: 280, y: 620, type: 'SMALL_HOUSE' },
        { x: 390, y: 620, type: 'SMALL_HOUSE' },
        { x: 500, y: 620, type: 'SMALL_HOUSE' },
        { x: 610, y: 620, type: 'SMALL_HOUSE' },
        { x: 720, y: 620, type: 'SMALL_HOUSE' },
        { x: 830, y: 620, type: 'SMALL_HOUSE' },
        // casas verticales centrales
        { x: 670, y: 780, type: 'SMALL_HOUSE' },
        { x: 670, y: 890, type: 'SMALL_HOUSE' },
        { x: 670, y: 1000, type: 'SMALL_HOUSE' },
        { x: 670, y: 1110, type: 'SMALL_HOUSE' },
        { x: 670, y: 1220, type: 'SMALL_HOUSE' },
        
        // CASAS GRANDES (tamaño 75)
        { x: 300, y: 100, type: 'BIG_HOUSE' },
        { x: 1300, y: 220, type: 'BIG_HOUSE' },
        { x: 510, y: 1500, type: 'BIG_HOUSE' },
        
        // EDIFICIOS (tamaño 120)
        { x: 1040, y: 1210, type: 'BUILDING' },
        { x: 1020, y: 1530, type: 'BUILDING' },
        { x: 960, y: 1400, type: 'BIG_HOUSE' },
        { x: 1100, y: 1400, type: 'TREE' },

        // Sector esquina inferior derecha
        { x: 1270, y: 1570, type: 'SMALL_HOUSE' },
        { x: 1270, y: 1470, type: 'SMALL_HOUSE' },
        { x: 1270, y: 1370, type: 'SMALL_HOUSE' },
        { x: 1370, y: 1370, type: 'SMALL_HOUSE' },
        { x: 1470, y: 1370, type: 'SMALL_HOUSE' },
        { x: 1570, y: 1370, type: 'SMALL_HOUSE' },
        { x: 1480, y: 1470, type: 'TREE' },
        { x: 1520, y: 1540, type: 'TREE' },
        { x: 1420, y: 1540, type: 'TREE' },
    ]
}
