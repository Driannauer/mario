// ============================================
// LEVEL DATA - Multi-Level System
// 5 Levels: 1-1 Grassland, 1-2 Underground,
// 1-3 Athletic, 1-4 Castle, 2-1 Boss
// ============================================

const LEVELS = [
    // ===================== WORLD 1-1: GRASSLAND =====================
    {
        name: '1-1', theme: 'overworld', bgColor: '#5C94FC',
        width: 215, height: 15,
        generate() {
            const map = [];
            for (let r = 0; r < this.height; r++) map[r] = new Array(this.width).fill(0);

            const groundSegs = [[0, 68], [71, 86], [89, 153], [155, 212]];
            for (const [s, e] of groundSegs) {
                for (let c = s; c <= e; c++) { map[13][c] = 1; map[14][c] = 1; }
            }

            const blocks = [
                { c: 16, r: 9, t: 3 },
                { c: 20, r: 9, t: 2 }, { c: 21, r: 9, t: 4 }, { c: 22, r: 9, t: 2 }, { c: 23, r: 9, t: 3 }, { c: 24, r: 9, t: 2 },
                { c: 22, r: 5, t: 3 },
                { c: 77, r: 9, t: 3 },
                { c: 78, r: 9, t: 2 }, { c: 79, r: 5, t: 4 }, { c: 80, r: 9, t: 2 },
                { c: 91, r: 9, t: 2 }, { c: 92, r: 9, t: 3 }, { c: 93, r: 9, t: 2 },
                { c: 94, r: 5, t: 2 }, { c: 95, r: 5, t: 2 }, { c: 96, r: 5, t: 2 },
                { c: 97, r: 5, t: 2 }, { c: 98, r: 5, t: 2 }, { c: 99, r: 5, t: 2 },
                { c: 100, r: 5, t: 2 }, { c: 101, r: 5, t: 2 },
                { c: 106, r: 5, t: 2 }, { c: 107, r: 5, t: 2 }, { c: 108, r: 5, t: 2 },
                { c: 109, r: 5, t: 3 },
                { c: 112, r: 9, t: 3 },
                { c: 118, r: 9, t: 2 }, { c: 119, r: 9, t: 2 },
                { c: 121, r: 5, t: 3 }, { c: 122, r: 5, t: 3 }, { c: 123, r: 5, t: 3 },
                { c: 128, r: 9, t: 2 }, { c: 129, r: 9, t: 3 }, { c: 130, r: 9, t: 3 }, { c: 131, r: 9, t: 2 },
                { c: 168, r: 9, t: 2 }, { c: 169, r: 9, t: 2 }, { c: 170, r: 5, t: 3 }, { c: 171, r: 5, t: 2 },
            ];
            for (const b of blocks) map[b.r][b.c] = b.t;

            // Fix: Add missing Row 9 bricks under Row 5 blocks (Cols 80-125) to make them reachable
            // This mimics the long brick row in original 1-1
            for (let c = 77; c <= 125; c++) {
                if (map[9][c] === 0) map[9][c] = 2;
            }

            const pipes = [[28, 11, 2], [38, 10, 3], [46, 9, 4], [57, 9, 4], [163, 11, 2], [179, 11, 2]];
            for (const [c, topR, h] of pipes) {
                for (let r = topR; r < 13; r++) { map[r][c] = 7; map[r][c + 1] = 7; }
            }

            const stairs = [
                [[134, 12, 1], [135, 12, 2], [136, 12, 3], [137, 12, 4]],
                [[140, 12, 4], [141, 12, 3], [142, 12, 2], [143, 12, 1]],
                [[148, 12, 1], [149, 12, 2], [150, 12, 3], [151, 12, 4], [152, 12, 5]],
                [[156, 12, 4], [157, 12, 3], [158, 12, 2], [159, 12, 1]],
                [[181, 12, 1], [182, 12, 2], [183, 12, 3], [184, 12, 4], [185, 12, 5], [186, 12, 6], [187, 12, 7], [188, 12, 8]],
            ];
            for (const set of stairs) for (const [c, sR, h] of set) { for (let i = 0; i < h; i++) map[sR - i][c] = 6; }

            return map;
        },
        enemies: [
            ['goomba', 22, 12], ['goomba', 40, 12], ['goomba', 51, 12], ['goomba', 52, 12],
            ['goomba', 80, 12], ['goomba', 82, 12], ['koopa', 107, 11],
            ['goomba', 114, 12], ['goomba', 115, 12], ['goomba', 124, 12], ['goomba', 125, 12],
            ['goomba', 128, 12], ['goomba', 129, 12], ['goomba', 174, 12], ['goomba', 175, 12],
        ],
        coins: [[12, 7]],
        clouds: [[8, 2, 1], [19, 1, 1], [36, 2, 3], [56, 1, 2], [67, 2, 1], [75, 1, 2], [88, 2, 1], [105, 1, 3], [120, 2, 1], [135, 1, 2], [150, 2, 1], [170, 1, 2], [190, 2, 1]],
        hills: [[0, 2], [16, 1], [48, 2], [64, 1], [96, 2], [112, 1], [144, 2], [160, 1], [192, 2]],
        bushes: [[11, 3], [23, 1], [41, 2], [59, 3], [71, 1], [89, 2], [107, 3], [119, 1], [137, 2], [155, 3], [175, 1]],
        flagpoleCol: 189, castleCol: 193,
        enterablePipes: [
            { col: 28, enterDir: 'down', exitCol: 163, exitRow: 11 },
            { col: 57, enterDir: 'down', exitCol: 179, exitRow: 11 },
        ],
        undergroundWidth: 32, undergroundHeight: 15,
        generateUnderground() {
            const map = [];
            for (let r = 0; r < this.undergroundHeight; r++) map[r] = new Array(this.undergroundWidth).fill(0);
            for (let c = 0; c < this.undergroundWidth; c++) { map[0][c] = 6; map[1][c] = 6; map[13][c] = 6; map[14][c] = 6; }
            for (let r = 0; r < this.undergroundHeight; r++) map[r][0] = 6;
            map[11][28] = 7; map[11][29] = 7; map[12][28] = 7; map[12][29] = 7;
            for (let r = 2; r < 13; r++) { map[r][31] = 6; map[r][30] = 6; }
            for (let c = 3; c <= 26; c++) map[5][c] = 3;
            for (let c = 3; c <= 26; c++) map[8][c] = 2;
            for (let c = 4; c <= 25; c++) map[10][c] = 3;
            return map;
        },
        undergroundCoins: [],
        undergroundExitPipe: { col: 28, topRow: 11 },
    },

    // ===================== WORLD 1-2: UNDERGROUND =====================
    {
        name: '1-2', theme: 'underground', bgColor: '#000000',
        width: 160, height: 15,
        generate() {
            const map = [];
            for (let r = 0; r < this.height; r++) map[r] = new Array(this.width).fill(0);

            // Ceiling
            for (let c = 0; c < this.width; c++) { map[0][c] = 6; map[1][c] = 6; }
            // Left wall
            for (let r = 0; r < 15; r++) map[r][0] = 6;

            // Ground with many gaps (more dangerous)
            const groundSegs = [[0, 18], [21, 35], [37, 42], [45, 58], [62, 70], [73, 85],
            [88, 95], [98, 110], [114, 125], [128, 165]]; // Extended to 165 to fill castle gap
            for (const [s, e] of groundSegs) {
                for (let c = s; c <= e; c++) { map[13][c] = 1; map[14][c] = 1; }
            }

            // Section 1: Low corridor with ceiling pressure (cols 5-18)
            for (let c = 5; c <= 18; c++) map[5][c] = 6;
            map[2][8] = 3; // Special "Honor of Kings" Q-Block

            // Current obstruction REMOVED (was cols 10-11, rows 2-4)

            // Climbing route on right side - ADJUSTED (User request: Retain middle, move R5 U1)
            // map[10][14] = 2; map[10][15] = 2; // REMOVED (Lower)
            map[7][20] = 2; map[7][21] = 2; // MOVED (Middle -> Right 5, Up 1. Was 8,15-16)
            // map[6][16] = 2; map[6][17] = 2; // REMOVED (Upper)

            map[5][7] = 6; // Hard block (User request: Match surrounding ceiling blocks)
            for (let c = 8; c <= 14; c++) map[6][c] = 6;
            map[6][12] = 3; // Moved coin block to bottom of ceiling (was 5,12 inaccessible)

            // Section 2: Platforming over first gaps (cols 18-42)
            // Floating platforms at varying heights
            for (let c = 19; c <= 20; c++) { map[11][c] = 2; } // Bridge over gap 1
            for (let c = 24; c <= 28; c++) map[10][c] = 2;
            for (let c = 30; c <= 33; c++) map[8][c] = 2;
            map[8][30] = 3; // Question block on platform
            for (let c = 36; c <= 36; c++) { map[11][c] = 2; } // Tiny bridge
            for (let c = 39; c <= 41; c++) map[9][c] = 2;
            map[6][39] = 4; // Power-up
            map[11][44] = 0; // Cleared block right of pipe (Col 42)

            // Section 3: Vertical maze (cols 45-58)
            // Walls creating zigzag path
            for (let r = 4; r <= 10; r++) map[r][48] = 6;
            for (let r = 2; r <= 8; r++) map[r][53] = 6;
            // Platforms in the maze
            for (let c = 46; c <= 47; c++) map[8][c] = 2; // Removed block at 45
            for (let c = 49; c <= 52; c++) map[6][c] = 2;
            for (let c = 54; c <= 57; c++) map[10][c] = 2;
            for (let c = 54; c <= 57; c++) map[10][c] = 2;
            // Fix: Add intermediate platform at Row 9 to reach Row 6 blocks
            for (let c = 49; c <= 52; c++) map[9][c] = 2;
            map[6][50] = 3; map[6][51] = 4;

            // Section 4: Lava-less death pits (cols 58-85)
            // Narrow platforms over bottomless pits
            for (let c = 60; c <= 61; c++) map[10][c] = 2;
            for (let c = 64; c <= 66; c++) map[8][c] = 2;
            for (let c = 69; c <= 70; c++) map[11][c] = 2;
            for (let c = 71; c <= 72; c++) { map[11][c] = 2; } // Bridge over gap
            // Ceiling drops to create pressure
            for (let c = 73; c <= 85; c++) map[4][c] = 6;
            for (let c = 76; c <= 80; c++) map[5][c] = 6;
            for (let c = 78; c <= 79; c++) { map[6][c] = 6; map[7][c] = 6; } // Stalactite
            // Platforms under ceiling
            for (let c = 75; c <= 78; c++) map[10][c] = 2;
            for (let c = 81; c <= 84; c++) map[9][c] = 2;
            map[9][82] = 3;

            // Section 5: Sprint section (cols 85-110)
            // Open ground but heavy enemy patrol
            // Elevated platforms for speedrunners
            for (let c = 87; c <= 90; c++) map[8][c] = 2; // Fixed platform (Left 1, Up 1)
            for (let c = 93; c <= 95; c++) map[7][c] = 2; // Reverted incorrect move
            map[7][94] = 4; // Fire flower up high
            for (let c = 96; c <= 97; c++) { map[11][c] = 2; } // Gap bridge
            for (let c = 100; c <= 104; c++) map[10][c] = 2;
            for (let c = 106; c <= 109; c++) map[8][c] = 2;
            map[8][107] = 3;

            // Section 6: Final gauntlet (cols 110-140)
            // Tight corridors + steps
            for (let c = 114; c <= 120; c++) map[7][c] = 6; // Low ceiling
            for (let c = 116; c <= 118; c++) map[8][c] = 6;
            // Stairs to exit
            for (let i = 0; i < 6; i++) { for (let j = 0; j <= i; j++) map[12 - j][135 + i] = 6; }
            for (let i = 0; i < 8; i++) { for (let j = 0; j <= i; j++) map[12 - j][143 + i] = 6; }

            // Pipes
            const pipes = [[15, 11, 2], [42, 10, 3], [90, 11, 2], [128, 11, 2]];
            for (const [c, topR] of pipes) {
                for (let r = topR; r < 13; r++) { map[r][c] = 7; map[r][c + 1] = 7; }
            }

            return map;
        },
        enemies: [
            // Section 1 corridor
            ['goomba', 8, 12], ['goomba', 12, 12], ['koopa', 18, 11], // Moved from 16 to 18 (stuck fix)
            // Section 2 platforming
            ['goomba', 26, 9], ['goomba', 27, 9], ['koopa', 31, 7],
            ['goomba', 40, 8],
            // Section 3 maze
            ['goomba', 46, 7], ['koopa', 50, 5], ['goomba', 55, 9], ['goomba', 56, 9],
            // Section 4 death pits
            ['koopa', 65, 7], ['goomba', 75, 9], ['goomba', 76, 9],
            ['koopa', 83, 8],
            // Section 5 sprint
            ['goomba', 89, 12], ['goomba', 90, 12], ['goomba', 92, 12],
            ['koopa', 101, 9], ['goomba', 104, 12], ['goomba', 105, 12],
            ['koopa', 107, 7],
            // Section 6 gauntlet
            ['goomba', 115, 12], ['goomba', 118, 12], ['koopa', 122, 11],
            ['goomba', 130, 12], ['goomba', 132, 12],
        ],
        coins: [],
        clouds: [], hills: [], bushes: [],
        flagpoleCol: 152, castleCol: 155,
        enterablePipes: [{ col: 42, enterDir: 'down', exitCol: 128, exitRow: 11 }],
        undergroundWidth: 24, undergroundHeight: 15,
        generateUnderground() {
            const map = [];
            for (let r = 0; r < this.undergroundHeight; r++) map[r] = new Array(this.undergroundWidth).fill(0);
            for (let c = 0; c < this.undergroundWidth; c++) { map[0][c] = 6; map[1][c] = 6; map[13][c] = 6; map[14][c] = 6; }
            for (let r = 0; r < this.undergroundHeight; r++) { map[r][0] = 6; }
            for (let r = 2; r < 13; r++) { map[r][22] = 6; map[r][23] = 6; }
            map[11][20] = 7; map[11][21] = 7; map[12][20] = 7; map[12][21] = 7;
            for (let c = 3; c <= 18; c++) map[6][c] = 3;
            for (let c = 3; c <= 18; c++) map[8][c] = 3;
            for (let c = 3; c <= 18; c++) map[10][c] = 3;
            for (let c = 3; c <= 18; c++) map[4][c] = 2;
            return map;
        },
        undergroundCoins: [],
        undergroundExitPipe: { col: 20, topRow: 11 },
    },

    // ===================== WORLD 1-3: ATHLETIC (PLATFORMS) =====================
    {
        name: '1-3', theme: 'overworld', bgColor: '#5C94FC',
        width: 170, height: 15,
        generate() {
            const map = [];
            for (let r = 0; r < this.height; r++) map[r] = new Array(this.width).fill(0);

            // Ground only at start and end
            for (let c = 0; c <= 15; c++) { map[13][c] = 1; map[14][c] = 1; }
            for (let c = 140; c < this.width; c++) { map[13][c] = 1; map[14][c] = 1; }

            // Tree-top / mushroom platforms (using brick blocks as platforms)
            // Series of floating platforms with gaps - player must jump between them
            const platforms = [
                // Starting area easy platforms
                [12, 11, 5], [19, 10, 4], [25, 9, 3], [30, 11, 6],
                // Mid section - trickier
                [38, 8, 3], [43, 10, 4], [49, 7, 3], [54, 9, 5],
                [61, 6, 3], [66, 8, 4], [72, 10, 3],
                // Hard section
                [77, 7, 2], [81, 9, 3], [86, 6, 2], [90, 8, 4],
                [96, 5, 3], [101, 7, 5], [108, 9, 3],
                // Final approach
                [113, 7, 4], [119, 10, 3], [124, 8, 4], [130, 11, 3], [135, 10, 5],
            ];
            for (const [c, r, len] of platforms) {
                for (let i = 0; i < len; i++) map[r][c + i] = 2;
            }

            // Question blocks on some platforms
            const qblocks = [
                { c: 14, r: 7, t: 4 }, { c: 21, r: 6, t: 3 }, { c: 31, r: 7, t: 3 },
                { c: 44, r: 6, t: 4 }, { c: 55, r: 5, t: 3 }, { c: 67, r: 4, t: 3 },
                { c: 82, r: 5, t: 4 }, { c: 102, r: 3, t: 3 }, { c: 115, r: 3, t: 4 },
                { c: 125, r: 4, t: 3 },
            ];
            for (const b of qblocks) map[b.r][b.c] = b.t;

            // Add some single-block stepping stones (stair blocks)
            const stones = [
                [17, 12], [23, 11], [28, 10], [36, 10], [47, 9],
                [59, 8], [64, 7], [70, 9], [75, 8], [84, 8],
                [94, 7], [99, 6], [111, 8], [117, 9], [122, 9], [128, 10], [133, 12],
            ];
            for (const [c, r] of stones) map[r][c] = 6;

            // Final staircase to flagpole
            for (let i = 0; i < 8; i++) { for (let j = 0; j <= i; j++) map[12 - j][146 + i] = 6; }

            // Pipe for hidden bonus room
            for (let r = 11; r < 13; r++) { map[r][8] = 7; map[r][9] = 7; }

            return map;
        },
        enemies: [
            ['goomba', 13, 10], ['koopa', 20, 9],
            ['goomba', 32, 10], ['goomba', 33, 10],
            ['goomba', 44, 9], ['koopa', 55, 8],
            ['goomba', 67, 7], ['goomba', 73, 9],
            ['koopa', 82, 8], ['goomba', 91, 7],
            ['goomba', 102, 6], ['goomba', 103, 6],
            ['koopa', 114, 6], ['goomba', 125, 7],
            ['goomba', 136, 9], ['goomba', 137, 9],
        ],
        coins: [],
        clouds: [[5, 1, 1], [20, 2, 2], [40, 1, 3], [60, 2, 1], [80, 1, 2], [100, 2, 1], [120, 1, 2], [140, 2, 1]],
        hills: [], bushes: [],
        flagpoleCol: 154, castleCol: 157,
        enterablePipes: [{ col: 8, enterDir: 'down', exitCol: 140, exitRow: 12 }],
        undergroundWidth: 20, undergroundHeight: 15,
        generateUnderground() {
            const map = [];
            for (let r = 0; r < this.undergroundHeight; r++) map[r] = new Array(this.undergroundWidth).fill(0);
            // Enclosed sky bonus room
            for (let c = 0; c < this.undergroundWidth; c++) { map[0][c] = 6; map[1][c] = 6; map[13][c] = 6; map[14][c] = 6; }
            for (let r = 0; r < this.undergroundHeight; r++) map[r][0] = 6;
            for (let r = 2; r < 13; r++) { map[r][18] = 6; map[r][19] = 6; }
            // Exit pipe
            map[11][16] = 7; map[11][17] = 7; map[12][16] = 7; map[12][17] = 7;
            // Cloud coin pattern - zigzag of coins
            for (let c = 2; c <= 14; c += 2) map[5][c] = 3;
            for (let c = 3; c <= 15; c += 2) map[7][c] = 3;
            for (let c = 2; c <= 14; c += 2) map[9][c] = 3;
            for (let c = 3; c <= 15; c += 2) map[11][c] = 3;
            // Power-up block
            map[9][8] = 4;
            return map;
        },
        undergroundCoins: [],
        undergroundExitPipe: { col: 16, topRow: 11 },
    },

    // ===================== WORLD 1-4: CASTLE =====================
    {
        name: '1-4', theme: 'castle', bgColor: '#200000',
        width: 145, height: 15,
        generate() {
            const map = [];
            for (let r = 0; r < this.height; r++) map[r] = new Array(this.width).fill(0);

            // Ceiling
            for (let c = 0; c < this.width; c++) { map[0][c] = 6; map[1][c] = 6; }
            // Main ground with lava gaps
            const groundSegs = [[0, 20], [23, 40], [43, 55], [58, 65], [68, 78],
            [81, 92], [95, 105], [108, 145]]; // Extended to 145 to fill gap right of castle
            for (const [s, e] of groundSegs) {
                for (let c = s; c <= e; c++) { map[13][c] = 6; map[14][c] = 6; }
            }

            // --- INTRO AREA REWORK (Cols 3-15) ---
            // Added terrain to fix "empty start" feeling
            for (let c = 5; c <= 7; c++) map[12][c] = 6; // Step 1
            for (let c = 6; c <= 7; c++) map[11][c] = 6; // Step 2
            map[10][7] = 6; // Step 3

            // Small platform with power-up
            for (let c = 10; c <= 12; c++) map[9][c] = 2;
            map[9][11] = 4; // Fire flower choice early on

            // HIGH ROUTE (Cols 13-18) - Filling upper empty space
            for (let c = 14; c <= 17; c++) map[6][c] = 2; // High platform
            map[6][15] = 3; map[6][16] = 3; // Coins on high platform

            // Lava in gaps
            const lavaGaps = [[21, 22], [41, 42], [56, 57], [66, 67], [79, 80], [93, 94], [106, 107]];
            for (const [s, e] of lavaGaps) {
                for (let c = s; c <= e; c++) { map[13][c] = 9; map[14][c] = 9; }
            }

            // --- FIRST HALF (cols 0-55): Introductory castle ---
            // Walls (jumpable)
            for (let r = 10; r < 13; r++) { map[r][15] = 6; }
            for (let r = 10; r < 13; r++) { map[r][35] = 6; }
            for (let r = 10; r < 13; r++) { map[r][50] = 6; } // Pillar moved Left 2 (was 52)

            // Stalactites
            for (let r = 2; r < 4; r++) { map[r][18] = 6; map[r][30] = 6; map[r][48] = 6; }

            // Low platforms (first half)
            for (let c = 25; c <= 30; c++) map[10][c] = 2;
            for (let c = 25; c <= 30; c++) map[10][c] = 2;
            for (let c = 50; c <= 55; c++) map[7][c] = 2; // Platform moved Right 5, Up 3 (was 45-50, R10)

            // --- SECOND HALF (cols 58-130): Harder castle ---

            // Narrow corridor with low ceiling (cols 60-65)
            for (let c = 60; c <= 65; c++) { map[6][c] = 6; map[7][c] = 6; }
            // Wall with gap to squeeze through
            for (let r = 4; r <= 10; r++) map[r][63] = 6;
            map[9][63] = 0; map[10][63] = 0; // Leave gap at bottom for passage

            // Elevated platform section (cols 68-78)
            for (let c = 69; c <= 72; c++) map[10][c] = 2;
            for (let c = 74; c <= 77; c++) map[8][c] = 2;
            map[8][75] = 4; // Power-up block
            // Stalactites dropping down
            for (let r = 2; r < 5; r++) { map[r][70] = 6; map[r][76] = 6; }

            // Zigzag lava section (cols 81-92)
            for (let c = 82; c <= 85; c++) map[10][c] = 2;
            for (let c = 87; c <= 89; c++) map[8][c] = 2;
            for (let c = 90; c <= 92; c++) map[10][c] = 2;
            map[8][88] = 3; // Question block
            // Walls creating corridors
            for (let r = 5; r <= 9; r++) map[r][86] = 6;
            // Stalactites
            for (let r = 2; r < 5; r++) { map[r][84] = 6; map[r][91] = 6; }

            // Lava gauntlet (cols 95-105)
            // Elevated walkway over lava gaps below
            for (let c = 96; c <= 98; c++) map[10][c] = 2;
            for (let c = 100; c <= 102; c++) map[8][c] = 2;
            for (let c = 103; c <= 105; c++) map[10][c] = 2;
            map[10][97] = 3; map[8][101] = 4;
            // Ceiling drops
            for (let r = 2; r < 6; r++) { map[r][99] = 6; }

            // Pre-flagpole area (cols 108-130)
            // Wall barrier with passage
            for (let r = 4; r <= 11; r++) map[r][112] = 6;
            map[10][112] = 0; map[11][112] = 0; // Gap to walk through
            // More platforms and obstacles
            for (let c = 114; c <= 118; c++) map[10][c] = 2;
            for (let c = 120; c <= 123; c++) map[8][c] = 2;
            map[8][121] = 3; map[10][116] = 3;
            // Stalactites near end
            for (let r = 2; r < 5; r++) { map[r][115] = 6; map[r][122] = 6; }

            // Final staircase to flagpole
            for (let i = 0; i < 8; i++) { for (let j = 0; j <= i; j++) map[12 - j][126 + i] = 6; }

            // Hidden pipe for bonus room
            for (let r = 11; r < 13; r++) { map[r][46] = 7; map[r][47] = 7; } // Pipe moved Left 2 (was 48)

            return map;
        },
        enemies: [
            // First half
            ['goomba', 12, 12], ['goomba', 14, 12],
            ['koopa', 25, 9], ['goomba', 28, 12],
            ['goomba', 38, 12], ['goomba', 39, 12],
            ['koopa', 46, 9], ['goomba', 50, 12],
            // Second half - more enemies in tighter spaces
            ['goomba', 60, 12], ['goomba', 62, 12],
            ['koopa', 70, 9], ['goomba', 72, 12],
            ['goomba', 76, 12], ['goomba', 78, 12],
            ['koopa', 83, 9], ['goomba', 85, 12],
            ['goomba', 88, 12], ['koopa', 91, 9],
            ['goomba', 97, 12], ['goomba', 100, 12],
            ['koopa', 104, 9], ['goomba', 110, 12],
            ['goomba', 115, 12], ['goomba', 117, 12],
            ['koopa', 121, 7], ['goomba', 124, 12],
        ],
        coins: [],
        clouds: [], hills: [], bushes: [],
        flagpoleCol: 136, castleCol: 139,
        flagpoleCol: 136, castleCol: 139,
        enterablePipes: [{ col: 46, enterDir: 'down', exitCol: 98, exitRow: 12 }], // Pipe data moved Left 2
        undergroundWidth: 22, undergroundHeight: 15,
        generateUnderground() {
            const map = [];
            for (let r = 0; r < this.undergroundHeight; r++) map[r] = new Array(this.undergroundWidth).fill(0);
            // Castle treasure room
            for (let c = 0; c < this.undergroundWidth; c++) { map[0][c] = 6; map[1][c] = 6; map[13][c] = 6; map[14][c] = 6; }
            for (let r = 0; r < this.undergroundHeight; r++) map[r][0] = 6;
            for (let r = 2; r < 13; r++) { map[r][20] = 6; map[r][21] = 6; }
            // Exit pipe
            map[11][18] = 7; map[11][19] = 7; map[12][18] = 7; map[12][19] = 7;
            // Treasure layout - lots of coins in a castle vault
            for (let c = 3; c <= 16; c++) map[5][c] = 3;
            for (let c = 4; c <= 15; c++) map[7][c] = 3;
            for (let c = 3; c <= 16; c++) map[9][c] = 3;
            // Brick walkway and power-up
            for (let c = 3; c <= 16; c++) map[11][c] = 2;
            map[7][9] = 4; // fire flower block
            map[7][10] = 4; // another power-up
            return map;
        },
        undergroundCoins: [],
        undergroundExitPipe: { col: 18, topRow: 11 },
        hasLava: true,
    },

    // ===================== WORLD 2-1: BOWSER'S NIGHTMARE FORTRESS =====================
    {
        name: '2-1', theme: 'boss', bgColor: '#0A0018',
        width: 220, height: 15,
        width: 220, height: 15,
        startCol: 4, startRow: 9, // Start high enough to fall safely on ground (row 13)
        isBossLevel: true,
        podiumCol: 200,
        generate() {
            const map = [];
            for (let r = 0; r < this.height; r++) map[r] = new Array(this.width).fill(0);

            // Ceiling (full length, except celebration)
            for (let c = 0; c < 176; c++) { map[0][c] = 6; map[1][c] = 6; }

            // === SECTION 1: ENTRANCE CORRIDOR (0-20) ===
            for (let c = 0; c <= 20; c++) { map[13][c] = 6; map[14][c] = 6; }
            // Left wall
            for (let r = 0; r < 15; r++) map[r][0] = 6;
            // Welcome power-ups
            map[9][6] = 4; // Fire flower
            map[9][10] = 3; // Coin
            map[9][14] = 3; // Coin
            // Decorative pillars (3 tiles high, jumpable)
            for (let r = 10; r < 13; r++) { map[r][18] = 6; }

            // === SECTION 2: TRAP LABYRINTH (21-70) ===
            // Dual-path: upper ceiling route & lower ground route
            // Lower ground with lava pits
            const groundSegs2 = [[21, 28], [31, 38], [41, 48], [51, 58], [61, 70]];
            for (const [s, e] of groundSegs2) {
                for (let c = s; c <= e; c++) { map[13][c] = 6; map[14][c] = 6; }
            }
            // Lava between ground segments
            const lavaPits2 = [[29, 30], [39, 40], [49, 50], [59, 60]];
            for (const [s, e] of lavaPits2) {
                for (let c = s; c <= e; c++) { map[13][c] = 9; map[14][c] = 9; }
            }

            // Upper path - accessible via wide staircase from left
            for (let c = 22; c <= 23; c++) map[11][c] = 6; // Step 1 (2-wide)
            for (let c = 24; c <= 25; c++) map[9][c] = 6;  // Step 2 (2-wide)
            for (let c = 26; c <= 27; c++) map[7][c] = 6;  // Step 3 (2-wide, reaches upper path)
            // Upper walkway (broken with gaps for difficulty)
            for (let c = 28; c <= 68; c++) {
                if (c % 7 !== 0) map[7][c] = 2; // Broken bridge at row 7 (reachable), wider gaps
            }
            map[7][35] = 3; // Coin on upper path
            map[7][50] = 4; // Power-up on upper path (reward for skilled players)

            // Stalactites on lower path (ceiling pressure)
            for (let r = 2; r < 5; r++) { map[r][32] = 6; map[r][44] = 6; map[r][56] = 6; }

            // Walls creating maze-like barriers
            for (let r = 6; r < 10; r++) map[r][36] = 6;
            for (let r = 6; r < 10; r++) map[r][52] = 6;

            // === SECTION 3: GAUNTLET CORRIDOR (71-110) ===
            // Continuous ground with heavy enemy placement (implemented through enemies array)
            for (let c = 71; c <= 110; c++) { map[13][c] = 6; map[14][c] = 6; }
            // Ceiling drops creating pressure corridors
            for (let c = 75; c <= 82; c++) { map[4][c] = 6; map[5][c] = 6; }
            for (let c = 90; c <= 97; c++) { map[4][c] = 6; map[5][c] = 6; }
            // Narrow passages with stalactites
            for (let r = 2; r < 6; r++) { map[r][78] = 6; map[r][80] = 6; }
            for (let r = 2; r < 6; r++) { map[r][93] = 6; map[r][95] = 6; }
            // Platforms for maneuvering
            for (let c = 83; c <= 86; c++) map[9][c] = 2;
            map[9][84] = 3; // Coin block
            for (let c = 100; c <= 103; c++) map[9][c] = 2;
            map[9][101] = 4; // Fire flower
            // Walls forcing jump patterns (3 tiles high, jumpable)
            for (let r = 10; r < 13; r++) map[r][87] = 6;
            for (let r = 10; r < 13; r++) map[r][106] = 6;

            // === SECTION 4: DARK ABYSS (111-140) ===
            // Full lava below - only floating platforms
            for (let c = 111; c <= 140; c++) { map[13][c] = 9; map[14][c] = 9; }
            // Floating platform chain (precision jumping required)
            for (let c = 112; c <= 114; c++) map[10][c] = 2; // Platform 1
            for (let c = 117; c <= 118; c++) map[8][c] = 2;  // Platform 2 (narrow!)
            for (let c = 121; c <= 123; c++) map[10][c] = 2; // Platform 3
            map[8][125] = 2; map[8][126] = 2;                // Platform 4 (lowered for reachability)
            for (let c = 129; c <= 131; c++) map[8][c] = 2;  // Platform 5
            for (let c = 134; c <= 136; c++) map[10][c] = 2; // Platform 6
            for (let c = 138; c <= 140; c++) map[11][c] = 6; // Landing

            // HIDDEN BLOCKS (tile 8) - secret stepping stones in the abyss
            // Path below visible platforms, requires blind jump or knowledge
            map[12][115] = 8; map[12][116] = 8; // Hidden step 1
            map[11][119] = 8; map[11][120] = 8; // Hidden step 2
            map[12][127] = 8; map[12][128] = 8; // Hidden step 3
            map[10][132] = 8; map[10][133] = 8; // Hidden step 4

            // Question block with 1UP above secret path (reward for finding hidden blocks)
            map[9][120] = 3; // Visible coin reward near hidden path

            // Power-up on high platform
            map[6][125] = 4;

            // === SECTION 5: BOSS ARENA (141-175) ===
            // Pre-arena solid ground
            for (let c = 141; c <= 148; c++) { map[11][c] = 6; map[12][c] = 6; map[13][c] = 6; map[14][c] = 6; }

            // Hidden pipe entrance (crouch to enter, in floor at col 143)
            map[11][143] = 7; map[11][144] = 7;
            map[12][143] = 7; map[12][144] = 7;

            // Arena left pillar (short enough to jump over)
            for (let r = 8; r <= 10; r++) map[r][148] = 6;

            // Lava pit under bridge
            for (let c = 149; c <= 170; c++) { map[13][c] = 9; map[14][c] = 9; }

            // Bridge (Col 149-164) - will be destroyed by axe
            // Col 165 is now SOLID (tile 6) so Mario can stand there when bridge breaks
            for (let c = 149; c <= 164; c++) map[11][c] = 2;
            map[11][165] = 6; // Solid block left of axe

            // POW bricks on bridge edges (hitting these as big Mario damages boss)
            map[11][151] = 2; // POW brick 1 (tracked by col in game.js)
            map[11][163] = 2; // POW brick 2

            // Elevated combat platforms (for Phase 2)
            map[8][152] = 6; map[8][153] = 6; // Left high platform
            map[6][157] = 6; map[6][158] = 6; // Center top platform

            // Axe platform & wall with HIGH DOOR
            map[11][166] = 6; map[11][167] = 6; // Axe platform
            for (let r = 2; r < 15; r++) { map[r][168] = 6; map[r][169] = 6; } // Wall
            // High door visual on wall (3 tiles high, at rows 4-6 on col 169)
            // Wall at col 168 stays SOLID until boss dies (opened dynamically in game.js)
            map[4][169] = 11; map[5][169] = 11; map[6][169] = 11; // Door tile visual
            // Platform leading to door (row 7, cols 166-167)
            map[7][166] = 6; map[7][167] = 6;
            // Pushed far step platform to force mid-air jump (shifted down/right)
            map[8][161] = 6; map[8][162] = 6; // Mid step moved to 8, 161-162

            // === SECTION 6: CELEBRATION HALL (176-220) ===
            // Open roof (no ceiling)
            for (let c = 176; c < 220; c++) { map[0][c] = 0; map[1][c] = 0; }
            // Ground
            for (let c = 170; c < 220; c++) { map[13][c] = 6; map[14][c] = 6; }
            // Fill between wall and celebration
            for (let c = 170; c <= 175; c++) { map[12][c] = 6; }

            // AWARD PODIUM - Large Gold Steps (1st, 2nd, 3rd)
            // Center is Col 200. Ground is Row 13.
            // 2nd Place (Left): 2 cols wide, Height 2 (Rows 11-12)
            map[12][198] = 12; map[11][198] = 12;
            map[12][199] = 12; map[11][199] = 12;
            // 1st Place (Center): 2 cols wide, Height 3 (Rows 10-12)
            map[12][200] = 12; map[11][200] = 12; map[10][200] = 12;
            map[12][201] = 12; map[11][201] = 12; map[10][201] = 12;
            // 3rd Place (Right): 2 cols wide, Height 1 (Row 12)
            map[12][202] = 12; map[12][203] = 12;

            // Adjust podiumCol to be center of 1st place (Already set to 200 in props)

            // Adjust podiumCol to be center of 1st place
            // Center of 197-203 is 200.

            return map;
        },
        enemies: [
            // Section 1: Light warmup
            ['goomba', 12, 12], ['goomba', 16, 12],
            // Section 2: Lower path (reduced - only key positions)
            ['goomba', 25, 12], ['koopa', 34, 11],
            ['goomba', 44, 12], ['koopa', 54, 11],
            ['goomba', 64, 12],
            // Section 2: Upper path enemy
            ['koopa', 40, 6],
            // Section 3: Gauntlet (reduced)
            ['goomba', 74, 12], ['koopa', 77, 11],
            ['goomba', 82, 12],
            ['koopa', 85, 8], // On platform
            ['goomba', 91, 12], ['goomba', 93, 12],
            ['koopa', 102, 8], // On platform
            ['goomba', 105, 12], ['goomba', 108, 12],
            // Section 4: Sparse
            ['koopa', 113, 9],
            ['goomba', 122, 9], ['goomba', 130, 7],
            // Section 3 reinforcements
            ['goomba', 96, 12], ['koopa', 100, 12], ['goomba', 109, 12],
        ],
        coins: [],
        clouds: [], hills: [], bushes: [],
        flagpoleCol: -1, castleCol: -1,
        // Hidden pipe: crouch at col 143 to enter star room
        enterablePipes: [
            { col: 143, enterDir: 'down', exitCol: 146, exitRow: 10 }
        ],
        undergroundWidth: 22, undergroundHeight: 15,
        generateUnderground() {
            const map = [];
            for (let r = 0; r < this.undergroundHeight; r++) map[r] = new Array(this.undergroundWidth).fill(0);
            // Room walls: ceiling rows 0-1, floor rows 13-14
            for (let c = 0; c < this.undergroundWidth; c++) { map[0][c] = 6; map[1][c] = 6; map[13][c] = 6; map[14][c] = 6; }
            for (let r = 0; r < this.undergroundHeight; r++) map[r][0] = 6;
            for (let r = 2; r < 13; r++) { map[r][20] = 6; map[r][21] = 6; }

            // Ground walkway (row 12) — main floor
            for (let c = 2; c <= 18; c++) map[12][c] = 2;

            // Raised platform (row 8, cols 4-10) — jumpable from row 12 (4 tiles, within range)
            for (let c = 4; c <= 10; c++) map[8][c] = 2;

            // === QUESTION BLOCKS — all have 2+ tile clearance above platforms ===

            // Coins at row 9 (3 tiles above ground row 12, NO block at rows 10-11 below)
            for (let c = 3; c <= 17; c += 2) map[9][c] = 3;

            // Star block at row 5 (3 tiles above platform row 8, NO block at rows 6-7 below)
            map[5][7] = 10;

            // Power-up at row 5 (hittable from platform row 8)
            map[5][5] = 4;

            // Coins at row 4 (hittable by jumping from platform row 8, 4 tiles up)
            map[4][8] = 3; map[4][9] = 3; map[4][10] = 3;

            // Exit Pipe (now on ground floor row 12)
            map[11][18] = 7; map[11][19] = 7; map[12][18] = 7; map[12][19] = 7;

            return map;
        },
        undergroundCoins: [],
        undergroundExitPipe: { col: 18, topRow: 11 },

        hasLava: true,
        // Celebration room config
        podiumCol: 200, // Center of 1st place platform
        celebrationStartCol: 176,
        // POW brick columns (breaking these damages boss)
        powBrickCols: [151, 163],
        // Arena floor columns (for Phase 3 collapse mechanic)
        arenaFloorCols: (() => { const cols = []; for (let c = 149; c <= 164; c++) cols.push(c); return cols; })(),
        // Boss data - 3 Phase system
        boss: {
            startCol: 158, startRow: 7,
            hp: 5, phase3Hp: 6,
            bridgeStart: 149, bridgeEnd: 164, bridgeRow: 11,
            axeCol: 166
        }
    },
];

// Mutable reference to current level data (updated by game.js)
let LEVEL_DATA = LEVELS[0];
