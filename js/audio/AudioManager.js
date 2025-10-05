import { MusicGenerator } from './MusicGenerator.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicGenerator = new MusicGenerator();
        this.sounds = {
            muted: false
        };
        this.engineOscillators = null;
        this.engineGain = null;
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGenerator.setAudioContext(this.audioContext);
            this.createEngineSound();
            console.log('🔊 Hang rendszer inicializálva');
        } catch (error) {
            console.log('❌ AudioContext hiba:', error);
            this.sounds.muted = true;
        }
    }
    
    createMuteButton() {
        const muteButton = document.createElement('button');
        muteButton.innerHTML = '🔊 SOUND ON';
        muteButton.style.cssText = `
            position: absolute; top: 10px; right: 10px; padding: 10px 15px;
            background: #333; color: white; border: 2px solid #00FFFF;
            border-radius: 5px; cursor: pointer; font-family: Arial;
            font-size: 14px; z-index: 1000;
        `;
        
        muteButton.addEventListener('click', () => {
            this.toggleMute();
            muteButton.innerHTML = this.sounds.muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
            muteButton.style.borderColor = this.sounds.muted ? '#FF4444' : '#00FFFF';
        });
        
        document.body.appendChild(muteButton);
    }
    
    toggleMute() {
        this.sounds.muted = !this.sounds.muted;
        
        if (this.sounds.muted) {
            this.stopEngineSound();
            this.musicGenerator.stopBackgroundMusic();
        } else {
            this.createEngineSound();
        }
        
        console.log('🔊 Hang:', this.sounds.muted ? 'KIKAPCSOLVA' : 'BEKAPCSOLVA');
    }
    
    startBackgroundMusic() {
        if (!this.sounds.muted) {
            this.musicGenerator.startBackgroundMusic();
        }
    }
    
    stopBackgroundMusic() {
        this.musicGenerator.stopBackgroundMusic();
    }
    
    createEngineSound() {
        if (this.sounds.muted || !this.audioContext) return;
        
        try {
            this.stopEngineSound();
            
            this.engineOscillators = [];
            this.engineGain = this.audioContext.createGain();
            
            const baseOsc = this.audioContext.createOscillator();
            baseOsc.type = 'sawtooth';
            baseOsc.frequency.setValueAtTime(50, this.audioContext.currentTime);
            
            const baseGain = this.audioContext.createGain();
            baseGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            
            baseOsc.connect(baseGain);
            baseGain.connect(this.engineGain);
            this.engineGain.connect(this.audioContext.destination);
            
            baseOsc.start();
            
            this.engineOscillators = [
                { osc: baseOsc, gain: baseGain, type: 'base' }
            ];
        } catch (error) {
            console.log('❌ Engine sound hiba:', error);
        }
    }
    
    stopEngineSound() {
        if (this.engineOscillators) {
            this.engineOscillators.forEach(oscData => {
                try {
                    oscData.osc.stop();
                } catch (e) {}
            });
            this.engineOscillators = null;
        }
    }
    
    updateEngineSound(gameData) {
        if (!this.engineOscillators || !this.engineGain || this.sounds.muted || !this.audioContext) return;
        
        try {
            const speedPercent = gameData.speed / gameData.maxSpeed;
            const rpm = gameData.actualRPM;
            
            const baseFreq = 30 + (rpm / 9000) * 80;
            const volume = 0.08 + (speedPercent * 0.12);
            
            this.engineOscillators.forEach(oscData => {
                const now = this.audioContext.currentTime;
                oscData.osc.frequency.setValueAtTime(baseFreq, now);
                oscData.gain.gain.setValueAtTime(volume * 1.5, now);
            });
        } catch (error) {
            console.log('❌ Engine update hiba:', error);
        }
    }
    
    playSound(type, frequency = 440, duration = 0.1, volume = 0.3) {
        if (!this.audioContext || this.sounds.muted) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const now = this.audioContext.currentTime;
            
            switch(type) {
                case 'finish':
                    const notes = [262, 330, 392, 523];
                    notes.forEach((note, i) => {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(this.audioContext.destination);
                        
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(note, now + i * 0.25);
                        gain.gain.setValueAtTime(0.25, now + i * 0.25);
                        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.4);
                        
                        osc.start(now + i * 0.25);
                        osc.stop(now + i * 0.25 + 0.4);
                    });
                    break;
                    
                case 'collision':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(150, now);
                    oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.4);
                    gainNode.gain.setValueAtTime(volume * 0.8, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                    oscillator.start(now);
                    oscillator.stop(now + 0.4);
                    break;
                    
                case 'gearShift':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(200, now);
                    oscillator.frequency.setValueAtTime(250, now + 0.03);
                    oscillator.frequency.setValueAtTime(180, now + 0.06);
                    gainNode.gain.setValueAtTime(0.15, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                    oscillator.start(now);
                    oscillator.stop(now + 0.12);
                    break;
            }
        } catch (error) {
            console.log('❌ Sound play hiba:', error);
        }
    }
}
