import * as Phaser from 'phaser'

export class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' })
    }

    init(data) {
        this.level = data?.level || 1
    }

    create() {
        // Textos principales (Score, Time, Messages)
        const textStyle = { fontSize: '24px', fill: '#fff' }

        this.scoreText = this.add.text(10, 10, 'Score: 0', textStyle).setScrollFactor(0).setDepth(40).setVisible(false)
        this.timerText = this.add.text(10, 40, 'Time: 120', textStyle).setScrollFactor(0).setDepth(40).setVisible(false)
        this.messageText = this.add.text(this.cameras.main.width / 2, 80, '', { fontSize: '32px', fill: '#fff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(40)

        // Configuración del panel de size con barra de progreso
        const panelX = 15
        const panelY = 10
        const panelWidth = 180  // AJUSTA AQUÍ el ancho total (más pequeño = 150-160)
        const panelHeight = 60  // AJUSTA AQUÍ la altura total (más pequeño = 50-55)
        const barWidth = 150    // AJUSTA AQUÍ el ancho de la barra (debe ser panelWidth - 30)
        const barHeight = 20    // AJUSTA AQUÍ la altura de la barra (debe ser panelHeight - 35)
        const barX = panelX + 15
        const barY = panelY + 35

        // Fondo del panel (rectángulo completamente redondeado)
        // 0x666666 = gris claro, CAMBIA ESTE VALOR para cambiar color de fondo
        const panelBg = this.add.graphics()
        panelBg.fillStyle(0x666666, 0.85)
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 30)
        panelBg.lineStyle(2, 0x888888, 1)  // 0x888888 = gris más claro (borde), CAMBIA AQUÍ si quieres otro color
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 30)
        panelBg.setScrollFactor(0)
        panelBg.setDepth(40)

        // Fondo de la barra (gris oscuro)
        // 0x1a1a1a = gris muy oscuro, CAMBIA ESTE VALOR para cambiar color del fondo de la barra
        const barBg = this.add.graphics()
        barBg.fillStyle(0x1a1a1a, 0.9)
        barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 10)
        barBg.lineStyle(2, 0x444444, 1)  // 0x444444 = gris medio (borde de la barra), CAMBIA AQUÍ si quieres
        barBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 10)
        barBg.setScrollFactor(0)
        barBg.setDepth(40)

        // Barra de progreso (roja, que crece hacia la derecha)
        // 0xFF3333 = rojo, CAMBIA ESTE VALOR para cambiar color de la barra de progreso
        this.sizeBar = this.add.graphics()
        this.sizeBar.setScrollFactor(0)
        this.sizeBar.setDepth(40)

        // Texto del size (gris claro, a la izquierda del panel)
        // '#cccccc' = gris claro, CAMBIA ESTE VALOR para cambiar color del texto
        this.sizeText = this.add.text(panelX + 50, panelY + 8, 'Tamaño: 20', {
            fontSize: '14px',  // AJUSTA AQUÍ el tamaño de la fuente (14-16)
            fill: '#cccccc',   // Color del texto (gris claro)
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0)
         .setScrollFactor(0)
         .setDepth(40)

        // Guardar configuración para actualizaciones
        // Objetivo de tamaño según nivel
        const levelObjective = this.level === 1 ? 120 : 260
        
        this.sizeBarConfig = {
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight,
            minSize: 20,
            maxSize: levelObjective,  // Objetivo de tamaño para ganar
            barColor: 0xFF3333  // Color de la barra, CAMBIA ESTE VALOR si quieres otro color
        }

        // Contenedor pequeño para el tiempo en esquina superior derecha
        const timePanelWidth = 100
        const timePanelHeight = 40
        const timePanelX = this.cameras.main.width - timePanelWidth - 15
        const timePanelY = 10

        // Fondo del panel de tiempo
        const timePanelBg = this.add.graphics()
        timePanelBg.fillStyle(0x666666, 0.85)
        timePanelBg.fillRoundedRect(timePanelX, timePanelY, timePanelWidth, timePanelHeight, 15)
        timePanelBg.lineStyle(2, 0x888888, 1)
        timePanelBg.strokeRoundedRect(timePanelX, timePanelY, timePanelWidth, timePanelHeight, 15)
        timePanelBg.setScrollFactor(0)
        timePanelBg.setDepth(40)

        // Texto del tiempo en formato MM:SS
        this.timeDisplayText = this.add.text(timePanelX + timePanelWidth / 2, timePanelY + timePanelHeight / 2, '00:00', {
            fontSize: '18px',
            fill: '#cccccc',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5)
         .setScrollFactor(0)
         .setDepth(40)
    }

    setScore(score) {
        this.scoreText.setText('Score: ' + score)
    }

    setTime(time) {
        this.timerText.setText('Time: ' + time)
        
        // Formatear tiempo en MM:SS para el display
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        this.timeDisplayText.setText(timeString)
    }

    setSizeValue(size) {
        const cfg = this.sizeBarConfig
        const displaySize = Math.floor(size)
        
        // Actualizar texto
        this.sizeText.setText('Tamaño: ' + displaySize)

        // Calcular ancho de la barra basado en el size actual
        const sizeRange = cfg.maxSize - cfg.minSize
        const currentRange = Math.max(0, displaySize - cfg.minSize)
        const barFillWidth = Math.min(cfg.width, Math.max(1, (currentRange / sizeRange) * cfg.width))

        // Redibujar barra de progreso (con radio pequeño para que se vea bien en los bordes)
        this.sizeBar.clear()
        this.sizeBar.fillStyle(cfg.barColor, 1)
        this.sizeBar.fillRoundedRect(cfg.x, cfg.y, barFillWidth, cfg.height, 8)
    }

    showGameOver() {
        this.messageText.setText('Game Over').setColor('#ff4444')
    }

    showWin(finalScore) {
        this.messageText.setText('You Win! Final Score: ' + finalScore).setColor('#66ff66')
    }
}
