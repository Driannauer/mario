// ============================================
// Redesigned sprites v2
// SPRITE DRAWING SYSTEM - Super Mario Bros
// Pixel-art rendering with compact data format
// ============================================

const PALETTE = {
    '.': null,
    'r': '#E40228', 'R': '#DC1820',
    's': '#FCA044', 'S': '#F8B878',
    'b': '#7C3800', 'B': '#AC7C00',
    'u': '#2038EC', 'U': '#3058F8',
    'w': '#FCFCFC', 'W': '#D8D8D8',
    'g': '#00A800', 'G': '#80D010',
    'y': '#F8D878', 'Y': '#E4A264',
    'o': '#E45C10', 'O': '#C84C0C',
    'k': '#000000', 'K': '#503000',
    'p': '#FCC0A8', // light skin
    'n': '#005800', // dark green
};

function renderPixels(ctx, x, y, data) {
    for (let row = 0; row < data.length; row++) {
        const line = data[row];
        for (let col = 0; col < line.length; col++) {
            const ch = line[col];
            if (ch === '.' || ch === ' ') continue;
            const color = PALETTE[ch];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x + col, y + row, 1, 1);
            }
        }
    }
}

// ---- SPRITE DATA ----
const MARIO_SMALL = {
    idle: [
        '....rrrrr...',
        '...rrrrrrrr.',
        '...bbbssbs..',
        '..bsbsssbs..',
        '..bsbsssbbb.',
        '..bbssssbb..',
        '....ssssss..',
        '...rruurrr..',
        '..rrruurrrr.',
        '..rrruuurrrr',
        '..ssruusrss.',
        '..sssuurss..',
        '..ssuuuuss..',
        '...uu..uu...',
        '..bbb..bbb..',
        '..bbbb.bbbb.',
    ],
    walk1: [
        '....rrrrr...',
        '...rrrrrrrr.',
        '...bbbssbs..',
        '..bsbsssbs..',
        '..bsbsssbbb.',
        '..bbssssbb..',
        '....ssssss..',
        '....rruurrr.',
        '...rruurrrr.',
        '..rrrruurrr.',
        '..sssuurss..',
        '..ssuuuuss..',
        '...uurruuu..',
        '..uur..bbb..',
        '..bb..bbbbb.',
        '........bbb.',
    ],
    walk2: [
        '....rrrrr...',
        '...rrrrrrrr.',
        '...bbbssbs..',
        '..bsbsssbs..',
        '..bsbsssbbb.',
        '..bbssssbb..',
        '....ssssss..',
        '...rruurr...',
        '..rrruurrr..',
        '.rrrruurrr..',
        '.ssruusrrr..',
        '.suurssss...',
        '..uurruu....',
        '..bbb..bb...',
        '.bbbbb.bbb..',
        '.bbb........',
    ],
    jump: [
        '....rrrrr...',
        '...rrrrrrrr.',
        '...bbbssbs..',
        '..bsbsssbs..',
        '..bsbsssbbb.',
        '..bbssssbb..',
        '....ssssss..',
        '..rrruurrrr.',
        '.rrrruurrrrr',
        '.ssrruusrss.',
        '.sssuurss...',
        '.ssuuuuss...',
        '...uu.uu....',
        '..uu..bbb...',
        '..b...bbbbb.',
        '.bb.........',
    ],
};

// Front-facing Mario (facing camera) - symmetrical
const MARIO_FRONT_SMALL = [
    '....rrrrr...',
    '...rrrrrrrr.',
    '...bbbbbbb..',
    '..bssbssbs..',
    '..bssbssbs..',
    '..bbsssssb..',
    '....sssss...',
    '...ruuruur..',
    '..rruuuruur.',
    '..rruuuuurr.',
    '..ssruuurss.',
    '..ssuuuuuss.',
    '..ssuuuuuss.',
    '...uu..uu...',
    '..bbb..bbb..',
    '..bbbb.bbbb.',
];

const MARIO_FRONT_BIG = [
    '.....rrrrr..',
    '....rrrrrrrr',
    '....bbbbbbb.',
    '...bssbssbs.',
    '...bssbssbs.',
    '...bbsssssb.',
    '.....sssss..',
    '....ruuruur.',
    '...rruuuruur',
    '..rruuuuuurr',
    '..ssruuuurss',
    '..ssuuuuuuss',
    '..ssuuuuuuss',
    '....uu..uu..',
    '...ruuruurr.',
    '..rruuuruurr',
    '..rruuuuuurr',
    '..ssruuuurss',
    '..ssuuuuuuss',
    '..ssuuuuuuss',
    '...uuu.uuu..',
    '...uu...uu..',
    '..bbb..bbb..',
    '..bbbb.bbbb.',
];

