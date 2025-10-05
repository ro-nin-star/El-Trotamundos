export class InputManager {
    constructor() {
        this.keys = {};
    }
    
    setupControls(game) {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (game.gameState.current === 'INTRO' && (e.code === 'Enter' || e.code === 'Space')) {
                game.gameState.current = 'PLAYING';
                game.gameEngine.game.raceStartTime = Date.now();
                game.audioManager.startBackgroundMusic();
            }
            
            if (e.code === 'KeyM') {
                game.audioManager.toggleMute();
            }
            
            if (e.code === 'KeyR' && game.gameEngine.game.finished) {
                game.gameEngine.restartRace();
                game.audioManager.startBackgroundMusic();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    isPressed(key) {
        return this.keys[key] || false;
    }
}
