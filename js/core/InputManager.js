export class InputManager {
    constructor() {
        this.keys = {};
    }
    
    setupControls(game) {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Intro indítás
            if (game.gameState.current === 'INTRO' && (e.code === 'Enter' || e.code === 'Space')) {
                game.gameState.current = 'PLAYING';
                game.gameEngine.game.raceStartTime = Date.now();
                game.audioManager.startBackgroundMusic();
                console.log('🏁 Verseny kezdése!');
            }
            
            // Mute toggle
            if (e.code === 'KeyM') {
                game.audioManager.toggleMute();
            }
            
            // Restart
            if (e.code === 'KeyR' && game.gameEngine.game.finished) {
                game.gameEngine.restartRace();
                game.audioManager.startBackgroundMusic();
            }
            
            // AudioContext resume
            if (game.audioManager.audioContext && game.audioManager.audioContext.state === 'suspended') {
                game.audioManager.audioContext.resume();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // ⭐ MOBIL TOUCH ESEMÉNYEK
        if (game.isMobile) {
            game.canvas.addEventListener('touchstart', (e) => {
                if (game.gameState.current === 'INTRO') {
                    e.preventDefault();
                    game.gameState.current = 'PLAYING';
                    game.gameEngine.game.raceStartTime = Date.now();
                    game.audioManager.startBackgroundMusic();
                    console.log('🏁 Verseny kezdése (touch)!');
                }
            }, { passive: false });
        }
    }
    
    isPressed(key) {
        return this.keys[key] || false;
    }
}