const MARIO_BIG = {
    idle: [
        '.....rrrrr..',
        '....rrrrrrrr',
        '....bbbssbs.',
        '...bsbsssbs.',
        '...bsbsssbbb',
        '...bbssssbb.',
        '.....sssss..',
        '....rruurrr.',
        '...rrruurrrr',
        '..rrrruurrru',
        '..ssruusssu.',
        '..sssuursss.',
        '..ssuuuuuss.',
        '....uu..uu..',
        '...rruurrr..',
        '..rrruurrrr.',
        '..rrrruurrru',
        '..rsruursr..',
        '..sssuuuss..',
        '..ssuuuuuss.',
        '...uuu.uuu..',
        '...uu...uu..',
        '..bbb..bbb..',
        '..bbbb.bbbb.',
    ],
    walk1: [
        '.....rrrrr..',
        '....rrrrrrrr',
        '....bbbssbs.',
        '...bsbsssbs.',
        '...bsbsssbbb',
        '...bbssssbb.',
        '.....sssss..',
        '....rruurr..',
        '...rrruurrrr',
        '..rrrruuurr.',
        '..ssruusrss.',
        '..sssuurrss.',
        '..ssuuuuuss.',
        '....uu..uu..',
        '....rruurrr.',
        '...rruurrrr.',
        '..rrruurrr..',
        '..sssuurss..',
        '..ssuuuuss..',
        '...uurruuu..',
        '..uur..bbb..',
        '..bb..bbbbb.',
        '......bbb...',
        '............',
    ],
    duck: [
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '.....rrrrr..',
        '....rrrrrrrr',
        '....bbbssbs.',
        '...bsbsssbs.',
        '...bsbsssbbb',
        '...bbssssbb.',
        '.....sssss..',
        '...rruurrr..',
        '..rrruurrrr.',
        '..rrrruurrru',
        '..ssruusssu.',
        '..ssuuuuuss.',
        '..ssuuuuuss.',
        '...uu...uu..',
        '..bbb..bbb..',
        '..bbbb.bbbb.',
    ],
};

const GOOMBA_DATA = {
    frame0: [
        '......kkkk......',
        '....kkYYYYkk....',
        '...kYYBBBBYYk...',
        '..kYYBBBBBBYYk..',
        '..kwwYkkkYwwYk..',
        '.kYwwYkkkYwwYYk.',
        '.kYkkYYYYYkkYYk.',
        '.kYYYYYYYYYYYYk.',
        '.kYYYYYkYYYYYYk.',
        '..kYYYooooBYYk..',
        '..kkYYokkoBYkk..',
        '...kYYYYYYYYk...',
        '..kkkkkkkkkkkk..',
        '.kBBBBk..kBBBBk.',
        '.kBBBBk..kBBBBk.',
        '..kkkk....kkkk..',
    ],
    frame1: [
        '......kkkk......',
        '....kkYYYYkk....',
        '...kYYBBBBYYk...',
        '..kYYBBBBBBYYk..',
        '..kwwYkkkYwwYk..',
        '.kYwwYkkkYwwYYk.',
        '.kYkkYYYYYkkYYk.',
        '.kYYYYYYYYYYYYk.',
        '.kYYYYYkYYYYYYk.',
        '..kYYYooooBYYk..',
        '..kkYYokkoBYkk..',
        '...kYYYYYYYYk...',
        '...kkkkkkkkkkk..',
        '..kBBBBkkBBBBk..',
        '..kBBBk..kBBBk..',
        '...kkk....kkk...',
    ],
    squished: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '.kkkkkkkkkkkkkk.',
        '.kYYkwYkookBBBk.',
        '.kYYkwYkookBBBk.',
        '..kkkkkkkkkkkk..',
    ],
};

