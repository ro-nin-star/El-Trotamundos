export class SpriteGenerator {
    createPlayerCarSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        // Piros autó
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(8, 2, 24, 16);
        
        // Szélvédő
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 4, 20, 6);
        
        // Lámpák
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(6, 6, 4, 8);
        ctx.fillRect(30, 6, 4, 8);
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 2, 6, 4);
        ctx.fillRect(30, 2, 6, 4);
        ctx.fillRect(4, 14, 6, 4);
        ctx.fillRect(30, 14, 6, 4);
        
        return canvas;
    }
    
    createEnemyCarSprite(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        // Autó test
        ctx.fillStyle = color;
        ctx.fillRect(8, 2, 24, 16);
        
        // Szélvédő
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 4, 20, 6);
        
        // Lámpák
        if (color === '#FF00FF') {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(6, 6, 4, 8);
            ctx.fillRect(30, 6, 4, 8);
        } else {
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(6, 6, 4, 8);
            ctx.fillRect(30, 6, 4, 8);
        }
        
        // Kerekek
        ctx.fillStyle = '#000000';
        ctx.fillRect(4, 2, 6, 4);
        ctx.fillRect(30, 2, 6, 4);
        ctx.fillRect(4, 14, 6, 4);
        ctx.fillRect(30, 14, 6, 4);
        
        return canvas;
    }
}
