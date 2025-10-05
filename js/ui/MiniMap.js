export class MiniMap {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mapData = null;
        this.isVisible = true;
        this.size = 150;
    }
    
    init(mapData) {
        this.mapData = mapData;
        this.createMiniMapElement();
    }
    
    createMiniMapElement() {
        if (!this.mapData || !this.mapData.originalImage) return;
        
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: ${this.size}px;
            height: ${this.size}px;
            z-index: 1000;
            background: rgba(0,0,0,0.8);
            border: 2px solid #fff;
            border-radius: 10px;
            padding: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        `;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size - 10;
        this.canvas.height = this.size - 10;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 5px;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        
        const label = document.createElement('div');
        label.textContent = 'BORSOD MEGYE';
        label.style.cssText = `
            position: absolute;
            bottom: -25px;
            left: 0;
            right: 0;
            text-align: center;
            color: white;
            font-size: 10px;
            font-family: Arial;
            font-weight: bold;
        `;
        
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '📍';
        toggleBtn.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            border: none;
            background: #007bff;
            color: white;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        
        toggleBtn.addEventListener('click', () => {
            this.isVisible = !this.isVisible;
            container.style.display = this.isVisible ? 'block' : 'none';
            toggleBtn.innerHTML = this.isVisible ? '📍' : '🗺️';
        });
        
        container.appendChild(this.canvas);
        container.appendChild(label);
        container.appendChild(toggleBtn);
        
        document.body.appendChild(container);
        
        this.drawBaseMap();
    }
    
    drawBaseMap() {
        if (!this.ctx || !this.mapData.originalImage) return;
        
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.mapData.originalImage, 0, 0, canvas.width, canvas.height);
        
        if (this.mapData.routePoints && this.mapData.routePoints.length > 1) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < this.mapData.routePoints.length; i++) {
                const point = this.mapData.routePoints[i];
                const x = (point.x / this.mapData.mapWidth) * canvas.width;
                const y = (point.y / this.mapData.mapHeight) * canvas.height;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            const startPoint = this.mapData.routePoints[0];
            const startX = (startPoint.x / this.mapData.mapWidth) * canvas.width;
            const startY = (startPoint.y / this.mapData.mapHeight) * canvas.height;
            
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(startX, startY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            const endPoint = this.mapData.routePoints[this.mapData.routePoints.length - 1];
            const endX = (endPoint.x / this.mapData.mapWidth) * canvas.width;
            const endY = (endPoint.y / this.mapData.mapHeight) * canvas.height;
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(endX - 3, endY - 1, 6, 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(endX - 3, endY + 1, 6, 2);
        }
    }
    
    updatePlayerPosition(gamePosition, trackLength) {
        if (!this.isVisible || !this.ctx || !this.mapData.routePoints) return;
        
        this.drawBaseMap();
        
        const progress = Math.max(0, Math.min(1, gamePosition / trackLength));
        const pointIndex = Math.floor(progress * (this.mapData.routePoints.length - 1));
        
        if (pointIndex < this.mapData.routePoints.length) {
            const currentPoint = this.mapData.routePoints[pointIndex];
            const x = (currentPoint.x / this.mapData.mapWidth) * this.canvas.width;
            const y = (currentPoint.y / this.mapData.mapHeight) * this.canvas.height;
            
            const time = Date.now() / 200;
            const pulseSize = 3 + Math.sin(time) * 1;
            
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#FF4444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, pulseSize + 2, 0, Math.PI * 2);
            this.ctx.stroke();
            
            let nextPointIndex = Math.min(pointIndex + 5, this.mapData.routePoints.length - 1);
            if (nextPointIndex > pointIndex) {
                const nextPoint = this.mapData.routePoints[nextPointIndex];
                const nextX = (nextPoint.x / this.mapData.mapWidth) * this.canvas.width;
                const nextY = (nextPoint.y / this.mapData.mapHeight) * this.canvas.height;
                
                const angle = Math.atan2(nextY - y, nextX - x);
                const arrowLength = 8;
                
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(
                    x + Math.cos(angle) * arrowLength,
                    y + Math.sin(angle) * arrowLength
                );
                this.ctx.stroke();
            }
        }
        
        this.drawProgressBar(progress);
    }
    
    drawProgressBar(progress) {
        const barWidth = this.canvas.width - 20;
        const barHeight = 4;
        const barX = 10;
        const barY = this.canvas.height - 15;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `${Math.round(progress * 100)}%`,
            this.canvas.width / 2,
            barY - 2
        );
    }
    
    destroy() {
        const containers = document.querySelectorAll('div');
        containers.forEach(container => {
            if (container.contains(this.canvas)) {
                container.remove();
            }
        });
    }
}