const KOOPA_DATA = {
    frame0: [
        '........kkkk....',
        '.......kggggk...',
        '......kgGwwGgk..',
        '......kGwwkkGk..',
        '......kgGkkGgk..',
        '.......kgGGgk...',
        '....kkkkgggkkk..',
        '...kggGGGGGGgk..',
        '..kggGGGGGGGGgk.',
        '..kgGGgGGGGgGgk.',
        '.kggGGGGwwGGGgk.',
        '.kggGGGwwwwGGgk.',
        '.kggGGGGwwGGGgk.',
        '..kgggGGGGgggk..',
        '..kkYYYk.kYYYkk.',
        '...kYYYk.kYYYk..',
    ],
    frame1: [
        '........kkkk....',
        '.......kggggk...',
        '......kgGwwGgk..',
        '......kGwwkkGk..',
        '......kgGkkGgk..',
        '.......kgGGgk...',
        '....kkkkgggkkk..',
        '...kggGGGGGGgk..',
        '..kggGGGGGGGGgk.',
        '..kgGGgGGGGgGgk.',
        '.kggGGGGwwGGGgk.',
        '.kggGGGwwwwGGgk.',
        '.kggGGGGwwGGGgk.',
        '..kgggGGGGgggk..',
        '.kkYYYkk.kkYYYk.',
        '.kYYYk....kYYYk.',
    ],
    shell: [
        '................',
        '................',
        '................',
        '......kkkk......',
        '....kkggggkk....',
        '...kggGGGGggk...',
        '..kgGGGGGGGGgk..',
        '.kgGGgGGGGgGGgk.',
        '.kgGGGGwwGGGGgk.',
        '.kgGGGwwwwGGGgk.',
        '.kgGGGGwwGGGGgk.',
        '..kgGGGGGGGGgk..',
        '...kggGGGGggk...',
        '....kkggggkk....',
        '......kkkk......',
        '................',
    ],
};

