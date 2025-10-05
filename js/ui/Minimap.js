export class MiniMap {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mapData = null;
        this.isVisible = true;
        this.isMobile = window.innerWidth <= 768;
        
        // ⭐ MOBIL-BARÁT MÉRETEK
        this.size = this.isMobile ? 80 : 120; // Kisebb mobil méret
        this.position = this.isMobile ? 'bottom-right' : 'top-left';
    }
    
    init(mapData) {
        this.mapData = mapData;
        this.createMiniMapElement();
    }
    
    createMiniMapElement() {
        if (!this.mapData || !this.mapData.originalImage) {
            console.warn('⚠️ Nincs térkép adat a mini térképhez');
            return;
        }
        
        // ⭐ MOBIL POZICIONÁLÁS
        const mobileStyle = this.isMobile ? `
            top: auto;
            bottom: 80px;
            left: auto;
            right: 10px;
        ` : `
            top: 10px;
            left: 10px;
            bottom: auto;
            right: auto;
        `;
        
        const container = document.createElement('div');
        container.id = 'minimap-container';
        container.style.cssText = `
            position: fixed;
            ${mobileStyle}
            width: ${this.size}px;
            height: ${this.size}px;
            z-index: 500;
            background: rgba(0,0,0,0.9);
            border: 1px solid #fff;
            border-radius: 8px;
            padding: 3px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.7);
            opacity: 0.9;
        `;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size - 6;
        this.canvas.height = this.size - 6;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 4px;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        
        // ⭐ CÍMKE (CSAK DESKTOP-ON)
        if (!this.isMobile) {
            const label = document.createElement('div');
            label.textContent = 'BORSOD';
            label.style.cssText = `
                position: absolute;
                bottom: -20px;
                left: 0;
                right: 0;
                text-align: center;
                color: white;
                font-size: 8px;
                font-family: Arial;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            `;
            container.appendChild(label);
        }
        
        // ⭐ TOGGLE GOMB
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '🗺️';
        toggleBtn.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: none;
            background: #007bff;
            color: white;
            font-size: 10px;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        toggleBtn.addEventListener('click', () => {
            this.isVisible = !this.isVisible;
            this.canvas.style.display = this.isVisible ? 'block' : 'none';
            toggleBtn.innerHTML = this.isVisible ? '🗺️' : '📍';
        });
        
        container.appendChild(this.canvas);
        container.appendChild(toggleBtn);
        
        // ⭐ MEGLÉVŐ MINI TÉRKÉP ELTÁVOLÍTÁSA
        const existingMap = document.getElementById('minimap-container');
        if (existingMap) {
            existingMap.remove();
        }
        
        document.body.appendChild(container);
        
        this.drawBaseMap();
        console.log('🗺️ Mini térkép létrehozva:', this.isMobile ? 'mobil' : 'desktop');
    }
    
    drawBaseMap() {
        if (!this.ctx || !this.mapData.originalImage) return;
        
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // ⭐ HÁTTÉR TÖRLÉSE
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        try {
            // ⭐ TÉRKÉP KÉP RAJZOLÁSA
            ctx.drawImage(this.mapData.originalImage, 0, 0, canvas.width, canvas.height);
            
            // ⭐ ÚTVONAL RAJZOLÁSA
            if (this.mapData.routePoints && this.mapData.routePoints.length > 1) {
                ctx.strokeStyle = '#FF4444';
                ctx.lineWidth = 1;
                ctx.beginPath();
                
                let hasValidPoints = false;
                
                for (let i = 0; i < this.mapData.routePoints.length; i += 5) { // Minden 5. pont
                    const point = this.mapData.routePoints[i];
                    if (!point) continue;
                    
                    const x = (point.x / this.mapData.mapWidth) * canvas.width;
                    const y = (point.y / this.mapData.mapHeight) * canvas.height;
                    
                    if (isNaN(x) || isNaN(y)) continue;
                    
                    if (!hasValidPoints) {
                        ctx.moveTo(x, y);
                        hasValidPoints = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                if (hasValidPoints) {
                    ctx.stroke();
                }
                
                // ⭐ START PONT
                if (this.mapData.routePoints[0]) {
                    const startPoint = this.mapData.routePoints[0];
                    const startX = (startPoint.x / this.mapData.mapWidth) * canvas.width;
                    const startY = (startPoint.y / this.mapData.mapHeight) * canvas.height;
                    
                    if (!isNaN(startX) && !isNaN(startY)) {
                        ctx.fillStyle = '#00FF00';
                        ctx.beginPath();
                        ctx.arc(startX, startY, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                // ⭐ FINISH PONT
                const lastIndex = this.mapData.routePoints.length - 1;
                if (this.mapData.routePoints[lastIndex]) {
                    const endPoint = this.mapData.routePoints[lastIndex];
                    const endX = (endPoint.x / this.mapData.mapWidth) * canvas.width;
                    const endY = (endPoint.y / this.mapData.mapHeight) * canvas.height;
                    
                    if (!isNaN(endX) && !isNaN(endY)) {
                        // ⭐ CÍLVONAL RAJZOLÁSA
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(endX - 2, endY - 1, 4, 1);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(endX - 2, endY, 4, 1);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Mini térkép rajzolási hiba:', error);
            
            // ⭐ FALLBACK: EGYSZERŰ TÉRKÉP
            ctx.fillStyle = '#228B22';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TÉRKÉP', canvas.width / 2, canvas.height / 2);
        }
    }
    
    updatePlayerPosition(gamePosition, trackLength) {
        if (!this.isVisible || !this.ctx || !this.mapData.routePoints) return;
        
        this.drawBaseMap();
        
        try {
            const progress = Math.max(0, Math.min(1, gamePosition / trackLength));
            const pointIndex = Math.floor(progress * (this.mapData.routePoints.length - 1));
            
            if (pointIndex < this.mapData.routePoints.length && this.mapData.routePoints[pointIndex]) {
                const currentPoint = this.mapData.routePoints[pointIndex];
                const x = (currentPoint.x / this.mapData.mapWidth) * this.canvas.width;
                const y = (currentPoint.y / this.mapData.mapHeight) * this.canvas.height;
                
                if (!isNaN(x) && !isNaN(y)) {
                    // ⭐ JÁTÉKOS JELÖLŐ (EGYSZERŰBB MOBIL VERZIÓ)
                    const pulseSize = this.isMobile ? 2 : 3;
                    
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // ⭐ KÜLSŐ GYŰRŰ
                    this.ctx.strokeStyle = '#FF0000';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, pulseSize + 1, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
            
            // ⭐ PROGRESS BAR (CSAK DESKTOP-ON)
            if (!this.isMobile) {
                this.drawProgressBar(progress);
            }
        } catch (error) {
            console.warn('⚠️ Játékos pozíció frissítési hiba:', error);
        }
    }
    
    drawProgressBar(progress) {
        const barWidth = this.canvas.width - 10;
        const barHeight = 2;
        const barX = 5;
        const barY = this.canvas.height - 8;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    destroy() {
        const container = document.getElementById('minimap-container');
        if (container) {
            container.remove();
        }
    }
}
