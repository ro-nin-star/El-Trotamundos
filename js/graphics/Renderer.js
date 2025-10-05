export class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.isMobile = false; // ⭐ MOBIL FLAG
        this.colors = this.initColors();
    }
    
    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        console.log(`🎨 Renderer beállítva: ${this.width}x${this.height}`);
    }
    
    // ⭐ HIÁNYZÓ SETMOBILE METÓDUS
    setMobile(isMobile) {
        this.isMobile = isMobile;
        console.log(`📱 Mobil mód: ${isMobile ? 'BE' : 'KI'}`);
    }
    
    initColors() {
        return {
            sky: '#87CEEB',
            ground: '#228B22',
            road: '#404040',
            road_marking: '#FFFFFF',
            grass: '#32CD32',
            tree: '#228B22',
            
            // ⭐ SZEGMENS SZÍNEK
            light: '#808080',
            dark: '#696969',
            highway_light: '#606060',
            highway_dark: '#505050',
            road_light: '#707070',
            road_dark: '#606060',
            city_light: '#909090',
            city_dark: '#808080',
            water_light: '#4169E1',
            water_dark: '#0000CD',
            forest_light: '#228B22',
            forest_dark: '#006400'
        };
    }
    
    render(game, gameState, assets) {
        if (!this.ctx || !game) return;
        
        // ⭐ KÉPERNYŐ TÖRLÉSE
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        switch (gameState.current) {
            case 'LOADING':
                this.renderLoading();
                break;
            case 'READY':
                this.renderReady(game, assets);
                break;
            case 'PLAYING':
                this.renderGame(game, assets);
                break;
            case 'PAUSED':
                this.renderGame(game, assets);
                this.renderPause();
                break;
            case 'FINISHED':
                this.renderGame(game, assets);
                this.renderFinished(game);
                break;
            default:
                this.renderLoading();
        }
    }
    
    // ⭐ BETÖLTÉS KÉPERNYŐ
    renderLoading() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? 'bold 32px Arial' : 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏎️ EL TROTAMUNDOS', this.width / 2, this.height / 2 - 50);
        
        this.ctx.font = this.isMobile ? '18px Arial' : '24px Arial';
        this.ctx.fillText('Betöltés...', this.width / 2, this.height / 2 + 20);
    }
    
    // ⭐ READY KÉPERNYŐ
    renderReady(game, assets) {
        // ⭐ HÁTTÉR GRADIENS
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#003366');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // ⭐ CÍM (MOBIL RESPONSIVE)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? 'bold 28px Arial' : 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏎️ EL TROTAMUNDOS', this.width / 2, this.height / 3);
        
        this.ctx.font = this.isMobile ? '16px Arial' : '24px Arial';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText('Magyar Telekom Racing', this.width / 2, this.height / 3 + (this.isMobile ? 35 : 50));
        
        // ⭐ JÁTÉK INFO
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? '14px Arial' : '20px Arial';
        
        if (game.trackLength) {
            this.ctx.fillText(`Pálya: ${Math.round(game.trackLength / 1000)}km`, this.width / 2, this.height / 2);
        }
        
        if (game.road && game.road.length) {
            this.ctx.fillText(`Szegmensek: ${game.road.length}`, this.width / 2, this.height / 2 + (this.isMobile ? 25 : 30));
        }
        
        // ⭐ INDÍTÁS INSTRUKCIÓ
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = this.isMobile ? 'bold 18px Arial' : 'bold 24px Arial';
        const startText = this.isMobile ? 'ÉRINTSD MEG A KÉPERNYŐT!' : 'NYOMD MEG A SPACE-T!';
        this.ctx.fillText(startText, this.width / 2, this.height * 0.75);
        
        // ⭐ VILLOGÓ EFFEKT
        const time = Date.now() / 500;
        if (Math.sin(time) > 0) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = this.isMobile ? '14px Arial' : '18px Arial';
            this.ctx.fillText('🏁 KÉSZEN ÁLLSZ?', this.width / 2, this.height * 0.85);
        }
        
        // ⭐ MINI TÉRKÉP ELŐNÉZET (CSAK DESKTOP-ON)
        if (!this.isMobile) {
            this.renderMiniMap(game, this.width - 200, 20, 180, 140, true);
        }
    }
    
    // ⭐ JÁTÉK RENDERELÉS
    renderGame(game, assets) {
        // ⭐ 3D ÚTVONAL RENDERELÉS
        this.render3DRoad(game);
        
        // ⭐ AUTÓK RENDERELÉS
        this.renderCars(game, assets);
        
        // ⭐ HUD RENDERELÉS
        this.renderHUD(game);
        
        // ⭐ MINI TÉRKÉP (CSAK DESKTOP-ON)
        if (!this.isMobile) {
            this.renderMiniMap(game, this.width - 220, 20, 200, 150);
        }
    }
    
    // ⭐ 3D ÚTVONAL RENDERELÉS
    render3DRoad(game) {
        const baseX = this.width / 2;
        const baseY = this.height;
        
        // ⭐ ÉG
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height * 0.6);
        
        // ⭐ FÖLD
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(0, this.height * 0.6, this.width, this.height * 0.4);
        
        // ⭐ ÚTVONAL SZEGMENSEK
        if (!game.road || !game.road.length) return;
        
        for (let n = 0; n < (game.drawDistance || 300); n++) {
            const segmentIndex = Math.floor((game.position.z / game.segmentLength + n)) % game.road.length;
            const segment = game.road[segmentIndex];
            
            if (!segment) continue;
            
            // ⭐ ALAPÉRTELMEZETT PONT STRUKTÚRA
            if (!segment.p1) segment.p1 = { world: {x:0,y:0,z:0}, camera: {x:0,y:0,z:0}, screen: {x:0,y:0,w:0,scale:0} };
            if (!segment.p2) segment.p2 = { world: {x:0,y:0,z:0}, camera: {x:0,y:0,z:0}, screen: {x:0,y:0,w:0,scale:0} };
            
            // ⭐ PROJEKCIÓ SZÁMÍTÁS
            segment.p1.camera.x = segment.p1.world.x - (game.position.x || 0);
            segment.p1.camera.y = segment.p1.world.y - (game.position.y || 0);
            segment.p1.camera.z = segment.p1.world.z - (game.position.z || 0);
            
            segment.p2.camera.x = segment.p2.world.x - (game.position.x || 0);
            segment.p2.camera.y = segment.p2.world.y - (game.position.y || 0);
            segment.p2.camera.z = segment.p2.world.z - (game.position.z || 0);
            
            // ⭐ KÉPERNYŐ KOORDINÁTÁK
            this.project(segment.p1, baseX, baseY, game.roadWidth || 2000);
            this.project(segment.p2, baseX, baseY, game.roadWidth || 2000);
            
            const cameraDepth = game.cameraDepth || 0.84;
            if (segment.p1.camera.z <= cameraDepth || segment.p2.camera.z <= cameraDepth) continue;
            
            // ⭐ SZEGMENS RAJZOLÁS
            this.renderSegment(segment, n);
        }
    }
    
    // ⭐ PROJEKCIÓ SZÁMÍTÁS
    project(p, cameraX, cameraY, roadWidth) {
        const cameraDepth = 0.84;
        p.screen.scale = cameraDepth / Math.max(p.camera.z, 0.1);
        p.screen.x = Math.round(cameraX + (p.screen.scale * p.camera.x * this.width / 2));
        p.screen.y = Math.round(cameraY + (p.screen.scale * p.camera.y * this.height / 2));
        p.screen.w = Math.round(p.screen.scale * roadWidth * this.width / 2);
    }
    
    // ⭐ SZEGMENS RENDERELÉS
    renderSegment(segment, index) {
        const p1 = segment.p1.screen;
        const p2 = segment.p2.screen;
        
        // ⭐ SZÍN MEGHATÁROZÁS
        const colorKey = segment.color || (index % 3 === 0 ? 'dark' : 'light');
        const grassColor = this.colors.grass;
        const roadColor = this.colors[colorKey] || this.colors.light;
        
        // ⭐ FŰ RENDERELÉS
        this.ctx.fillStyle = grassColor;
        this.ctx.fillRect(0, p2.y, this.width, p1.y - p2.y);
        
        // ⭐ ÚT RENDERELÉS
        if (p1.w > 0 && p2.w > 0) {
            this.ctx.fillStyle = roadColor;
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x - p1.w, p1.y);
            this.ctx.lineTo(p1.x + p1.w, p1.y);
            this.ctx.lineTo(p2.x + p2.w, p2.y);
            this.ctx.lineTo(p2.x - p2.w, p2.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            // ⭐ ÚTFESTÉS
            if (index % 4 === 0) {
                this.ctx.fillStyle = this.colors.road_marking;
                const markingWidth = p1.w * 0.1;
                this.ctx.fillRect(p1.x - markingWidth/2, p1.y, markingWidth, p2.y - p1.y);
            }
        }
    }
    
    // ⭐ AUTÓK RENDERELÉS
    renderCars(game, assets) {
        // ⭐ JÁTÉKOS AUTÓ
        const playerAsset = assets && assets.player;
        if (playerAsset) {
            const carX = this.width / 2 + ((game.position.x || 0) * this.width / 2000);
            const carY = this.height - (this.isMobile ? 80 : 100);
            const carWidth = this.isMobile ? 40 : 60;
            const carHeight = this.isMobile ? 20 : 30;
            
            this.ctx.save();
            this.ctx.translate(carX, carY);
            this.ctx.rotate((game.position.x || 0) * 0.0001);
            this.ctx.drawImage(playerAsset, -carWidth/2, -carHeight/2, carWidth, carHeight);
            this.ctx.restore();
        } else {
            // ⭐ FALLBACK JÁTÉKOS AUTÓ
            const carX = this.width / 2 + ((game.position.x || 0) * this.width / 2000);
            const carY = this.height - (this.isMobile ? 80 : 100);
            const carWidth = this.isMobile ? 40 : 60;
            const carHeight = this.isMobile ? 20 : 30;
            
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(carX - carWidth/2, carY - carHeight/2, carWidth, carHeight);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(carX - carWidth/3, carY - carHeight/3, carWidth*2/3, carHeight*2/3);
        }
        
        // ⭐ ELLENFÉL AUTÓK
        if (game.cars && game.cars.length) {
            game.cars.forEach(car => {
                if (car.z > (game.position.z || 0) && car.z < (game.position.z || 0) + (game.drawDistance || 300) * (game.segmentLength || 200)) {
                    const segmentIndex = Math.floor(car.z / (game.segmentLength || 200)) % game.road.length;
                    const carSegment = game.road[segmentIndex];
                    
                    if (carSegment && carSegment.p1 && carSegment.p1.screen && carSegment.p1.screen.scale > 0) {
                        const carX = carSegment.p1.screen.x + (car.x * carSegment.p1.screen.w);
                        const carY = carSegment.p1.screen.y;
                        const carWidth = (this.isMobile ? 30 : 40) * carSegment.p1.screen.scale;
                        const carHeight = (this.isMobile ? 15 : 20) * carSegment.p1.screen.scale;
                        
                        if (car.sprite) {
                            this.ctx.drawImage(car.sprite, carX - carWidth/2, carY - carHeight/2, carWidth, carHeight);
                        } else {
                            this.ctx.fillStyle = '#0000FF';
                            this.ctx.fillRect(carX - carWidth/2, carY - carHeight/2, carWidth, carHeight);
                        }
                    }
                }
            });
        }
    }
    
    // ⭐ HUD RENDERELÉS
    renderHUD(game) {
        const fontSize = this.isMobile ? 16 : 24;
        const margin = this.isMobile ? 10 : 20;
        
        // ⭐ SEBESSÉG
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Sebesség: ${Math.round((game.speed || 0) * 3.6)} km/h`, margin, margin + fontSize);
        
        // ⭐ POZÍCIÓ
        if (game.trackLength && game.trackLength > 0) {
            const progress = ((game.position.z || 0) / game.trackLength * 100).toFixed(1);
            this.ctx.fillText(`Pozíció: ${progress}%`, margin, margin + fontSize * 2 + 10);
        }
        
        // ⭐ IDŐ
        if (game.raceStartTime) {
            const elapsed = (Date.now() - game.raceStartTime) / 1000;
            const minutes = Math.floor(elapsed / 60);
            const seconds = (elapsed % 60).toFixed(1);
            this.ctx.fillText(`Idő: ${minutes}:${seconds.padStart(4, '0')}`, margin, margin + fontSize * 3 + 20);
        }
        
        // ⭐ HALADÁS SÁV
        if (!this.isMobile && game.trackLength && game.trackLength > 0) {
            const barWidth = 300;
            const barHeight = 20;
            const barX = this.width / 2 - barWidth / 2;
            const barY = 20;
            
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            this.ctx.fillStyle = '#00FF00';
            const progressWidth = ((game.position.z || 0) / game.trackLength) * barWidth;
            this.ctx.fillRect(barX, barY, progressWidth, barHeight);
            
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
    
    // ⭐ MINI TÉRKÉP
    renderMiniMap(game, x, y, width, height, isPreview = false) {
        // ⭐ HÁTTÉR
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // ⭐ CÍM
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(isPreview ? 'TÉRKÉP ELŐNÉZET' : 'MINI TÉRKÉP', x + width/2, y + 15);
        
        if (game.mapGenerator && game.mapGenerator.getMiniMapData) {
            try {
                const mapData = game.mapGenerator.getMiniMapData();
                
                if (mapData && mapData.originalImage) {
                    // ⭐ EREDETI TÉRKÉP RAJZOLÁS
                    const mapX = x + 10;
                    const mapY = y + 25;
                    const mapWidth = width - 20;
                    const mapHeight = height - 35;
                    
                    this.ctx.drawImage(mapData.originalImage, mapX, mapY, mapWidth, mapHeight);
                    
                    // ⭐ ÚTVONAL RAJZOLÁS
                    if (mapData.routePoints && mapData.routePoints.length > 0) {
                        this.ctx.strokeStyle = '#FF0000';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        
                        mapData.routePoints.forEach((point, index) => {
                            const pointX = mapX + (point.x / mapData.mapWidth) * mapWidth;
                            const pointY = mapY + (point.y / mapData.mapHeight) * mapHeight;
                            
                            if (index === 0) {
                                this.ctx.moveTo(pointX, pointY);
                            } else {
                                this.ctx.lineTo(pointX, pointY);
                            }
                        });
                        
                        this.ctx.stroke();
                    }
                    
                    // ⭐ JÁTÉKOS POZÍCIÓ
                    if (!isPreview && game.trackLength && game.trackLength > 0) {
                        const progress = (game.position.z || 0) / game.trackLength;
                        const routeIndex = Math.floor(progress * (mapData.routePoints.length - 1));
                        const routePoint = mapData.routePoints[routeIndex];
                        
                        if (routePoint) {
                            const playerX = mapX + (routePoint.x / mapData.mapWidth) * mapWidth;
                            const playerY = mapY + (routePoint.y / mapData.mapHeight) * mapHeight;
                            
                            this.ctx.fillStyle = '#FFFF00';
                            this.ctx.beginPath();
                            this.ctx.arc(playerX, playerY, 4, 0, Math.PI * 2);
                            this.ctx.fill();
                            
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 1;
                            this.ctx.stroke();
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ Mini térkép renderelési hiba:', error);
            }
        }
    }
    
    // ⭐ SZÜNET KÉPERNYŐ
    renderPause() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? 'bold 32px Arial' : 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⏸️ SZÜNET', this.width / 2, this.height / 2);
        
        this.ctx.font = this.isMobile ? '18px Arial' : '24px Arial';
        this.ctx.fillText('ESC - Folytatás', this.width / 2, this.height / 2 + 50);
    }
    
    // ⭐ BEFEJEZETT JÁTÉK
    renderFinished(game) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = this.isMobile ? 'bold 32px Arial' : 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏁 CÉLBA ÉRTÉL!', this.width / 2, this.height / 2 - 50);
        
        if (game.raceStartTime) {
            const elapsed = (Date.now() - game.raceStartTime) / 1000;
            const minutes = Math.floor(elapsed / 60);
            const seconds = (elapsed % 60).toFixed(1);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = this.isMobile ? '24px Arial' : '32px Arial';
            this.ctx.fillText(`Idő: ${minutes}:${seconds.padStart(4, '0')}`, this.width / 2, this.height / 2 + 20);
        }
        
        this.ctx.font = this.isMobile ? '18px Arial' : '24px Arial';
        this.ctx.fillText('F5 - Újraindítás', this.width / 2, this.height / 2 + 80);
    }
}