const SPRITE = {
    // Render a pixel-art sprite with direction flipping
    _render(ctx, x, y, data, dir) {
        if (dir < 0) {
            ctx.save();
            ctx.translate(x + 16, y);
            ctx.scale(-1, 1);
            renderPixels(ctx, 0, 0, data);
            ctx.restore();
        } else {
            renderPixels(ctx, x, y, data);
        }
    },

    drawSmallMario(ctx, x, y, dir, frame, invincible, invTimer, fire) {
        if (invincible && Math.floor(invTimer * 10) % 3 === 0) return;
        let data;
        if (frame === 0) data = MARIO_SMALL.idle;
        else if (frame === 1) data = MARIO_SMALL.walk1;
        else if (frame === 2) data = MARIO_SMALL.walk2;
        else data = MARIO_SMALL.jump;
        if (fire) data = data.map(row => row.replace(/r/g, 'w').replace(/R/g, 'W').replace(/u/g, 'r').replace(/U/g, 'R'));
        this._render(ctx, x, y, data, dir);
    },

    drawBigMario(ctx, x, y, dir, frame, ducking, invincible, invTimer, fire) {
        if (invincible && Math.floor(invTimer * 10) % 3 === 0) return;
        let data;
        if (ducking) data = MARIO_BIG.duck;
        else if (frame === 0) data = MARIO_BIG.idle;
        else data = MARIO_BIG.walk1;
        if (fire) data = data.map(row => row.replace(/r/g, 'w').replace(/R/g, 'W').replace(/u/g, 'r').replace(/U/g, 'R'));
        if (dir < 0) {
            ctx.save();
            ctx.translate(x + 14, y);
            ctx.scale(-1, 1);
            renderPixels(ctx, 0, 0, data);
            ctx.restore();
        } else {
            renderPixels(ctx, x, y, data);
        }
    },

    drawFrontMario(ctx, x, y, big, fire) {
        let data = big ? MARIO_FRONT_BIG : MARIO_FRONT_SMALL;
        if (fire) data = data.map(row => row.replace(/r/g, 'w').replace(/R/g, 'W').replace(/u/g, 'r').replace(/U/g, 'R'));
        renderPixels(ctx, x, y, data);
    },

    drawGoomba(ctx, x, y, frame, squished) {
        if (squished) {
            renderPixels(ctx, x, y, GOOMBA_DATA.squished);
            return;
        }
        renderPixels(ctx, x, y, frame === 0 ? GOOMBA_DATA.frame0 : GOOMBA_DATA.frame1);
    },

    drawKoopa(ctx, x, y, frame, inShell) {
        if (inShell) {
            renderPixels(ctx, x, y, KOOPA_DATA.shell);
            return;
        }
        // Walking Koopa (24px hitbox, 16px sprite) - offset 8px down to align with ground
        renderPixels(ctx, x, y + 8, frame === 0 ? KOOPA_DATA.frame0 : KOOPA_DATA.frame1);
    },

    // ---- TILE SPRITES ----
    drawQuestionBlock(ctx, x, y, frame) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = '#E45C10';
        ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.fillStyle = '#E45C10';
        ctx.fillRect(x + 3, y + 3, 10, 10);
        // Animated ? mark
        const qy = y + (frame === 1 ? -1 : 0);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 5, qy + 3, 6, 2);
        ctx.fillRect(x + 9, qy + 5, 2, 2);
        ctx.fillRect(x + 6, qy + 7, 4, 2);
        ctx.fillRect(x + 6, qy + 9, 2, 1);
        ctx.fillRect(x + 6, qy + 11, 2, 2);
        // Corner highlights
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(x + 1, y + 1, 1, 1);
        ctx.fillRect(x + 14, y + 1, 1, 1);
        ctx.fillRect(x + 1, y + 14, 1, 1);
        ctx.fillRect(x + 14, y + 14, 1, 1);
    },

    drawUsedBlock(ctx, x, y) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = '#886848';
        ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = '#C8A878';
        ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.fillStyle = '#886848';
        ctx.fillRect(x + 3, y + 3, 10, 10);
    },

    drawBrick(ctx, x, y, theme) {
        const palettes = {
            overworld: ['#C84C0C', '#E45C10', '#DC9464'],
            underground: ['#3060A0', '#5888C8', '#7CACDC'],
            castle: ['#585858', '#787878', '#989898'],
            boss: ['#482868', '#6840A0', '#8868C0'],
        };
        const [base, light, accent] = palettes[theme] || palettes.overworld;
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = base;
        ctx.fillRect(x + 1, y + 1, 14, 6);
        ctx.fillRect(x + 1, y + 9, 14, 6);
        ctx.fillStyle = light;
        ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillRect(x + 9, y + 1, 6, 6);
        ctx.fillRect(x + 5, y + 9, 6, 6);
        ctx.fillRect(x + 13, y + 9, 2, 6);
        ctx.fillStyle = accent;
        ctx.fillRect(x + 1, y + 9, 3, 6);
    },

    drawGround(ctx, x, y, theme) {
        const palettes = {
            overworld: ['#C84C0C', '#E45C10', '#AC7C00'],
            underground: ['#3060A0', '#5888C8', '#204880'],
            castle: ['#585858', '#787878', '#404040'],
            boss: ['#482868', '#6840A0', '#301848'],
        };
        const [base, light, dark] = palettes[theme] || palettes.overworld;
        ctx.fillStyle = base;
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = light;
        ctx.fillRect(x, y, 16, 2);
        ctx.fillRect(x, y, 2, 8);
        ctx.fillStyle = dark;
        ctx.fillRect(x + 2, y + 2, 12, 6);
        ctx.fillRect(x, y + 8, 6, 6);
        ctx.fillRect(x + 8, y + 8, 8, 6);
        ctx.fillStyle = base;
        ctx.fillRect(x + 6, y + 8, 2, 8);
        ctx.fillRect(x, y + 14, 16, 2);
    },

    drawPipeTop(ctx, x, y, theme) {
        const palettes = {
            overworld: ['#00A800', '#80D010', '#005800'],
            underground: ['#4070B0', '#70A0D8', '#284878'],
            castle: ['#686868', '#909090', '#404040'],
            boss: ['#583088', '#8050C0', '#381860'],
        };
        const [base, light, dark] = palettes[theme] || palettes.overworld;
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 32, 16);
        ctx.fillStyle = base;
        ctx.fillRect(x + 1, y + 1, 30, 14);
        ctx.fillStyle = light;
        ctx.fillRect(x + 2, y + 1, 5, 14);
        ctx.fillRect(x + 8, y + 1, 2, 14);
        ctx.fillStyle = dark;
        ctx.fillRect(x + 25, y + 1, 5, 14);
    },

    drawPipeBody(ctx, x, y, theme) {
        const palettes = {
            overworld: ['#00A800', '#80D010', '#005800'],
            underground: ['#4070B0', '#70A0D8', '#284878'],
            castle: ['#686868', '#909090', '#404040'],
            boss: ['#583088', '#8050C0', '#381860'],
        };
        const [base, light, dark] = palettes[theme] || palettes.overworld;
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2, y, 28, 16);
        ctx.fillStyle = base;
        ctx.fillRect(x + 3, y, 26, 16);
        ctx.fillStyle = light;
        ctx.fillRect(x + 4, y, 5, 16);
        ctx.fillRect(x + 10, y, 2, 16);
        ctx.fillStyle = dark;
        ctx.fillRect(x + 23, y, 5, 16);
    },

    drawMushroom(ctx, x, y) {
        // Smaller mushroom (12x13, offset +2 to center in 16px tile)
        const ox = x + 2, oy = y + 3;
        // Cap
        ctx.fillStyle = '#E40228';
        ctx.fillRect(ox + 1, oy, 10, 1);
        ctx.fillRect(ox, oy + 1, 12, 4);
        // White spots on cap
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(ox + 2, oy + 1, 2, 3);
        ctx.fillRect(ox + 8, oy + 1, 2, 3);
        ctx.fillRect(ox + 5, oy + 3, 2, 2);
        // Cap outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(ox + 1, oy - 1, 10, 1);
        ctx.fillRect(ox - 1, oy, 1, 1); ctx.fillRect(ox + 12, oy, 1, 1);
        // Stem
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(ox + 2, oy + 5, 8, 6);
        ctx.fillStyle = '#FCA044';
        ctx.fillRect(ox + 2, oy + 5, 2, 6);
        ctx.fillRect(ox + 8, oy + 5, 2, 6);
        // Stem outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(ox + 1, oy + 5, 1, 6); ctx.fillRect(ox + 10, oy + 5, 1, 6);
        ctx.fillRect(ox + 2, oy + 11, 8, 1);
    },

    drawCoin(ctx, x, y, frame) {
        const widths = [8, 6, 4, 6];
        const w = widths[frame % 4];
        const ox = x + (8 - w / 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(ox, y + 1, w, 14);
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(ox + 1, y + 2, w - 2, 12);
        ctx.fillStyle = '#E45C10';
        if (w >= 6) {
            ctx.fillRect(ox + 2, y + 4, w - 4, 8);
        }
    },

    drawDoor(ctx, x, y) {
        // Dark castle door
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2, y, 12, 16);
        // Door frame
        ctx.fillStyle = '#886848';
        ctx.fillRect(x, y, 2, 16);
        ctx.fillRect(x + 14, y, 2, 16);
        ctx.fillRect(x + 2, y, 12, 2);
        // Door handle
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(x + 11, y + 8, 2, 2);
    },

    drawGoldBlock(ctx, x, y) {
        // Solid gold block
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(x, y, 16, 16);
        // Bevel/Shine
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x, y, 16, 2);
        ctx.fillRect(x, y, 2, 16);
        ctx.fillStyle = '#E45C10';
        ctx.fillRect(x + 14, y, 2, 16);
        ctx.fillRect(x, y + 14, 16, 2);
        // Inner detail
        ctx.fillStyle = '#E4A264';
        ctx.fillRect(x + 4, y + 4, 8, 8);
    },

    drawFlag(ctx, x, y) {
        ctx.fillStyle = '#00A800';
        ctx.fillRect(x - 14, y, 14, 8);
        ctx.fillStyle = '#80D010';
        ctx.fillRect(x - 12, y + 2, 10, 4);
    },

    drawFlagPole(ctx, x, y, height) {
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x, y, 2, height);
        ctx.fillStyle = '#00A800';
        ctx.fillRect(x - 3, y - 5, 8, 8);
        ctx.fillStyle = '#80D010';
        ctx.fillRect(x - 2, y - 4, 6, 6);
    },

    drawCloud(ctx, x, y, size) {
        ctx.fillStyle = '#FCFCFC';
        for (let i = 0; i < size; i++) {
            ctx.fillRect(x + i * 16 + 4, y, 8, 16);
            ctx.fillRect(x + i * 16, y + 4, 16, 8);
        }
        ctx.fillRect(x + 4, y - 4, (size - 1) * 16 + 8, 4);
    },

    drawHill(ctx, x, y, size) {
        ctx.fillStyle = '#80D010';
        const w = size * 32, h = size * 16;
        for (let row = 0; row < h; row++) {
            const ratio = row / h;
            const width = w * (1 - ratio * 0.6);
            ctx.fillRect(x + (w - width) / 2, y + h - row, width, 1);
        }
        ctx.fillStyle = '#00A800';
        for (let row = 0; row < h * 0.3; row++) {
            const ratio = row / h;
            const width = w * (1 - ratio * 0.6) * 0.9;
            ctx.fillRect(x + (w - width) / 2, y + h - row, width, 1);
        }
    },

    drawBush(ctx, x, y, size) {
        // NES-accurate bush: rounded bumps sitting flush on ground
        // Each segment is 16px wide, drawn as pixel-art rounded shapes
        const baseY = y + 16; // bottom aligns with top of ground tile

        for (let i = 0; i < size; i++) {
            const bx = x + i * 16;
            // Darkest outline layer
            ctx.fillStyle = '#005800';
            ctx.fillRect(bx + 2, baseY - 14, 12, 2);
            ctx.fillRect(bx, baseY - 12, 16, 2);
            ctx.fillRect(bx - 1, baseY - 10, 18, 10);

            // Main green body
            ctx.fillStyle = '#00A800';
            ctx.fillRect(bx + 3, baseY - 13, 10, 1);
            ctx.fillRect(bx + 1, baseY - 12, 14, 2);
            ctx.fillRect(bx, baseY - 10, 16, 9);

            // Light green highlight (upper portion)
            ctx.fillStyle = '#80D010';
            ctx.fillRect(bx + 4, baseY - 12, 8, 1);
            ctx.fillRect(bx + 2, baseY - 11, 10, 2);
            ctx.fillRect(bx + 1, baseY - 9, 10, 3);
            ctx.fillRect(bx + 2, baseY - 6, 6, 2);

            // Brightest spot
            ctx.fillStyle = '#B8F818';
            ctx.fillRect(bx + 5, baseY - 11, 4, 1);
            ctx.fillRect(bx + 3, baseY - 10, 5, 2);
            ctx.fillRect(bx + 4, baseY - 8, 3, 1);
        }

        // Fill seams between segments
        if (size > 1) {
            ctx.fillStyle = '#00A800';
            for (let i = 0; i < size - 1; i++) {
                ctx.fillRect(x + i * 16 + 15, baseY - 10, 2, 8);
            }
            ctx.fillStyle = '#005800';
            for (let i = 0; i < size - 1; i++) {
                ctx.fillRect(x + i * 16 + 15, baseY - 2, 2, 2);
            }
        }
    },

    drawCastle(ctx, x, y) {
        ctx.fillStyle = '#886848';
        ctx.fillRect(x, y + 16, 80, 64);
        ctx.fillStyle = '#AC7C00';
        ctx.fillRect(x + 2, y + 18, 76, 60);
        // Battlements
        ctx.fillStyle = '#886848';
        ctx.fillRect(x + 4, y + 8, 8, 8); ctx.fillRect(x + 20, y + 8, 8, 8);
        ctx.fillRect(x + 52, y + 8, 8, 8); ctx.fillRect(x + 68, y + 8, 8, 8);
        // Tower
        ctx.fillRect(x + 24, y - 16, 32, 32);
        ctx.fillStyle = '#AC7C00';
        ctx.fillRect(x + 26, y - 14, 28, 28);
        ctx.fillRect(x + 32, y - 28, 16, 14);
        // Windows
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 16, y + 32, 12, 16);
        ctx.fillRect(x + 52, y + 32, 12, 16);
        // Door
        ctx.fillRect(x + 28, y + 48, 24, 32);
        ctx.fillStyle = '#E40228';
        ctx.fillRect(x + 28, y + 44, 24, 4);
        // Tower window
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 36, y - 8, 8, 12);
    },

    drawTrophy(ctx, x, y) {
        // Gold trophy cup
        ctx.fillStyle = '#F8D878'; // Gold
        ctx.fillRect(x + 4, y + 2, 8, 4); // Bowl top
        ctx.fillRect(x + 5, y + 6, 6, 3); // Bowl bottom
        ctx.fillRect(x + 7, y + 9, 2, 3); // Stem
        ctx.fillRect(x + 5, y + 12, 6, 2); // Base

        ctx.fillStyle = '#E45C10'; // Dark gold/shadow
        ctx.fillRect(x + 4, y + 2, 1, 4);
        ctx.fillRect(x + 11, y + 2, 1, 4);
        ctx.fillRect(x + 5, y + 8, 6, 1);
        ctx.fillRect(x + 6, y + 13, 4, 1);

        // Handles
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(x + 2, y + 3, 2, 3);
        ctx.fillRect(x + 12, y + 3, 2, 3);

        // Shine
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x + 6, y + 3, 2, 2);
    },

    drawStar(ctx, x, y, frame) {
        const colors = ['#F8D878', '#FCFCFC', '#F8D878', '#E45C10'];
        ctx.fillStyle = colors[frame % 4];
        ctx.fillRect(x + 6, y + 0, 4, 2);
        ctx.fillRect(x + 4, y + 2, 8, 2);
        ctx.fillRect(x + 0, y + 4, 16, 4);
        ctx.fillRect(x + 2, y + 8, 12, 4);
        ctx.fillRect(x + 4, y + 12, 3, 2);
        ctx.fillRect(x + 9, y + 12, 3, 2);
        // Star outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 5, y, 1, 1); ctx.fillRect(x + 10, y, 1, 1);
        ctx.fillRect(x + 3, y + 2, 1, 1); ctx.fillRect(x + 12, y + 2, 1, 1);
    },

    drawAxe(ctx, x, y, time) {
        const blink = Math.floor(time * 6) % 2;
        // Handle
        ctx.fillStyle = '#AC7C00';
        ctx.fillRect(x + 7, y + 4, 2, 12);
        // Blade
        ctx.fillStyle = blink ? '#FCFCFC' : '#D8D8D8';
        ctx.fillRect(x + 2, y + 2, 6, 4);
        ctx.fillRect(x + 1, y + 4, 7, 6);
        ctx.fillRect(x + 2, y + 10, 6, 2);
        // Edge highlight
        ctx.fillStyle = '#F8D878';
        ctx.fillRect(x + 1, y + 5, 1, 4);
    },

    drawStairBlock(ctx, x, y, theme) {
        const palettes = {
            overworld: ['#C84C0C', '#E45C10'],
            underground: ['#3060A0', '#5888C8'],
            castle: ['#585858', '#787878'],
            boss: ['#482868', '#6840A0'],
        };
        const [base, light] = palettes[theme] || palettes.overworld;
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = base;
        ctx.fillRect(x + 1, y + 1, 14, 14);
        ctx.fillStyle = light;
        ctx.fillRect(x + 1, y + 1, 6, 3);
        ctx.fillRect(x + 9, y + 1, 6, 3);
        ctx.fillRect(x + 1, y + 5, 14, 2);
        ctx.fillRect(x + 5, y + 8, 6, 3);
        ctx.fillRect(x + 1, y + 8, 3, 3);
        ctx.fillRect(x + 12, y + 8, 3, 3);
        ctx.fillRect(x + 1, y + 12, 14, 2);
    },

    drawFireFlower(ctx, x, y, frame) {
        // Animated fire flower - cycles colors
        const colors = [
            ['#E40228', '#F8D878', '#00A800'],
            ['#F8D878', '#E40228', '#80D010'],
            ['#FCFCFC', '#F8D878', '#00A800'],
            ['#E40228', '#FCFCFC', '#80D010'],
        ];
        const [petalC, centerC, stemC] = colors[frame % 4];
        // Stem
        ctx.fillStyle = stemC;
        ctx.fillRect(x + 6, y + 8, 4, 6);
        ctx.fillRect(x + 4, y + 12, 2, 2);
        ctx.fillRect(x + 10, y + 10, 2, 2);
        ctx.fillRect(x + 5, y + 14, 6, 2);
        // Petals
        ctx.fillStyle = petalC;
        ctx.fillRect(x + 4, y + 0, 8, 2);
        ctx.fillRect(x + 2, y + 2, 4, 4);
        ctx.fillRect(x + 10, y + 2, 4, 4);
        ctx.fillRect(x + 4, y + 6, 8, 2);
        // Center
        ctx.fillStyle = centerC;
        ctx.fillRect(x + 6, y + 2, 4, 4);
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 3, 1, 1);
        ctx.fillRect(x + 9, y + 3, 1, 1);
    },

    drawFireball(ctx, x, y, frame) {
        // Rotating fireball - 8x8 pixels
        const rot = frame % 4;
        ctx.fillStyle = '#F8D878'; // yellow core
        ctx.fillRect(x + 2, y + 2, 4, 4);
        ctx.fillStyle = '#E45C10'; // orange middle
        if (rot === 0) {
            ctx.fillRect(x + 1, y + 0, 6, 2);
            ctx.fillRect(x + 0, y + 2, 2, 4);
            ctx.fillRect(x + 6, y + 2, 2, 4);
            ctx.fillRect(x + 1, y + 6, 6, 2);
        } else if (rot === 1) {
            ctx.fillRect(x + 0, y + 0, 3, 3);
            ctx.fillRect(x + 5, y + 0, 3, 3);
            ctx.fillRect(x + 0, y + 5, 3, 3);
            ctx.fillRect(x + 5, y + 5, 3, 3);
        } else if (rot === 2) {
            ctx.fillRect(x + 1, y + 0, 6, 2);
            ctx.fillRect(x + 0, y + 2, 2, 4);
            ctx.fillRect(x + 6, y + 2, 2, 4);
            ctx.fillRect(x + 1, y + 6, 6, 2);
        } else {
            ctx.fillRect(x + 0, y + 0, 3, 3);
            ctx.fillRect(x + 5, y + 0, 3, 3);
            ctx.fillRect(x + 0, y + 5, 3, 3);
            ctx.fillRect(x + 5, y + 5, 3, 3);
        }
        ctx.fillStyle = '#E40228'; // red accents
        ctx.fillRect(x + 3, y + 3, 2, 2);
    },

    drawLava(ctx, x, y, time) {
        ctx.fillStyle = '#E40228'; // Red base
        ctx.fillRect(x, y, 16, 16);
        // Animated top surface
        const offset = Math.floor(time * 10) % 16;
        ctx.fillStyle = '#E45C10'; // Orange surface
        ctx.fillRect(x, y, 16, 4);
        // Bubbles
        if ((offset + x) % 5 === 0) {
            ctx.fillStyle = '#F8D878';
            ctx.fillRect(x + 4, y + 2, 2, 2);
        }
    },

    drawBoss(ctx, x, y, frame, phase, time) {
        phase = phase || 1;
        time = time || 0;

        // Phase-based color scheme
        let bodyColor, shellColor, bellyColor, eyeWhite, hornColor, legColor;
        if (phase === 3) {
            // ENRAGED: Pulsing red/dark, white-hot accents
            const pulse = Math.sin(time * 8) * 0.5 + 0.5;
            bodyColor = pulse > 0.5 ? '#C00000' : '#800000';
            shellColor = '#FF4400';
            bellyColor = '#FFAA00';
            eyeWhite = '#FF0000';
            hornColor = '#FFFF00';
            legColor = bodyColor;
        } else if (phase === 2) {
            // LAVA PHASE: Orange glow, magma dripping
            bodyColor = '#B05000';
            shellColor = '#FF6600';
            bellyColor = '#FFCC44';
            eyeWhite = '#FF8800';
            hornColor = '#FCFCFC';
            legColor = '#B05000';
        } else {
            // Normal
            bodyColor = '#00A800';
            shellColor = '#E45C10';
            bellyColor = '#F8D878';
            eyeWhite = '#FCFCFC';
            hornColor = '#FCFCFC';
            legColor = '#00A800';
        }

        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x + 4, y + 10, 20, 22);

        // Shell
        ctx.fillStyle = shellColor;
        ctx.fillRect(x + 6, y + 2, 12, 8);
        ctx.fillRect(x + 20, y + 12, 12, 16);

        // Shell spikes (Phase 3 gets extra spikes)
        ctx.fillStyle = '#FCFCFC';
        ctx.fillRect(x + 22, y + 10, 3, 2);
        ctx.fillRect(x + 26, y + 14, 3, 2);
        ctx.fillRect(x + 22, y + 20, 3, 2);
        if (phase === 3) {
            ctx.fillRect(x + 28, y + 10, 3, 2);
            ctx.fillRect(x + 28, y + 18, 3, 2);
        }

        // Belly/Muzzle
        ctx.fillStyle = bellyColor;
        ctx.fillRect(x + 0, y + 14, 8, 8);
        ctx.fillRect(x + 8, y + 18, 12, 10);

        // Eyes
        ctx.fillStyle = eyeWhite;
        ctx.fillRect(x + 10, y + 8, 4, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 12, y + 9, 2, 2);

        // Angry eyebrows (Phase 2 & 3)
        if (phase >= 2) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 9, y + 7, 6, 1);
        }

        // Horns
        ctx.fillStyle = hornColor;
        ctx.fillRect(x + 14, y + 2, 2, 4);
        if (phase === 3) {
            // Extra horn
            ctx.fillRect(x + 8, y + 0, 2, 4);
        }

        // Mouth - open and breathing fire in Phase 3
        if (phase === 3 && Math.floor(time * 6) % 3 === 0) {
            ctx.fillStyle = '#FF4400';
            ctx.fillRect(x - 4, y + 18, 6, 3);
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(x - 2, y + 19, 3, 1);
        }

        // Legs with animation
        ctx.fillStyle = legColor;
        if (frame === 0) {
            ctx.fillRect(x + 4, y + 28, 8, 4);
            ctx.fillRect(x + 16, y + 28, 8, 4);
        } else {
            ctx.fillRect(x + 4, y + 26, 8, 4);
            ctx.fillRect(x + 16, y + 26, 8, 4);
        }

        // Phase 2: Lava drip particles
        if (phase === 2) {
            ctx.fillStyle = '#FF6600';
            const dripOffset = Math.floor(time * 4) % 4;
            ctx.fillRect(x + 8, y + 30 + dripOffset, 2, 3);
            ctx.fillRect(x + 18, y + 28 + dripOffset, 2, 3);
        }

        // Phase 3: Aura glow
        if (phase === 3) {
            const auraAlpha = Math.sin(time * 6) * 0.3 + 0.3;
            ctx.fillStyle = `rgba(255, 0, 0, ${auraAlpha})`;
            ctx.fillRect(x - 2, y - 2, 36, 36);
        }
    },
};
