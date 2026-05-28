// ============================================
// SOUND SYSTEM - Super Mario Bros
// ============================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.enabled = false; }
    }

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        switch (type) {
            case 'jump': this._playTone([{ f: 500, d: 0.05 }, { f: 800, d: 0.1 }], 'square', 0.15); break;
            case 'bigjump': this._playTone([{ f: 400, d: 0.05 }, { f: 600, d: 0.05 }, { f: 900, d: 0.1 }], 'square', 0.12); break;
            case 'coin': this._playTone([{ f: 988, d: 0.05 }, { f: 1319, d: 0.15 }], 'square', 0.12); break;
            case 'stomp': this._playTone([{ f: 400, d: 0.03 }, { f: 600, d: 0.08 }], 'square', 0.15); break;
            case 'powerup': this._playSequence([523, 587, 659, 698, 784, 880, 988, 1047], 0.06, 'square', 0.1); break;
            case 'powerdown': this._playTone([{ f: 600, d: 0.1 }, { f: 400, d: 0.1 }, { f: 200, d: 0.2 }], 'square', 0.15); break;
            case 'die': this._playSequence([700, 600, 500, 400, 350, 300, 250, 200], 0.1, 'square', 0.15); break;
            case 'bump': this._playTone([{ f: 300, d: 0.05 }, { f: 200, d: 0.05 }], 'square', 0.1); break;
            case 'break': this._noise(0.1, 0.15); break;
            case 'flag': this._playSequence([523, 659, 784, 1047, 784, 1047], 0.12, 'square', 0.12); break;
            case 'gameover': this._playSequence([400, 350, 300, 350, 250, 200, 175, 150], 0.15, 'triangle', 0.15); break;
            case '1up': this._playSequence([330, 392, 523, 659, 784, 1047], 0.05, 'square', 0.1); break;
            case 'kick': this._playTone([{ f: 800, d: 0.03 }, { f: 500, d: 0.05 }], 'square', 0.1); break;
            case 'fireball': this._playTone([{ f: 1200, d: 0.02 }, { f: 600, d: 0.04 }, { f: 300, d: 0.04 }], 'square', 0.08); break;
            case 'blockbreak': this._playTone([{ f: 600, d: 0.02 }, { f: 400, d: 0.02 }, { f: 200, d: 0.06 }], 'square', 0.12); break;
            case 'pause': this._playTone([{ f: 500, d: 0.1 }], 'square', 0.1); break;
        }
    }

    _playTone(notes, type, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        let t = this.ctx.currentTime;
        for (const n of notes) {
            osc.frequency.setValueAtTime(n.f, t);
            t += n.d;
        }
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(this.ctx.currentTime);
        osc.stop(t + 0.05);
    }

    _playSequence(freqs, dur, type, vol) {
        let t = this.ctx.currentTime;
        for (const f of freqs) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(f, t);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
            osc.start(t);
            osc.stop(t + dur);
            t += dur;
        }
    }

    _noise(dur, vol) {
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        source.connect(gain);
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        source.start();
    }

    // Simple background music using oscillators
    playBGM() {
        if (!this.enabled || !this.ctx) return;
        this.stopBGM();
        this.bgmPlaying = true;
        this._loopBGM();
    }

    _loopBGM() {
        if (!this.bgmPlaying) return;
        const melody = [
            659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0,
            523, 0, 0, 392, 0, 0, 330, 0, 0, 440, 0, 494, 0, 466, 440, 0,
            392, 659, 0, 784, 880, 0, 698, 784, 0, 659, 0, 523, 587, 494, 0, 0
        ];
        const dur = 0.12;
        let t = this.ctx.currentTime;
        this.bgmEndTime = t + melody.length * dur;
        for (const f of melody) {
            if (f > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(f, t);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                gain.gain.setValueAtTime(0.04, t);
                gain.gain.setValueAtTime(0.001, t + dur * 0.8);
                osc.start(t);
                osc.stop(t + dur * 0.9);
            }
            t += dur;
        }
        this.bgmTimeout = setTimeout(() => this._loopBGM(), melody.length * dur * 1000);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
    }
}
