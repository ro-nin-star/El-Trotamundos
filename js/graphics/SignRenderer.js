export class SignRenderer {
    constructor() {
        this.signCache = new Map(); // Cache a generált táblákhoz
    }
    
    // ⭐ KANYAR TÁBLA GENERÁLÁSA
    createCurveSign(direction, distance) {
        const cacheKey = `${direction}_${Math.floor(distance / 100)}`;
        
        if (this.signCache.has(cacheKey)) {
            return this.signCache.get(cacheKey);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        
        // ⭐ TÁBLA HÁTTÉR
        ctx.fillStyle = '#FFFF00'; // Sárga háttér
        ctx.fillRect(10, 10, 100, 140);
        
        // ⭐ FEKETE KERET
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 100, 140);
        
        // ⭐ BELSŐ FEHÉR TERÜLET
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(20, 20, 80, 120);
        
        // ⭐ KANYAR NYÍL RAJZOLÁSA
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        if (direction === 'left') {
            // ⭐ BALRA KANYAR
            ctx.moveTo(80, 40);
            ctx.quadraticCurveTo(30, 50, 30, 80);
            ctx.quadraticCurveTo(30, 110, 80, 120);
            
            // Nyílhegy
            ctx.moveTo(30, 80);
            ctx.lineTo(40, 70);
            ctx.moveTo(30, 80);
            ctx.lineTo(40, 90);
            
        } else if (direction === 'right') {
            // ⭐ JOBBRA KANYAR
            ctx.moveTo(40, 40);
            ctx.quadraticCurveTo(90, 50, 90, 80);
            ctx.quadraticCurveTo(90, 110, 40, 120);
            
            // Nyílhegy
            ctx.moveTo(90, 80);
            ctx.lineTo(80, 70);
            ctx.moveTo(90, 80);
            ctx.lineTo(80, 90);
        }
        
        ctx.stroke();
        
        // ⭐ TÁVOLSÁG SZÖVEG
        if (distance < 1000) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(distance)}m`, 60, 140);
        }
        
        // ⭐ TÁBLA OSZLOP
        ctx.fillStyle = '#888888';
        ctx.fillRect(55, 150, 10, 30);
        
        this.signCache.set(cacheKey, canvas);
        return canvas;
    }
    
    // ⭐ SEBESSÉG TÁBLA GENERÁLÁSA
    createSpeedSign(speedLimit) {
        const cacheKey = `speed_${speedLimit}`;
        
        if (this.signCache.has(cacheKey)) {
            return this.signCache.get(cacheKey);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 140;
        const ctx = canvas.getContext('2d');
        
        // ⭐ FEHÉR KÖR
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(50, 60, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // ⭐ PIROS KERET
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // ⭐ SEBESSÉG SZÁM
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(speedLimit.toString(), 50, 70);
        
        // ⭐ OSZLOP
        ctx.fillStyle = '#888888';
        ctx.fillRect(45, 100, 10, 30);
        
        this.signCache.set(cacheKey, canvas);
        return canvas;
    }
    
    // ⭐ VÁROS/HELYSÉG TÁBLA
    createCitySign(cityName) {
        const cacheKey = `city_${cityName}`;
        
        if (this.signCache.has(cacheKey)) {
            return this.signCache.get(cacheKey);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        
        // ⭐ ZÖLD HÁTTÉR
        ctx.fillStyle = '#228B22';
        ctx.fillRect(10, 10, 180, 80);
        
        // ⭐ FEHÉR KERET
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 180, 80);
        
        // ⭐ VÁROS NÉV
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cityName, 100, 35);
        
        // ⭐ TÁVOLSÁG (opcionális)
        ctx.font = '14px Arial';
        ctx.fillText('NEXT EXIT', 100, 55);
        
        // ⭐ OSZLOP
        ctx.fillStyle = '#888888';
        ctx.fillRect(95, 90, 10, 30);
        
        this.signCache.set(cacheKey, canvas);
        return canvas;
    }
    
    // ⭐ CACHE TISZTÍTÁSA
    clearCache() {
        this.signCache.clear();
    }
}
