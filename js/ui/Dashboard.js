export class Dashboard {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }
    
    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    render(speedKmh, gear, rpm) {
        const centerX = this.canvas.width - 180;
        const centerY = 120;
        const radius = 80;
        
        // Dashboard háttér
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.roundRect(centerX - 150, centerY - 100, 300, 180, 15);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Sebességmérő
        this.renderSpeedometer(centerX - 70, centerY, radius, speedKmh);
        
        // RPM mérő
        this.renderRPMMeter(centerX + 70, centerY, radius, rpm);
        
        // Digitális kijelző
        this.renderDigitalDisplay(centerX, centerY + 40, speedKmh, gear, rpm);
    }
    
    renderSpeedometer(centerX, centerY, radius, speedKmh) {
        // Háttér
        this.ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#555555';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Skála
        for (let i = 0; i <= 300; i += 20) {
            const angle = (i / 300) * Math.PI * 1.5 + Math.PI * 0.75;
            const x1 = centerX + Math.cos(angle) * (radius - 15);
            const y1 = centerY + Math.sin(angle) * (radius - 15);
            const x2 = centerX + Math.cos(angle) * (radius - (i % 60 === 0 ? 25 : 20));
            const y2 = centerY + Math.sin(angle) * (radius - (i % 60 === 0 ? 25 : 20));
            
            this.ctx.strokeStyle = i > 240 ? '#FF4444' : '#FFFFFF';
            this.ctx.lineWidth = i % 60 === 0 ? 3 : 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            
            if (i % 60 === 0) {
                const textX = centerX + Math.cos(angle) * (radius - 35);
                const textY = centerY + Math.sin(angle) * (radius - 35);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(i.toString(), textX, textY + 4);
            }
        }
        
        // Mutató
        const speedAngle = (speedKmh / 300) * Math.PI * 1.5 + Math.PI * 0.75;
        const speedNeedleX = centerX + Math.cos(speedAngle) * (radius - 20);
        const speedNeedleY = centerY + Math.sin(speedAngle) * (radius - 20);
        
        this.ctx.strokeStyle = speedKmh > 240 ? '#FF4444' : '#00FFFF';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(speedNeedleX, speedNeedleY);
        this.ctx.stroke();
        
        // Központ
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderRPMMeter(centerX, centerY, radius, rpm) {
        // Háttér
        this.ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#555555';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // 9000 RPM skála
        for (let i = 0; i <= 9000; i += 500) {
            const angle = (i / 9000) * Math.PI * 1.5 + Math.PI * 0.75;
            const x1 = centerX + Math.cos(angle) * (radius - 15);
            const y1 = centerY + Math.sin(angle) * (radius - 15);
            const x2 = centerX + Math.cos(angle) * (radius - (i % 1000 === 0 ? 25 : 20));
            const y2 = centerY + Math.sin(angle) * (radius - (i % 1000 === 0 ? 25 : 20));
            
            this.ctx.strokeStyle = i > 7000 ? '#FF4444' : '#FFFFFF';
            this.ctx.lineWidth = i % 1000 === 0 ? 3 : 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            
            if (i % 1000 === 0) {
                const textX = centerX + Math.cos(angle) * (radius - 35);
                const textY = centerY + Math.sin(angle) * (radius - 35);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText((i / 1000).toString(), textX, textY + 3);
            }
        }
        
        // RPM mutató
        const rpmAngle = (rpm / 9000) * Math.PI * 1.5 + Math.PI * 0.75;
        const rpmNeedleX = centerX + Math.cos(rpmAngle) * (radius - 20);
        const rpmNeedleY = centerY + Math.sin(rpmAngle) * (radius - 20);
        
        this.ctx.strokeStyle = rpm > 7000 ? '#FF4444' : '#00FFFF';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(rpmNeedleX, rpmNeedleY);
        this.ctx.stroke();
        
        // Központ
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderDigitalDisplay(centerX, centerY, speedKmh, gear, rpm) {
        // Digitális kijelző
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(centerX - 60, centerY - 15, 120, 30);
        
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - 60, centerY - 15, 120, 30);
        
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${speedKmh} KM/H`, centerX, centerY + 5);
        
        // Fokozat
        this.ctx.fillStyle = gear >= 5 ? '#FF4444' : '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`${gear}`, centerX, centerY - 30);
        
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('GEAR', centerX, centerY - 15);
        
        // RPM
        this.ctx.fillStyle = '#FFAA00';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillText(`${Math.round(rpm)} RPM`, centerX, centerY - 50);
        
        this.ctx.textAlign = 'left';
    }
}
