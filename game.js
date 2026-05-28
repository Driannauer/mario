// ============================================
// SUPER MARIO BROS - Main Game Engine
// ============================================

const T = 16; // tile size
const SCALE = 3;
const W = 256; // NES width
const H = 240; // NES height
const GRAVITY = 0.4;
const FRICTION = 0.85;

// ---- INPUT ----
const keys = {};
const keyPressed = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (!e.repeat) keyPressed[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyX', 'KeyJ'].includes(e.code)) e.preventDefault();
});
// Helper to clear all inputs
function clearInputs() {
    for (const code in keys) keys[code] = false;
    for (const code in keyPressed) keyPressed[code] = false;
    // Also explicitly clear specific directional flags if any custom ones exist
}

window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', clearInputs);
window.addEventListener('focus', clearInputs); // Clear on focus gain to prevent stale state
document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInputs();
});
// Right-click context menu often causes stuck keys
window.addEventListener('contextmenu', (e) => {
    // e.preventDefault(); // Un-comment if you want to block context menu entirely
    clearInputs();
});

// Helper to check multiple keys
function keyLeft() { return keys['ArrowLeft'] || keys['KeyA']; }
function keyRight() { return keys['ArrowRight'] || keys['KeyD']; }
function keyJump() { return keys['Space'] || keys['ArrowUp'] || keys['KeyW']; }
function keyDown() { return keys['ArrowDown'] || keys['KeyS']; }
function keyFire() { return keyPressed['KeyX'] || keyPressed['KeyJ']; }

