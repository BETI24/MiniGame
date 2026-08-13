import {
    AMMO,
    BACKPACK_CAPACITY,
    BOT_AI,
    COLORS,
    EQUIPMENT_VISUALS,
    HEALS,
    SCOPES,
    THROWABLES,
    WEAPONS,
    WORLD
} from './data.js';

const TAU = Math.PI * 2;

export class Renderer {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    }

    resize(width, height) {
        this.width = Math.max(1, Math.floor(width));
        this.height = Math.max(1, Math.floor(height));
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
    }

    render(now) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        this.drawWorld(now);
        this.drawHud(now);
        this.drawCrosshair();
    }

    worldToScreen(x, y) {
        const g = this.game;
        return {
            x: this.width / 2 + (x - g.camera.x) * g.camera.scale,
            y: this.height / 2 + (y - g.camera.y) * g.camera.scale
        };
    }

    screenToWorld(x, y) {
        const g = this.game;
        return {
            x: g.camera.x + (x - this.width / 2) / g.camera.scale,
            y: g.camera.y + (y - this.height / 2) / g.camera.scale
        };
    }

    drawWorld(now) {
        const ctx = this.ctx;
        const g = this.game;
        ctx.fillStyle = WORLD.background;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(g.camera.scale, g.camera.scale);
        ctx.translate(-g.camera.x, -g.camera.y);

        this.drawGrid(ctx);
        this.drawMapBoundary(ctx);
        this.drawHouses(ctx);
        this.drawContainerFloors(ctx);
        this.drawLoot(ctx);
        this.drawCrates(ctx);
        this.drawRareCrates(ctx);
        this.drawBarrels(ctx);
        this.drawRocks(ctx);
        this.drawTreeTrunks(ctx);
        this.drawThrowables(ctx);
        this.drawBullets(ctx);
        this.drawExplosions(ctx);
        this.drawBots(ctx, now);
        this.drawPlayer(ctx, now);
        this.drawParticles(ctx);
        this.drawHouseRoofs(ctx);
        this.drawContainerRoofs(ctx);
        this.drawTreeCanopies(ctx);

        ctx.restore();
    }

    drawGrid(ctx) {
        const g = this.game;
        const halfW = this.width / (2 * g.camera.scale);
        const halfH = this.height / (2 * g.camera.scale);
        const left = Math.max(0, g.camera.x - halfW - WORLD.gridSize);
        const right = Math.min(WORLD.width, g.camera.x + halfW + WORLD.gridSize);
        const top = Math.max(0, g.camera.y - halfH - WORLD.gridSize);
        const bottom = Math.min(WORLD.height, g.camera.y + halfH + WORLD.gridSize);

        ctx.strokeStyle = WORLD.grid;
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let x = Math.floor(left / WORLD.gridSize) * WORLD.gridSize; x <= right; x += WORLD.gridSize) {
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
        }
        for (let y = Math.floor(top / WORLD.gridSize) * WORLD.gridSize; y <= bottom; y += WORLD.gridSize) {
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
        }
        ctx.stroke();
    }

    drawMapBoundary(ctx) {
        ctx.strokeStyle = 'rgba(29, 54, 19, 0.4)';
        ctx.lineWidth = 10;
        ctx.strokeRect(4, 4, WORLD.width - 8, WORLD.height - 8);
    }

    drawHouses(ctx) {
        for (const house of this.game.houses) {
            this.drawHouseEntryPads(ctx, house);
            const reveal = this.game.getHouseRevealFactor(house);
            if (reveal <= 0.12) continue;

            const left = house.x - house.w / 2;
            const top = house.y - house.h / 2;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(left + 18, top + 20, house.w, house.h);
            ctx.fillStyle = COLORS.houseFloor;
            ctx.fillRect(left, top, house.w, house.h);

            ctx.fillStyle = COLORS.houseOuterWall;
            for (const wall of house.walls) if (wall.outer) ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
            ctx.fillStyle = COLORS.houseInnerWall;
            for (const wall of house.walls) if (wall.inner) ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

            for (const win of house.windows) {
                ctx.fillStyle = win.broken ? 'rgba(30,38,42,0.65)' : COLORS.houseWindow;
                ctx.fillRect(win.wx + 1, win.wy + 1, win.w - 2, win.h - 2);
                if (!win.broken) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                    ctx.lineWidth = 3;
                    if (win.vertical) {
                        ctx.beginPath();
                        ctx.moveTo(win.wx + win.w / 2, win.wy + 6);
                        ctx.lineTo(win.wx + win.w / 2, win.wy + win.h - 6);
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(win.wx + 6, win.wy + win.h / 2);
                        ctx.lineTo(win.wx + win.w - 6, win.wy + win.h / 2);
                        ctx.stroke();
                    }
                }
            }

            for (const door of house.doors) this.drawHouseDoor(ctx, door);

            for (const toilet of this.game.toilets) {
                if (toilet.houseId !== house.id || toilet.dead) continue;
                this.drawToilet(ctx, toilet);
            }
            ctx.restore();
        }
    }


    drawHouseDoor(ctx, door) {
        ctx.save();
        ctx.fillStyle = '#dedede';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 4;
        if (!door.open) {
            ctx.fillRect(door.wx, door.wy, door.w, door.h);
            ctx.strokeRect(door.wx, door.wy, door.w, door.h);
            ctx.restore();
            return;
        }

        if (door.vertical) {
            const hingeY = door.hinge === 'bottom' ? door.wy + door.h : door.wy;
            const hingeX = door.wx + door.w / 2;
            const angle = door.side === 'right' ? -Math.PI / 2 : Math.PI / 2;
            ctx.translate(hingeX, hingeY);
            ctx.rotate(angle);
            const y = door.hinge === 'bottom' ? -door.h : 0;
            ctx.fillRect(-door.w / 2, y, door.w, door.h);
            ctx.strokeRect(-door.w / 2, y, door.w, door.h);
        } else {
            const hingeX = door.hinge === 'right' ? door.wx + door.w : door.wx;
            const hingeY = door.wy + door.h / 2;
            const angle = door.hinge === 'right' ? Math.PI / 2 : -Math.PI / 2;
            ctx.translate(hingeX, hingeY);
            ctx.rotate(angle);
            const x = door.hinge === 'right' ? -door.w : 0;
            ctx.fillRect(x, -door.h / 2, door.w, door.h);
            ctx.strokeRect(x, -door.h / 2, door.w, door.h);
        }
        ctx.restore();
    }

    drawHouseEntryPads(ctx, house) {
        const pads = house.doors.filter(d => d.exterior);
        ctx.save();
        for (const door of pads) {
            const px = door.side === 'right' ? door.wx + 18 : door.wx - 112;
            const py = door.wy - 34;
            const pw = 112;
            const ph = door.h + 68;
            ctx.fillStyle = COLORS.houseStone;
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = 'rgba(100,100,100,0.38)';
            ctx.lineWidth = 2;
            for (let y = py + 18; y < py + ph; y += 24) {
                ctx.beginPath();
                ctx.moveTo(px, y);
                ctx.lineTo(px + pw, y);
                ctx.stroke();
            }
            for (let row = 0, y = py; y < py + ph; y += 24, row++) {
                const offset = row % 2 ? 14 : 0;
                for (let x = px + offset; x < px + pw; x += 28) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, Math.min(py + ph, y + 24));
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }

    drawHouseRoofs(ctx) {
        for (const house of this.game.houses) {
            const reveal = this.game.getHouseRevealFactor(house);
            if (reveal > 0.12) continue;
            const left = house.x - house.w / 2;
            const top = house.y - house.h / 2;
            const w = house.w;
            const h = house.h;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(left + 18, top + 20, w, h);
            ctx.fillStyle = COLORS.houseRoof;
            ctx.fillRect(left, top, w, h);
            ctx.fillStyle = COLORS.houseRoofDark;
            for (let x = left + 18; x < left + w - 18; x += 56) ctx.fillRect(x, top + 10, 5, h - 20);
            ctx.strokeStyle = '#050505';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(left, top); ctx.lineTo(left + w / 2, top + h * 0.42); ctx.lineTo(left + w, top);
            ctx.moveTo(left + w / 2, top + h * 0.42); ctx.lineTo(left + w / 2, top + h);
            ctx.stroke();
            ctx.fillStyle = '#c1a58a';
            ctx.fillRect(left + w * 0.42, top + h * 0.46, 120, 170);
            ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
            ctx.strokeRect(left + w * 0.42, top + h * 0.46, 120, 170);
            ctx.fillStyle = 'rgba(255,255,255,0.16)';
            ctx.fillRect(left + w * 0.44, top + h * 0.49, 18, 150);
            ctx.fillRect(left + w * 0.51, top + h * 0.49, 18, 150);
            for (const win of house.windows) {
                ctx.fillStyle = win.broken ? '#24342f' : COLORS.houseWindow;
                ctx.fillRect(win.wx - (win.vertical ? 5 : 0), win.wy - (win.vertical ? 0 : 5), win.w + (win.vertical ? 10 : 0), win.h + (win.vertical ? 0 : 10));
                ctx.strokeStyle = '#111';
                ctx.lineWidth = 3;
                ctx.strokeRect(win.wx - (win.vertical ? 5 : 0), win.wy - (win.vertical ? 0 : 5), win.w + (win.vertical ? 10 : 0), win.h + (win.vertical ? 0 : 10));
            }
            for (const door of house.doors.filter(d => d.exterior)) {
                ctx.fillStyle = '#141a10';
                if (door.side === 'right') ctx.fillRect(left + w - 8, door.wy - 10, 20, door.h + 20);
                else if (door.side === 'left') ctx.fillRect(left - 12, door.wy - 10, 20, door.h + 20);
                ctx.fillStyle = '#d8d8d8';
                if (door.side === 'right') ctx.fillRect(left + w - 3, door.wy + 5, 28, door.h - 10);
                else if (door.side === 'left') ctx.fillRect(left - 25, door.wy + 5, 28, door.h - 10);
            }
            ctx.restore();
        }
    }

    drawToilet(ctx, toilet) {
        const r = toilet.r * toilet.scale;
        ctx.save();
        ctx.translate(toilet.x, toilet.y);
        ctx.fillStyle = '#d9d9d9';
        this.roundRect(ctx, -r * 0.62, -r * 0.90, r * 1.24, r * 0.70, 10);
        ctx.fill();
        ctx.fillStyle = '#f1f1f1';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.56, r * 0.44, r * 0.30, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#a2a2a2';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.56, r * 0.16, r * 0.11, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ececec';
        this.roundRect(ctx, -r * 0.42, -r * 0.16, r * 0.84, r * 0.74, 11);
        ctx.fill();
        ctx.restore();
    }

    drawContainerFloors(ctx) {
        for (const c of this.game.containers) {
            ctx.save();
            ctx.translate(c.x, c.y);

            ctx.fillStyle = 'rgba(0,0,0,0.14)';
            ctx.fillRect(-c.w / 2 + 14, -c.h / 2 + 16, c.w, c.h);

            // Einfarbiger Innenboden. Das Dach bekommt sein Muster separat.
            ctx.fillStyle = COLORS.containerFloor;
            this.roundRect(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 2);
            ctx.fill();

            ctx.fillStyle = COLORS.containerWall;
            const thick = 13;
            const opening = 94;
            const seg = (c.h - opening) / 2;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, thick);
            ctx.fillRect(-c.w / 2, c.h / 2 - thick, c.w, thick);

            if (c.opening === 'left') {
                ctx.fillRect(-c.w / 2, -c.h / 2, thick, seg);
                ctx.fillRect(-c.w / 2, c.h / 2 - seg, thick, seg);
                ctx.fillRect(c.w / 2 - thick, -c.h / 2, thick, c.h);
                ctx.fillStyle = WORLD.background;
                ctx.fillRect(-c.w / 2 - 8, -opening / 2, 14, opening);
            } else {
                ctx.fillRect(c.w / 2 - thick, -c.h / 2, thick, seg);
                ctx.fillRect(c.w / 2 - thick, c.h / 2 - seg, thick, seg);
                ctx.fillRect(-c.w / 2, -c.h / 2, thick, c.h);
                ctx.fillStyle = WORLD.background;
                ctx.fillRect(c.w / 2 - 6, -opening / 2, 14, opening);
            }
            ctx.restore();
        }
    }

    drawContainerRoofs(ctx) {
        for (const c of this.game.containers) {
            const reveal = this.game.getContainerRevealFactor(c);
            if (reveal > 0.12) continue;
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.fillStyle = COLORS.containerShadow;
            ctx.fillRect(-c.w / 2 + 18, -c.h / 2 + 20, c.w, c.h);
            ctx.fillStyle = COLORS.containerRoof;
            this.roundRect(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 2);
            ctx.fill();
            ctx.fillStyle = '#182531';
            ctx.fillRect(-c.w / 2 + 10, -c.h / 2 + 10, c.w - 20, c.h - 20);
            ctx.fillStyle = COLORS.containerPanel;
            for (let x = -c.w / 2 + 25; x < c.w / 2 - 18; x += 45) ctx.fillRect(x, -c.h / 2 + 12, 10, c.h - 24);
            ctx.strokeStyle = '#071017';
            ctx.lineWidth = 8;
            this.roundRect(ctx, -c.w / 2 + 4, -c.h / 2 + 4, c.w - 8, c.h - 8, 2);
            ctx.stroke();
            this.drawContainerOpeningMarker(ctx, c);
            ctx.restore();
        }
    }

    drawContainerOpeningMarker(ctx, c) {
        ctx.save();
        ctx.fillStyle = WORLD.background;
        if (c.opening === 'left') {
            ctx.fillRect(-c.w / 2 - 2, -46, 18, 92);
            ctx.fillStyle = '#0d1820';
            ctx.beginPath();
            ctx.moveTo(-c.w / 2 + 10, -46);
            ctx.lineTo(-c.w / 2 + 22, -34);
            ctx.lineTo(-c.w / 2 + 22, 34);
            ctx.lineTo(-c.w / 2 + 10, 46);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(c.w / 2 - 16, -46, 18, 92);
            ctx.fillStyle = '#0d1820';
            ctx.beginPath();
            ctx.moveTo(c.w / 2 - 10, -46);
            ctx.lineTo(c.w / 2 - 22, -34);
            ctx.lineTo(c.w / 2 - 22, 34);
            ctx.lineTo(c.w / 2 - 10, 46);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    drawRareCrates(ctx) {
        for (const crate of this.game.rareCrates) {
            if (crate.dead) continue;
            const size = 90 * crate.scale;
            ctx.save();
            ctx.translate(crate.x, crate.y);
            ctx.rotate(crate.rotation || 0);
            ctx.fillStyle = '#171819';
            this.roundRect(ctx, -size / 2 - 5, -size / 2 - 5, size + 10, size + 10, 7);
            ctx.fill();
            ctx.fillStyle = '#52574f';
            this.roundRect(ctx, -size / 2, -size / 2, size, size, 6);
            ctx.fill();
            ctx.strokeStyle = '#d7a62f';
            ctx.lineWidth = 7;
            this.roundRect(ctx, -size * 0.39, -size * 0.39, size * 0.78, size * 0.78, 4);
            ctx.stroke();
            ctx.fillStyle = '#2b2e2a';
            ctx.fillRect(-size * 0.27, -size * 0.10, size * 0.54, size * 0.20);
            ctx.fillRect(-size * 0.10, -size * 0.27, size * 0.20, size * 0.54);
            ctx.fillStyle = '#f1c34e';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.10, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }

    drawBarrels(ctx) {
        for (const barrel of this.game.barrels) {
            if (barrel.dead) continue;
            const r = barrel.r * barrel.scale;
            ctx.save();
            ctx.translate(barrel.x, barrel.y);
            ctx.fillStyle = '#202428';
            ctx.beginPath();
            ctx.arc(0, 0, r + 5, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#52656b';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#171a1c';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.70, 0, TAU);
            ctx.stroke();
            ctx.strokeStyle = '#d29c2c';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.45, -0.8, 0.8);
            ctx.stroke();
            ctx.fillStyle = '#25282a';
            ctx.beginPath();
            ctx.arc(-r * 0.28, -r * 0.22, 4.5, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }

    drawCrates(ctx) {
        for (const crate of this.game.crates) {
            if (crate.dead) continue;
            const size = 76 * crate.scale;
            ctx.save();
            ctx.translate(crate.x, crate.y);
            ctx.rotate(crate.rotation || 0);
            ctx.fillStyle = COLORS.crateDark;
            this.roundRect(ctx, -size / 2 - 4, -size / 2 - 4, size + 8, size + 8, 4);
            ctx.fill();
            ctx.fillStyle = COLORS.crate;
            this.roundRect(ctx, -size / 2, -size / 2, size, size, 4);
            ctx.fill();
            ctx.fillStyle = COLORS.crateMid;
            ctx.fillRect(-size * 0.36, -size * 0.40, size * 0.72, size * 0.19);
            ctx.fillRect(-size * 0.36, -size * 0.10, size * 0.72, size * 0.19);
            ctx.fillRect(-size * 0.36, size * 0.20, size * 0.72, size * 0.19);
            ctx.strokeStyle = '#714613';
            ctx.lineWidth = Math.max(3, 5 * crate.scale);
            ctx.beginPath();
            ctx.moveTo(-size * 0.26, -size * 0.26);
            ctx.lineTo(size * 0.26, size * 0.26);
            ctx.moveTo(size * 0.26, -size * 0.26);
            ctx.lineTo(-size * 0.26, size * 0.26);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawRocks(ctx) {
        for (const rock of this.game.rocks) {
            if (rock.dead) continue;
            const r = rock.r * rock.scale;
            ctx.save();
            ctx.translate(rock.x, rock.y);
            ctx.fillStyle = COLORS.rockEdge;
            this.rockBlob(ctx, r + 7);
            ctx.fill();
            ctx.fillStyle = COLORS.rock;
            this.rockBlob(ctx, r);
            ctx.fill();
            ctx.fillStyle = COLORS.rockDark;
            ctx.beginPath();
            ctx.arc(-r * 0.22, -r * 0.15, r * 0.30, 0, TAU);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.42)';
            ctx.beginPath();
            ctx.arc(r * 0.22, -r * 0.22, r * 0.28, 0, TAU);
            ctx.fill();
            if (r > 50) {
                ctx.fillStyle = COLORS.rockDot;
                ctx.beginPath();
                ctx.arc(-r * 0.44, -r * 0.12, 6, 0, TAU);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    rockBlob(ctx, radius) {
        ctx.beginPath();
        for (let i = 0; i <= 18; i++) {
            const a = (i / 18) * TAU;
            const wobble = 1 + Math.sin(i * 2.4 + radius) * 0.05 + Math.cos(i * 1.7) * 0.08;
            const r = radius * wobble;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    drawTreeTrunks(ctx) {
        for (const tree of this.game.trees) {
            if (tree.dead) continue;
            ctx.save();
            ctx.translate(tree.x, tree.y);
            ctx.fillStyle = '#151515';
            this.treeBlob(ctx, tree.trunk * tree.scale + 9, 10, 0.09);
            ctx.fill();
            ctx.fillStyle = COLORS.treeTrunk;
            this.treeBlob(ctx, tree.trunk * tree.scale, 10, 0.08);
            ctx.fill();
            ctx.fillStyle = COLORS.treeTrunkInner;
            ctx.beginPath();
            ctx.arc(0, 0, tree.trunk * tree.scale * 0.70, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }

    drawTreeCanopies(ctx) {
        const player = this.game.player;
        for (const tree of this.game.trees) {
            if (tree.dead) continue;
            const dx = player.x - tree.x;
            const dy = player.y - tree.y;
            const under = dx * dx + dy * dy < (tree.r * tree.scale * 0.84) ** 2;
            const r = tree.r * tree.scale;
            ctx.save();
            ctx.translate(tree.x, tree.y);
            ctx.globalAlpha = under ? 0.70 : 0.94;
            ctx.fillStyle = COLORS.treeLeavesShadow;
            this.treeBlob(ctx, r + 7, 18, 0.085);
            ctx.fill();
            ctx.fillStyle = COLORS.treeLeavesDark;
            this.treeBlob(ctx, r + 3, 18, 0.075);
            ctx.fill();
            ctx.fillStyle = COLORS.treeLeaves;
            this.treeBlob(ctx, r, 18, 0.07);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    treeBlob(ctx, radius, lobes, variance) {
        ctx.beginPath();
        for (let i = 0; i <= lobes; i++) {
            const a = (i / lobes) * TAU;
            const wobble = 1 + Math.sin(i * 2.73 + radius) * variance + Math.cos(i * 4.12) * variance * 0.55;
            const r = radius * wobble;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    drawLoot(ctx) {
        for (const item of this.game.loot) {
            if (item.removed || !this.game.isLootVisible(item)) continue;
            if (item.kind === 'ammo') this.drawAmmoLoot(ctx, item);
            else this.drawCircularLoot(ctx, item);
        }
    }

    drawAmmoLoot(ctx, item) {
        const size = 31;
        const bob = Math.sin(item.pulse) * 2;
        ctx.save();
        ctx.translate(item.x, item.y + bob);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#2e2a1f';
        ctx.fillRect(-size / 2 - 4, -size / 2 - 4, size + 8, size + 8);
        ctx.fillStyle = AMMO[item.subtype].color;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.fillStyle = 'rgba(255,255,255,0.24)';
        ctx.fillRect(-size / 2 + 5, -size / 2 + 5, size * 0.36, size * 0.36);
        ctx.restore();
    }

    drawCircularLoot(ctx, item) {
        let border = '#171717';
        if (item.kind === 'weapon') border = AMMO[WEAPONS[item.subtype].ammo].color;
        if (item.kind === 'throwable') border = '#8c8c8c';

        const bob = Math.sin(item.pulse) * 2;
        ctx.save();
        ctx.translate(item.x, item.y + bob);
        ctx.fillStyle = 'rgba(150, 150, 150, 0.18)';
        ctx.strokeStyle = border;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, TAU);
        ctx.fill();
        ctx.stroke();

        if (item.kind === 'weapon') this.drawGroundWeaponIcon(ctx, item.subtype);
        if (item.kind === 'equipment') this.drawEquipmentIcon(ctx, item.subtype, item.level);
        if (item.kind === 'heal') this.drawHealIcon(ctx, item.subtype);
        if (item.kind === 'scope') this.drawScopeLootIcon(ctx, item.subtype);
        if (item.kind === 'throwable') this.drawFragIcon(ctx, 1.05);
        ctx.restore();
    }

    drawGroundWeaponIcon(ctx, weaponId) {
        const def = WEAPONS[weaponId];
        if (!def) return;
        ctx.save();
        ctx.rotate(-0.30);
        const scale = def.barrel >= 60 ? 0.76 : def.barrel >= 50 ? 0.82 : 0.90;
        ctx.translate(-def.barrel * scale * 0.48, 0);
        this.drawWeaponSprite(ctx, weaponId, scale, true);
        ctx.restore();
    }

    drawEquipmentIcon(ctx, type, level) {
        ctx.save();
        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#dfe4e6';
        if (type === 'helmet') {
            ctx.beginPath();
            ctx.arc(0, 1, 17, Math.PI, TAU);
            ctx.lineTo(16, 10);
            ctx.lineTo(-16, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (type === 'vest') {
            ctx.beginPath();
            ctx.moveTo(-16, -16);
            ctx.lineTo(-7, -21);
            ctx.lineTo(-2, -10);
            ctx.lineTo(2, -10);
            ctx.lineTo(7, -21);
            ctx.lineTo(16, -16);
            ctx.lineTo(18, 18);
            ctx.lineTo(-18, 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            this.roundRect(ctx, -16, -17, 32, 34, 5);
            ctx.fill();
            ctx.stroke();
            ctx.strokeRect(-8, -9, 16, 11);
        }
        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`L${level}`, 0, 31);
        ctx.restore();
    }

    drawHealIcon(ctx, subtype) {
        ctx.save();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 4;
        if (subtype === 'bandage') {
            ctx.fillStyle = '#ecefe9';
            ctx.rotate(-0.55);
            this.roundRect(ctx, -24, -8, 48, 16, 7);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#c8cfca';
            ctx.fillRect(-7, -7, 14, 14);
        } else if (subtype === 'medkit') {
            ctx.fillStyle = '#ecefe9';
            this.roundRect(ctx, -18, -18, 36, 36, 6);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#59a95f';
            ctx.fillRect(-4, -12, 8, 24);
            ctx.fillRect(-12, -4, 24, 8);
        } else if (subtype === 'soda') {
            ctx.fillStyle = '#86b1ab';
            ctx.fillRect(-10, -22, 20, 44);
            ctx.strokeRect(-10, -22, 20, 44);
            ctx.fillStyle = '#ecebe3';
            ctx.fillRect(-9, -5, 18, 10);
        } else {
            ctx.fillStyle = '#dadbcd';
            ctx.beginPath(); ctx.arc(-7, 0, 9, 0, TAU); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(7, 0, 9, 0, TAU); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }

    drawScopeLootIcon(ctx, scope) {
        ctx.save();
        ctx.fillStyle = '#efefef';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${scope}x`, 0, 1);
        ctx.restore();
    }

    drawFragIcon(ctx, scale = 1) {
        ctx.save();
        ctx.scale(scale, scale);
        ctx.fillStyle = '#666b71';
        ctx.strokeStyle = '#1e1f22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 4, 10, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#3b3d41';
        ctx.fillRect(-3, -8, 6, 8);
        ctx.fillStyle = '#9ca1a7';
        ctx.fillRect(-1, -12, 10, 5);
        ctx.beginPath();
        ctx.arc(10, -10, 5, 0, TAU);
        ctx.fill();
        ctx.restore();
    }

    drawBullets(ctx) {
        ctx.lineCap = 'round';
        for (const b of this.game.bullets) {
            const speed = Math.hypot(b.vx, b.vy) || 1;
            const nx = b.vx / speed;
            const ny = b.vy / speed;
            const tail = 78;
            const midX = b.x - nx * tail * 0.55;
            const midY = b.y - ny * tail * 0.55;
            ctx.strokeStyle = 'rgba(80,80,80,0.18)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(b.x - nx * tail, b.y - ny * tail);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.96)';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(b.x - nx * tail, b.y - ny * tail);
            ctx.lineTo(midX, midY);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(b.x, b.y, 1.9, 0, TAU);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
    }

    drawThrowables(ctx) {
        for (const g of this.game.throwables) {
            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate(g.rotation);
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.beginPath();
            ctx.ellipse(0, 10, 12, 7, 0, 0, TAU);
            ctx.fill();
            this.drawFragIcon(ctx, 0.95);
            ctx.restore();
        }
    }

    drawExplosions(ctx) {
        for (const e of this.game.explosions) {
            const t = 1 - e.life / e.maxLife;
            const radius = e.radius * (0.25 + t * 0.75);
            ctx.save();
            ctx.globalAlpha = 0.5 * (1 - t);
            ctx.fillStyle = '#f4c96b';
            ctx.beginPath();
            ctx.arc(e.x, e.y, radius, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 0.8 * (1 - t);
            ctx.strokeStyle = '#f9e7a1';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(e.x, e.y, radius * 0.86, 0, TAU);
            ctx.stroke();
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }


    drawBots(ctx, now) {
        for (const bot of this.game.bots) {
            if (bot.dead) continue;
            ctx.save();
            ctx.translate(bot.x, bot.y);
            ctx.rotate(bot.aimAngle);

            if (bot.equipment.backpack) this.drawBackpack(ctx, bot.equipment.backpack, bot.radius);
            const vestColor = EQUIPMENT_VISUALS.vest[bot.equipment.vest]?.color || COLORS.playerOutline;
            ctx.fillStyle = vestColor;
            ctx.beginPath();
            ctx.arc(0, 0, bot.radius + 4, 0, TAU);
            ctx.fill();

            ctx.fillStyle = BOT_AI.botColor;
            ctx.strokeStyle = COLORS.playerOutline;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, bot.radius, 0, TAU);
            ctx.fill();
            ctx.stroke();

            if (bot.equipment.helmet) this.drawHelmet(ctx, bot.equipment.helmet, bot.radius);
            if (bot.weapon) {
                ctx.save();
                ctx.translate(16, 0);
                this.drawWeaponSprite(ctx, bot.weapon.id, 1, false);
                ctx.restore();
            }
            this.drawBotHand(ctx, 28, -18);
            this.drawBotHand(ctx, 28, 18);
            ctx.restore();

            if (bot.health < bot.maxHealth) {
                ctx.save();
                ctx.fillStyle = 'rgba(34,42,29,0.78)';
                this.roundRect(ctx, bot.x - 32, bot.y - 54, 64, 8, 3);
                ctx.fill();
                ctx.fillStyle = '#ef8585';
                this.roundRect(ctx, bot.x - 31, bot.y - 53, 62 * (bot.health / bot.maxHealth), 6, 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    drawBotHand(ctx, x, y) {
        ctx.fillStyle = BOT_AI.botColor;
        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, TAU);
        ctx.fill();
        ctx.stroke();
    }

    drawPlayer(ctx, now) {
        const p = this.game.player;
        if (p.dead) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.aimAngle);

        const punch = Math.max(0, 1 - (now - p.lastPunchAt) / 180);
        const active = this.game.getActiveWeapon();
        const handForward = active ? 28 : 20 + punch * 20;

        if (p.equipment.backpack) this.drawBackpack(ctx, p.equipment.backpack, p.radius);

        const vestColor = EQUIPMENT_VISUALS.vest[p.equipment.vest]?.color || COLORS.playerOutline;
        ctx.fillStyle = vestColor;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 4, 0, TAU);
        ctx.fill();

        ctx.fillStyle = COLORS.player;
        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, TAU);
        ctx.fill();
        ctx.stroke();

        if (p.equipment.helmet) this.drawHelmet(ctx, p.equipment.helmet, p.radius);

        if (active) {
            ctx.save();
            ctx.translate(16, 0);
            this.drawWeaponSprite(ctx, active.id, 1, false);
            ctx.restore();
        } else if (p.activeSlot === 3 && p.throwables.frag > 0) {
            ctx.save();
            ctx.translate(18, 0);
            this.drawFragIcon(ctx, 1);
            ctx.restore();
        }

        this.drawHand(ctx, handForward, -18);
        this.drawHand(ctx, active || p.activeSlot === 3 ? 28 : handForward, 18);
        ctx.restore();
    }

    drawBackpack(ctx, level, radius) {
        const bp = EQUIPMENT_VISUALS.backpack[level];
        if (!bp) return;
        ctx.save();
        ctx.translate(-radius * 0.84, 0);
        ctx.fillStyle = bp.color;
        ctx.strokeStyle = '#2b2218';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius * bp.size, Math.PI * 0.52, Math.PI * 1.48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawHelmet(ctx, level, radius) {
        const helmet = EQUIPMENT_VISUALS.helmet[level];
        if (!helmet) return;
        ctx.save();
        ctx.translate(-radius * 0.44, 0);
        ctx.fillStyle = helmet.color;
        ctx.strokeStyle = helmet.stroke;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.62, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    drawWeaponSprite(ctx, weaponId, scale = 1, iconMode = false) {
        const def = WEAPONS[weaponId];
        if (!def) return;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#111';
        ctx.fillStyle = def.color;

        const barW = def.barrel;
        const barH = def.width;
        this.roundRect(ctx, 0, -barH / 2, barW, barH, Math.min(6, barH / 2));
        ctx.fill();
        ctx.strokeStyle = def.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (def.appearance === 'pistol') {
            ctx.fillStyle = def.magColor;
            ctx.fillRect(10, 5, 8, 14);
            ctx.fillRect(barW - 5, -2, 8, 4);
        } else if (def.appearance === 'smg') {
            ctx.fillStyle = def.magColor;
            ctx.fillRect(18, 6, 8, 15);
            ctx.fillRect(barW - 4, -2, 9, 4);
            ctx.fillStyle = '#0c0f11';
            ctx.fillRect(8, -barH / 2 - 2, 18, 4);
        } else if (def.appearance === 'shotgun') {
            ctx.fillStyle = '#211913';
            ctx.fillRect(-8, -5, 15, barH + 2);
            ctx.fillRect(barW - 4, -2, 12, 4);
        } else if (def.appearance === 'sniper' || def.appearance === 'marksman') {
            ctx.fillStyle = '#111';
            ctx.fillRect(15, -barH / 2 - 6, 18, 5);
            ctx.fillRect(barW - 6, -2, 12, 4);
            if (!iconMode) ctx.fillRect(24, 5, 10, 13);
        } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(15, -barH / 2 - 5, 15, 4);
            ctx.fillStyle = def.magColor;
            ctx.fillRect(18, 5, 9, 15);
            ctx.fillRect(barW - 4, -2, 9, 4);
        }
        ctx.restore();
    }

    drawHand(ctx, x, y) {
        ctx.fillStyle = COLORS.player;
        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, TAU);
        ctx.fill();
        ctx.stroke();
    }

    drawParticles(ctx) {
        for (const p of this.game.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, TAU);
                ctx.fill();
            } else {
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    }

    drawHud(now) {
        this.drawScopeHud();
        this.drawAliveHud();
        this.drawRightInventoryHud();
        this.drawWeaponHud();
        this.drawCurrentAmmoHud();
        this.drawHealthHud();
        this.drawMiniMap();
        this.drawPickupPrompt();
        this.drawTopStatus();
        this.drawActionPrompt(now);
    }

    drawTopStatus() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.90)';
        ctx.font = '700 18px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Waiting for new leader  ·  0', this.width - 120, 28);
        ctx.restore();
    }

    drawScopeHud() {
        const ctx = this.ctx;
        const active = this.game.player.activeScope;
        const buttons = this.game.getScopeButtons();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const btn of buttons) {
            ctx.fillStyle = btn.scope === active ? 'rgba(67,96,38,0.98)' : 'rgba(67,96,38,0.74)';
            ctx.beginPath();
            ctx.arc(btn.x, btn.y, btn.r, 0, TAU);
            ctx.fill();
            if (btn.scope === active) {
                ctx.strokeStyle = 'rgba(255,255,255,0.32)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px Arial';
            ctx.fillText(SCOPES[btn.scope].label, btn.x, btn.y + 1);
        }
        ctx.restore();
    }

    drawAliveHud() {
        const ctx = this.ctx;
        const x = this.width - 58;
        ctx.save();
        ctx.fillStyle = 'rgba(62, 88, 42, 0.94)';
        this.roundRect(ctx, x - 55, 10, 102, 136, 7);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 52px Arial';
        ctx.textAlign = 'center';
        const alive = (this.game.player.dead ? 0 : 1) + this.game.bots.filter(b => !b.dead).length;
        ctx.fillText(String(alive), x - 4, 68);
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Am', x - 4, 108);
        ctx.fillText('Leben', x - 4, 132);
        ctx.restore();
    }

    drawRightInventoryHud() {
        const ctx = this.ctx;
        const p = this.game.player;
        const pack = BACKPACK_CAPACITY[p.equipment.backpack];
        const compact = this.height < 940;
        const x = this.width - 80;
        const equipX = this.width - 168;
        const healStart = compact ? 175 : 210;
        const healGap = compact ? 58 : 62;
        const ammoStart = compact ? 365 : 430;
        const ammoGap = compact ? 50 : 62;
        const equipStart = compact ? 175 : 210;
        const equipGap = compact ? 62 : 72;
        const ammoKeys = ['9mm', '12g', '7.62', '5.56'];
        const healKeys = ['bandage', 'medkit', 'soda', 'painkiller'];
        const equipKeys = [
            { type: 'helmet', level: p.equipment.helmet },
            { type: 'vest', level: p.equipment.vest },
            { type: 'backpack', level: p.equipment.backpack }
        ];

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        equipKeys.forEach((entry, i) => {
            const y = equipStart + i * equipGap;
            ctx.globalAlpha = entry.level ? 1 : 0.34;
            this.drawSideHudCell(equipX, y - 28, 72, 58);
            ctx.save();
            ctx.translate(equipX, y);
            ctx.scale(0.78, 0.78);
            if (entry.level) this.drawEquipmentIcon(ctx, entry.type, entry.level);
            else {
                ctx.strokeStyle = '#d0d0d0';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, 14, 0, TAU);
                ctx.stroke();
            }
            ctx.restore();
            ctx.globalAlpha = 1;
        });

        healKeys.forEach((key, i) => {
            const y = healStart + i * healGap;
            this.drawSideHudCell(x, y - 28, 72, 58);
            ctx.save();
            ctx.translate(x - 10, y - 1);
            ctx.scale(0.56, 0.56);
            this.drawHealIcon(ctx, key);
            ctx.restore();
            ctx.fillStyle = p.heals[key] >= pack.heals[key] ? COLORS.capacityFull : '#fff';
            ctx.font = 'bold 19px Arial';
            ctx.fillText(String(p.heals[key]), x + 18, y + 15);
        });

        ammoKeys.forEach((key, i) => {
            const y = ammoStart + i * ammoGap;
            this.drawSideHudCell(x, y - 28, 72, 58);
            ctx.fillStyle = AMMO[key].color;
            ctx.fillRect(x - 18, y - 15, 27, 27);
            ctx.fillStyle = p.ammo[key] >= pack.ammo[key] ? COLORS.capacityFull : '#fff';
            ctx.font = 'bold 19px Arial';
            ctx.fillText(String(p.ammo[key]), x + 19, y + 15);
        });
        ctx.restore();
    }

    drawSideHudCell(x, y, w, h) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(123,151,92,0.38)';
        this.roundRect(ctx, x - w / 2, y, w, h, 4);
        ctx.fill();
    }

    drawWeaponHud() {
        const ctx = this.ctx;
        const p = this.game.player;
        const x = this.width - 292;
        const baseY = this.height - 330;
        const fragAvailable = p.throwables.frag > 0;
        const slots = [
            { index: 0, label: '1', name: p.weaponSlots[0] ? WEAPONS[p.weaponSlots[0].id].name : '', weapon: p.weaponSlots[0], kind: 'weapon' },
            { index: 1, label: '2', name: p.weaponSlots[1] ? WEAPONS[p.weaponSlots[1].id].name : '', weapon: p.weaponSlots[1], kind: 'weapon' },
            { index: 2, label: '3', name: 'Fists', kind: 'fists' },
            { index: 3, label: '4', name: fragAvailable ? 'Frag' : '', kind: fragAvailable ? 'frag' : 'empty' }
        ];

        ctx.save();
        ctx.textBaseline = 'middle';
        slots.forEach((slot, i) => {
            const y = baseY + i * 72;
            const active = p.activeSlot === slot.index;
            ctx.fillStyle = active ? 'rgba(51, 82, 31, 0.95)' : 'rgba(51,82,31,0.55)';
            this.roundRect(ctx, x, y - 32, 280, 64, 6);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 26px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(slot.label, x + 266, y + 1);

            ctx.save();
            ctx.translate(x + 42, y - 1);
            if (slot.kind === 'weapon' && slot.weapon) {
                const def = WEAPONS[slot.weapon.id];
                ctx.translate(-def.barrel * 0.30, 0);
                this.drawWeaponSprite(ctx, slot.weapon.id, 0.82, true);
            } else if (slot.kind === 'fists') {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 31px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('✊', 0, 4);
            } else if (slot.kind === 'frag') {
                this.drawFragIcon(ctx, 0.90);
            }
            ctx.restore();

            ctx.fillStyle = slot.kind === 'empty' ? 'rgba(255,255,255,0.30)' : '#fff';
            ctx.font = 'bold 19px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(slot.name, x + 94, y + 3);

            if (slot.kind === 'weapon' && slot.weapon) {
                ctx.textAlign = 'right';
                ctx.fillText(String(slot.weapon.loaded), x + 236, y + 3);
            } else if (slot.kind === 'frag') {
                ctx.textAlign = 'right';
                ctx.fillText(String(p.throwables.frag), x + 236, y + 3);
            }
        });
        ctx.restore();
    }

    drawCurrentAmmoHud() {
        const ctx = this.ctx;
        const active = this.game.getActiveWeapon();
        if (!active) return;
        const def = WEAPONS[active.id];
        const x = this.width / 2;
        const y = this.height - 132;
        ctx.save();
        ctx.fillStyle = 'rgba(53,84,33,0.94)';
        this.roundRect(ctx, x - 100, y - 29, 88, 56, 6);
        ctx.fill();
        this.roundRect(ctx, x + 4, y - 23, 78, 46, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 44px Arial';
        ctx.fillText(String(active.loaded), x - 38, y + 1);
        ctx.font = 'bold 23px Arial';
        ctx.fillText(String(this.game.player.ammo[def.ammo]), x + 30, y + 1);
        ctx.restore();
    }

    drawHealthHud() {
        const ctx = this.ctx;
        const p = this.game.player;
        const w = 520;
        const hpH = 36;
        const x = this.width / 2 - w / 2;
        const y = this.height - 50;
        ctx.save();
        ctx.fillStyle = 'rgba(35, 51, 26, 0.82)';
        this.roundRect(ctx, x - 6, y - 25, w + 12, hpH + 31, 5);
        ctx.fill();

        this.roundRect(ctx, x, y - 18, w, 10, 3);
        ctx.fillStyle = '#594727';
        ctx.fill();
        this.roundRect(ctx, x, y - 18, w * (p.energy / 100), 10, 3);
        ctx.fillStyle = COLORS.energy;
        ctx.fill();

        this.roundRect(ctx, x, y, w, hpH, 3);
        ctx.fillStyle = '#bfbfbf';
        ctx.fill();
        this.roundRect(ctx, x, y, w * (p.health / p.maxHealth), hpH, 3);
        ctx.fillStyle = '#f09292';
        ctx.fill();
        ctx.restore();
    }

    drawMiniMap() {
        const ctx = this.ctx;
        const w = 240;
        const h = 240;
        const x = 10;
        const y = this.height - h - 10;
        const sx = w / WORLD.width;
        const sy = h / WORLD.height;
        ctx.save();
        ctx.fillStyle = '#75a949';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#121212';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#3d5c33';
        for (const t of this.game.trees) {
            if (t.dead) continue;
            ctx.beginPath();
            ctx.arc(x + t.x * sx, y + t.y * sy, 3.2, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#7e7e7f';
        for (const r of this.game.rocks) {
            if (r.dead) continue;
            ctx.beginPath();
            ctx.arc(x + r.x * sx, y + r.y * sy, 2.7, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#223645';
        for (const c of this.game.containers) ctx.fillRect(x + (c.x - c.w / 2) * sx, y + (c.y - c.h / 2) * sy, c.w * sx, c.h * sy);
        ctx.fillStyle = '#7a322c';
        for (const hObj of this.game.houses) ctx.fillRect(x + (hObj.x - hObj.w / 2) * sx, y + (hObj.y - hObj.h / 2) * sy, hObj.w * sx, hObj.h * sy);
        ctx.fillStyle = '#59656a';
        for (const b of this.game.barrels) {
            if (b.dead) continue;
            ctx.beginPath();
            ctx.arc(x + b.x * sx, y + b.y * sy, 2.6, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#d3a438';
        for (const c of this.game.rareCrates) {
            if (c.dead) continue;
            ctx.fillRect(x + c.x * sx - 2.5, y + c.y * sy - 2.5, 5, 5);
        }

        const p = this.game.player;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#313131';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + p.x * sx, y + p.y * sy, 6, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#dfd51a';
        ctx.beginPath();
        ctx.arc(x + p.x * sx, y + p.y * sy, 3, 0, TAU);
        ctx.fill();
        ctx.restore();
    }

    drawPickupPrompt() {
        const item = this.game.nearestPickup;
        const door = this.game.nearestDoor;
        let showDoor = false;
        if (door) {
            const doorD2 = (door.cx - this.game.player.x) ** 2 + (door.cy - this.game.player.y) ** 2;
            const itemD2 = item ? (item.x - this.game.player.x) ** 2 + (item.y - this.game.player.y) ** 2 : Infinity;
            showDoor = !item || doorD2 <= itemD2;
        }
        if (!item && !showDoor) return;
        const ctx = this.ctx;
        const p = showDoor ? this.worldToScreen(door.cx, door.cy) : this.worldToScreen(item.x, item.y);
        let label = '';
        if (showDoor) label = door.open ? 'Close Door' : 'Open Door';
        else {
            if (item.kind === 'ammo') label = `${AMMO[item.subtype].label} (${item.amount})`;
            if (item.kind === 'weapon') label = WEAPONS[item.subtype].name;
            if (item.kind === 'heal') label = `${HEALS[item.subtype].name}${item.amount > 1 ? ` (${item.amount})` : ''}`;
            if (item.kind === 'equipment') label = `${item.subtype[0].toUpperCase() + item.subtype.slice(1)} Lv.${item.level}`;
            if (item.kind === 'scope') label = `${item.subtype}x Scope`;
            if (item.kind === 'throwable') label = `Frag (${item.amount})`;
        }

        ctx.save();
        ctx.font = 'bold 18px Arial';
        const labelWidth = ctx.measureText(label).width + 18;
        const total = 38 + labelWidth;
        const x = Math.max(total / 2 + 8, Math.min(this.width - total / 2 - 8, p.x));
        const y = Math.max(50, Math.min(this.height - 60, p.y + 58));
        ctx.fillStyle = 'rgba(57, 86, 34, 0.94)';
        this.roundRect(ctx, x - total / 2, y - 19, 34, 38, 4);
        ctx.fill();
        this.roundRect(ctx, x - total / 2 + 39, y - 16, labelWidth, 32, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('F', x - total / 2 + 17, y + 1);
        ctx.font = 'bold 17px Arial';
        ctx.fillText(label, x - total / 2 + 39 + labelWidth / 2, y + 1);
        ctx.restore();
    }

    drawActionPrompt(now) {
        const state = this.game.getCurrentActionState(now);
        if (!state) return;
        const ctx = this.ctx;
        const p = this.worldToScreen(this.game.player.x, this.game.player.y);
        const label = state.type === 'reload' ? 'Nachladen' : `${HEALS[state.subtype].name} Benutzen`;
        const progressText = Math.max(0.0, (1 - state.progress) * (state.type === 'reload' ? (this.game.player.reload?.duration ?? 1) : (this.game.player.useItem?.duration ?? 1)) / 1000).toFixed(1);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ringY = p.y - 132;
        ctx.fillStyle = 'rgba(53,84,33,0.18)';
        ctx.beginPath();
        ctx.arc(p.x, ringY, 30, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.30)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, ringY, 28, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(p.x, ringY, 28, -Math.PI / 2, -Math.PI / 2 + TAU * state.progress);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(progressText, p.x, ringY + 1);

        ctx.fillStyle = 'rgba(57,86,34,0.94)';
        const textW = Math.max(92, ctx.measureText(label).width + 24);
        this.roundRect(ctx, p.x - textW / 2, p.y - 76, textW, 32, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(label, p.x, p.y - 60);

        this.roundRect(ctx, p.x - 66, p.y + 60, 36, 38, 4);
        ctx.fillStyle = 'rgba(57,86,34,0.94)';
        ctx.fill();
        this.roundRect(ctx, p.x - 22, p.y + 63, 96, 32, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('X', p.x - 48, p.y + 79);
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Beenden', p.x + 26, p.y + 79);
        ctx.restore();
    }

    drawCrosshair() {
        const ctx = this.ctx;
        const m = this.game.mouse;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 8, 0, TAU);
        ctx.moveTo(m.x - 13, m.y); ctx.lineTo(m.x - 5, m.y);
        ctx.moveTo(m.x + 5, m.y); ctx.lineTo(m.x + 13, m.y);
        ctx.moveTo(m.x, m.y - 13); ctx.lineTo(m.x, m.y - 5);
        ctx.moveTo(m.x, m.y + 5); ctx.lineTo(m.x, m.y + 13);
        ctx.stroke();
        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }
}
