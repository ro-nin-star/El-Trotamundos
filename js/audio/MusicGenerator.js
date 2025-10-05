export class MusicGenerator {
    constructor() {
        this.audioContext = null;
        this.backgroundMusic = {
            bassInterval: null,
            melodyInterval: null,
            drumInterval: null,
            isPlaying: false
        };
    }
    
    setAudioContext(audioContext) {
        this.audioContext = audioContext;
    }
    
    startBackgroundMusic() {
        if (!this.backgroundMusic.isPlaying && this.audioContext) {
            console.log('🎵 Háttérzene indítása...');
            this.createTechnoBass();
            this.createMelodicLead();
            this.createTechnoBeats();
            this.backgroundMusic.isPlaying = true;
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic.bassInterval) {
            clearInterval(this.backgroundMusic.bassInterval);
            this.backgroundMusic.bassInterval = null;
        }
        if (this.backgroundMusic.melodyInterval) {
            clearInterval(this.backgroundMusic.melodyInterval);
            this.backgroundMusic.melodyInterval = null;
        }
        if (this.backgroundMusic.drumInterval) {
            clearInterval(this.backgroundMusic.drumInterval);
            this.backgroundMusic.drumInterval = null;
        }
        this.backgroundMusic.isPlaying = false;
        console.log('🎵 Háttérzene leállítva');
    }
    
    createTechnoBass() {
        const bassPattern = [
            { note: 41.20, duration: 0.25 },
            { note: 0, duration: 0.25 },
            { note: 41.20, duration: 0.15 },
            { note: 46.25, duration: 0.35 }
        ];
        
        let patternIndex = 0;
        
        const playTechnoBass = () => {
            if (!this.audioContext) return;
            
            const currentNote = bassPattern[patternIndex % bassPattern.length];
            
            if (currentNote.note > 0) {
                const bassOsc = this.audioContext.createOscillator();
                const bassGain = this.audioContext.createGain();
                
                bassOsc.type = 'sawtooth';
                bassOsc.frequency.setValueAtTime(currentNote.note, this.audioContext.currentTime);
                
                bassGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + currentNote.duration);
                
                bassOsc.connect(bassGain);
                bassGain.connect(this.audioContext.destination);
                
                bassOsc.start();
                bassOsc.stop(this.audioContext.currentTime + currentNote.duration);
            }
            
            patternIndex++;
        };
        
        playTechnoBass();
        this.backgroundMusic.bassInterval = setInterval(playTechnoBass, 200);
    }
    
    createMelodicLead() {
        const melody = [
            { note: 659.25, duration: 0.8 },
            { note: 783.99, duration: 0.4 },
            { note: 880.00, duration: 0.6 },
            { note: 987.77, duration: 0.4 }
        ];
        
        let melodyIndex = 0;
        
        const playMelodicLead = () => {
            if (!this.audioContext) return;
            
            const currentNote = melody[melodyIndex % melody.length];
            
            const leadOsc = this.audioContext.createOscillator();
            const leadGain = this.audioContext.createGain();
            
            leadOsc.type = 'sawtooth';
            leadOsc.frequency.setValueAtTime(currentNote.note, this.audioContext.currentTime);
            
            leadGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            leadGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
            leadGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + currentNote.duration);
            
            leadOsc.connect(leadGain);
            leadGain.connect(this.audioContext.destination);
            
            leadOsc.start();
            leadOsc.stop(this.audioContext.currentTime + currentNote.duration);
            
            melodyIndex++;
        };
        
        setTimeout(() => {
            playMelodicLead();
            this.backgroundMusic.melodyInterval = setInterval(playMelodicLead, 600);
        }, 300);
    }
    
    createTechnoBeats() {
        let beatIndex = 0;
        
        const playTechnoBeats = () => {
            if (!this.audioContext) return;
            
            const now = this.audioContext.currentTime;
            
            if (beatIndex % 4 === 0) {
                const kickOsc = this.audioContext.createOscillator();
                const kickGain = this.audioContext.createGain();
                
                kickOsc.type = 'sine';
                kickOsc.frequency.setValueAtTime(60, now);
                kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
                
                kickGain.gain.setValueAtTime(0.12, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                
                kickOsc.connect(kickGain);
                kickGain.connect(this.audioContext.destination);
                
                kickOsc.start(now);
                kickOsc.stop(now + 0.2);
            }
            
            beatIndex++;
        };
        
        this.backgroundMusic.drumInterval = setInterval(playTechnoBeats, 150);
    }
}