// ---- GAME CLASS ----
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = W;
        this.canvas.height = H;
        this.canvas.style.width = W * SCALE + 'px';
        this.canvas.style.height = H * SCALE + 'px';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.sound = new SoundManager();
        this.levelIndex = 0;
        this.lives = 2;
        this.gameMode = 'normal'; // 'normal' or 'extreme'
        this.menuSelection = 0; // 0: Normal, 1: Extreme
        this.reset();
        this.state = 'title';
        this.titleBlink = 0;
        this.canvas.addEventListener('click', () => {
            this.sound.resume();
            if (this.state === 'title') this.startGame();
            else if (this.state === 'gameover') { this.lives = 2; this.score = 0; this.coins = 0; this.reset(); this.startGame(); }
            else if (this.state === 'win') { this.reset(); this.startGame(); }
        });
        this.lastTime = 0;
        this.accumulator = 0;
        requestAnimationFrame(t => this.loop(t));
    }

    reset(keepTime = false, resetLives = false) {
        // Load current level data
        LEVEL_DATA = LEVELS[this.levelIndex];
        this.map = LEVEL_DATA.generate();
        this.camera = { x: 0 };

        // Determine start position
        const startX = (LEVEL_DATA.startCol !== undefined) ? LEVEL_DATA.startCol * T : 40;
        const startY = (LEVEL_DATA.startRow !== undefined) ? LEVEL_DATA.startRow * T : 176;

        this.mario = {
            x: startX, y: startY, vx: 0, vy: 0, w: 12, h: 16, dir: 1, big: false, fire: false,
            frame: 0, frameTimer: 0, onGround: false, jumping: false, dead: false,
            invincible: true, invTimer: 2.0, ducking: false, growTimer: 0, shrinkTimer: 0,
            star: false, starTimer: 0, winning: false, winTimer: 0, deathTimer: 0,
            visible: true
        };
        this.enemies = [];
        this.items = [];
        this.fireballs = [];
        this.particles = [];
        this.particles = [];
        this.textParticles = []; // For "Honor of Kings" event
        this.coinEffects = [];
        this.blockAnims = [];
        this.score = this.score || 0;
        this.coins = this.coins || 0;
        this.lives = this.lives !== undefined ? this.lives : 2;
        this.coins = this.coins || 0;
        this.lives = (this.lives !== undefined && !resetLives) ? this.lives : 2;
        if (!keepTime) {
            this.time = 999; // Reset time only if specified (new level/game)
        }
        this.timeAccum = 0;
        this.flagY = 0;
        this.flagDescending = false;
        this.animTimer = 0;
        this.fireCooldown = 0;
        this.spawnedEnemies = new Set();
        this.bgmStarted = false;
        // Pipe / underground system
        this.underground = false;
        this.undergroundMap = null;
        this.pipeAnim = null;
        this.savedOverworld = null;
        this.castleEnterTimer = 0;

        // Always reset screen shake and boss fireballs (prevents leftovers across levels)
        this.screenShake = 0;
        this.bossFireballs = [];
        this.powBricksHit = new Set();

        // Boss init
        if (LEVEL_DATA.isBossLevel) {
            this.boss = {
                x: LEVEL_DATA.boss.startCol * T,
                y: LEVEL_DATA.boss.startRow * T,
                w: 32, h: 32, vx: -1, vy: 0, hp: LEVEL_DATA.boss.hp,
                dead: false, frame: 0, timer: 0,
                fireTimer: 0,
                // 3-Phase system
                phase: 1,           // 1=bridge, 2=lava, 3=enraged
                lavaPhase: false,
                enraged: false,
                phaseTimer: 0,
                floorCollapseTimer: 0,
                collapsedCols: new Set(),
                fakeDeathTimer: 0,
                fakeDeathDone: false,
                speedMult: 1.0,
                burstCount: 0,
            };
            this.bridgeBroken = false;
            this.bridgeBreakTimer = 0;
            this.trophySpawned = false;
            this.enteredDoor = false;
            this.doorTimer = 0;
            this.doorOpen = false;
        } else {
            this.boss = null;
        }
        this.isTimeout = false; // Reset timeout flag
    }

    startGame() {
        this.state = 'levelIntro';
        this.animTimer = 0;
        this.sound.stopBGM();
    }

    loop(timestamp) {
        let dt = (timestamp - this.lastTime) / 1000;
        if (dt > 0.05) dt = 0.05; // Cap dt to prevent spiral of death
        this.lastTime = timestamp;
        this.accumulator += dt;
        this.titleBlink += dt;

        // --- INPUT HANDLING (Once per frame) ---
        // Pause toggle
        if (keyPressed['KeyP'] || keyPressed['Escape']) {
            if (this.state === 'playing') {
                this.state = 'paused';
                this.sound.stopBGM();
                this.sound.play('pause');
            } else if (this.state === 'paused') {
                this.state = 'playing';
                this.sound.playBGM();
            }
        }

        // Level select / Restart inputs (Only if paused/gameover/complete)
        if (this.state === 'paused') {
            // Level Select - ONLY in Normal Mode
            if (this.gameMode !== 'extreme') {
                for (let i = 0; i < 5; i++) {
                    if (keyPressed['Digit' + (i + 1)] || keyPressed['Numpad' + (i + 1)]) {
                        this.lives = 2;
                        this.safeRestart(i, false);
                        break;
                    }
                }
            }
        }
        if (keyPressed['KeyR'] && this.gameMode !== 'extreme') {
            if (this.state === 'playing' || this.state === 'paused') this.safeRestart(this.levelIndex, true);
            else if (this.state === 'gameover') {
                this.lives = 2; this.score = 0; this.coins = 0;
                this.safeRestart(this.levelIndex || 0, true);
            } else if (this.state === 'gameComplete') {
                this.levelIndex = 0; this.lives = 2; this.score = 0; this.coins = 0;
                this.reset();
                this.state = 'title';
            }
        }
        if (this.state === 'gameover' && keyPressed['Enter']) {
            this.levelIndex = 0;
            this.lives = 2; this.score = 0; this.coins = 0;
            this.reset();
            this.state = 'title'; // Return to title screen
            this.menuSelection = 0;
            keyPressed['Enter'] = false; // Consume the key so updateTitle won't see it
        }

        // --- FIXED UPDATE LOOP ---
        const step = 1 / 60;
        let firstStep = true;
        while (this.accumulator >= step) {
            if (this.state === 'title') {
                this.animTimer += step;
                this.updateTitle(step);
            } else if (this.state === 'playing') {
                this.animTimer += step;
                this.update(step);
            } else if (this.state === 'levelIntro') {
                this.animTimer += step;
                if (this.animTimer > 2.0) {
                    this.state = 'playing';
                    this.sound.playBGM();
                    this.bgmStarted = true;
                }
            } else if (this.state === 'dying') {
                this.updateDying(step);
            } else if (this.state === 'pipeEnter' || this.state === 'pipeExit') {
                this.updatePipeAnim(step);
            } else if (this.state === 'celebration') {
                this.updateCelebration(step);
            }
            // Clear triggers after the first step so keyFire() etc. work exactly once
            if (firstStep) {
                for (const k in keyPressed) keyPressed[k] = false;
                firstStep = false;
            }
            this.accumulator -= step;
        }

        // --- RENDER ---
        if (this.state === 'levelIntro') {
            this.renderIntro();
        } else {
            this.render();
        }

        requestAnimationFrame(t => this.loop(t));
    }

    safeRestart(levelIdx, keepTime = false) {
        try {
            this.levelIndex = levelIdx;
            this.reset(keepTime);
            this.startGame();
        } catch (e) {
            console.error('Failed to restart', e);
            this.state = 'paused';
        }
    }

    renderIntro() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, W, H);
        this.ctx.font = 'bold 12px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#FCFCFC';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`WORLD ${LEVEL_DATA.name}`, W / 2, H / 2 - 10);
        this.ctx.fillText(`x ${this.lives}`, W / 2 + 15, H / 2 + 30);
        SPRITE.drawSmallMario(this.ctx, W / 2 - 25, H / 2 + 20, 1, 0, false, 0);
    }

    // ---- UPDATE ----
    update(dt) {
        // Decay screen shake globally (not just in boss update)
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 8);

        if (this.mario.winning) { this.updateWinning(dt); return; }

        const m = this.mario;
        const run = keys['ShiftLeft'] || keys['ShiftRight'];
        const spectator = keys['KeyB']; // Spectator mode toggle (B key)

        if (spectator) {
            // NoClip Mode
            const speed = run ? 6 : 3;
            if (keyLeft()) m.x -= speed;
            if (keyRight()) m.x += speed;
            if (keys['ArrowUp'] || keys['KeyW']) m.y -= speed;
            if (keyDown()) m.y += speed;

            m.vx = 0; m.vy = 0; // Stop physics movement
            m.onGround = false; // Always flying

            // Standard camera follow
            const camTarget = m.x - W / 3;
            this.camera.x = Math.max(0, Math.min(camTarget, (this.mapWidth - 16) * T));

            // Update timers but skip physics
            this.timeAccum += dt;
            if (this.timeAccum >= 0.4) { this.timeAccum -= 0.4; if (this.time > 0) this.time--; }

            // Still spawn enemies so you can see them (only in overworld)
            if (!this.underground) {
                for (let i = 0; i < LEVEL_DATA.enemies.length; i++) {
                    if (this.spawnedEnemies.has(i)) continue;
                    const [type, col, row] = LEVEL_DATA.enemies[i];
                    if (col * T < this.camera.x + W + 32) {
                        this.spawnedEnemies.add(i);
                        const ey = row * T;
                        if (type === 'goomba') this.enemies.push({ type: 'goomba', x: col * T, y: ey, vx: -0.6, vy: 0, w: 16, h: 16, frame: 0, ft: 0, dead: false, deadTimer: 0, onGround: false });
                        else this.enemies.push({ type: 'koopa', x: col * T, y: ey - 8, vx: -0.6, vy: 0, w: 16, h: 24, frame: 0, ft: 0, dead: false, inShell: false, shellSpeed: 0, deadTimer: 0, onGround: false });
                    }
                }
            }
            // Update enemies (animation only essentially, since collision is skipped below)
            this.updateEnemies(dt);
            // Update Boss
            // Update Boss (Check underground to avoid auto-win bug)
            if (this.boss && !this.boss.dead && !this.bridgeBroken && !this.underground) this.updateBoss(dt);
            // Update items
            this.updateItems(dt);
            // Particles
            this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= dt; return p.life > 0; });
            this.textParticles = this.textParticles.filter(p => {
                p.vy += 0.15; // Gravity
                p.y += p.vy;
                p.x += p.vx;

                // Ground collision
                const row = Math.floor((p.y) / T);
                const col = Math.floor(p.x / T);
                if (row >= 0 && row < this.height && col >= 0 && col < this.mapWidth && this.isSolid(row, col)) {
                    p.y = row * T - 2; // Sit on top
                    p.vy = 0;
                    p.vx *= 0.8; // Friction
                }

                // Bounce off bottom screen
                if (p.y > H - 10) { p.y = H - 10; p.vy = -p.vy * 0.5; }

                // Collect by Mario (Simple collection, no reward)
                if (Math.abs(p.x - this.mario.x) < 12 && Math.abs(p.y - this.mario.y) < 16) {
                    return false; // Collected
                }

                p.life -= dt;
                return p.life > 0;
            });
            this.coinEffects = this.coinEffects.filter(c => { c.y += c.vy; c.vy += 0.4; c.life -= dt; return c.life > 0; });
            this.blockAnims = this.blockAnims.filter(b => { b.timer -= dt; return b.timer > 0; });
            this.updateFireballs(dt);
            return; // Skip normal update
        }

        const maxSpeed = run ? 2.8 : 1.8;
        const accel = run ? 0.12 : 0.08;

        // Horizontal movement
        if (keyLeft() && !m.ducking) { m.vx -= accel; m.dir = -1; }
        else if (keyRight() && !m.ducking) { m.vx += accel; m.dir = 1; }
        else { m.vx *= FRICTION; if (Math.abs(m.vx) < 0.1) m.vx = 0; }
        m.vx = Math.max(-maxSpeed, Math.min(maxSpeed, m.vx));

        // Ducking (big mario only)
        m.ducking = m.big && m.onGround && keyDown();
        if (m.big) { m.h = m.ducking ? 16 : 28; m.w = 14; } else { m.h = 16; m.w = 12; }

        // Jump
        if (keyJump() && m.onGround && !m.ducking) {
            m.vy = m.big ? -7.5 : -7;
            m.onGround = false;
            m.jumping = true;
            this.sound.play(m.big ? 'bigjump' : 'jump');
        }
        // Variable jump height
        if (m.jumping && !keyJump() && m.vy < -2) {
            m.vy = -2;
        }

        // Fireball shooting (HOMING)
        if (m.fire && keyFire() && this.fireCooldown <= 0 && this.fireballs.length < 2) {
            // Find nearest target
            let target = null;
            let minDist = Infinity;

            // Check enemies
            for (const e of this.enemies) {
                if (e.dead) continue;
                const dist = Math.hypot((e.x + e.w / 2) - m.x, (e.y + e.h / 2) - m.y);
                if (dist < minDist) { minDist = dist; target = e; }
            }
            // Check Boss
            if (this.boss && !this.boss.dead && !this.boss.transitioning) {
                const dist = Math.hypot((this.boss.x + this.boss.w / 2) - m.x, (this.boss.y + this.boss.h / 2) - m.y);
                if (dist < minDist) { minDist = dist; target = this.boss; }
            }

            let vx, vy;
            const speed = 5;
            if (target && minDist < 250) { // Target within reasonable range
                // Homing vector
                const dx = (target.x + target.w / 2) - (m.x + (m.dir > 0 ? m.w : -8));
                const dy = (target.y + target.h / 2) - (m.y + (m.big ? 12 : 4));
                const len = Math.hypot(dx, dy);
                vx = (dx / len) * speed;
                vy = (dy / len) * speed;
            } else {
                // Default straight shot
                vx = m.dir * speed;
                vy = 0;
            }

            this.fireballs.push({
                x: m.x + (m.dir > 0 ? m.w : -8), y: m.y + (m.big ? 12 : 4),
                vx: vx, vy: vy, w: 8, h: 8, bounceCount: 0
            });
            this.fireCooldown = 0.15;
            this.sound.play('bump');
        }
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        // Grow/shrink animation (freeze physics)
        if (m.growTimer > 0) { m.growTimer -= dt; m.vy = 0; return; }
        if (m.shrinkTimer > 0) { m.shrinkTimer -= dt; m.vy = 0; return; }

        // Gravity
        m.vy += GRAVITY;
        if (m.vy > 8) m.vy = 8;

        // Move X
        m.x += m.vx;
        if (m.x < 0) m.x = 0; // Level boundary
        this.collideX(m);

        // Move Y
        m.y += m.vy;
        m.onGround = false;
        this.collideY(m);

        // Fall in pit
        if (m.y > H + 16) { this.die(); return; }

        // Animation
        if (m.onGround) {
            m.jumping = false;
            if (Math.abs(m.vx) > 0.3) {
                m.frameTimer += dt * Math.abs(m.vx) * 3;
                if (m.frameTimer > 1) { m.frameTimer = 0; m.frame = (m.frame + 1) % 3; }
            } else { m.frame = 0; m.frameTimer = 0; }
        }

        // Invincibility timer
        if (m.invincible) {
            m.invTimer += dt;
            if (m.invTimer > 2) { m.invincible = false; m.invTimer = 0; }
        }

        // Star timer
        if (m.star) {
            m.starTimer -= dt;
            if (m.starTimer <= 0) {
                m.star = false;
                // STAR EXPLOSION - fixed radius AoE damage (2 fireball equivalent)
                const explosionRadius = 80;
                const cx = m.x + m.w / 2;
                const cy = m.y + m.h / 2;
                // Visual explosion particles
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    this.particles.push({
                        x: cx, y: cy,
                        vx: Math.cos(angle) * (3 + Math.random() * 3),
                        vy: Math.sin(angle) * (3 + Math.random() * 3),
                        life: 0.6 + Math.random() * 0.3
                    });
                }
                this.screenShake = 1.5;
                this.sound.play('kick');
                // Damage enemies in range
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const e = this.enemies[i];
                    if (e.dead) continue;
                    const dx = (e.x + 8) - cx;
                    const dy = (e.y + 8) - cy;
                    if (Math.sqrt(dx * dx + dy * dy) < explosionRadius) {
                        e.dead = true; e.vy = -4;
                        this.score += 200;
                    }
                }
                // Damage boss if in range (2 HP = 2 fireballs worth)
                if (this.boss && !this.boss.dead) {
                    const bx = (this.boss.x + this.boss.w / 2) - cx;
                    const by = (this.boss.y + this.boss.h / 2) - cy;
                    if (Math.sqrt(bx * bx + by * by) < explosionRadius) {
                        this.boss.hp -= 2;
                        this.screenShake = 2;
                        this.sound.play('blockbreak');
                    }
                }
            }
        }

        // Camera - follows Mario in both directions
        const camTarget = m.x - W / 3;
        this.camera.x = Math.max(0, Math.min(camTarget, (this.mapWidth - 16) * T));

        // Timer
        // Timer (Real-time seconds)
        // Timer (Real-time seconds)
        this.timeAccum += dt;
        if (this.timeAccum >= 1.0) {
            this.timeAccum -= 1.0;
            if (this.time > 0) {
                this.time--;
                if (this.time === 0) { // TIME OUT -> Game Over
                    this.state = 'gameover';
                    this.isTimeout = true; // Flag for render
                    this.sound.play('gameover');
                }
            }
        }

        // Spawn enemies when near (only in overworld)
        if (!this.underground) {
            for (let i = 0; i < LEVEL_DATA.enemies.length; i++) {
                if (this.spawnedEnemies.has(i)) continue;
                const [type, col, row] = LEVEL_DATA.enemies[i];
                if (col * T < this.camera.x + W + 32) {
                    this.spawnedEnemies.add(i);
                    const ey = row * T;
                    if (type === 'goomba') this.enemies.push({ type: 'goomba', x: col * T, y: ey, vx: -0.6, vy: 0, w: 16, h: 16, frame: 0, ft: 0, dead: false, deadTimer: 0, onGround: false });
                    else this.enemies.push({ type: 'koopa', x: col * T, y: ey - 8, vx: -0.6, vy: 0, w: 16, h: 24, frame: 0, ft: 0, dead: false, inShell: false, shellSpeed: 0, deadTimer: 0, onGround: false });
                }
            }
        }

        // Update enemies
        // Update enemies
        this.updateEnemies(dt);

        // Update Boss (runs through all phases, even after bridge break)
        // Skip when underground - boss exists in overworld coordinates only
        if (this.boss && !this.boss.dead && !this.underground) {
            this.updateBoss(dt);
        }

        // Update items
        this.updateItems(dt);

        // Update particles
        this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= dt; return p.life > 0; });

        // Update coin effects
        this.coinEffects = this.coinEffects.filter(c => { c.y += c.vy; c.vy += 0.4; c.life -= dt; return c.life > 0; });

        // Update block animations
        this.blockAnims = this.blockAnims.filter(b => { b.timer -= dt; return b.timer > 0; });

        // Update fireballs
        this.updateFireballs(dt);

        // Check pipe entry
        if (!this.underground && m.onGround && keyDown()) {
            for (const pipe of LEVEL_DATA.enterablePipes) {
                const px = pipe.col * T;
                const pipeTopRow = this.findPipeTop(pipe.col);
                if (pipeTopRow >= 0) {
                    const py = pipeTopRow * T;
                    // Mario must be standing on top of the pipe
                    if (m.x + m.w > px + 4 && m.x < px + 28 && Math.abs((m.y + m.h) - py) < 16) {
                        this.startPipeEnter(pipe);
                        return;
                    }
                }
            }
        }

        // Check exit pipe in underground
        if (this.underground && m.onGround && keyDown()) {
            const ep = LEVEL_DATA.undergroundExitPipe;
            const px = ep.col * T;
            const py = ep.topRow * T;
            if (m.x + m.w > px + 4 && m.x < px + 28 && Math.abs((m.y + m.h) - py) < 16) {
                this.startPipeExit();
                return;
            }
        }

        // Check flagpole (skip on boss levels which have no flagpole)
        if (!this.underground && !LEVEL_DATA.isBossLevel && LEVEL_DATA.flagpoleCol > 0) {
            const fpx = LEVEL_DATA.flagpoleCol * T;
            if (!m.winning && m.x + m.w > fpx && m.x < fpx + 4) {
                m.winning = true;
                m.winTimer = 0;
                m.vx = 0;
                m.vy = 0;
                m.x = fpx - m.w + 2;
                this.flagDescending = true;
                this.flagY = m.y;
                this.sound.stopBGM();
                this.sound.play('flag');
                this.score += Math.max(0, (12 * T - Math.floor(m.y)) * 5);
            }
        }

        // Check door proximity (Boss Level) - Open door animation trigger
        if (LEVEL_DATA.isBossLevel && this.boss && this.boss.dead && !this.doorOpen) {
            const doorLoc = 168 * T;
            // Trigger open when within 4 tiles
            if (Math.abs((this.mario.x + this.mario.w / 2) - (doorLoc + 8)) < 64) {
                this.doorOpen = true;
                this.sound.play('bump'); // Door opening sound
            }
        }

        // Check boss door entry (player walks to door manually after boss dies)
        if (this.doorOpen && !m.winning && LEVEL_DATA.isBossLevel) {
            const doorCol = 168; // Door is at col 168
            const doorX = doorCol * T;
            if (m.x + m.w > doorX && m.x < doorX + T && m.y < 7 * T && m.y > 3 * T) {
                // Mario reached the open door!
                m.winning = true;
                m.winTimer = 0;
                m.vx = 0;
                m.vy = 0;
                // m.visible = false; // Don't hide yet! Walk in first.
                this.enteredDoor = true;
                this.doorTimer = 0;
                this.sound.stopBGM();
                this.sound.play('flag');
            }
        }

    }

    // Find the top row of a pipe at the given column
    findPipeTop(col) {
        const currentMap = this.underground ? this.undergroundMap : this.map;
        for (let r = 0; r < this.height; r++) {
            if (currentMap[r] && currentMap[r][col] === 7) return r;
        }
        return -1;
    }

    startPipeEnter(pipeData) {
        const m = this.mario;
        m.vx = 0; m.vy = 0;
        // Center Mario on pipe
        m.x = pipeData.col * T + 8;
        this.sound.play('bump');
        this.state = 'pipeEnter';
        this.pipeAnim = {
            type: 'enter',
            timer: 0,
            duration: 1.0,
            pipeData: pipeData,
            startY: m.y,
            phase: 'descend' // descend, transition
        };
    }

    startPipeExit() {
        const m = this.mario;
        m.vx = 0; m.vy = 0;
        m.x = LEVEL_DATA.undergroundExitPipe.col * T + 8;
        this.sound.play('bump');
        this.state = 'pipeEnter';
        this.pipeAnim = {
            type: 'exitUnderground',
            timer: 0,
            duration: 1.0,
            phase: 'descend',
            startY: m.y
        };
    }

    updatePipeAnim(dt) {
        const anim = this.pipeAnim;
        if (!anim) return;
        anim.timer += dt;
        const m = this.mario;

        if (anim.type === 'enter') {
            if (anim.phase === 'descend') {
                // Mario slides down into pipe
                m.y = anim.startY + (anim.timer / 0.5) * 32;
                if (anim.timer >= 0.5) {
                    anim.phase = 'transition';
                    anim.timer = 0;
                    // Save overworld state and switch to underground
                    this.savedOverworld = {
                        map: this.map,
                        camera: { ...this.camera },
                        enemies: [...this.enemies],
                        items: [...this.items],
                        spawnedEnemies: new Set(this.spawnedEnemies),
                        exitCol: anim.pipeData.exitCol,
                        exitRow: anim.pipeData.exitRow
                    };
                    // Setup underground
                    this.underground = true;
                    this.undergroundMap = LEVEL_DATA.generateUnderground();
                    this.map = this.undergroundMap;
                    this.enemies = [];
                    this.items = [];
                    m.x = 2 * T;
                    m.y = 12 * T - m.h;
                    m.vx = 0; m.vy = 0;
                    this.camera.x = 0;
                }
            } else if (anim.phase === 'transition') {
                // Brief black screen then appear
                if (anim.timer >= 0.4) {
                    this.state = 'playing';
                    this.pipeAnim = null;
                }
            }
        } else if (anim.type === 'exitUnderground') {
            if (anim.phase === 'descend') {
                m.y = anim.startY + (anim.timer / 0.5) * 32;
                if (anim.timer >= 0.5) {
                    anim.phase = 'transition';
                    anim.timer = 0;
                    // Restore overworld
                    const saved = this.savedOverworld;
                    this.underground = false;
                    this.map = saved.map;
                    this.enemies = saved.enemies;
                    this.items = saved.items;
                    this.spawnedEnemies = saved.spawnedEnemies;
                    // Position Mario at exit pipe
                    const exitPipeTop = this.findPipeTop(saved.exitCol);
                    m.x = saved.exitCol * T + 8;
                    m.y = (exitPipeTop >= 0 ? exitPipeTop : saved.exitRow) * T - m.h - 1;
                    m.vx = 0; m.vy = 0;
                    this.camera.x = Math.max(0, m.x - W / 3);
                    this.undergroundMap = null;
                    this.savedOverworld = null;
                }
            } else if (anim.phase === 'transition') {
                if (anim.timer >= 0.4) {
                    this.state = 'playing';
                    this.pipeAnim = null;
                }
            }
        } else if (anim.type === 'rise') {
            // Mario rising out of pipe
            m.y = anim.startY - (anim.timer / 0.5) * 32;
            if (anim.timer >= 0.5) {
                this.state = 'playing';
                this.pipeAnim = null;
                m.onGround = false;
            }
        }
    }

    updateWinning(dt) {
        const m = this.mario;
        m.winTimer += dt;

        if (LEVEL_DATA.isBossLevel) {
            // Boss level win - door already entered in update(), handle teleport & celebration
            const celebX = LEVEL_DATA.podiumCol * T;
            m.dir = 1;

            // Brief pause inside door, then teleport to celebration room
            this.doorTimer += dt;

            // Walk into door animation (only before teleport)
            if (this.enteredDoor === true) {
                if (this.doorTimer < 0.6) {
                    m.x += 0.5; // Walk slowly into darkness
                    m.frame = Math.floor(this.doorTimer * 10) % 3;
                } else {
                    m.visible = false; // Disappear into the darkness
                }

                if (this.doorTimer > 1.0) {
                    // Teleport to celebration room
                    m.visible = true;
                    m.x = (LEVEL_DATA.celebrationStartCol + 2) * T;
                    m.y = 12 * T - m.h;
                    m.vx = 0; m.vy = 0;
                    this.camera.x = Math.max(0, m.x - W / 3);
                    this.enteredDoor = 'walking';
                }
            }
            if (this.enteredDoor === 'walking') {
                if (m.x < celebX - 4) {
                    m.x += 1.5;
                    m.frame = Math.floor(m.winTimer * 6) % 3;
                    m.vy += GRAVITY;
                    m.y += m.vy;
                    m.onGround = false;
                    // Smart ground detection for podium stairs
                    const mc = Math.floor((m.x + m.w / 2) / T);
                    const headRow = Math.max(0, Math.floor(m.y / T));
                    let landed = false;
                    for (let r = headRow; r < this.height; r++) {
                        if (this.isSolid(r, mc)) {
                            m.y = r * T - m.h;
                            m.vy = 0;
                            m.onGround = true;
                            landed = true;
                            break;
                        }
                    }
                    if (!landed) this.collideY(m);
                } else {
                    // Arrived at podium - enter celebration
                    m.x = celebX;
                    this.state = 'celebration';
                    this.celebrationTimer = 0;
                    this.fireworks = [];
                    this.celebrationPhase = 'standing';
                    m.winning = false;
                }
            }
            return;
        }

        // Castle door X position (castle is drawn at castleCol * T, door is at offset +28)
        const castleDoorX = LEVEL_DATA.castleCol * T + 36;

        if (m.winTimer < 1.5) {
            // Phase 1: Slide down flagpole
            m.y += 2;
            if (m.y > 12 * T - m.h) m.y = 12 * T - m.h;
            this.flagY = Math.min(this.flagY + 2, 12 * T - 16);
        } else if (m.winTimer < 1.6) {
            // Phase 2: Brief pause at bottom of pole, switch direction
            m.dir = 1;
            m.frame = 0;
        } else if (m.x < castleDoorX) {
            // Phase 3: Walk towards castle door
            m.dir = 1;
            m.x += 1.5;
            m.frame = Math.floor(m.winTimer * 6) % 3;
            m.vy += GRAVITY;
            m.y += m.vy;
            m.onGround = false;
            this.collideY(m);
        } else {
            // Phase 4: Mario is at the door
            if (!this.castleEnterTimer) {
                this.castleEnterTimer = 0;
                m.visible = false; // Hide Mario (he entered the castle)
            }
            this.castleEnterTimer += dt;
            if (this.castleEnterTimer > 0.8) {
                this.castleEnterTimer = 0;
                m.visible = true; // Reset for next level
                this.nextLevel();
            }
        }
    }

    updateCelebration(dt) {
        this.celebrationTimer += dt;
        this.animTimer += dt;

        // Delayed trophy drop (2 seconds)
        if (this.celebrationTimer > 2.0 && !this.trophySpawned) {
            this.trophySpawned = true;
            this.sound.play('powerup');
            const cx = LEVEL_DATA.podiumCol * T;
            // Spawn 3 trophies aligned with enlarged podium blocks
            // 1st Place (Center, cols 200-201) - land on top of 3-high block
            this.items.push({ type: 'trophy', x: cx + 8, y: -32, vx: 0, vy: 0 });
            // 2nd Place (Left, cols 198-199) - land on 2-high block
            this.items.push({ type: 'trophy', x: (LEVEL_DATA.podiumCol - 2) * T + 8, y: -64, vx: 0, vy: 0 });
            // 3rd Place (Right, cols 202-203) - land on 1-high block
            this.items.push({ type: 'trophy', x: (LEVEL_DATA.podiumCol + 2) * T + 8, y: -48, vx: 0, vy: 0 });
        }

        // Update items so trophies can fall
        this.updateItems(dt);

        // Camera follows Mario
        const m = this.mario;
        this.camera.x = Math.max(0, m.x - W / 2);

        if (this.celebrationPhase === 'standing') {
            // Brief pause on podium, face camera
            m.dir = 0; // Will be used to signal front-facing
            if (this.celebrationTimer > 1.5) {
                this.celebrationPhase = 'fireworks';
                this.celebrationTimer = 0;
                this.nextFirework = 0;
                this.celebJumpTimer = 0;
                this.sound.play('powerup');
            }
        } else if (this.celebrationPhase === 'fireworks') {
            // Celebration jump animation
            this.celebJumpTimer = (this.celebJumpTimer || 0) + dt;
            if (this.celebJumpTimer > 1.2 && m.onGround) {
                m.vy = -3.5; // Small celebration jump
                m.onGround = false;
                this.celebJumpTimer = 0;
                this.sound.play('jump');
            }
            // Apply gravity for celebration jumps
            if (!m.onGround) {
                m.vy += 0.2;
                m.y += m.vy;
                // Ground detection
                const mc = Math.floor((m.x + m.w / 2) / T);
                for (let r = Math.floor(m.y / T); r < this.height; r++) {
                    if (this.isSolid(r, mc)) {
                        if (m.y + m.h > r * T && m.vy > 0) {
                            m.y = r * T - m.h;
                            m.vy = 0;
                            m.onGround = true;
                        }
                        break;
                    }
                }
            }
            // Launch fireworks
            this.nextFirework -= dt;
            if (this.nextFirework <= 0 && this.celebrationTimer < 6.0) {
                this.nextFirework = 0.8;
                // Launch a firework
                const fx = m.x + (Math.random() - 0.5) * 120;
                const fy = m.y - 60 - Math.random() * 80;
                const colors = ['#FF4444', '#44FF44', '#4488FF', '#FFFF44', '#FF44FF', '#44FFFF', '#FF8800', '#FFFFFF'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                // Create explosion particles
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.3;
                    const speed = 1.5 + Math.random() * 2;
                    this.fireworks.push({
                        x: fx, y: fy,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: color,
                        life: 1.5 + Math.random() * 0.5,
                        maxLife: 2.0,
                        size: 2 + Math.random() * 2
                    });
                }
                this.sound.play('coin');
            }

            // Update firework particles
            for (let i = this.fireworks.length - 1; i >= 0; i--) {
                const f = this.fireworks[i];
                f.x += f.vx;
                f.y += f.vy;
                f.vy += 0.05; // Light gravity
                f.life -= dt;
                if (f.life <= 0) this.fireworks.splice(i, 1);
            }

            if (this.celebrationTimer > 7.0) {
                this.celebrationPhase = 'waiting';
            }
        } else if (this.celebrationPhase === 'waiting') {
            // Wait for Enter key
            // Update remaining firework particles
            for (let i = this.fireworks.length - 1; i >= 0; i--) {
                const f = this.fireworks[i];
                f.x += f.vx;
                f.y += f.vy;
                f.vy += 0.05;
                f.life -= dt;
                if (f.life <= 0) this.fireworks.splice(i, 1);
            }

            if (keys['Enter'] || keyPressed['Enter']) {
                this.state = 'gameComplete';
            }
        }
    }

    nextLevel() {
        this.levelIndex++;
        if (this.levelIndex >= LEVELS.length) {
            this.state = 'gameComplete';
        } else {
            // Normal Mode: Reset Lives and Time on level change
            // Extreme Mode: Carry over Lives and Time (Continuous)
            const isExtreme = this.gameMode === 'extreme';
            if (!isExtreme) {
                this.lives = 2; // Reset lives
                this.time = 999; // Reset time
                this.reset(false, true); // Don't keep time, Reset lives
            } else {
                this.reset(true, false); // Keep time, Keep lives
            }
            this.startGame();
        }
    }

    updateDying(dt) {
        const m = this.mario;
        m.deathTimer += dt;
        if (m.deathTimer < 0.4) return;
        if (m.deathTimer < 0.5) { m.vy = -7; }
        m.vy += GRAVITY;
        m.y += m.vy;
        if (m.deathTimer > 3) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = 'gameover';
                this.isTimeout = false; // Regular death
                this.sound.play('gameover');
            }
            else { this.reset(true); this.startGame(); } // Keep time on respawn
        }
    }

    updateEnemies(dt) {
        const m = this.mario;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.dead) {
                e.deadTimer += dt;
                if (e.type === 'goomba' && e.deadTimer > 0.5) { this.enemies.splice(i, 1); continue; }
                if (e.deadTimer > 2) { this.enemies.splice(i, 1); }
                continue;
            }

            // Koopa shell movement
            if (e.type === 'koopa' && e.inShell && e.shellSpeed !== 0) {
                e.x += e.shellSpeed;
                // Shell kills other enemies
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    if (j === i || this.enemies[j].dead) continue;
                    const o = this.enemies[j];
                    if (this.overlap(e, o)) { o.dead = true; o.vy = -4; this.score += 100; this.sound.play('kick'); }
                }
                // Shell hits wall
                const tc = Math.floor((e.shellSpeed > 0 ? e.x + e.w : e.x) / T);
                const tr = Math.floor((e.y + e.h / 2) / T);
                if (tc >= 0 && tc < this.mapWidth && tr >= 0 && tr < this.height && this.isSolid(tr, tc)) {
                    e.shellSpeed = -e.shellSpeed;
                }
            } else if (e.type === 'koopa' && e.inShell) {
                // Stationary shell - don't move
            } else {
                e.vx = e.vx || -0.6;
                e.x += e.vx;
            }

            // Gravity & ground collision for enemies
            e.vy = (e.vy || 0) + GRAVITY;
            if (e.vy > 6) e.vy = 6;
            e.y += e.vy;
            e.onGround = false;
            const eBottom = Math.floor((e.y + e.h) / T);
            const eLeft = Math.floor(e.x / T);
            const eRight = Math.floor((e.x + e.w - 1) / T);
            if (eBottom >= 0 && eBottom < this.height) {
                for (let c = eLeft; c <= eRight; c++) {
                    if (c >= 0 && c < this.mapWidth && this.isSolid(eBottom, c)) {
                        e.y = eBottom * T - e.h;
                        e.vy = 0;
                        e.onGround = true;
                        break;
                    }
                }
            }

            // Enemy walks off edge -> turn around (only if not shell)
            if (e.onGround && !(e.type === 'koopa' && e.inShell)) {
                // Check the tile *ahead* based on current velocity
                const checkCol = Math.floor((e.x + (e.vx > 0 ? e.w + 2 : -2)) / T);
                const belowRow = Math.floor((e.y + e.h + 2) / T);
                const checkRow = Math.floor((e.y + e.h / 2) / T);

                if (checkCol >= 0 && checkCol < this.mapWidth && belowRow < this.height) {
                    const wallAhead = this.isSolid(checkRow, checkCol);
                    const cliffAhead = !this.isSolid(belowRow, checkCol);

                    if (wallAhead || cliffAhead) {
                        e.vx = -e.vx;
                    }
                } else if (checkCol < 0 || checkCol >= this.mapWidth) {
                    e.vx = -e.vx;
                }
            }

            // Remove only if fell into pit
            if (e.y > H + 32) { this.enemies.splice(i, 1); continue; }

            // Animation
            e.ft += dt;
            if (e.ft > 0.2) { e.ft = 0; e.frame = (e.frame + 1) % 2; }

            // Collision with Mario
            if (m.dead || m.invincible || m.winning || keys['KeyB']) continue;
            if (!this.overlap(m, e)) continue;

            if (m.star) {
                e.dead = true; e.vy = -4; this.score += 200; this.sound.play('kick');
            } else {
                const isStomp = m.vy > 0 && m.y + m.h - e.y < 12;

                if (e.type === 'koopa' && e.inShell) {
                    if (e.shellSpeed === 0) {
                        // Stationary Shell Interaction (KICK)
                        // Triggered by Stomp OR Side touch - neither hurts Mario
                        if (isStomp) m.vy = -4; // Bounce if stomped

                        // Kick away from Mario
                        e.shellSpeed = m.x < e.x ? 4 : -4;
                        // Prevent instant re-collision (move shell slightly out)
                        e.x += e.shellSpeed;
                        this.sound.play('kick');
                        // Cooldown to prevent double hits? Not strictly needed with speed
                    } else {
                        // Moving Shell Interaction
                        if (isStomp) {
                            // STOP the shell
                            e.shellSpeed = 0;
                            m.vy = -4;
                            this.sound.play('stomp');
                        } else {
                            // Hurt by moving shell
                            this.hurtMario();
                        }
                    }
                } else {
                    // Normal Enemy Interaction (Goomba / Walking Koopa)
                    if (isStomp) {
                        if (e.type === 'goomba') {
                            e.dead = true; e.deadTimer = 0;
                            m.vy = -5;
                            this.score += 100;
                            this.sound.play('stomp');
                        } else if (e.type === 'koopa') {
                            // Turn to shell
                            e.inShell = true; e.shellSpeed = 0;
                            e.h = 16; e.y += 8; // Adjust hitbox
                            m.vy = -5;
                            this.sound.play('stomp');
                            this.score += 100;
                        }
                    } else {
                        this.hurtMario();
                    }
                }
            }
        }
    }

    hurtMario() {
        const m = this.mario;
        if (m.invincible || m.star) return;
        if (m.fire) {
            // Fire -> Big
            m.fire = false;
            m.invincible = true; m.invTimer = 0;
            this.sound.play('powerdown');
        } else if (m.big) {
            // Big -> Small
            m.big = false;
            m.h = 16; m.w = 12;
            m.invincible = true; m.invTimer = 0;
            m.shrinkTimer = 0.5;
            this.sound.play('powerdown');
        } else {
            this.die();
        }
    }

    updateFireballs(dt) {
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            // Move (No Gravity for Homing)
            fb.x += fb.vx;
            // fb.vy += GRAVITY; // No gravity
            // if (fb.vy > 6) fb.vy = 6;
            fb.y += fb.vy;

            // Ground bounce REMOVED
            /*
            const fbBottom = Math.floor((fb.y + fb.h) / T);
            const fbCol = Math.floor((fb.x + fb.w / 2) / T);
            if (fbBottom >= 0 && fbBottom < this.height && fbCol >= 0 && fbCol < this.mapWidth && this.isSolid(fbBottom, fbCol)) {
                fb.y = fbBottom * T - fb.h;
                fb.vy = -3.5; // bounce
                fb.bounceCount++;
            }
            */

            // Wall collision
            const wallCol = Math.floor((fb.vx > 0 ? fb.x + fb.w : fb.x) / T);
            const wallRow = Math.floor((fb.y + fb.h / 2) / T);
            if (wallCol >= 0 && wallCol < this.mapWidth && wallRow >= 0 && wallRow < this.height && this.isSolid(wallRow, wallCol)) {
                // Hit wall - destroy with particle
                this.particles.push({ x: fb.x, y: fb.y, vx: 0, vy: -2, life: 0.3 });
                this.fireballs.splice(i, 1);
                continue;
            }

            // Off screen or too many bounces
            if (fb.y > H + 16 || fb.x < this.camera.x - 16 || fb.x > this.camera.x + W + 16 || fb.bounceCount > 6) {
                this.fireballs.splice(i, 1);
                continue;
            }

            // Hit enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (e.dead) continue;
                if (this.overlap(fb, e)) {
                    e.dead = true; e.vy = -4;
                    this.score += 100;
                    this.sound.play('kick');
                    this.particles.push({ x: fb.x, y: fb.y, vx: 0, vy: -2, life: 0.3 });
                    this.fireballs.splice(i, 1);
                    break;
                }
            }
        }
    }

    updateBoss(dt) {
        const b = this.boss;
        const m = this.mario;
        if (b.dead) return;

        b.timer += dt;
        b.fireTimer += dt;
        b.phaseTimer += dt;

        // Screen shake decay
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 8);

        // === PHASE 1 HP DEPLETION → transition to Phase 2 enraged ===
        if (b.hp <= 0 && b.phase === 1 && !b.transitioning) {
            b.transitioning = true;
            b.transitionTimer = 2.0;
            b.vx = 0;
            b.vy = 0;
            this.screenShake = 2;
            this.sound.play('kick');
            return;
        }

        // Handle Phase 1→2 transition animation
        if (b.transitioning && b.phase === 1) {
            b.transitionTimer -= dt;
            // Boss "shakes/flashes" during transition
            b.y += Math.sin(b.transitionTimer * 20) * 0.5;
            if (b.transitionTimer <= 0) {
                // RESURRECTION! Boss enters Phase 2 enraged
                b.phase = 2;
                b.transitioning = false;
                b.enraged = true;
                b.hp = LEVEL_DATA.boss.phase3Hp;
                b.speedMult = 2.0;
                // Teleport boss to center of arena
                b.x = (LEVEL_DATA.boss.bridgeStart + 8) * T;
                b.y = 6 * T;
                b.vy = 0;
                b.vx = -2;
                b.fireTimer = 0;
                b.phaseTimer = 0;
                b.burstCount = 0;
                b.floorCollapseTimer = 0;
                this.screenShake = 3;
                this.sound.play('powerup');
            }
            return;
        }

        // === PHASE 2: ENRAGED ===
        if (b.phase === 2) {
            // Gravity
            b.vy += GRAVITY;
            b.y += b.vy;

            // Floor collision
            const bBottom = Math.floor((b.y + b.h) / T);
            const bCenterCol = Math.floor((b.x + b.w / 2) / T);
            if (b.vy >= 0 && bBottom < 15) {
                if (bCenterCol >= 0 && bCenterCol < this.mapWidth && this.isSolid(bBottom, bCenterCol)) {
                    b.y = bBottom * T - b.h;
                    b.vy = 0;
                    b.onGround = true;
                } else {
                    b.onGround = false;
                }
            } else {
                b.onGround = false;
            }

            // Lava float (if bridge was broken and boss fell into lava area)
            // User request: Raise boss height to surface (12.5 * T) instead of submerged (13.5 * T)
            if (b.y > 12.5 * T) {
                b.y = 12.5 * T;
                b.vy = 0;
                b.onGround = true;
            }

            // Phase 2 AI - deliberate aggressive pursuit
            if (b.onGround) {
                // Jump periodically (controlled, not random)
                b.jumpTimer = (b.jumpTimer || 0) + dt;
                if (b.jumpTimer > 1.5) {
                    b.jumpTimer = 0;
                    // User Request: Increase max height by 1 block, but randomized
                    // Previously -4.5. Now -4.0 to -6.5
                    b.vy = -(4.0 + Math.random() * 2.5);
                }
                // Re-evaluate direction every 1 second (commit to pursuit)
                if (b.timer > 1.0) {
                    b.timer = 0;
                    b.targetDir = (m.x < b.x) ? -1 : 1;
                }
            }
            // Smooth acceleration toward target direction
            const targetSpeed = (b.targetDir || -1) * 2.5;
            b.vx += (targetSpeed - b.vx) * 0.08; // Gradual acceleration
            b.x += b.vx;

            // Wall collision
            const bCheckRow = Math.floor((b.y + b.h / 2) / T);
            const leftCol = Math.floor(b.x / T);
            const rightCol = Math.floor((b.x + b.w) / T);
            if (leftCol >= 0 && leftCol < this.mapWidth && this.isSolid(bCheckRow, leftCol)) {
                b.x = (leftCol + 1) * T;
                b.vx = Math.abs(b.vx);
            }
            if (rightCol >= 0 && rightCol < this.mapWidth && this.isSolid(bCheckRow, rightCol)) {
                b.x = rightCol * T - b.w;
                b.vx = -Math.abs(b.vx);
            }

            // Arena bounds (Phase 2: Restrict to Lava Lake)
            const arenaLeft = (LEVEL_DATA.boss.bridgeStart) * T; // Strictly lava/bridge start
            const arenaRight = (LEVEL_DATA.boss.axeCol + 2) * T;
            if (b.x < arenaLeft) { b.x = arenaLeft; b.vx = Math.abs(b.vx); }
            if (b.x + b.w > arenaRight) { b.x = arenaRight - b.w; b.vx = -Math.abs(b.vx); }

            // FIREBALL BARRAGE - 3 burst shots
            if (b.fireTimer > 1.0) {
                b.burstCount = (b.burstCount || 0) + 1;
                if (b.burstCount <= 3) {
                    b.fireTimer = 0.7;
                    if (!this.bossFireballs) this.bossFireballs = [];
                    // TARGETED SHOT: Toward Mario
                    const idx = b.burstCount; // 1, 2, 3
                    const dx = (m.x + m.w / 2) - (b.x + b.w / 2);
                    const dy = (m.y + m.h / 2) - (b.y + b.h / 2);
                    const dist = Math.hypot(dx, dy);
                    const speed = 5.0;

                    // Add slight spread if needed, or just pure accuracy
                    // User said: "towards player position"
                    this.bossFireballs.push({
                        x: b.x + (b.vx > 0 ? b.w : -8),
                        y: b.y + b.h / 2,
                        vx: (dx / dist) * speed,
                        vy: (dy / dist) * speed,
                        life: 5,
                        targeted: true // Ignore gravity
                    });
                    this.sound.play('fireball');
                } else {
                    b.fireTimer = 0;
                    b.burstCount = 0;
                }
            }

            // Phase 2 boss HP reaches 0 → truly dead
            if (b.hp <= 0) {
                b.dead = true;
                this.score += 10000;
                this.sound.play('kick');
                this.screenShake = 6; // Dramatic defeat shake
            }

            // Boss falls off screen in Phase 2
            if (b.y > H) {
                b.dead = true;
                this.score += 10000;
            }

            // === PHASE 1: BRIDGE COMBAT ===
        } else {
            // Gravity
            b.vy += GRAVITY;
            b.y += b.vy;

            // Floor collision
            const bBottom = Math.floor((b.y + b.h) / T);
            const bCenterCol = Math.floor((b.x + b.w / 2) / T);
            if (b.vy >= 0 && bBottom < 15) {
                if (bCenterCol >= 0 && bCenterCol < this.mapWidth && this.isSolid(bBottom, bCenterCol)) {
                    b.y = bBottom * T - b.h;
                    b.vy = 0;
                    b.onGround = true;
                } else {
                    b.onGround = false;
                }
            } else {
                b.onGround = false;
            }

            // Standard AI
            if (b.onGround) {
                if (Math.random() < 0.04) b.vy = -6;
                if (b.timer > 0.4) {
                    b.vx = (m.x < b.x) ? -1.0 : 1.0;
                    b.timer = 0;
                }
            }
            b.x += b.vx;

            // Wall collision
            const bCheckRow = Math.floor((b.y + b.h / 2) / T);
            const leftCol = Math.floor(b.x / T);
            const rightCol = Math.floor((b.x + b.w) / T);
            if (leftCol >= 0 && leftCol < this.mapWidth && this.isSolid(bCheckRow, leftCol)) {
                b.x = (leftCol + 1) * T;
                b.vx = Math.abs(b.vx);
            }
            if (rightCol >= 0 && rightCol < this.mapWidth && this.isSolid(bCheckRow, rightCol)) {
                b.x = rightCol * T - b.w;
                b.vx = -Math.abs(b.vx);
            }

            // Arena bounds
            const arenaLeft = (LEVEL_DATA.boss.bridgeStart - 5) * T;
            const arenaRight = (LEVEL_DATA.boss.axeCol) * T;
            if (b.x < arenaLeft) { b.x = arenaLeft; b.vx = Math.abs(b.vx); }
            if (b.x + b.w > arenaRight) { b.x = arenaRight - b.w; b.vx = -Math.abs(b.vx); }

            // Standard fireballs
            if (b.fireTimer > 1.8) {
                b.fireTimer = 0;
                if (!this.bossFireballs) this.bossFireballs = [];
                const dir = m.x < b.x ? -1 : 1;
                this.bossFireballs.push({
                    x: b.x + (dir > 0 ? b.w : -8),
                    y: b.y + b.h / 2,
                    vx: dir * 3,
                    vy: -1.5,
                    life: 4
                });
                this.sound.play('fireball');
            }
        }

        // Update boss fireballs (shared across all phases)
        if (this.bossFireballs) {
            for (let i = this.bossFireballs.length - 1; i >= 0; i--) {
                const bf = this.bossFireballs[i];
                bf.x += bf.vx;
                if (!bf.targeted) bf.vy += GRAVITY * 0.5; // Only apply gravity to normal fireballs
                bf.y += bf.vy;
                bf.life -= dt;

                // Bounce off ground
                // Wall collision (Horizontal)
                const wallCol = Math.floor((bf.vx > 0 ? bf.x + 8 : bf.x) / T);
                const midRow = Math.floor((bf.y + 4) / T);
                if (wallCol >= 0 && wallCol < this.mapWidth && this.isSolid(midRow, wallCol)) {
                    // Hit wall -> Destroy
                    this.particles.push({ x: bf.x, y: bf.y, vx: 0, vy: -2, life: 0.3 });
                    this.bossFireballs.splice(i, 1);
                    continue;
                }

                // Bounce off ground
                const bfRow = Math.floor((bf.y + 8) / T);
                const bfCol = Math.floor((bf.x + 4) / T);
                if (bfRow >= 0 && bfRow < 15 && bfCol >= 0 && bfCol < this.mapWidth && this.isSolid(bfRow, bfCol)) {
                    bf.y = bfRow * T - 8; // Push out of ground
                    bf.vy = -3;
                }

                // Remove if expired
                if (bf.life <= 0 || bf.y > H + 16 || bf.x < this.camera.x - 32 || bf.x > this.camera.x + W + 32) {
                    this.bossFireballs.splice(i, 1);
                    continue;
                }

                // Hit Mario
                if (!m.dead && !m.invincible && !m.winning && !keys['KeyB'] &&
                    bf.x < m.x + m.w && bf.x + 8 > m.x && bf.y < m.y + m.h && bf.y + 8 > m.y) {
                    this.hurtMario();
                    this.bossFireballs.splice(i, 1);
                }
            }
        }

        // Axe collision - Mario touches the axe → break bridge, boss transitions to Phase 2
        // Axe collision - Mario touches the axe → break bridge, boss transitions to Phase 2
        const axeX = LEVEL_DATA.boss.axeCol * T;
        const axeY = (LEVEL_DATA.boss.bridgeRow - 1) * T;
        // Check overlap (box collision)
        if (m.x + m.w > axeX && m.x < axeX + T &&
            m.y + m.h > axeY && m.y < axeY + T && // Added Y-axis check
            !this.bridgeBroken && m === this.mario) {
            this.bridgeBroken = true;
            this.sound.play('blockbreak');
            this.screenShake = 2;
            this.bridgeBreakTimer = 2.0; // 2 second shake before boss falls

            // Remove bridge tiles
            const start = LEVEL_DATA.boss.bridgeStart;
            const end = LEVEL_DATA.boss.bridgeEnd;
            for (let i = start; i <= end; i++) this.map[LEVEL_DATA.boss.bridgeRow][i] = 0;
        }

        // Handle bridge break transition timer
        if (this.bridgeBreakTimer > 0) {
            this.bridgeBreakTimer -= dt;
            this.screenShake = Math.max(this.screenShake, 2); // Keep shaking
            if (this.bridgeBreakTimer <= 0 && b.phase === 1) {
                // Boss enters Phase 2 enraged (from falling into lava)
                b.phase = 2;
                b.enraged = true;
                b.hp = LEVEL_DATA.boss.phase3Hp;
                b.speedMult = 2.0;
                b.x = (LEVEL_DATA.boss.bridgeStart + 8) * T;
                b.y = 6 * T;
                b.vy = 0;
                b.vx = -2;
                b.fireTimer = 0;
                b.phaseTimer = 0;
                b.burstCount = 0;
                b.floorCollapseTimer = 0;
                this.screenShake = 3;
                this.sound.play('powerup');
            }
        }

        // POW brick mechanic - breaking certain bricks damages boss
        if (LEVEL_DATA.powBrickCols && this.mario.big) {
            for (const powCol of LEVEL_DATA.powBrickCols) {
                if (!this.powBricksHit.has(powCol)) {
                    const powRow = LEVEL_DATA.boss.bridgeRow;
                    if (this.map[powRow] && this.map[powRow][powCol] === 0) {
                        if (!this.bridgeBroken || b.phase >= 2) {
                            this.powBricksHit.add(powCol);
                            b.hp--;
                            this.screenShake = 1.5;
                            this.sound.play('kick');
                        }
                    }
                }
            }
        }

        // Mario collision with boss
        if (!b.dead && this.overlap(m, b) && !keys['KeyB'] && !m.winning) {
            if (m.star || m.invincible) {
                // Star/Invincible: harmlessly overlap
            } else {
                this.hurtMario();
            }
        }

        // Fireball hit boss
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            if (this.overlap(this.fireballs[i], b)) {
                b.hp--;
                this.fireballs.splice(i, 1);
                this.sound.play('kick');
                this.screenShake = 0.5;
            }
        }

        // When boss dies, open door and clear fireballs (player must walk to door manually)
        if (b.dead && !this.doorOpen) {
            this.doorOpen = true;
            this.bossFireballs = [];
            // Dynamically open the wall at the door (rows 4-6, col 168)
            this.map[4][168] = 0;
            this.map[5][168] = 0;
            this.map[6][168] = 0;
            this.screenShake = 2;
            this.sound.play('blockbreak');
        }
    }

    die() {
        this.mario.dead = true;
        this.mario.vy = 0;
        this.mario.deathTimer = 0;
        this.state = 'dying';
        this.sound.stopBGM();
        this.sound.play('die');
    }

    updateItems(dt) {
        const m = this.mario;
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (item.type === 'mushroom') {
                // Rise from block
                if (item.rising) { item.y -= 1; if (item.riseY - item.y >= T) { item.rising = false; item.vx = 1.2; } continue; }
                // Drop from block (hidden room)
                if (item.dropping) {
                    item.y += 1;
                    if (item.y - item.riseY >= T) {
                        item.dropping = false;
                        item.vx = 1.2; item.vy = 0;
                    }
                    continue;
                }

                item.vx = item.vx || 1.2;
                item.x += item.vx;
                item.vy = (item.vy || 0) + GRAVITY;
                if (item.vy > 6) item.vy = 6;
                item.y += item.vy;
                // Ground collision
                const ib = Math.floor((item.y + 16) / T);
                const il = Math.floor(item.x / T);
                const ir = Math.floor((item.x + 15) / T);
                if (ib >= 0 && ib < this.height) {
                    for (let c = il; c <= ir; c++) {
                        if (c >= 0 && c < this.mapWidth && this.isSolid(ib, c)) { item.y = ib * T - 16; item.vy = 0; break; }
                    }
                }
                // Wall collision
                const wc = Math.floor((item.vx > 0 ? item.x + 16 : item.x) / T);
                const wr = Math.floor((item.y + 8) / T);
                if (wc >= 0 && wc < this.mapWidth && wr >= 0 && wr < this.height && this.isSolid(wr, wc)) item.vx = -item.vx;
                if (item.y > H + 32) { this.items.splice(i, 1); continue; }
                // Collect
                if (this.overlap(m, { x: item.x, y: item.y, w: 16, h: 16 })) {
                    if (!m.big) { m.big = true; m.h = 28; m.w = 14; m.y -= 12; m.growTimer = 0.5; }
                    this.score += 1000;
                    this.sound.play('powerup');
                    this.items.splice(i, 1);
                }
            } else if (item.type === 'fireflower') {
                // Fire flower rises/drops then stays
                if (item.rising) { item.y -= 1; if (item.riseY - item.y >= T) { item.rising = false; } continue; }
                if (item.dropping) { item.y += 1; if (item.y - item.riseY >= T) { item.dropping = false; } continue; }

                if (item.y > H + 32) { this.items.splice(i, 1); continue; }
                if (this.overlap(m, { x: item.x, y: item.y, w: 16, h: 16 })) {
                    m.fire = true;
                    if (!m.big) { m.big = true; m.h = 28; m.w = 14; m.y -= 12; m.growTimer = 0.5; }
                    this.score += 1000;
                    this.sound.play('powerup');
                    this.items.splice(i, 1);
                }
            } else if (item.type === 'star') {
                if (item.rising) { item.y -= 1; if (item.riseY - item.y >= T) { item.rising = false; item.vx = 0; item.vy = 0; } continue; }
                // Star stays in place (stationary)
                if (this.overlap(m, { x: item.x, y: item.y, w: 16, h: 16 })) {
                    m.star = true; m.starTimer = 8;
                    this.score += 1000;
                    this.sound.play('powerup');
                    this.items.splice(i, 1);
                }
            } else if (item.type === 'trophy') {
                // Trophy falls and stays
                item.vy += GRAVITY;
                item.y += item.vy;
                const ib = Math.floor((item.y + 16) / T);
                const il = Math.floor(item.x / T);
                // Simple ground collision
                if (ib >= 0 && ib < this.height && il >= 0 && il < this.mapWidth && this.isSolid(ib, il)) {
                    item.y = ib * T - 16;
                    item.vy = 0; // Stop
                }
            } else if (item.type === 'wzry') {
                // "王者荣耀" Easter egg item - behaves like mushroom but gives no effect
                // Staggered spawn delay
                if (item.spawnDelay > 0) { item.spawnDelay -= dt; continue; }
                // Rise from block
                if (item.rising) { item.y -= 1; if (item.riseY - item.y >= T) { item.rising = false; } continue; }
                // Static items - no physics
                if (item.noGravity) {
                    // Collection check - generous hitbox
                    const dx = Math.abs((item.x + 8) - (m.x + m.w / 2));
                    const dy = Math.abs((item.y + 8) - (m.y + m.h / 2));
                    if (dx < 16 && dy < 20) {
                        this.sound.play('coin');
                        this.items.splice(i, 1);
                    }
                    continue;
                }
                // Physics (like mushroom)
                item.x += item.vx;
                item.vy = (item.vy || 0) + GRAVITY;
                if (item.vy > 6) item.vy = 6;
                item.y += item.vy;
                // Ground collision
                const wb = Math.floor((item.y + 16) / T);
                const wl = Math.floor(item.x / T);
                const wrc = Math.floor((item.x + 15) / T);
                if (wb >= 0 && wb < this.height) {
                    for (let c = wl; c <= wrc; c++) {
                        if (c >= 0 && c < this.mapWidth && this.isSolid(wb, c)) { item.y = wb * T - 16 - T; item.vy = 0; break; }
                    }
                }
                // Wall collision
                const wwc = Math.floor((item.vx > 0 ? item.x + 16 : item.x) / T);
                const wwr = Math.floor((item.y + 8) / T);
                if (wwc >= 0 && wwc < this.mapWidth && wwr >= 0 && wwr < this.height && this.isSolid(wwr, wwc)) item.vx = -item.vx;
                // Fall off screen
                if (item.y > H + 32) { this.items.splice(i, 1); continue; }
                // Collect (no effect, just sound)
                if (this.overlap(m, { x: item.x, y: item.y, w: 16, h: 16 })) {
                    this.sound.play('coin');
                    this.items.splice(i, 1);
                }
            }
        }
    }

    // ---- COLLISION ----
    get height() { return this.underground ? LEVEL_DATA.undergroundHeight : LEVEL_DATA.height; }
    get mapWidth() { return this.underground ? LEVEL_DATA.undergroundWidth : LEVEL_DATA.width; }

    isSolid(r, c) {
        if (r < 0 || r >= this.height || c < 0 || c >= this.mapWidth) return false;
        const t = this.map[r][c];
        return t === 1 || t === 2 || t === 3 || t === 4 || t === 5 || t === 6 || t === 7 || t === 10 || t === 12;
    }

    overlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    collideX(m) {
        const top = Math.floor(m.y / T);
        const bot = Math.floor((m.y + m.h - 1) / T);
        if (m.vx > 0) {
            const col = Math.floor((m.x + m.w) / T);
            for (let r = top; r <= bot; r++) {
                if (r >= 0 && r < this.height && col >= 0 && col < this.mapWidth && this.isSolid(r, col)) {
                    m.x = col * T - m.w;
                    m.vx = 0;
                    break;
                }
            }
        } else if (m.vx < 0) {
            const col = Math.floor(m.x / T);
            for (let r = top; r <= bot; r++) {
                if (r >= 0 && r < this.height && col >= 0 && col < this.mapWidth && this.isSolid(r, col)) {
                    m.x = (col + 1) * T;
                    m.vx = 0;
                    break;
                }
            }
        }
    }

    collideY(m) {
        if (m.vy > 0) {
            const row = Math.floor((m.y + m.h) / T);
            const left = Math.floor(m.x / T);
            const right = Math.floor((m.x + m.w - 1) / T);
            for (let c = left; c <= right; c++) {
                if (row >= 0 && row < this.height && c >= 0 && c < this.mapWidth && this.isSolid(row, c)) {
                    // Check for Star Block (Tile 10) stomp
                    if (this.map[row][c] === 10) {
                        this.map[row][c] = 5; // Becomes used
                        this.items.push({ type: 'star', x: c * T, y: row * T, rising: true, riseY: row * T, vy: 0, vx: 0 });
                        this.blockAnims.push({ c, r: row, timer: 0.15, oy: 0 });
                        this.sound.play('bump');
                    }

                    m.y = row * T - m.h;
                    m.vy = 0;
                    m.onGround = true;
                    m.jumping = false;
                    return;
                }
            }
        } else if (m.vy < 0) {
            const row = Math.floor(m.y / T);
            const left = Math.floor((m.x + 2) / T);
            const right = Math.floor((m.x + m.w - 3) / T);
            for (let c = left; c <= right; c++) {
                if (row >= 0 && row < this.height && c >= 0 && c < this.mapWidth) {
                    // Solid collision
                    if (this.isSolid(row, c)) {
                        m.y = (row + 1) * T;
                        m.vy = 0;
                        this.hitBlock(row, c);
                        return;
                    }
                    // Hidden Block (Type 8)
                    if (this.map[row][c] === 8) {
                        m.y = (row + 1) * T;
                        m.vy = 0;
                        // Reveal block
                        this.map[row][c] = 5; // Becomes used (solid)
                        this.blockAnims.push({ c, r: row, timer: 0.15, oy: 0 });
                        this.sound.play('bump');
                        // Optional: Spawn item? For now just a step.
                        // Check if it should be a Star (level specific?)
                        // We can add logic: if col === 29 (level 5), it's just a step.
                        // If col === 3 (level 5), maybe mushroom?
                        // Simple logic: Type 8 -> Type 5 (Solid Stepping Stone)
                        return;
                    }
                }
            }
        }
    }

    hitBlock(r, c) {
        const tile = this.map[r][c];
        if (tile === 3) {
            // Question block - coin
            this.map[r][c] = 5;
            this.coins++;
            this.score += 200;
            this.coinEffects.push({ x: c * T + 4, y: r * T - 16, vy: -5, life: 0.6 });
            this.blockAnims.push({ c, r, timer: 0.15, oy: 0 });
            this.sound.play('coin');
            if (this.coins >= 100) { this.coins -= 100; this.lives++; this.sound.play('1up'); }

            // SPECIAL EVENT: Level 2, Col 8 (Honor of Kings)
            // "王者荣耀" drops from upper-right as collectible items
            if (c === 8 && r === 2) {
                const text = ['王', '者', '荣', '耀'];
                for (let i = 0; i < 4; i++) {
                    this.items.push({
                        type: 'wzry',
                        x: (c + 3 + i * 2) * T,
                        y: (r + 1) * T, // Appear at platform level
                        rising: false,
                        vy: 0, vx: 0,
                        noGravity: true, // Stay in place
                        text: text[i],
                        spawnDelay: 0
                    });
                }
                this.sound.play('powerup');
            }
        } else if (tile === 4) {
            // Question block - mushroom or fire flower
            this.map[r][c] = 5;
            // Underground hidden room: items drop DOWNWARDS
            const isDropping = this.underground;
            const spawnY = isDropping ? r * T : r * T; // Logic handled in updateItems

            if (this.mario.big) {
                // Already big - give fire flower
                this.items.push({
                    type: 'fireflower', x: c * T, y: r * T,
                    rising: !isDropping, riseY: r * T,
                    dropping: isDropping
                });
            } else {
                this.items.push({
                    type: 'mushroom', x: c * T, y: r * T,
                    rising: !isDropping, riseY: r * T,
                    dropping: isDropping,
                    vy: 0, vx: 1.2
                });
            }
            this.blockAnims.push({ c, r, timer: 0.15, oy: 0 });
            this.sound.play('bump');
        } else if (tile === 10) {
            // Star block HIT FROM BELOW - gives COIN (waste the block!)
            // Player must stomp it to get star
            this.map[r][c] = 5;
            this.coins++;
            this.score += 200;
            this.coinEffects.push({ x: c * T + 4, y: r * T - 16, vy: -5, life: 0.6 });
            this.blockAnims.push({ c, r, timer: 0.15, oy: 0 });
            this.sound.play('coin');
            if (this.coins >= 100) { this.coins -= 100; this.lives++; this.sound.play('1up'); }
            // Logic moved to tile 3
        } else if (tile === 2 && this.mario.big) {
            // Break brick
            this.map[r][c] = 0;
            this.sound.play('blockbreak');
            this.score += 50;
            for (let dx = -1; dx <= 1; dx += 2) {
                for (let dy = -1; dy <= 0; dy++) {
                    this.particles.push({ x: c * T + 8, y: r * T + 8, vx: dx * (1 + Math.random() * 2), vy: dy * 3 - Math.random() * 2, life: 0.8 });
                }
            }
        } else if (tile === 2) {
            // Small Mario bumps brick
            this.blockAnims.push({ c, r, timer: 0.15, oy: 0 });
            this.sound.play('bump');
            // Check if enemy is on top
            for (const e of this.enemies) {
                if (!e.dead && Math.floor(e.x / T) === c && Math.floor((e.y + e.h) / T) === r) {
                    e.dead = true; e.vy = -4; this.score += 100;
                }
            }
        }
    }

    renderGameComplete(ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';

        ctx.fillStyle = '#F8D878';
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.fillText('CONGRATULATIONS!', W / 2, H / 2 - 50);

        ctx.fillStyle = '#FCFCFC';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('SCIENCE IS THE', W / 2, H / 2 - 20);
        ctx.fillText("PEOPLE'S SCIENCE!", W / 2, H / 2 - 5);

        ctx.fillStyle = '#F8D878';
        ctx.font = 'bold 14px "SimHei", "Microsoft YaHei", sans-serif';
        ctx.fillText('科学是人民的科学', W / 2, H / 2 + 20);

        ctx.fillStyle = '#AAAAAA';
        ctx.font = '12px "SimHei", "Microsoft YaHei", sans-serif';
        ctx.fillText('—— 李文亚教授', W / 2, H / 2 + 42);

        // Restart prompt
        if (Math.floor(this.animTimer * 2) % 2 === 0) {
            ctx.fillStyle = '#AAAAEE';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('PRESS R TO RESTART', W / 2, H / 2 + 70);
        }
    }

    renderBoss(ctx) {
        const b = this.boss;
        // Fake death flashing
        if (b.fakeDeathTimer > 0 && !b.fakeDeathDone) {
            if (Math.floor(b.fakeDeathTimer * 8) % 2 === 0) return; // Flash invisible
        }
        // Phase-based rendering
        const frame = Math.floor(this.animTimer * 4) % 2;
        SPRITE.drawBoss(ctx, Math.floor(b.x), Math.floor(b.y), frame, b.phase, this.animTimer);
    }

    renderTextParticles(ctx) {
        ctx.font = 'bold 12px "SimHei", "Microsoft YaHei", sans-serif'; // Use Chinese font (Slightly larger)
        for (const p of this.textParticles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.life);
            ctx.fillText(p.text, Math.floor(p.x), Math.floor(p.y));
            ctx.globalAlpha = 1.0;
        }
    }

    // ---- RENDER ----
    render() {
        const ctx = this.ctx;

        if (this.state === 'title') { ctx.fillStyle = '#5C94FC'; ctx.fillRect(0, 0, W, H); this.renderTitle(ctx); return; }
        if (this.state === 'gameover') { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); this.renderGameOver(ctx); return; }
        if (this.state === 'gameComplete') { this.renderGameComplete(ctx); return; }

        // Pipe transition - black screen
        if ((this.state === 'pipeEnter' || this.state === 'pipeExit') && this.pipeAnim && this.pipeAnim.phase === 'transition') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, H);
            this.renderHUD(ctx);
            return;
        }

        // Background color
        ctx.fillStyle = LEVEL_DATA.bgColor;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        // Screen shake effect
        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 4 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 2 : 0;
        ctx.translate(-Math.floor(this.camera.x) + shakeX, shakeY);
        if (!this.underground) this.renderBackground(ctx);
        this.renderMap(ctx);
        this.renderItems(ctx);
        this.renderItems(ctx);
        this.renderEnemies(ctx);
        if (this.boss && !this.boss.dead) this.renderBoss(ctx);
        // Render axe on boss level
        if (LEVEL_DATA.isBossLevel && !this.bridgeBroken) {
            const axeX = LEVEL_DATA.boss.axeCol * T;
            const axeY = (LEVEL_DATA.boss.bridgeRow - 1) * T;
            SPRITE.drawAxe(ctx, axeX, axeY, this.animTimer);
        }

        // Render boss fireballs
        if (this.bossFireballs) {
            ctx.fillStyle = '#E45C10'; // Red/Orange
            for (const bf of this.bossFireballs) {
                ctx.beginPath();
                ctx.arc(bf.x + 4, bf.y + 4, 4, 0, Math.PI * 2);
                ctx.fill();
                // Inner core
                ctx.fillStyle = '#F8D878';
                ctx.beginPath();
                ctx.arc(bf.x + 4, bf.y + 4, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#E45C10'; // Reset for next
            }
        }

        // Render fireworks (celebration)
        if (this.state === 'celebration' && this.fireworks) {
            for (const f of this.fireworks) {
                ctx.fillStyle = f.color;
                ctx.globalAlpha = Math.min(1, f.life); // Fade out
                ctx.fillRect(f.x, f.y, f.size, f.size);
                ctx.globalAlpha = 1.0;
            }

            // Draw prompt
            if (this.celebrationPhase === 'waiting' && Math.floor(this.animTimer * 2) % 2 === 0) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FCFCFC';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.fillText('PRESS ENTER TO FINISH', this.camera.x + W / 2, H - 40);
            }
        }
        this.renderMario(ctx);
        this.renderFireballs(ctx);
        this.renderParticles(ctx);
        this.renderTextParticles(ctx);
        this.renderCoinEffects(ctx);
        if (!this.underground && !LEVEL_DATA.isBossLevel) {
            this.renderFlagpole(ctx);
            this.renderCastle(ctx);
        }
        ctx.restore();
        this.renderHUD(ctx);
        // Win handled in updateWinning mostly, but maybe transition?
        if (this.state === 'paused') this.renderPause(ctx);
    }

    renderBackground(ctx) {
        const cam = this.camera.x;
        // Clouds
        for (const [col, row, size] of LEVEL_DATA.clouds) {
            SPRITE.drawCloud(ctx, col * T, row * T, size);
        }
        // Hills
        for (const [col, size] of LEVEL_DATA.hills) {
            SPRITE.drawHill(ctx, col * T, 13 * T, size);
        }
        // Bushes
        for (const [col, size] of LEVEL_DATA.bushes) {
            SPRITE.drawBush(ctx, col * T, 12 * T, size);
        }
    }

    renderMap(ctx) {
        const mapW = this.underground ? LEVEL_DATA.undergroundWidth : LEVEL_DATA.width;
        const startCol = Math.max(0, Math.floor(this.camera.x / T) - 1);
        const endCol = Math.min(mapW, startCol + Math.ceil(W / T) + 2);
        const qFrame = Math.floor(this.animTimer * 3) % 2;
        const theme = LEVEL_DATA.theme;

        for (let r = 0; r < this.height; r++) {
            for (let c = startCol; c < endCol; c++) {
                const tile = this.map[r][c];
                let x = c * T, y = r * T;
                // Block animation offset
                const ba = this.blockAnims.find(b => b.c === c && b.r === r);
                if (ba) { const p = ba.timer / 0.15; y -= Math.sin(p * Math.PI) * 4; }

                if (tile === 1) SPRITE.drawGround(ctx, x, y, theme);
                else if (tile === 2) SPRITE.drawBrick(ctx, x, y, theme);
                else if (tile === 3 || tile === 4 || tile === 10) SPRITE.drawQuestionBlock(ctx, x, y, qFrame);
                else if (tile === 5) SPRITE.drawUsedBlock(ctx, x, y);
                else if (tile === 6) SPRITE.drawStairBlock(ctx, x, y, theme);
                else if (tile === 12) SPRITE.drawGoldBlock(ctx, x, y);
                else if (tile === 11) SPRITE.drawDoor(ctx, x, y);
                else if (tile === 9) SPRITE.drawLava(ctx, x, y, this.animTimer);
                else if (tile === 7) {
                    // Determine if pipe top or body
                    const above = r > 0 ? this.map[r - 1][c] : 0;
                    if (above !== 7) {
                        // Find the leftmost pipe tile in this row
                        const isLeft = c === 0 || this.map[r][c - 1] !== 7;
                        if (isLeft) SPRITE.drawPipeTop(ctx, x, y, theme);
                    } else {
                        const isLeft = c === 0 || this.map[r][c - 1] !== 7;
                        if (isLeft) SPRITE.drawPipeBody(ctx, x, y, theme);
                    }
                }
            }
        }
    }

    renderMario(ctx) {
        const m = this.mario;
        if (m.visible === false) return;
        if (m.dead) {
            SPRITE.drawSmallMario(ctx, Math.floor(m.x), Math.floor(m.y), 1, 0, false, 0);
            return;
        }

        // Star power rainbow aura + sparkles
        if (m.star) {
            const t = this.animTimer;
            // Rainbow aura glow
            const hue = (t * 360) % 360;
            ctx.save();
            ctx.shadowBlur = 12 + Math.sin(t * 8) * 4;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            // Draw aura rectangle (expands/contracts)
            const pulse = Math.sin(t * 6) * 2;
            ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.3)`;
            ctx.fillRect(Math.floor(m.x) - 2 - pulse, Math.floor(m.y) - 2 - pulse,
                m.w + 4 + pulse * 2, m.h + 4 + pulse * 2);
            ctx.restore();

            // Sparkle particles trailing behind
            for (let i = 0; i < 3; i++) {
                const sparkHue = (hue + i * 120) % 360;
                const sx = Math.floor(m.x) + Math.random() * m.w;
                const sy = Math.floor(m.y) + Math.random() * m.h;
                const size = 1 + Math.random() * 2;
                ctx.fillStyle = `hsl(${sparkHue}, 100%, 80%)`;
                ctx.fillRect(sx, sy, size, size);
            }
        }

        const f = m.onGround ? m.frame : 1;

        // Front-facing during celebration
        if (this.state === 'celebration') {
            SPRITE.drawFrontMario(ctx, Math.floor(m.x), Math.floor(m.y), m.big, m.fire);
            return;
        }

        if (m.big) {
            SPRITE.drawBigMario(ctx, Math.floor(m.x), Math.floor(m.y), m.dir, f, m.ducking,
                m.invincible || m.star, m.invTimer + this.animTimer, m.fire);
        } else {
            SPRITE.drawSmallMario(ctx, Math.floor(m.x), Math.floor(m.y), m.dir, f,
                m.invincible || m.star, m.invTimer + this.animTimer, m.fire);
        }
    }

    renderEnemies(ctx) {
        const f = Math.floor(this.animTimer * 4) % 2;
        for (const e of this.enemies) {
            if (e.type === 'goomba') {
                SPRITE.drawGoomba(ctx, Math.floor(e.x), Math.floor(e.y), f, e.dead);
            } else if (e.type === 'koopa') {
                SPRITE.drawKoopa(ctx, Math.floor(e.x), Math.floor(e.y), f, e.inShell);
            }
        }
    }

    renderItems(ctx) {
        const f = Math.floor(this.animTimer * 4) % 4;
        for (const item of this.items) {
            if (item.type === 'mushroom') SPRITE.drawMushroom(ctx, Math.floor(item.x), Math.floor(item.y));
            else if (item.type === 'fireflower') SPRITE.drawFireFlower(ctx, Math.floor(item.x), Math.floor(item.y), f);
            else if (item.type === 'star') SPRITE.drawStar(ctx, Math.floor(item.x), Math.floor(item.y), f);
            else if (item.type === 'trophy') SPRITE.drawTrophy(ctx, Math.floor(item.x), Math.floor(item.y));
            else if (item.type === 'wzry') {
                // Render Chinese character as gold text
                ctx.font = 'bold 11px "SimHei", "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000000';
                ctx.fillText(item.text, Math.floor(item.x) + 9, Math.floor(item.y) + 14);
                ctx.fillStyle = '#FFD700';
                ctx.fillText(item.text, Math.floor(item.x) + 8, Math.floor(item.y) + 13);
                ctx.textAlign = 'left';
            }
        }
    }

    renderFireballs(ctx) {
        const f = Math.floor(this.animTimer * 8) % 4;
        for (const fb of this.fireballs) {
            SPRITE.drawFireball(ctx, Math.floor(fb.x), Math.floor(fb.y), f);
        }
    }

    renderParticles(ctx) {
        ctx.fillStyle = '#AC7C00';
        for (const p of this.particles) {
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 4, 4);
        }
    }

    renderCoinEffects(ctx) {
        const f = Math.floor(this.animTimer * 8) % 4;
        for (const c of this.coinEffects) {
            SPRITE.drawCoin(ctx, Math.floor(c.x), Math.floor(c.y), f);
        }
    }

    renderFlagpole(ctx) {
        const fpx = LEVEL_DATA.flagpoleCol * T;
        const baseY = 12 * T;
        const topY = 4 * T;
        SPRITE.drawFlagPole(ctx, fpx, topY, baseY - topY);
        const fy = this.flagDescending ? Math.floor(this.flagY) : topY + 8;
        SPRITE.drawFlag(ctx, fpx, fy);
    }

    renderCastle(ctx) {
        const castleX = LEVEL_DATA.castleCol * T;
        const castleY = 8 * T;
        SPRITE.drawCastle(ctx, castleX, castleY);

        // Draw open door if applicable
        if (this.doorOpen || (this.enteredDoor && !this.underground)) { // enteredDoor check for safety
            ctx.fillStyle = '#000000';
            // Door is roughly at relative x=2.5 tiles (40px), y=2.5 tiles (40px) from castle origin logic?
            // Actually, updateWinning says door is at castleCol * T + 36.
            // Sprite usually has door centered. Let's assume standard castle sprite door position.
            // Standard castle: 5 tiles wide. Door is at center bottom.
            // Center = + (5*16)/2 = +40. Door width ~16-24.
            // Let's use the logic from updateWinning: castleDoorX = castleCol * T + 36
            // Door height is approx 32px (2 tiles).
            ctx.fillRect(castleX + 34, castleY + 32, 20, 32);
        }
    }

    renderHUD(ctx) {
        ctx.fillStyle = '#FCFCFC';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        // MARIO label + score
        ctx.fillText('MARIO', 16, 8);
        ctx.fillText(String(this.score).padStart(6, '0'), 16, 18);

        // Coin icon + count
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(88, 19, 6, 7);
        ctx.fillStyle = '#A04800';
        ctx.fillRect(90, 19, 2, 7);
        ctx.fillStyle = '#FCFCFC';
        ctx.fillText('×' + String(this.coins).padStart(2, '0'), 96, 18);

        // WORLD label + level name
        ctx.fillText('WORLD', 144, 8);
        ctx.textAlign = 'center';
        ctx.fillText(LEVEL_DATA.name, 164, 18);
        ctx.textAlign = 'left';

        // TIME
        ctx.fillText('TIME', 200, 8);
        ctx.fillText(String(Math.max(0, this.time)).padStart(3, ' '), 204, 18);

        // Extreme Mode Indicator
        if (this.gameMode === 'extreme') {
            ctx.fillStyle = '#FF4444';
            ctx.font = '8px "SimHei", monospace'; // Small font
            ctx.textAlign = 'center';
            ctx.fillText('EXTREME', 104, 8); // Centered above coins (88-120 range)
            ctx.textAlign = 'left';
        }

        // Lives display - heart icons row below
        const heartsX = 16;
        const heartsY = 28;
        for (let i = 0; i < this.lives; i++) {
            // Draw pixel heart
            const hx = heartsX + i * 10;
            ctx.fillStyle = '#DC1820';
            // Heart shape (pixel art style)
            ctx.fillRect(hx, heartsY + 1, 2, 2);
            ctx.fillRect(hx + 4, heartsY + 1, 2, 2);
            ctx.fillRect(hx, heartsY + 3, 6, 2);
            ctx.fillRect(hx + 1, heartsY + 5, 4, 1);
            ctx.fillRect(hx + 2, heartsY + 6, 2, 1);
            // Highlight
            ctx.fillStyle = '#FC3838';
            ctx.fillRect(hx + 1, heartsY + 1, 1, 1);
            ctx.fillRect(hx + 5, heartsY + 1, 1, 1);
        }

        // Boss HP bar (only during boss fight)
        if (this.boss && !this.boss.dead && LEVEL_DATA.isBossLevel) {
            const b = this.boss;
            const barX = W / 2 - 40;
            const barY = 32;
            const barW = 80;
            const barH = 6;
            const maxHp = (b.phase >= 2) ? LEVEL_DATA.boss.phase3Hp : LEVEL_DATA.boss.hp;
            const hpRatio = Math.max(0, b.hp / maxHp);

            // Label
            ctx.fillStyle = '#FCFCFC';
            ctx.font = '6px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BOWSER', W / 2, barY - 2);

            // Background
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barW, barH);

            // HP fill - color based on phase
            if (b.phase === 3) ctx.fillStyle = '#FF0000';
            else if (b.phase === 2) ctx.fillStyle = '#FF6600';
            else ctx.fillStyle = '#00CC00';
            ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);

            // Border
            ctx.strokeStyle = '#FCFCFC';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);

            // Phase indicator
            const phaseLabels = ['', 'PHASE 1', 'PHASE 2', 'PHASE 3!'];
            if (b.phase >= 2) {
                ctx.fillStyle = b.phase === 3 ? '#FF4444' : '#FF8800';
                ctx.font = '5px "Press Start 2P", monospace';
                ctx.fillText(phaseLabels[b.phase], W / 2, barY + barH + 8);
            }
            ctx.textAlign = 'left';
        }
    }

    renderTitle(ctx) {
        // Dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        // Sky strip
        ctx.fillStyle = '#5C94FC';
        ctx.fillRect(0, 140, W, 100);
        // Ground decoration
        for (let i = 0; i < 16; i++) {
            SPRITE.drawGround(ctx, i * T, 13 * T);
            SPRITE.drawGround(ctx, i * T, 14 * T);
        }
        SPRITE.drawBush(ctx, 16, 12 * T, 2);
        SPRITE.drawPipeTop(ctx, 180, 11 * T);
        SPRITE.drawPipeBody(ctx, 180, 12 * T);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // SUPER - with shadow
        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = '#800000';
        ctx.fillText('SUPER', W / 2 + 2, 32);
        ctx.fillStyle = '#E40228';
        ctx.fillText('SUPER', W / 2, 30);

        // MARIO BROS. - with shadow
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = '#804000';
        ctx.fillText('MARIO BROS.', W / 2 + 2, 58);
        ctx.fillStyle = '#F8D878';
        ctx.fillText('MARIO BROS.', W / 2, 56);

        // Decorative dots
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(W / 2 - 90, 70, 4, 4);
        ctx.fillRect(W / 2 + 86, 70, 4, 4);

        // Animated Mario
        const mf = Math.floor(this.titleBlink * 4) % 3;
        SPRITE.drawSmallMario(ctx, W / 2 - 6, 90, 1, mf, false, 0);

        // Copyright
        ctx.fillStyle = '#FCFCFC';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('\u00a9 NINTENDO', W / 2, 120);

        // Menu Selection
        const opts = ['NORMAL MODE', 'EXTREME MODE'];
        ctx.textAlign = 'center';
        opts.forEach((opt, i) => {
            ctx.fillStyle = (this.menuSelection === i) ? '#F8D878' : '#FCFCFC';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText((this.menuSelection === i ? '> ' : '  ') + opt, W / 2, 160 + i * 15);
        });

        ctx.textAlign = 'left'; return; // Input handling moved to updateTitle
        if (keyPressed['ArrowUp'] || keyPressed['KeyW']) {
            this.menuSelection = (this.menuSelection - 1 + 2) % 2;
            this.sound.play('bump');
        }
        if (keyPressed['ArrowDown'] || keyPressed['KeyS']) {
            this.menuSelection = (this.menuSelection + 1) % 2;
            this.sound.play('bump');
        }

        if (keys['Enter'] || keys['Space']) {
            this.gameMode = this.menuSelection === 0 ? 'normal' : 'extreme';
            this.lives = 3; // Ensure fresh start
            this.score = 0;
            this.time = 999;
            this.reset(false, true); // Reset everything
            this.startGame();
        }
    }

    updateTitle(dt) {
        // Input handling for menu
        if (keyPressed['ArrowUp'] || keyPressed['KeyW']) {
            this.menuSelection = (this.menuSelection - 1 + 2) % 2;
            this.sound.play('bump');
        }
        if (keyPressed['ArrowDown'] || keyPressed['KeyS']) {
            this.menuSelection = (this.menuSelection + 1) % 2;
            this.sound.play('bump');
        }

        if (keyPressed['Enter'] || keyPressed['Space']) {
            this.gameMode = this.menuSelection === 0 ? 'normal' : 'extreme';
            this.lives = 2; // Ensure fresh start
            this.score = 0;
            this.time = 999;
            this.reset(false, true); // Reset everything
            this.startGame();
        }
    }

    renderGameOver(ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FCFCFC';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        const msg = this.isTimeout ? 'TIME OUT' : 'GAME OVER';
        ctx.fillText(msg, W / 2, H / 2 - 30);

        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#F8D878';
        ctx.fillText('SCORE: ' + this.score, W / 2, H / 2 - 10);

        if (this.gameMode !== 'extreme') {
            ctx.fillStyle = '#88CC88';
            ctx.fillText('R: RESTART LEVEL', W / 2, H / 2 + 20);
        }
        ctx.fillStyle = '#CC8888';
        ctx.fillText('ENTER: BACK TO TITLE', W / 2, H / 2 + 40);

        ctx.textAlign = 'left';
    }

    renderWin(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#F8D878';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', W / 2, H / 2 - 30);
        ctx.fillStyle = '#FCFCFC';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('SCORE: ' + this.score, W / 2, H / 2);
        ctx.fillText('TIME × 50 = ' + (this.time * 50), W / 2, H / 2 + 20);
        this.score += this.time > 0 ? 1 : 0;
        if (this.time > 0) this.time--;
        if (Math.floor(this.animTimer * 2) % 2 === 0) {
            ctx.fillStyle = '#8888CC';
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillText('点击继续', W / 2, H / 2 + 50);
        }
        ctx.textAlign = 'left';
    }

    renderPause(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.imageSmoothingEnabled = false;

        // Title
        ctx.font = 'bold 16px "Press Start 2P", Courier, monospace';
        ctx.fillStyle = '#F8D878';
        ctx.fillText('PAUSE', W / 2, 10);

        // Decorative line
        ctx.fillStyle = '#F8D87860';
        ctx.fillRect(W / 2 - 60, 30, 120, 2);

        // Level Select header
        if (this.gameMode !== 'extreme') {
            ctx.font = 'bold 8px "Press Start 2P", Courier, monospace';
            ctx.fillStyle = '#80D010';
            ctx.fillText('SELECT LEVEL', W / 2, 38);

            // Level list
            ctx.font = '8px "Press Start 2P", Courier, monospace';
            const levelNames = ['1-1 GRASSLAND', '1-2 UNDERGROUND', '1-3 ATHLETIC', '1-4 CASTLE', '2-1 BOSS'];
            levelNames.forEach((name, i) => {
                const ly = 56 + i * 18;
                const isCurrent = i === this.levelIndex;

                // Highlight background for current level
                if (isCurrent) {
                    ctx.fillStyle = 'rgba(248, 216, 120, 0.15)';
                    ctx.fillRect(W / 2 - 80, ly - 2, 160, 14);
                }

                // Level number indicator
                ctx.fillStyle = isCurrent ? '#F8D878' : '#606090';
                ctx.textAlign = 'left';
                ctx.fillText((i + 1) + '.', W / 2 - 74, ly);

                // Level name
                ctx.fillStyle = isCurrent ? '#FCFCFC' : '#808080';
                ctx.fillText(name, W / 2 - 58, ly);

                // Arrow indicator for current level
                if (isCurrent) {
                    const arrowBlink = Math.floor(this.animTimer * 4) % 2 === 0;
                    if (arrowBlink) {
                        ctx.fillStyle = '#F8D878';
                        ctx.fillText('\u25B6', W / 2 + 68, ly);
                    }
                }
            });
        } else {
            // Extreme Mode Pause UI
            ctx.font = 'bold 10px "Press Start 2P", Courier, monospace';
            ctx.fillStyle = '#FF4444';
            ctx.fillText('EXTREME MODE', W / 2, 60);

            ctx.font = '8px "Press Start 2P", Courier, monospace';
            ctx.fillStyle = '#FCFCFC';
            ctx.fillText('NO MERCY', W / 2, 80);
            ctx.fillStyle = '#808080';
            ctx.fillText('LEVEL SELECT DISABLED', W / 2, 100);

            // Current Level Info
            ctx.fillStyle = '#F8D878';
            const levelNames = ['1-1 GRASSLAND', '1-2 UNDERGROUND', '1-3 ATHLETIC', '1-4 CASTLE', '2-1 BOSS'];
            ctx.fillText('CURRENT: ' + levelNames[this.levelIndex], W / 2, 130);
        }

        ctx.textAlign = 'center';

        // Decorative line
        ctx.fillStyle = '#F8D87860';
        ctx.fillRect(W / 2 - 60, 152, 120, 2);

        // Tips header
        ctx.fillStyle = '#80D010';
        ctx.font = 'bold 8px "Press Start 2P", Courier, monospace';
        ctx.fillText('TIPS', W / 2, 160);

        ctx.font = '7px "Press Start 2P", Courier, monospace';
        ctx.fillStyle = '#FCFCFC';
        const tips = [
            'STOMP ENEMIES',
            'HIT ? FOR COINS',
            'MUSHROOM = BIG',
            'FLOWER = FIRE',
        ];
        tips.forEach((t, i) => {
            ctx.fillText(t, W / 2, 174 + i * 11);
        });

        // Key hints
        ctx.fillStyle = '#606090';
        ctx.font = '7px "Press Start 2P", Courier, monospace';
        if (this.gameMode !== 'extreme') {
            ctx.fillText('1-5 SELECT  R RESTART', W / 2, 218);
        } else {
            ctx.fillStyle = '#FF4444';
            ctx.fillText('NO RETRY  SURVIVE!', W / 2, 218);
        }

        // Resume hint
        if (Math.floor(this.animTimer * 2) % 2 === 0) {
            ctx.fillStyle = '#AAAAEE';
            ctx.font = 'bold 8px "Press Start 2P", Courier, monospace';
            ctx.fillText('PRESS P TO RESUME', W / 2, 228);
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

// ---- INIT ----
window.addEventListener('load', () => { new Game(); });
