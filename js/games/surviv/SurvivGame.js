import {
    AIRDROP_LOOT,
    BACKPACK_CAPACITY,
    BATTLE_ROYALE,
    BOT_AI,
    CRATE_LOOT,
    ENERGY_RULES,
    HEALS,
    MAP,
    RARE_CRATE_LOOT,
    SCOPES,
    THROWABLES,
    WEAPONS,
    WORLD
} from './data.js';
import { Renderer } from './Renderer.js';

const TAU = Math.PI * 2;

export class SurvivGame {
    constructor(container, services) {
        this.container = container;
        this.services = services;
        this.root = null;
        this.canvas = null;
        this.renderer = null;
        this.resizeObserver = null;
        this.raf = null;
        this.lastFrame = 0;
        this.running = false;
        this.mode = 'menu';
        this.roundActive = false;
        this.roundEnded = false;
        this.modeOverlay = null;
        this.modeResult = '';
        this.zone = null;
        this.airdrop = null;
        this.notifications = [];
        this.roundStartAt = 0;
        this.roundEndAt = 0;
        this.nextLootId = 1;

        this.keys = new Set();
        this.mouse = { x: 0, y: 0, down: false, justPressed: false };
        this.camera = { x: MAP.spawn.x, y: MAP.spawn.y, scale: SCOPES[1].cameraScale, targetScale: SCOPES[1].cameraScale };

        this.player = this.createPlayer();
        this.houses = (MAP.houses || []).map((h, i) => this.createHouse(h, i));
        this.containers = MAP.containers
            .filter(c => !this.rectOverlapsAnyHouse(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 70))
            .map((c, i) => ({ ...c, id: `container-${i}` }));
        this.trees = MAP.trees
            .filter(t => !this.circleOverlapsAnyHouse(t.x, t.y, t.r + 36))
            .map((t, i) => ({ ...t, id: `tree-${i}`, hp: t.hp, maxHp: t.hp, scale: 1, dead: false }));
        this.rocks = MAP.rocks
            .filter(r => !this.circleOverlapsAnyHouse(r.x, r.y, r.r + 30))
            .map((r, i) => ({ ...r, id: `rock-${i}`, hp: r.hp, maxHp: r.hp, scale: 1, dead: false }));
        this.barrels = MAP.barrels
            .filter(b => !this.circleOverlapsAnyHouse(b.x, b.y, b.r + 30))
            .map((b, i) => ({ ...b, id: `barrel-${i}`, hp: b.hp, maxHp: b.hp, scale: 1, dead: false }));
        this.rareCrates = MAP.rareCrates
            .filter(c => !this.circleOverlapsAnyHouse(c.x, c.y, 80))
            .map((c, i) => ({ ...c, id: `rare-crate-${i}`, hp: 230, maxHp: 230, scale: 1, rotation: (i % 2 ? 0.04 : -0.035), dead: false }));
        this.crates = MAP.crates
            .filter(c => !this.circleOverlapsAnyHouse(c.x, c.y, 74))
            .map((c, i) => ({
                ...c,
                id: `crate-${i}`,
                hp: 140,
                maxHp: 140,
                scale: 1,
                rotation: (i % 5 - 2) * 0.035,
                dead: false,
                houseId: null
            }));
        for (const house of this.houses) {
            house.fixedCrates.forEach((c, index) => {
                this.crates.push({
                    x: c.x, y: c.y, loot: c.loot,
                    id: `${house.id}-crate-${index}`,
                    hp: 140, maxHp: 140, scale: 1,
                    rotation: (index - 1) * 0.025, dead: false,
                    houseId: house.id
                });
            });
        }
        this.toilets = this.houses.flatMap(h => h.toilets);
        this.loot = MAP.lootSpawns
            .filter(item => !this.circleOverlapsAnyHouse(item.x, item.y, 48))
            .map(item => this.makeLoot(item));
        this.bots = [];
        this.nextBotId = 1;
        this.bullets = [];
        this.throwables = [];
        this.explosions = [];
        this.particles = [];
        this.nearestPickup = null;
        this.visibleContainerId = null;
        this.insideContainerId = null;
        this.visibleHouseId = null;
        this.insideHouseId = null;
        this.nearestDoor = null;
        this.botSpawnCursor = 0;
        this.nextAirdropAt = Infinity;

        this.bound = {
            keydown: e => this.onKeyDown(e),
            keyup: e => this.onKeyUp(e),
            mousemove: e => this.onMouseMove(e),
            mousedown: e => this.onMouseDown(e),
            mouseup: e => this.onMouseUp(e),
            wheel: e => this.onWheel(e),
            contextmenu: e => e.preventDefault(),
            blur: () => this.onBlur()
        };
    }

    createPlayer() {
        return {
            x: MAP.spawn.x,
            y: MAP.spawn.y,
            radius: 31,
            speed: 270,
            aimAngle: 0,
            health: 100,
            maxHealth: 100,
            dead: false,
            respawnAt: 0,
            energy: 0,
            weaponSlots: [null, null],
            activeSlot: 2,
            ammo: { '9mm': 0, '12g': 0, '7.62': 0, '5.56': 0 },
            heals: { bandage: 0, medkit: 0, soda: 0, painkiller: 0 },
            equipment: { helmet: 0, vest: 0, backpack: 0 },
            scopes: new Set([1]),
            activeScope: 1,
            throwables: { frag: 0 },
            lastShotAt: -Infinity,
            lastPunchAt: -Infinity,
            lastThrowAt: -Infinity,
            shotSlowUntil: -Infinity,
            shotMoveScale: 1,
            reload: null,
            useItem: null
        };
    }

    resetSessionWorld() {
        this.nextLootId = 1;
        this.nextBotId = 1;
        this.player = this.createPlayer();
        this.houses = (MAP.houses || []).map((h, i) => this.createHouse(h, i));
        this.containers = MAP.containers
            .filter(c => !this.rectOverlapsAnyHouse(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 70))
            .map((c, i) => ({ ...c, id: `container-${i}` }));
        this.trees = MAP.trees
            .filter(t => !this.circleOverlapsAnyHouse(t.x, t.y, t.r + 36))
            .map((t, i) => ({ ...t, id: `tree-${i}`, hp: t.hp, maxHp: t.hp, scale: 1, dead: false }));
        this.rocks = MAP.rocks
            .filter(r => !this.circleOverlapsAnyHouse(r.x, r.y, r.r + 30))
            .map((r, i) => ({ ...r, id: `rock-${i}`, hp: r.hp, maxHp: r.hp, scale: 1, dead: false }));
        this.barrels = MAP.barrels
            .filter(b => !this.circleOverlapsAnyHouse(b.x, b.y, b.r + 30))
            .map((b, i) => ({ ...b, id: `barrel-${i}`, hp: b.hp, maxHp: b.hp, scale: 1, dead: false }));
        this.rareCrates = MAP.rareCrates
            .filter(c => !this.circleOverlapsAnyHouse(c.x, c.y, 80))
            .map((c, i) => ({ ...c, id: `rare-crate-${i}`, hp: 230, maxHp: 230, scale: 1, rotation: (i % 2 ? 0.04 : -0.035), dead: false }));
        this.crates = MAP.crates
            .filter(c => !this.circleOverlapsAnyHouse(c.x, c.y, 74))
            .map((c, i) => ({ ...c, id: `crate-${i}`, hp: 140, maxHp: 140, scale: 1, rotation: (i % 5 - 2) * 0.035, dead: false, houseId: null }));
        for (const house of this.houses) {
            house.fixedCrates.forEach((c, index) => {
                this.crates.push({
                    x: c.x, y: c.y, loot: c.loot,
                    id: `${house.id}-crate-${index}`,
                    hp: 140, maxHp: 140, scale: 1,
                    rotation: (index - 1) * 0.025, dead: false,
                    houseId: house.id
                });
            });
        }
        this.toilets = this.houses.flatMap(h => h.toilets);
        this.loot = MAP.lootSpawns
            .filter(item => !this.circleOverlapsAnyHouse(item.x, item.y, 48))
            .map(item => this.makeLoot(item));
        this.bots = [];
        this.bullets = [];
        this.throwables = [];
        this.explosions = [];
        this.particles = [];
        this.nearestPickup = null;
        this.visibleContainerId = null;
        this.insideContainerId = null;
        this.visibleHouseId = null;
        this.insideHouseId = null;
        this.nearestDoor = null;
        this.botSpawnCursor = 0;
        this.zone = null;
        this.airdrop = null;
        this.notifications = [];
        this.nextAirdropAt = Infinity;
        this.roundEnded = false;
        this.camera.x = MAP.spawn.x;
        this.camera.y = MAP.spawn.y;
        this.camera.scale = SCOPES[1].cameraScale;
        this.camera.targetScale = SCOPES[1].cameraScale;
    }

    startMode(mode) {
        this.resetSessionWorld();
        this.mode = mode;
        this.roundActive = true;
        this.roundStartAt = performance.now();
        this.modeResult = '';
        this.hideModeMenu();

        if (mode === 'battleRoyale') {
            const playerSpawn = this.pickRandomBattleSpawn();
            this.player.x = playerSpawn.x;
            this.player.y = playerSpawn.y;
            this.camera.x = playerSpawn.x;
            this.camera.y = playerSpawn.y;
            for (let i = 0; i < BATTLE_ROYALE.botCount; i++) this.spawnBot({ unarmed: true, battleRoyale: true });
            this.initializeZone(this.roundStartAt);
            this.nextAirdropAt = this.roundStartAt + this.randomRange(BATTLE_ROYALE.airdropFirstMinMs, BATTLE_ROYALE.airdropFirstMaxMs);
            this.pushNotification('Battle Royale gestartet – 12 Überlebende', 3600);
        } else {
            this.player.x = MAP.spawn.x;
            this.player.y = MAP.spawn.y;
            this.camera.x = MAP.spawn.x;
            this.camera.y = MAP.spawn.y;
            this.pushNotification('Spielwiese – B spawnt einen Bot', 3000);
        }
        requestAnimationFrame(() => this.canvas?.focus());
    }

    pickRandomBattleSpawn() {
        const points = MAP.botSpawnPoints || [];
        const shuffled = [...points].sort(() => Math.random() - 0.5);
        for (const point of shuffled) if (this.isWorldSpawnPointSafe(point.x, point.y, 130, false)) return { x: point.x, y: point.y };
        return { x: MAP.spawn.x, y: MAP.spawn.y };
    }

    endRound(result) {
        if (!this.roundActive || this.roundEnded) return;
        this.roundEnded = true;
        this.roundActive = false;
        this.modeResult = result;
        this.mouse.down = false;
        this.keys.clear();
        this.showModeMenu(result);
    }

    showModeMenu(result = '') {
        if (!this.modeOverlay) return;
        const resultEl = this.modeOverlay.querySelector('.surviv-mode-result');
        if (resultEl) resultEl.textContent = result || '';
        this.modeOverlay.style.display = 'flex';
    }

    hideModeMenu() {
        if (this.modeOverlay) this.modeOverlay.style.display = 'none';
    }

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    pushNotification(text, duration = 4200) {
        this.notifications.push({ text, until: performance.now() + duration });
        if (this.notifications.length > 4) this.notifications.shift();
    }

    isWorldSpawnPointSafe(x, y, radius = 45, checkActors = true) {
        if (!this.canActorOccupy(x, y, radius, null)) return false;
        if (this.isInWater(x, y)) return false;
        if (this.circleOverlapsAnyHouse(x, y, radius + 25, 35)) return false;
        for (const c of this.containers) {
            const left = c.x - c.w / 2 - radius;
            const right = c.x + c.w / 2 + radius;
            const top = c.y - c.h / 2 - radius;
            const bottom = c.y + c.h / 2 + radius;
            if (x >= left && x <= right && y >= top && y <= bottom) return false;
        }
        if (checkActors) {
            if (!this.player.dead && Math.hypot(x - this.player.x, y - this.player.y) < 150) return false;
            for (const bot of this.bots) if (!bot.dead && Math.hypot(x - bot.x, y - bot.y) < 125) return false;
        }
        return true;
    }

    initializeZone(now) {
        this.zone = {
            x: WORLD.width / 2,
            y: WORLD.height / 2,
            radius: BATTLE_ROYALE.startRadius,
            startX: WORLD.width / 2,
            startY: WORLD.height / 2,
            startRadius: BATTLE_ROYALE.startRadius,
            targetX: WORLD.width / 2,
            targetY: WORLD.height / 2,
            targetRadius: BATTLE_ROYALE.startRadius,
            phase: 0,
            state: 'waiting',
            stateStartedAt: now,
            nextStateAt: now + BATTLE_ROYALE.firstMoveDelayMs
        };
    }

    beginNextZoneMove(now) {
        if (!this.zone) return;
        const z = this.zone;
        z.phase += 1;
        z.state = 'moving';
        z.stateStartedAt = now;
        z.nextStateAt = now + BATTLE_ROYALE.phaseDurationMs;
        z.startX = z.x;
        z.startY = z.y;
        z.startRadius = z.radius;
        z.targetRadius = Math.max(BATTLE_ROYALE.minRadius, z.radius * (z.phase <= 2 ? 0.72 : 0.66));
        const maxShift = Math.max(0, z.radius - z.targetRadius) * 0.68;
        const a = Math.random() * TAU;
        z.targetX = Math.max(z.targetRadius, Math.min(WORLD.width - z.targetRadius, z.x + Math.cos(a) * maxShift));
        z.targetY = Math.max(z.targetRadius, Math.min(WORLD.height - z.targetRadius, z.y + Math.sin(a) * maxShift));
        this.pushNotification(`Zone schließt sich – Phase ${z.phase}`, 4000);
    }

    updateBattleRoyale(dt, now) {
        if (this.mode !== 'battleRoyale' || !this.roundActive) return;
        this.updateZone(dt, now);
        this.updateAirdrop(now);

        if (this.player.dead) {
            this.endRound('Du wurdest eliminiert');
            return;
        }
        const livingBots = this.bots.filter(b => !b.dead).length;
        if (livingBots === 0) this.endRound('Sieg! Du bist der letzte Überlebende');
    }

    updateZone(dt, now) {
        const z = this.zone;
        if (!z) return;
        if (z.state === 'waiting' && now >= z.nextStateAt && z.radius > BATTLE_ROYALE.minRadius + 5) {
            this.beginNextZoneMove(now);
        } else if (z.state === 'moving') {
            const t = Math.max(0, Math.min(1, (now - z.stateStartedAt) / BATTLE_ROYALE.phaseDurationMs));
            const ease = t * t * (3 - 2 * t);
            z.x = z.startX + (z.targetX - z.startX) * ease;
            z.y = z.startY + (z.targetY - z.startY) * ease;
            z.radius = z.startRadius + (z.targetRadius - z.startRadius) * ease;
            if (t >= 1) {
                z.x = z.targetX;
                z.y = z.targetY;
                z.radius = z.targetRadius;
                z.state = 'waiting';
                z.stateStartedAt = now;
                z.nextStateAt = now + BATTLE_ROYALE.phasePauseMs;
            }
        }
        const damage = BATTLE_ROYALE.damagePerSecond[Math.min(z.phase, BATTLE_ROYALE.damagePerSecond.length - 1)] || 1.5;
        if (!this.player.dead && Math.hypot(this.player.x - z.x, this.player.y - z.y) > z.radius) this.damagePlayer(damage * dt, 0, 'zone', 'zone');
        for (const bot of this.bots) {
            if (!bot.dead && Math.hypot(bot.x - z.x, bot.y - z.y) > z.radius) this.damageBot(bot, damage * dt, 0, 'zone', 'zone');
        }
    }

    updateAirdrop(now) {
        if (this.airdrop) {
            if (this.airdrop.state === 'smoke' && now >= this.airdrop.landAt) this.landAirdrop();
            return;
        }
        if (now >= this.nextAirdropAt) this.scheduleAirdrop(now);
    }

    scheduleAirdrop(now) {
        let point = null;
        for (let i = 0; i < 40; i++) {
            const z = this.zone || { x: WORLD.width / 2, y: WORLD.height / 2, radius: Math.min(WORLD.width, WORLD.height) * 0.45 };
            const a = Math.random() * TAU;
            const r = Math.sqrt(Math.random()) * Math.max(300, z.radius * 0.72);
            const x = Math.max(150, Math.min(WORLD.width - 150, z.x + Math.cos(a) * r));
            const y = Math.max(150, Math.min(WORLD.height - 150, z.y + Math.sin(a) * r));
            if (this.isWorldSpawnPointSafe(x, y, 80, false)) { point = { x, y }; break; }
        }
        if (!point) point = { x: WORLD.width / 2 + 260, y: WORLD.height / 2 - 260 };
        this.airdrop = { x: point.x, y: point.y, state: 'smoke', createdAt: now, landAt: now + BATTLE_ROYALE.airdropSmokeMs, crateHp: 260, opened: false };
        this.pushNotification('AirDrop im Anflug – roter Rauch markiert die Abwurfzone!', 6500);
    }

    landAirdrop() {
        if (!this.airdrop) return;
        this.airdrop.state = 'landed';
        this.airdrop.landedAt = performance.now();
        this.pushNotification('AirDrop ist gelandet!', 4500);
    }

    breakAirdrop() {
        const a = this.airdrop;
        if (!a || a.state !== 'landed' || a.opened) return;
        a.opened = true;
        const weaponSpec = this.rollWeighted(AIRDROP_LOOT.weapon);
        const def = WEAPONS[weaponSpec.subtype];
        const ammoAmount = def.ammo === '9mm' ? 96 : def.ammo === '12g' ? 20 : 60;
        const specs = [weaponSpec, { kind: 'ammo', subtype: def.ammo, amount: ammoAmount }, this.rollWeighted(AIRDROP_LOOT.gear), this.rollWeighted(AIRDROP_LOOT.gear)];
        specs.forEach((spec, i) => {
            const ang = i * TAU / specs.length + 0.3;
            this.loot.push(this.makeLoot({ ...spec, x: a.x + Math.cos(ang) * 72, y: a.y + Math.sin(ang) * 72, vx: Math.cos(ang) * 130, vy: Math.sin(ang) * 130 }));
        });
        this.nextAirdropAt = performance.now() + this.randomRange(BATTLE_ROYALE.airdropRepeatMinMs, BATTLE_ROYALE.airdropRepeatMaxMs);
        this.airdrop = null;
    }


    spawnBot(options = {}) {
        const points = MAP.botSpawnPoints || [];
        if (!points.length) return null;
        const start = Math.floor(Math.random() * points.length);
        let chosen = null;
        for (let i = 0; i < points.length; i++) {
            const point = points[(start + i) % points.length];
            if (!this.isBotSpawnPointSafe(point.x, point.y)) continue;
            chosen = point;
            break;
        }
        if (!chosen) return null;
        const bot = this.createBot(chosen.x, chosen.y, { unarmed: options.unarmed !== false, battleRoyale: !!options.battleRoyale });
        this.bots.push(bot);
        return bot;
    }

    isBotSpawnPointSafe(x, y) {
        return this.isWorldSpawnPointSafe(x, y, BOT_AI.radius + 4, true);
    }

    createBot(x, y, options = {}) {
        const now = performance.now();
        return {
            id: `bot-${this.nextBotId++}`,
            x, y,
            radius: BOT_AI.radius,
            speed: BOT_AI.speed * (0.94 + Math.random() * 0.12),
            aimAngle: Math.random() * TAU,
            health: 100,
            maxHealth: 100,
            dead: false,
            energy: 0,
            deathHandled: false,
            weapon: null,
            ammo: { '9mm': 0, '12g': 0, '7.62': 0, '5.56': 0 },
            heals: { bandage: 0, medkit: 0, soda: 0, painkiller: 0 },
            equipment: { helmet: 0, vest: 0, backpack: 0 },
            scope: 1,
            throwables: { frag: 0 },
            state: 'wander',
            targetId: null,
            targetKind: null,
            lastSeenX: null,
            lastSeenY: null,
            lastSeenAt: -Infinity,
            nextThinkAt: now + 150 + Math.random() * 250,
            nextWanderAt: now,
            wanderX: x,
            wanderY: y,
            strafeDir: Math.random() < 0.5 ? -1 : 1,
            nextStrafeFlipAt: now + 800 + Math.random() * 1400,
            lastShotAt: -Infinity,
            lastPunchAt: -Infinity,
            lastThrowAt: -Infinity,
            shotSlowUntil: -Infinity,
            shotMoveScale: 1,
            reload: null,
            useItem: null,
            safeSince: now,
            stuckFor: 0,
            lastMoveX: x,
            lastMoveY: y,
            skill: 0.48 + Math.random() * 0.34,
            reactionUntil: now + 300 + Math.random() * 350,
            burstEndsAt: -Infinity,
            burstPauseUntil: -Infinity,
            lootTargetId: null,
            crateTargetId: null,
            battleRoyale: !!options.battleRoyale
        };
    }

    pickWeightedId(entries) {
        const total = entries.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * total;
        for (const e of entries) {
            roll -= e.weight;
            if (roll <= 0) return e.id;
        }
        return entries[entries.length - 1].id;
    }

    updateBots(dt, now) {
        for (const bot of this.bots) {
            if (bot.dead) continue;
            this.updateBotTimedActions(bot, now);
            this.updateBotEnergy(bot, dt);

            const target = this.findBestBotTarget(bot);
            const sensed = target && this.botCanSense(bot, target);
            const clearShot = sensed && this.hasClearFireLine(bot.x, bot.y, target.x, target.y);

            if (sensed) {
                const newTarget = bot.targetId !== target.id || bot.targetKind !== target.kind;
                bot.targetId = target.id;
                bot.targetKind = target.kind;
                if (newTarget) bot.reactionUntil = now + 220 + Math.random() * (420 - bot.skill * 160);
                bot.lastSeenX = target.x;
                bot.lastSeenY = target.y;
                bot.lastSeenAt = now;
                bot.safeSince = now;
                bot.state = clearShot || !bot.weapon ? 'combat' : 'search';
            } else if (now - bot.lastSeenAt < BOT_AI.searchMs && bot.lastSeenX !== null) {
                bot.state = 'search';
            } else {
                bot.targetId = null;
                bot.targetKind = null;
                if (bot.state !== 'heal') bot.state = 'wander';
            }

            if (this.tryBotHeal(bot, sensed, now)) {
                this.moveBotToward(bot, 0, 0, dt, 0);
                continue;
            }

            if (bot.reload) {
                const retreat = sensed && target ? this.getRetreatVector(bot, target) : { x: 0, y: 0 };
                this.moveBotToward(bot, retreat.x, retreat.y, dt, 0.56);
                continue;
            }

            if (this.mode === 'battleRoyale' && this.zone) {
                const zoneDist = Math.hypot(bot.x - this.zone.x, bot.y - this.zone.y);
                if (zoneDist > this.zone.radius * 0.94 && (!sensed || zoneDist > this.zone.radius)) {
                    const nav = this.resolveBotNavigationPoint(bot, this.zone.x, this.zone.y);
                    this.moveBotToward(bot, nav.x - bot.x, nav.y - bot.y, dt, 1.02);
                    this.updateBotStuckRecovery(bot, dt);
                    continue;
                }
            }

            const urgentMelee = sensed && !bot.weapon && target && Math.hypot(target.x - bot.x, target.y - bot.y) < 105;
            if (!urgentMelee && this.updateBotLooting(bot, dt, now, sensed)) {
                this.updateBotStuckRecovery(bot, dt);
                continue;
            }

            if (bot.state === 'combat' && target) {
                this.updateBotCombat(bot, target, dt, now);
            } else if (bot.state === 'search') {
                this.updateBotSearch(bot, target, dt, now);
            } else {
                this.updateBotWander(bot, dt, now);
            }

            this.updateBotStuckRecovery(bot, dt);
        }
    }

    updateBotLooting(bot, dt, now, enemySensed) {
        const needWeapon = !bot.weapon;
        const needAmmo = !!bot.weapon && bot.weapon.loaded <= 0 && (bot.ammo[WEAPONS[bot.weapon.id].ammo] || 0) <= 0;
        const useful = this.findUsefulLootForBot(bot, needWeapon ? 1450 : needAmmo ? 900 : 520);
        if (useful) {
            const dx = useful.x - bot.x;
            const dy = useful.y - bot.y;
            const dist = Math.hypot(dx, dy);
            bot.aimAngle = this.lerpAngle(bot.aimAngle, Math.atan2(dy, dx), Math.min(1, dt * 3.8));
            if (dist < 58) {
                this.botPickupLoot(bot, useful);
                return true;
            }
            if (!enemySensed || needWeapon || needAmmo) {
                const nav = this.resolveBotNavigationPoint(bot, useful.x, useful.y);
                this.moveBotToward(bot, nav.x - bot.x, nav.y - bot.y, dt, needWeapon ? 0.96 : 0.72);
                return true;
            }
        }

        if (needWeapon && !enemySensed) {
            const crate = this.findNearestBreakableForBot(bot, 1350);
            if (crate) {
                const dx = crate.x - bot.x;
                const dy = crate.y - bot.y;
                const dist = Math.hypot(dx, dy);
                bot.aimAngle = this.lerpAngle(bot.aimAngle, Math.atan2(dy, dx), Math.min(1, dt * 4));
                if (dist < 82) {
                    if (now - bot.lastPunchAt >= 370) {
                        bot.lastPunchAt = now;
                        if (crate.kind === 'rare') this.damageRareCrate(crate.ref, 28, bot.aimAngle);
                        else if (crate.kind === 'airdrop') this.damageAirdrop(crate.ref, 32, bot.aimAngle);
                        else this.damageCrate(crate.ref, 34, bot.aimAngle);
                    }
                    return true;
                }
                const nav = this.resolveBotNavigationPoint(bot, crate.x, crate.y);
                this.moveBotToward(bot, nav.x - bot.x, nav.y - bot.y, dt, 0.90);
                return true;
            }
        }
        return false;
    }

    findUsefulLootForBot(bot, maxDistance) {
        let best = null;
        let bestScore = Infinity;
        for (const item of this.loot) {
            if (item.removed || !this.isLootVisible(item)) continue;
            const d = Math.hypot(item.x - bot.x, item.y - bot.y);
            if (d > maxDistance) continue;
            let priority = 99;
            if (item.kind === 'weapon') priority = bot.weapon ? 3.6 : 0.15;
            else if (item.kind === 'ammo' && bot.weapon && WEAPONS[bot.weapon.id].ammo === item.subtype) priority = (bot.ammo[item.subtype] || 0) < 20 ? 0.7 : 2.2;
            else if (item.kind === 'equipment' && item.level > (bot.equipment[item.subtype] || 0)) priority = 1.1 - item.level * 0.12;
            else if (item.kind === 'heal' && (bot.heals[item.subtype] || 0) < 3) priority = 1.8;
            else if (item.kind === 'scope' && item.subtype > bot.scope) priority = 1.35;
            else if (item.kind === 'throwable' && bot.throwables.frag < 2) priority = 2.0;
            else continue;
            const score = priority * 600 + d;
            if (score < bestScore) { bestScore = score; best = item; }
        }
        return best;
    }

    botPickupLoot(bot, item) {
        if (!item || item.removed) return false;
        if (item.kind === 'weapon') {
            if (bot.weapon) {
                this.loot.push(this.makeLoot({ kind: 'weapon', subtype: bot.weapon.id, loaded: bot.weapon.loaded, x: bot.x - 24, y: bot.y + 20, vx: -35, vy: 25 }));
            }
            bot.weapon = { id: item.subtype, loaded: item.loaded ?? 0 };
            item.removed = true;
            const def = WEAPONS[bot.weapon.id];
            if (bot.weapon.loaded <= 0 && (bot.ammo[def.ammo] || 0) > 0) this.tryBotReload(bot, performance.now());
            return true;
        }
        if (item.kind === 'ammo') {
            bot.ammo[item.subtype] = Math.min(330, (bot.ammo[item.subtype] || 0) + item.amount);
            item.removed = true;
            if (bot.weapon && WEAPONS[bot.weapon.id].ammo === item.subtype && bot.weapon.loaded <= 0) this.tryBotReload(bot, performance.now());
            return true;
        }
        if (item.kind === 'equipment' && item.level > (bot.equipment[item.subtype] || 0)) {
            bot.equipment[item.subtype] = item.level;
            item.removed = true;
            return true;
        }
        if (item.kind === 'heal') {
            bot.heals[item.subtype] = Math.min(12, (bot.heals[item.subtype] || 0) + item.amount);
            item.removed = true;
            return true;
        }
        if (item.kind === 'scope' && item.subtype > bot.scope) {
            bot.scope = item.subtype;
            item.removed = true;
            return true;
        }
        if (item.kind === 'throwable') {
            bot.throwables.frag = Math.min(4, bot.throwables.frag + item.amount);
            item.removed = true;
            return true;
        }
        return false;
    }

    findNearestBreakableForBot(bot, maxDistance) {
        let best = null;
        let bestD = maxDistance;
        if (this.airdrop && this.airdrop.state === 'landed' && !this.airdrop.opened) {
            const d = Math.hypot(this.airdrop.x - bot.x, this.airdrop.y - bot.y);
            if (d < bestD) { bestD = d; best = { kind: 'airdrop', ref: this.airdrop, x: this.airdrop.x, y: this.airdrop.y }; }
        }
        for (const crate of this.crates) {
            if (crate.dead) continue;
            const d = Math.hypot(crate.x - bot.x, crate.y - bot.y);
            if (d < bestD) { bestD = d; best = { kind: 'normal', ref: crate, x: crate.x, y: crate.y }; }
        }
        for (const crate of this.rareCrates) {
            if (crate.dead) continue;
            const d = Math.hypot(crate.x - bot.x, crate.y - bot.y);
            if (d < bestD) { bestD = d; best = { kind: 'rare', ref: crate, x: crate.x, y: crate.y }; }
        }
        return best;
    }

    updateBotTimedActions(bot, now) {
        if (bot.reload && now >= bot.reload.endsAt) {
            if (!bot.weapon) { bot.reload = null; return; }
            const def = WEAPONS[bot.weapon.id];
            const need = def.magSize - bot.weapon.loaded;
            const take = Math.min(need, bot.ammo[def.ammo] || 0);
            bot.weapon.loaded += take;
            bot.ammo[def.ammo] -= take;
            bot.reload = null;
        }
        if (bot.useItem && now >= bot.useItem.endsAt) {
            const heal = HEALS[bot.useItem.subtype];
            if (bot.heals[bot.useItem.subtype] > 0) {
                bot.heals[bot.useItem.subtype] -= 1;
                if (heal.hp > 0) {
                    if (bot.useItem.subtype === 'medkit') bot.health = Math.min(bot.maxHealth, bot.health + heal.hp);
                    else bot.health = Math.min(heal.hpCap, bot.health + heal.hp);
                }
                if (heal.energyGain > 0) bot.energy = Math.min(100, bot.energy + heal.energyGain);
            }
            bot.useItem = null;
            bot.state = 'wander';
        }
    }

    updateBotEnergy(bot, dt) {
        if (bot.energy > 0) bot.energy = Math.max(0, bot.energy - ENERGY_RULES.decayPerSecond * dt);
        if (bot.health < bot.maxHealth && bot.energy > 0) {
            const tier = bot.energy >= 76 ? 4 : bot.energy >= 51 ? 3 : bot.energy >= 26 ? 2 : 1;
            bot.health = Math.min(bot.maxHealth, bot.health + ENERGY_RULES.regenPerSecond[tier] * dt);
        }
    }

    findBestBotTarget(bot) {
        let best = null;
        let bestScore = Infinity;
        if (!this.player.dead && this.player.health > 0) {
            const d = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
            if (d < bestScore) {
                bestScore = d;
                best = { kind: 'player', id: 'player', x: this.player.x, y: this.player.y, health: this.player.health, radius: this.player.radius, ref: this.player };
            }
        }
        for (const other of this.bots) {
            if (other === bot || other.dead) continue;
            const d = Math.hypot(other.x - bot.x, other.y - bot.y);
            if (d < bestScore) {
                bestScore = d;
                best = { kind: 'bot', id: other.id, x: other.x, y: other.y, health: other.health, radius: other.radius, ref: other };
            }
        }
        return best;
    }

    botCanSense(bot, target) {
        const factor = bot.scope === 8 ? 1.34 : bot.scope === 4 ? 1.18 : bot.scope === 2 ? 1.08 : 1;
        return Math.hypot(target.x - bot.x, target.y - bot.y) <= BOT_AI.senseRadius * factor;
    }

    hasClearFireLine(x1, y1, x2, y2) {
        const dist = Math.hypot(x2 - x1, y2 - y1);
        if (dist <= 1) return true;
        const steps = Math.max(2, Math.ceil(dist / 28));
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            if (this.findStaticBulletCollision(x, y, true)) return false;
        }
        return true;
    }

    updateBotCombat(bot, target, dt, now) {
        const dist = Math.hypot(target.x - bot.x, target.y - bot.y);
        const toX = (target.x - bot.x) / Math.max(1, dist);
        const toY = (target.y - bot.y) / Math.max(1, dist);

        if (!bot.weapon) {
            bot.aimAngle = this.lerpAngle(bot.aimAngle, Math.atan2(target.y - bot.y, target.x - bot.x), Math.min(1, dt * 7));
            if (dist <= 78 && this.hasClearFireLine(bot.x, bot.y, target.x, target.y) && now - bot.lastPunchAt >= 360) {
                bot.lastPunchAt = now;
                if (target.kind === 'player') this.damagePlayer(22, bot.aimAngle, 'bot', bot.id);
                else this.damageBot(target.ref, 22, bot.aimAngle, 'bot', bot.id);
            }
            this.moveBotToward(bot, toX, toY, dt, 1.08);
            return;
        }

        const def = WEAPONS[bot.weapon.id];
        const desiredRange = BOT_AI.preferredRanges[def.appearance] || (def.appearance === 'lmg' ? 430 : 360);
        if (now >= bot.nextStrafeFlipAt) {
            bot.strafeDir *= -1;
            bot.nextStrafeFlipAt = now + 700 + Math.random() * 1500;
        }

        let moveX = 0;
        let moveY = 0;
        if (dist > desiredRange * 1.15) { moveX += toX; moveY += toY; }
        else if (dist < desiredRange * 0.62) { moveX -= toX * 1.15; moveY -= toY * 1.15; }
        moveX += -toY * bot.strafeDir * BOT_AI.strafeStrength;
        moveY += toX * bot.strafeDir * BOT_AI.strafeStrength;

        const targetLead = this.predictTargetPoint(target, def.bulletSpeed, bot);
        const aimAngle = Math.atan2(targetLead.y - bot.y, targetLead.x - bot.x);
        bot.aimAngle = this.lerpAngle(bot.aimAngle, aimAngle, Math.min(1, dt * (5.4 + bot.skill * 3.2)));

        if (bot.throwables.frag > 0 && dist > 255 && dist < 520 && now - bot.lastThrowAt > 6500 && Math.random() < 0.011 + bot.skill * 0.007) this.botThrowFrag(bot, target, now);
        if (this.hasClearFireLine(bot.x, bot.y, target.x, target.y)) this.tryBotFire(bot, target, now);
        this.moveBotToward(bot, moveX, moveY, dt, 1);
    }

    updateBotSearch(bot, liveTarget, dt, now) {
        if (liveTarget && this.botCanSense(bot, liveTarget)) {
            bot.lastSeenX = liveTarget.x;
            bot.lastSeenY = liveTarget.y;
        }
        if (bot.lastSeenX === null) {
            bot.state = 'wander';
            return;
        }
        const nav = this.resolveBotNavigationPoint(bot, bot.lastSeenX, bot.lastSeenY);
        const dx = nav.x - bot.x;
        const dy = nav.y - bot.y;
        const finalDist = Math.hypot(bot.lastSeenX - bot.x, bot.lastSeenY - bot.y);
        const dist = Math.hypot(dx, dy);
        bot.aimAngle = this.lerpAngle(bot.aimAngle, Math.atan2(bot.lastSeenY - bot.y, bot.lastSeenX - bot.x), Math.min(1, dt * 4.6));
        if (finalDist < 58 || now - bot.lastSeenAt > BOT_AI.searchMs) {
            bot.state = 'wander';
            bot.lastSeenX = null;
            bot.lastSeenY = null;
            bot.nextWanderAt = 0;
            return;
        }
        this.moveBotToward(bot, dx, dy, dt, 0.92);
    }

    updateBotWander(bot, dt, now) {
        const d = Math.hypot(bot.wanderX - bot.x, bot.wanderY - bot.y);
        if (now >= bot.nextWanderAt || d < 75) this.setBotWanderTarget(bot, now);
        const dx = bot.wanderX - bot.x;
        const dy = bot.wanderY - bot.y;
        bot.aimAngle = this.lerpAngle(bot.aimAngle, Math.atan2(dy, dx), Math.min(1, dt * 2.5));
        this.moveBotToward(bot, dx, dy, dt, 0.68);
    }

    setBotWanderTarget(bot, now) {
        const points = MAP.botSpawnPoints || [];
        for (let tries = 0; tries < 10; tries++) {
            let x;
            let y;
            if (points.length && Math.random() < 0.58) {
                const p = points[Math.floor(Math.random() * points.length)];
                x = p.x + (Math.random() - 0.5) * 260;
                y = p.y + (Math.random() - 0.5) * 260;
            } else {
                x = 180 + Math.random() * (WORLD.width - 360);
                y = 180 + Math.random() * (WORLD.height - 360);
            }
            if (this.canActorOccupy(x, y, bot.radius + 5, bot)) {
                bot.wanderX = x;
                bot.wanderY = y;
                break;
            }
        }
        bot.nextWanderAt = now + BOT_AI.wanderRepathMs + Math.random() * 1800;
    }


    resolveBotNavigationPoint(bot, targetX, targetY) {
        const targetHouse = this.findContainingHouse(targetX, targetY);
        const botHouse = this.findContainingHouse(bot.x, bot.y);
        if (targetHouse && (!botHouse || botHouse.id !== targetHouse.id)) {
            let best = null;
            let bestD = Infinity;
            for (const door of targetHouse.doors.filter(d => d.exterior)) {
                const d = Math.hypot(door.cx - bot.x, door.cy - bot.y);
                if (d < bestD) { bestD = d; best = door; }
            }
            if (best) return { x: best.cx, y: best.cy };
        }
        if (botHouse && (!targetHouse || targetHouse.id !== botHouse.id)) {
            let best = null;
            let bestD = Infinity;
            for (const door of botHouse.doors.filter(d => d.exterior)) {
                const d = Math.hypot(door.cx - bot.x, door.cy - bot.y);
                if (d < bestD) { bestD = d; best = door; }
            }
            if (best) return { x: best.cx, y: best.cy };
        }

        const targetContainer = this.findContainingContainer(targetX, targetY);
        const botContainer = this.findContainingContainer(bot.x, bot.y);
        if (targetContainer && (!botContainer || botContainer.id !== targetContainer.id)) return this.getContainerEntryPoint(targetContainer);
        if (botContainer && (!targetContainer || targetContainer.id !== botContainer.id)) return this.getContainerEntryPoint(botContainer);
        return { x: targetX, y: targetY };
    }

    getRetreatVector(bot, target) {
        if (!target) return { x: 0, y: 0 };
        const dx = bot.x - target.x;
        const dy = bot.y - target.y;
        const d = Math.hypot(dx, dy) || 1;
        return { x: dx / d, y: dy / d };
    }

    predictTargetPoint(target, bulletSpeed, bot) {
        const dist = Math.hypot(target.x - bot.x, target.y - bot.y);
        const travel = dist / Math.max(1, bulletSpeed);
        let vx = 0;
        let vy = 0;
        if (target.kind === 'bot') {
            vx = (target.ref.x - (target.ref.lastMoveX ?? target.ref.x)) / Math.max(0.016, 1 / 60);
            vy = (target.ref.y - (target.ref.lastMoveY ?? target.ref.y)) / Math.max(0.016, 1 / 60);
            vx = Math.max(-220, Math.min(220, vx));
            vy = Math.max(-220, Math.min(220, vy));
        }
        const leadFactor = 0.18 + bot.skill * 0.34;
        return { x: target.x + vx * travel * leadFactor, y: target.y + vy * travel * leadFactor };
    }

    tryBotFire(bot, target, now) {
        if (!bot.weapon || bot.useItem || bot.reload || now < bot.reactionUntil) return;
        const def = WEAPONS[bot.weapon.id];
        if (def.automatic && !def.burstCount) {
            if (now < bot.burstPauseUntil) return;
            if (now >= bot.burstEndsAt) {
                const burstLength = def.appearance === 'smg' ? 430 + Math.random() * 280 : 250 + Math.random() * 260;
                bot.burstEndsAt = now + burstLength;
                bot.burstPauseUntil = bot.burstEndsAt + 170 + Math.random() * 300;
            }
        }
        if (def.burstCount && now < (bot.weapon.burstPauseUntil || 0)) return;
        if (now - bot.lastShotAt < def.fireInterval) return;
        const ammoCost = def.ammoCost ?? 1;
        if (bot.weapon.loaded < ammoCost) {
            this.tryBotReload(bot, now);
            return;
        }
        const dist = Math.hypot(target.x - bot.x, target.y - bot.y);
        if (dist > BOT_AI.fireLOSRadius * (bot.scope === 8 ? 1.30 : bot.scope === 4 ? 1.15 : bot.scope === 2 ? 1.06 : 1)) return;

        bot.weapon.loaded -= ammoCost;
        bot.lastShotAt = now;
        if (def.burstCount) {
            bot.weapon.burstIndex = (bot.weapon.burstIndex || 0) + 1;
            if (bot.weapon.burstIndex >= def.burstCount) {
                bot.weapon.burstIndex = 0;
                bot.weapon.burstPauseUntil = now + (def.burstPauseMs ?? 300);
            }
        }
        bot.shotMoveScale = def.moveScale ?? 0.88;
        bot.shotSlowUntil = Math.max(bot.shotSlowUntil, now + (def.shotSlowMs ?? 120));
        const accuracyPenalty = (1 - bot.skill) * 0.085 + Math.min(0.055, dist / 10000);
        const base = bot.aimAngle + (Math.random() - 0.5) * accuracyPenalty;
        for (let i = 0; i < def.pellets; i++) {
            const spread = (Math.random() - 0.5) * 2 * def.spread + (Math.random() - 0.5) * accuracyPenalty;
            const angle = base + spread;
            const muzzle = bot.radius + def.barrel;
            const side = def.dual ? (i % 2 === 0 ? -14 : 14) : 0;
            const ox = -Math.sin(base) * side;
            const oy = Math.cos(base) * side;
            this.bullets.push({
                x: bot.x + Math.cos(angle) * muzzle + ox,
                y: bot.y + Math.sin(angle) * muzzle + oy,
                vx: Math.cos(angle) * def.bulletSpeed,
                vy: Math.sin(angle) * def.bulletSpeed,
                damage: def.damage,
                life: 0.92,
                maxLife: 0.92,
                ownerType: 'bot',
                ownerId: bot.id
            });
        }
    }

    tryBotReload(bot, now) {
        if (!bot.weapon || bot.reload || bot.useItem) return false;
        const def = WEAPONS[bot.weapon.id];
        if (bot.weapon.loaded >= def.magSize || (bot.ammo[def.ammo] || 0) <= 0) return false;
        bot.reload = { startedAt: now, endsAt: now + def.reloadMs, duration: def.reloadMs };
        return true;
    }

    botThrowFrag(bot, target, now) {
        if (bot.throwables.frag <= 0) return;
        bot.throwables.frag -= 1;
        bot.lastThrowAt = now;
        const angle = Math.atan2(target.y - bot.y, target.x - bot.x) + (Math.random() - 0.5) * 0.09;
        const dist = bot.radius + 24;
        this.throwables.push({
            type: 'frag',
            x: bot.x + Math.cos(angle) * dist,
            y: bot.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * THROWABLES.frag.speed * 0.92,
            vy: Math.sin(angle) * THROWABLES.frag.speed * 0.92,
            life: THROWABLES.frag.fuseMs / 1000,
            maxLife: THROWABLES.frag.fuseMs / 1000,
            radius: 9,
            rotation: 0,
            ownerType: 'bot',
            ownerId: bot.id
        });
    }

    tryBotHeal(bot, enemySensed, now) {
        if (bot.useItem) return true;
        if (enemySensed || now - bot.safeSince < 1900 || bot.reload) return false;
        let type = null;
        if (bot.health <= 48 && bot.heals.medkit > 0) type = 'medkit';
        else if (bot.health < 73 && bot.heals.bandage > 0) type = 'bandage';
        else if (bot.health < 92 && bot.energy < 25 && bot.heals.soda > 0) type = 'soda';
        else if (bot.health < 82 && bot.energy < 45 && bot.heals.painkiller > 0) type = 'painkiller';
        if (!type) return false;
        const heal = HEALS[type];
        bot.useItem = { subtype: type, startedAt: now, endsAt: now + heal.useMs, duration: heal.useMs };
        bot.state = 'heal';
        return true;
    }

    moveBotToward(bot, desiredX, desiredY, dt, speedFactor = 1) {
        let len = Math.hypot(desiredX, desiredY);
        if (len < 0.001 || speedFactor <= 0) return;
        let dx = desiredX / len;
        let dy = desiredY / len;
        const now = performance.now();
        if (now < bot.shotSlowUntil) speedFactor *= bot.shotMoveScale;
        if (bot.useItem) speedFactor *= HEALS[bot.useItem.subtype].moveScale;
        speedFactor *= this.getWaterMoveScale(bot.x, bot.y);

        this.maybeOpenDoorForBot(bot, dx, dy);

        const baseAngle = Math.atan2(dy, dx);
        const offsets = [0, 0.45, -0.45, 0.85, -0.85, 1.25, -1.25, 1.75, -1.75, Math.PI];
        let chosen = null;
        const probe = BOT_AI.obstacleProbe;
        for (const off of offsets) {
            const a = baseAngle + off;
            const tx = bot.x + Math.cos(a) * probe;
            const ty = bot.y + Math.sin(a) * probe;
            if (this.canActorOccupy(tx, ty, bot.radius, bot)) {
                chosen = { x: Math.cos(a), y: Math.sin(a) };
                break;
            }
        }
        if (!chosen) {
            this.unstickBot(bot);
            return;
        }

        const separation = this.getActorSeparation(bot);
        chosen.x += separation.x * 0.75;
        chosen.y += separation.y * 0.75;
        len = Math.hypot(chosen.x, chosen.y) || 1;
        chosen.x /= len;
        chosen.y /= len;

        const step = bot.speed * speedFactor * dt;
        const oldX = bot.x;
        const oldY = bot.y;
        this.moveBotWithCollision(bot, chosen.x * step, chosen.y * step);
        bot.lastMoveX = oldX;
        bot.lastMoveY = oldY;
    }

    moveBotWithCollision(bot, dx, dy) {
        const oldX = bot.x;
        bot.x += dx;
        if (!this.canActorOccupy(bot.x, bot.y, bot.radius, bot)) bot.x = oldX;
        const oldY = bot.y;
        bot.y += dy;
        if (!this.canActorOccupy(bot.x, bot.y, bot.radius, bot)) bot.y = oldY;
        bot.x = Math.max(bot.radius, Math.min(WORLD.width - bot.radius, bot.x));
        bot.y = Math.max(bot.radius, Math.min(WORLD.height - bot.radius, bot.y));
    }

    canActorOccupy(x, y, radius, actor = null) {
        if (x < radius || y < radius || x > WORLD.width - radius || y > WORLD.height - radius) return false;
        for (const t of this.trees) if (!t.dead && Math.hypot(x - t.x, y - t.y) < radius + t.trunk * t.scale + 6) return false;
        for (const r of this.rocks) if (!r.dead && Math.hypot(x - r.x, y - r.y) < radius + r.r * r.scale + 4) return false;
        for (const b of this.barrels) if (!b.dead && Math.hypot(x - b.x, y - b.y) < radius + b.r * b.scale + 4) return false;
        for (const c of this.crates) {
            if (c.dead) continue;
            const half = 38 * c.scale;
            if (this.circleAabbOverlap(x, y, radius, c.x - half, c.y - half, half * 2, half * 2)) return false;
        }
        if (this.airdrop && this.airdrop.state === 'landed' && !this.airdrop.opened && Math.hypot(x - this.airdrop.x, y - this.airdrop.y) < radius + 46) return false;
        for (const c of this.rareCrates) {
            if (c.dead) continue;
            const half = 44 * c.scale;
            if (this.circleAabbOverlap(x, y, radius, c.x - half, c.y - half, half * 2, half * 2)) return false;
        }
        for (const w of this.getContainerWalls()) if (this.circleAabbOverlap(x, y, radius, w.x, w.y, w.w, w.h)) return false;
        for (const w of this.getHousePlayerBlockers()) if (this.circleAabbOverlap(x, y, radius, w.x, w.y, w.w, w.h)) return false;
        for (const toilet of this.toilets || []) if (!toilet.dead && Math.hypot(x - toilet.x, y - toilet.y) < radius + toilet.r * toilet.scale + 4) return false;
        return true;
    }

    circleAabbOverlap(cx, cy, r, x, y, w, h) {
        const qx = Math.max(x, Math.min(cx, x + w));
        const qy = Math.max(y, Math.min(cy, y + h));
        return (cx - qx) ** 2 + (cy - qy) ** 2 < r * r;
    }

    maybeOpenDoorForBot(bot, dirX, dirY) {
        for (const house of this.houses) {
            for (const door of house.doors) {
                if (door.open) continue;
                const dx = door.cx - bot.x;
                const dy = door.cy - bot.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 82) continue;
                const dot = (dx * dirX + dy * dirY) / Math.max(1, dist);
                if (dot > 0.22) {
                    door.open = true;
                    this.rebuildHouseGeometry(house);
                    return;
                }
            }
        }
    }

    getActorSeparation(bot) {
        let sx = 0;
        let sy = 0;
        for (const other of this.bots) {
            if (other === bot || other.dead) continue;
            const dx = bot.x - other.x;
            const dy = bot.y - other.y;
            const d = Math.hypot(dx, dy);
            if (d > 0 && d < 76) {
                const force = (76 - d) / 76;
                sx += dx / d * force;
                sy += dy / d * force;
            }
        }
        const pdx = bot.x - this.player.x;
        const pdy = bot.y - this.player.y;
        const pd = Math.hypot(pdx, pdy);
        if (pd > 0 && pd < 68) {
            sx += pdx / pd * 0.8;
            sy += pdy / pd * 0.8;
        }
        return { x: sx, y: sy };
    }

    updateBotStuckRecovery(bot, dt) {
        const moved = Math.hypot(bot.x - bot.lastMoveX, bot.y - bot.lastMoveY);
        if (moved < 0.35 && (bot.state === 'wander' || bot.state === 'search' || bot.state === 'combat')) bot.stuckFor += dt;
        else bot.stuckFor = Math.max(0, bot.stuckFor - dt * 2.5);
        if (bot.stuckFor > 0.8) {
            this.unstickBot(bot);
            bot.stuckFor = 0;
            bot.nextWanderAt = 0;
            bot.strafeDir *= -1;
        }
    }

    unstickBot(bot) {
        for (let radius = 28; radius <= 150; radius += 24) {
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * TAU + Math.random() * 0.12;
                const x = bot.x + Math.cos(a) * radius;
                const y = bot.y + Math.sin(a) * radius;
                if (this.canActorOccupy(x, y, bot.radius, bot)) {
                    bot.x = x;
                    bot.y = y;
                    return true;
                }
            }
        }
        return false;
    }

    lerpAngle(a, b, t) {
        let d = ((b - a + Math.PI) % TAU) - Math.PI;
        if (d < -Math.PI) d += TAU;
        return a + d * t;
    }

    createHouse(spec, index) {
        const house = {
            id: `house-${index}`,
            x: spec.x,
            y: spec.y,
            w: spec.w ?? 920,
            h: spec.h ?? 840,
            walls: [],
            playerBlockers: [],
            bulletBlockers: [],
            doors: [],
            windows: [],
            toilets: [],
            fixedCrates: []
        };
        const W = house.w;
        const H = house.h;

        // Two exterior doors face each other, matching the reference house.
        house.doors = [
            { id: `${house.id}-door-left`, x: 0, y: 304, w: 18, h: 108, open: false, vertical: true, exterior: true, side: 'left', hinge: 'top', houseId: house.id },
            { id: `${house.id}-door-right`, x: W - 18, y: 304, w: 18, h: 108, open: false, vertical: true, exterior: true, side: 'right', hinge: 'bottom', houseId: house.id },
            { id: `${house.id}-door-room`, x: 202, y: 440, w: 104, h: 18, open: false, vertical: false, exterior: false, side: 'inner', hinge: 'left', houseId: house.id },
            { id: `${house.id}-door-bath`, x: 366, y: 580, w: 18, h: 102, open: false, vertical: true, exterior: false, side: 'inner', hinge: 'top', houseId: house.id },
            { id: `${house.id}-door-living`, x: 604, y: 526, w: 112, h: 18, open: false, vertical: false, exterior: false, side: 'inner', hinge: 'right', houseId: house.id }
        ];

        house.windows = [
            { id: `${house.id}-window-top-a`, x: 286, y: 0, w: 76, h: 18, hp: 32, maxHp: 32, broken: false, vertical: false, houseId: house.id },
            { id: `${house.id}-window-top-b`, x: 676, y: 0, w: 76, h: 18, hp: 32, maxHp: 32, broken: false, vertical: false, houseId: house.id },
            { id: `${house.id}-window-left-low`, x: 0, y: 636, w: 18, h: 82, hp: 32, maxHp: 32, broken: false, vertical: true, houseId: house.id },
            { id: `${house.id}-window-right-low`, x: W - 18, y: 636, w: 18, h: 82, hp: 32, maxHp: 32, broken: false, vertical: true, houseId: house.id }
        ];

        house.toilets = [
            { id: `${house.id}-toilet-0`, houseId: house.id, x: house.x - W / 2 + 470, y: house.y - H / 2 + 700, hp: 68, maxHp: 68, r: 31, dead: false, scale: 1 }
        ];

        // Fixed, hand-authored loot-object positions. These are the only normal crates that may exist inside the house.
        house.fixedCrates = [
            { x: house.x - W / 2 + 198, y: house.y - H / 2 + 570, loot: 'houseRoom' },
            { x: house.x - W / 2 + 265, y: house.y - H / 2 + 660, loot: 'houseRoom2' },
            { x: house.x - W / 2 + 735, y: house.y - H / 2 + 626, loot: 'houseLiving' }
        ];
        this.rebuildHouseGeometry(house);
        return house;
    }

    rebuildHouseGeometry(house) {
        const W = house.w;
        const H = house.h;
        const thick = 18;
        const left = house.x - W / 2;
        const top = house.y - H / 2;
        const walls = [];
        const playerBlockers = [];
        const bulletBlockers = [];
        const addRect = (list, x, y, w, h, extra = {}) => list.push({ x: left + x, y: top + y, w, h, houseId: house.id, ...extra });
        const addWall = (x, y, w, h, extra = {}) => {
            addRect(walls, x, y, w, h, extra);
            addRect(playerBlockers, x, y, w, h, extra);
            addRect(bulletBlockers, x, y, w, h, extra);
        };

        // Outer shell. Each opening is explicitly cut out instead of painting a solid shell on top.
        addWall(0, 0, 286, thick, { outer: true });
        addWall(362, 0, 314, thick, { outer: true });
        addWall(752, 0, W - 752, thick, { outer: true });
        addWall(0, 0, thick, 304, { outer: true });
        addWall(0, 412, thick, 224, { outer: true });
        addWall(0, 718, thick, H - 718, { outer: true });
        addWall(W - thick, 0, thick, 304, { outer: true });
        addWall(W - thick, 412, thick, 224, { outer: true });
        addWall(W - thick, 718, thick, H - 718, { outer: true });
        addWall(0, H - thick, W, thick, { outer: true });

        // Hand-authored interior: a large top room and three connected lower areas.
        addWall(18, 440, 184, thick, { inner: true });
        addWall(306, 440, 78, thick, { inner: true });
        addWall(384, 440, 220, thick, { inner: true });
        addWall(716, 440, W - 734, thick, { inner: true });

        addWall(366, 458, thick, 122, { inner: true });
        addWall(366, 682, thick, H - 700, { inner: true });

        addWall(384, 526, 220, thick, { inner: true });
        addWall(716, 526, W - 734, thick, { inner: true });
        addWall(604, 544, thick, H - 562, { inner: true });

        for (const door of house.doors) {
            door.wx = left + door.x;
            door.wy = top + door.y;
            door.cx = door.wx + door.w / 2;
            door.cy = door.wy + door.h / 2;
            if (!door.open) {
                addRect(playerBlockers, door.x, door.y, door.w, door.h, { type: 'door', ref: door });
                addRect(bulletBlockers, door.x, door.y, door.w, door.h, { type: 'door', ref: door });
            }
        }

        for (const win of house.windows) {
            win.wx = left + win.x;
            win.wy = top + win.y;
            win.cx = win.wx + win.w / 2;
            win.cy = win.wy + win.h / 2;
            addRect(playerBlockers, win.x, win.y, win.w, win.h, { type: 'window', ref: win });
            if (!win.broken) addRect(bulletBlockers, win.x, win.y, win.w, win.h, { type: 'window', ref: win });
        }

        house.walls = walls;
        house.playerBlockers = playerBlockers;
        house.bulletBlockers = bulletBlockers;
    }

    circleOverlapsAnyHouse(x, y, radius, margin = 24) {
        for (const house of this.houses) {
            const left = house.x - house.w / 2 - margin;
            const top = house.y - house.h / 2 - margin;
            const right = house.x + house.w / 2 + margin;
            const bottom = house.y + house.h / 2 + margin;
            const cx = Math.max(left, Math.min(x, right));
            const cy = Math.max(top, Math.min(y, bottom));
            if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) return true;
        }
        return false;
    }

    rectOverlapsAnyHouse(x, y, w, h, margin = 24) {
        for (const house of this.houses) {
            const hx = house.x - house.w / 2 - margin;
            const hy = house.y - house.h / 2 - margin;
            const hw = house.w + margin * 2;
            const hh = house.h + margin * 2;
            if (x < hx + hw && x + w > hx && y < hy + hh && y + h > hy) return true;
        }
        return false;
    }

    isInWater(x, y) {
        for (const lake of MAP.lakes || []) {
            const cos = Math.cos(-(lake.rotation || 0));
            const sin = Math.sin(-(lake.rotation || 0));
            const dx = x - lake.x;
            const dy = y - lake.y;
            const lx = dx * cos - dy * sin;
            const ly = dx * sin + dy * cos;
            if ((lx * lx) / (lake.rx * lake.rx) + (ly * ly) / (lake.ry * lake.ry) <= 1) return lake;
        }
        return null;
    }

    getWaterMoveScale(x, y) {
        const lake = this.isInWater(x, y);
        return lake ? (lake.slowScale ?? 0.6) : 1;
    }

    getHousePlayerBlockers() {
        return this.houses.flatMap(h => h.playerBlockers);
    }

    getHouseBulletBlockers() {
        return this.houses.flatMap(h => h.bulletBlockers);
    }

    getExteriorHouseDoorPoints(house) {
        return house.doors.filter(d => d.exterior).map(d => ({ x: d.cx, y: d.cy }));
    }


    start() {
        this.injectDom();
        this.bindEvents();
        this.resizeObserver = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            this.renderer.resize(rect.width, rect.height);
            if (this.mouse.x === 0 && this.mouse.y === 0) {
                this.mouse.x = rect.width * 0.65;
                this.mouse.y = rect.height * 0.5;
            }
        });
        this.resizeObserver.observe(this.root);
        const rect = this.root.getBoundingClientRect();
        this.renderer.resize(rect.width, rect.height);
        this.running = true;
        this.lastFrame = performance.now();
        this.raf = requestAnimationFrame(t => this.loop(t));
    }

    injectDom() {
        this.root = document.createElement('div');
        this.root.className = 'surviv-clone-root';
        this.root.innerHTML = `
            <style>
                .surviv-clone-root {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 540px;
                    overflow: hidden;
                    background: #83b64d;
                    user-select: none;
                    cursor: none;
                    font-family: Arial, Helvetica, sans-serif;
                }
                .surviv-clone-root canvas {
                    display: block;
                    width: 100%;
                    height: 100%;
                    touch-action: none;
                }
                .surviv-clone-help {
                    position: absolute;
                    left: 50%;
                    top: 66px;
                    transform: translateX(-50%);
                    background: rgba(42, 69, 30, .72);
                    color: rgba(255,255,255,.86);
                    padding: 6px 10px;
                    border-radius: 4px;
                    font: 700 12px/1 Arial, sans-serif;
                    pointer-events: none;
                    opacity: .75;
                    transition: opacity .25s ease;
                    white-space: nowrap;
                    animation: survivHelpFade 4.5s ease forwards;
                }
                @keyframes survivHelpFade {
                    0%, 55% { opacity: .65; }
                    100% { opacity: 0; visibility: hidden; }
                }
                .surviv-clone-root:focus-within .surviv-clone-help { opacity: .18; }
                .surviv-mode-overlay {
                    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
                    background:rgba(18,29,13,.55); z-index:20; cursor:default;
                }
                .surviv-mode-card {
                    width:min(520px, calc(100% - 48px)); padding:26px; border:4px solid rgba(24,35,17,.95);
                    background:rgba(76,112,48,.97); border-radius:8px; color:#fff; box-shadow:0 14px 40px rgba(0,0,0,.32);
                    text-align:center;
                }
                .surviv-mode-card h2 { margin:0 0 8px; font-size:30px; }
                .surviv-mode-card p { margin:0 0 20px; opacity:.9; line-height:1.35; }
                .surviv-mode-result { min-height:24px; margin-bottom:12px; font-weight:800; color:#ffe7a2; font-size:18px; }
                .surviv-mode-buttons { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
                .surviv-mode-buttons button {
                    border:3px solid rgba(31,47,21,.95); border-radius:6px; padding:18px 12px; cursor:pointer;
                    background:#86b956; color:#fff; font:800 19px/1 Arial,sans-serif; box-shadow:inset 0 -4px rgba(0,0,0,.12);
                }
                .surviv-mode-buttons button:hover { background:#96c964; transform:translateY(-1px); }
                .surviv-mode-buttons small { display:block; margin-top:7px; font-size:12px; font-weight:600; opacity:.82; }
            </style>
            <canvas aria-label="Surviv clone game canvas"></canvas>
            <div class="surviv-clone-help">WASD · Linksklick · F aufnehmen · R nachladen · B Bot spawnen (Spielwiese) · 1/2 Waffen · 3 Fäuste · 4 Frag · 7/8/9/0 Heals</div>
            <div class="surviv-mode-overlay">
                <div class="surviv-mode-card">
                    <h2>Surviv Clone</h2>
                    <div class="surviv-mode-result"></div>
                    <p>Wähle einen Modus. Battle Royale startet mit dir und 11 Bots – alle nur mit Fäusten.</p>
                    <div class="surviv-mode-buttons">
                        <button type="button" data-mode="sandbox">Spielwiese<small>Freies Testen · B spawnt Bots</small></button>
                        <button type="button" data-mode="battleRoyale">Battle Royale<small>12 Spieler · Zone · AirDrops</small></button>
                    </div>
                </div>
            </div>
        `;
        this.canvas = this.root.querySelector('canvas');
        this.canvas.tabIndex = 0;
        this.modeOverlay = this.root.querySelector('.surviv-mode-overlay');
        this.modeOverlay?.querySelectorAll('[data-mode]').forEach(button => {
            button.addEventListener('click', () => this.startMode(button.dataset.mode));
        });
        this.renderer = new Renderer(this, this.canvas);
        this.container.appendChild(this.root);
        requestAnimationFrame(() => this.canvas.focus());
    }

    bindEvents() {
        window.addEventListener('keydown', this.bound.keydown);
        window.addEventListener('keyup', this.bound.keyup);
        window.addEventListener('blur', this.bound.blur);
        this.canvas.addEventListener('mousemove', this.bound.mousemove);
        this.canvas.addEventListener('mousedown', this.bound.mousedown);
        window.addEventListener('mouseup', this.bound.mouseup);
        this.canvas.addEventListener('wheel', this.bound.wheel, { passive: false });
        this.canvas.addEventListener('contextmenu', this.bound.contextmenu);
    }

    onKeyDown(e) {
        if (!this.roundActive) return;
        const blockKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyR', 'KeyX', 'KeyB', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
        if (blockKeys.includes(e.code)) e.preventDefault();
        this.keys.add(e.code);
        if (e.repeat && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) return;

        if (e.code === 'Digit1') this.switchSlot(0);
        if (e.code === 'Digit2') this.switchSlot(1);
        if (e.code === 'Digit3') this.switchSlot(2);
        if (e.code === 'Digit4') this.switchSlot(3);
        if (e.code === 'KeyF') this.pickupNearest();
        if (e.code === 'KeyR') this.tryReload(performance.now());
        if (e.code === 'KeyX') this.cancelAction();
        if (e.code === 'KeyB' && this.mode === 'sandbox') this.spawnBot({ unarmed: true });
        if (e.code === 'Digit7') this.startUseHeal('bandage', performance.now());
        if (e.code === 'Digit8') this.startUseHeal('medkit', performance.now());
        if (e.code === 'Digit9') this.startUseHeal('soda', performance.now());
        if (e.code === 'Digit0') this.startUseHeal('painkiller', performance.now());
    }

    onKeyUp(e) {
        this.keys.delete(e.code);
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        this.canvas.focus();
        if (this.handleUiClick(this.mouse.x, this.mouse.y)) return;
        this.mouse.down = true;
        this.mouse.justPressed = true;
        if (this.player.useItem) this.player.useItem = null;
    }

    onMouseUp(e) {
        if (e.button === 0) this.mouse.down = false;
    }

    onWheel(e) {
        e.preventDefault();
        this.cycleSlot(e.deltaY > 0 ? 1 : -1);
    }

    onBlur() {
        this.keys.clear();
        this.mouse.down = false;
    }

    handleUiClick(x, y) {
        if (!this.roundActive) return true;
        const scopeButtons = this.getScopeButtons();
        for (const btn of scopeButtons) {
            const dx = x - btn.x;
            const dy = y - btn.y;
            if (dx * dx + dy * dy <= btn.r * btn.r) {
                this.player.activeScope = btn.scope;
                return true;
            }
        }

        for (const box of this.getWeaponSlotRects()) {
            if (this.pointInRect(x, y, box.x, box.y, box.w, box.h)) {
                this.switchSlot(box.slotIndex);
                return true;
            }
        }

        for (const box of this.getHealHudRects()) {
            if (this.pointInRect(x, y, box.x, box.y, box.w, box.h)) {
                this.startUseHeal(box.type, performance.now());
                return true;
            }
        }

        const cancel = this.getCancelActionRect();
        if (cancel && this.pointInRect(x, y, cancel.x, cancel.y, cancel.w, cancel.h)) {
            this.cancelAction();
            return true;
        }
        return false;
    }

    pointInRect(px, py, x, y, w, h) {
        return px >= x && px <= x + w && py >= y && py <= y + h;
    }

    getScopeButtons() {
        const held = [...this.player.scopes].sort((a, b) => a - b);
        const gap = 88;
        const start = this.renderer.width / 2 - ((held.length - 1) * gap) / 2;
        return held.map((scope, index) => ({ scope, x: start + index * gap, y: 40, r: 38 }));
    }

    getWeaponSlotRects() {
        const x = this.renderer.width - 292;
        const baseY = this.renderer.height - 330;
        return [0, 1, 2, 3].map(i => ({ slotIndex: i, x, y: baseY + i * 72 - 32, w: 280, h: 64 }));
    }

    getHealHudRects() {
        const compact = this.renderer.height < 940;
        const x = this.renderer.width - 80;
        const y0 = compact ? 175 : 210;
        const gap = compact ? 58 : 62;
        return ['bandage', 'medkit', 'soda', 'painkiller'].map((type, i) => ({ type, x: x - 36, y: y0 + i * gap - 28, w: 72, h: 58 }));
    }

    getCancelActionRect() {
        const state = this.getCurrentActionState(performance.now());
        if (!state) return null;
        const p = this.renderer.worldToScreen(this.player.x, this.player.y);
        const y = p.y + 54;
        return { x: p.x - 58, y: y, w: 116, h: 34 };
    }

    loop(now) {
        if (!this.running) return;
        const dt = Math.min(0.033, Math.max(0.001, (now - this.lastFrame) / 1000));
        this.lastFrame = now;

        this.update(dt, now);
        this.renderer.render(now);
        this.mouse.justPressed = false;
        this.raf = requestAnimationFrame(t => this.loop(t));
    }

    update(dt, now) {
        if (!this.roundActive) return;
        this.updateAim();
        this.updateTimedActions(now);
        if (this.mode === 'sandbox') this.updatePlayerRespawn(now);
        this.updateEnergy(dt);
        this.updatePlayer(dt);
        this.updateBots(dt, now);
        this.updateCombat(now);
        this.updateBullets(dt);
        this.updateThrowables(dt, now);
        this.updateLootMotion(dt);
        this.updateParticles(dt);
        this.updateExplosions(dt);
        this.updatePickupCandidate();
        this.updateVisibleContainer();
        this.updateCamera(dt);
        this.notifications = this.notifications.filter(n => n.until > now);
        this.updateBattleRoyale(dt, now);
    }

    updateAim() {
        const target = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
        this.player.aimAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    }

    updateTimedActions(now) {
        const p = this.player;
        if (p.reload && now >= p.reload.endsAt) {
            const slot = p.weaponSlots[p.reload.slotIndex];
            if (slot && slot.id === p.reload.weaponId) {
                const def = WEAPONS[slot.id];
                const need = def.magSize - slot.loaded;
                const take = Math.min(need, p.ammo[def.ammo]);
                slot.loaded += take;
                p.ammo[def.ammo] -= take;
            }
            p.reload = null;
        }

        if (p.useItem && now >= p.useItem.endsAt) {
            const heal = HEALS[p.useItem.subtype];
            if (p.heals[p.useItem.subtype] > 0) {
                p.heals[p.useItem.subtype] -= 1;
                if (heal.hp > 0) {
                    if (p.useItem.subtype === 'medkit') p.health = Math.min(p.maxHealth, p.health + heal.hp);
                    else p.health = Math.min(heal.hpCap, p.health + heal.hp);
                }
                if (heal.energyGain > 0) p.energy = Math.min(ENERGY_RULES.max, p.energy + heal.energyGain);
            }
            p.useItem = null;
        }
    }


    updatePlayerRespawn(now) {
        if (this.mode !== 'sandbox' || !this.player.dead || now < this.player.respawnAt) return;
        this.player.dead = false;
        this.player.health = this.player.maxHealth;
        this.player.energy = 0;
        this.player.x = MAP.spawn.x;
        this.player.y = MAP.spawn.y;
        this.player.reload = null;
        this.player.useItem = null;
        this.player.activeSlot = this.player.weaponSlots[0] ? 0 : 2;
    }

    updateEnergy(dt) {
        const p = this.player;
        if (p.energy > 0) p.energy = Math.max(0, p.energy - ENERGY_RULES.decayPerSecond * dt);
        if (p.health < p.maxHealth && p.energy > 0) {
            const tier = p.energy >= 76 ? 4 : p.energy >= 51 ? 3 : p.energy >= 26 ? 2 : 1;
            p.health = Math.min(p.maxHealth, p.health + ENERGY_RULES.regenPerSecond[tier] * dt);
        }
    }

    updatePlayer(dt) {
        if (this.player.dead) return;
        let dx = 0;
        let dy = 0;
        if (this.keys.has('KeyA')) dx -= 1;
        if (this.keys.has('KeyD')) dx += 1;
        if (this.keys.has('KeyW')) dy -= 1;
        if (this.keys.has('KeyS')) dy += 1;
        if (dx || dy) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;
            let speedScale = 1;
            if (this.player.useItem) speedScale *= HEALS[this.player.useItem.subtype].moveScale;
            if (performance.now() < this.player.shotSlowUntil) speedScale *= this.player.shotMoveScale;
            speedScale *= this.getWaterMoveScale(this.player.x, this.player.y);
            const step = this.player.speed * speedScale * dt;
            this.movePlayer(dx * step, dy * step);
        }
    }

    movePlayer(dx, dy) {
        const p = this.player;
        p.x += dx;
        this.resolvePlayerCollisions('x', dx);
        p.y += dy;
        this.resolvePlayerCollisions('y', dy);
        p.x = Math.max(p.radius, Math.min(WORLD.width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(WORLD.height - p.radius, p.y));
    }

    resolvePlayerCollisions(axis, delta) {
        const p = this.player;
        for (const t of this.trees) if (!t.dead) this.resolveCircleCollision(p, t.x, t.y, t.trunk * t.scale + 8, axis, delta);
        for (const r of this.rocks) if (!r.dead) this.resolveCircleCollision(p, r.x, r.y, r.r * r.scale + 5, axis, delta);
        for (const b of this.barrels) if (!b.dead) this.resolveCircleCollision(p, b.x, b.y, b.r * b.scale + 4, axis, delta);
        for (const rc of this.rareCrates) {
            if (!rc.dead) {
                const half = 44 * rc.scale;
                this.resolveCircleAabb(p, rc.x - half, rc.y - half, half * 2, half * 2, axis, delta);
            }
        }
        for (const c of this.crates) {
            if (!c.dead) {
                const half = 38 * c.scale;
                this.resolveCircleAabb(p, c.x - half, c.y - half, half * 2, half * 2, axis, delta);
            }
        }
        for (const wall of this.getContainerWalls()) this.resolveCircleAabb(p, wall.x, wall.y, wall.w, wall.h, axis, delta);
        for (const wall of this.getHousePlayerBlockers()) this.resolveCircleAabb(p, wall.x, wall.y, wall.w, wall.h, axis, delta);
        for (const toilet of this.toilets) if (!toilet.dead) this.resolveCircleCollision(p, toilet.x, toilet.y, toilet.r * toilet.scale + 5, axis, delta);
        for (const bot of this.bots) if (!bot.dead) this.resolveCircleCollision(p, bot.x, bot.y, bot.radius + 2, axis, delta);
    }

    resolveCircleCollision(p, cx, cy, obstacleR, axis, delta) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const min = p.radius + obstacleR;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) return;
        if (axis === 'x') p.x -= delta;
        else p.y -= delta;
    }

    resolveCircleAabb(p, x, y, w, h, axis, delta) {
        const closestX = Math.max(x, Math.min(p.x, x + w));
        const closestY = Math.max(y, Math.min(p.y, y + h));
        const dx = p.x - closestX;
        const dy = p.y - closestY;
        if (dx * dx + dy * dy < p.radius * p.radius) {
            if (axis === 'x') p.x -= delta;
            else p.y -= delta;
        }
    }

    getContainerWalls() {
        const walls = [];
        const thick = 18;
        const opening = 94;
        for (const c of this.containers) {
            walls.push({ x: c.x - c.w / 2, y: c.y - c.h / 2, w: c.w, h: thick, containerId: c.id });
            walls.push({ x: c.x - c.w / 2, y: c.y + c.h / 2 - thick, w: c.w, h: thick, containerId: c.id });
            const seg = (c.h - opening) / 2;
            if (c.opening === 'left') {
                walls.push({ x: c.x - c.w / 2, y: c.y - c.h / 2, w: thick, h: seg, containerId: c.id });
                walls.push({ x: c.x - c.w / 2, y: c.y + opening / 2, w: thick, h: seg, containerId: c.id });
                walls.push({ x: c.x + c.w / 2 - thick, y: c.y - c.h / 2, w: thick, h: c.h, containerId: c.id });
            } else {
                walls.push({ x: c.x + c.w / 2 - thick, y: c.y - c.h / 2, w: thick, h: seg, containerId: c.id });
                walls.push({ x: c.x + c.w / 2 - thick, y: c.y + opening / 2, w: thick, h: seg, containerId: c.id });
                walls.push({ x: c.x - c.w / 2, y: c.y - c.h / 2, w: thick, h: c.h, containerId: c.id });
            }
        }
        return walls;
    }

    updateCombat(now) {
        if (this.player.dead) return;
        const active = this.getActiveWeapon();
        if (active) {
            const def = WEAPONS[active.id];
            const wantsFire = def.automatic ? this.mouse.down : this.mouse.justPressed;
            if (wantsFire) this.tryFire(now, active, def);
        } else if (this.player.activeSlot === 2 && this.mouse.justPressed) {
            this.punch(now);
        } else if (this.player.activeSlot === 3 && this.mouse.justPressed) {
            this.throwFrag(now);
        }
    }

    tryFire(now, slot, def) {
        if (this.player.useItem) this.player.useItem = null;
        if (this.player.reload) return;
        if (def.burstCount && now < (slot.burstPauseUntil || 0)) return;
        if (now - this.player.lastShotAt < def.fireInterval) return;
        const ammoCost = def.ammoCost ?? 1;
        if (slot.loaded < ammoCost) {
            this.tryReload(now);
            return;
        }

        slot.loaded -= ammoCost;
        this.player.lastShotAt = now;
        this.player.shotMoveScale = def.moveScale ?? 0.9;
        this.player.shotSlowUntil = Math.max(this.player.shotSlowUntil, now + (def.shotSlowMs ?? 120));
        if (def.burstCount) {
            slot.burstIndex = (slot.burstIndex || 0) + 1;
            if (slot.burstIndex >= def.burstCount) {
                slot.burstIndex = 0;
                slot.burstPauseUntil = now + (def.burstPauseMs ?? 300);
            }
        }
        const base = this.player.aimAngle;
        for (let i = 0; i < def.pellets; i++) {
            const spread = (Math.random() - 0.5) * 2 * def.spread;
            const angle = base + spread;
            const muzzle = this.player.radius + def.barrel;
            const side = def.dual ? (i % 2 === 0 ? -14 : 14) : 0;
            const ox = -Math.sin(base) * side;
            const oy = Math.cos(base) * side;
            this.bullets.push({
                x: this.player.x + Math.cos(angle) * muzzle + ox,
                y: this.player.y + Math.sin(angle) * muzzle + oy,
                vx: Math.cos(angle) * def.bulletSpeed,
                vy: Math.sin(angle) * def.bulletSpeed,
                damage: def.damage,
                life: 0.92,
                maxLife: 0.92,
                ownerType: 'player',
                ownerId: 'player'
            });
        }
    }

    punch(now) {
        if (this.player.useItem) this.player.useItem = null;
        if (now - this.player.lastPunchAt < 340) return;
        this.player.lastPunchAt = now;
        const hitX = this.player.x + Math.cos(this.player.aimAngle) * 68;
        const hitY = this.player.y + Math.sin(this.player.aimAngle) * 68;
        let best = null;
        let bestD2 = Infinity;
        const targets = [];
        for (const crate of this.crates) if (!crate.dead) targets.push({ type: 'crate', obj: crate, reach: 78 });
        for (const crate of this.rareCrates) if (!crate.dead) targets.push({ type: 'rareCrate', obj: crate, reach: 88 });
        for (const barrel of this.barrels) if (!barrel.dead) targets.push({ type: 'barrel', obj: barrel, reach: barrel.r * barrel.scale + 28 });
        for (const tree of this.trees) if (!tree.dead) targets.push({ type: 'tree', obj: tree, reach: tree.trunk * tree.scale + 24 });
        for (const rock of this.rocks) if (!rock.dead) targets.push({ type: 'rock', obj: rock, reach: rock.r * rock.scale + 22 });
        for (const toilet of this.toilets) if (!toilet.dead) targets.push({ type: 'toilet', obj: toilet, reach: toilet.r * toilet.scale + 22 });
        for (const bot of this.bots) if (!bot.dead) targets.push({ type: 'bot', obj: bot, reach: bot.radius + 36 });
        if (this.airdrop && this.airdrop.state === 'landed' && !this.airdrop.opened) targets.push({ type: 'airdrop', obj: this.airdrop, reach: 88 });

        for (const entry of targets) {
            const ox = entry.obj.x;
            const oy = entry.obj.y;
            const d2 = (ox - hitX) ** 2 + (oy - hitY) ** 2;
            if (d2 < entry.reach ** 2 && d2 < bestD2) {
                best = entry;
                bestD2 = d2;
            }
        }

        if (!best) return;
        if (best.type === 'crate') this.damageCrate(best.obj, 36, this.player.aimAngle);
        if (best.type === 'rareCrate') this.damageRareCrate(best.obj, 30, this.player.aimAngle);
        if (best.type === 'barrel') this.damageBarrel(best.obj, 34, this.player.aimAngle);
        if (best.type === 'tree') this.damageTree(best.obj, 34, this.player.aimAngle);
        if (best.type === 'rock') this.damageRock(best.obj, 28, this.player.aimAngle);
        if (best.type === 'toilet') this.damageToilet(best.obj, 32, this.player.aimAngle);
        if (best.type === 'bot') this.damageBot(best.obj, 24, this.player.aimAngle, 'player', 'player');
        if (best.type === 'airdrop') this.damageAirdrop(best.obj, 34, this.player.aimAngle);
    }

    throwFrag(now) {
        if (this.player.throwables.frag <= 0) return;
        if (now - this.player.lastThrowAt < THROWABLES.frag.throwCooldown) return;
        this.player.lastThrowAt = now;
        this.player.throwables.frag -= 1;
        const emptyAfterThrow = this.player.throwables.frag <= 0;
        const angle = this.player.aimAngle;
        const dist = this.player.radius + 26;
        this.throwables.push({
            type: 'frag',
            x: this.player.x + Math.cos(angle) * dist,
            y: this.player.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * THROWABLES.frag.speed,
            vy: Math.sin(angle) * THROWABLES.frag.speed,
            life: THROWABLES.frag.fuseMs / 1000,
            maxLife: THROWABLES.frag.fuseMs / 1000,
            radius: 9,
            rotation: 0,
            ownerType: 'player',
            ownerId: 'player'
        });
        if (emptyAfterThrow) this.player.activeSlot = 2;
    }

    tryReload(now) {
        const slot = this.getActiveWeapon();
        if (!slot || this.player.reload || this.player.useItem) return false;
        const def = WEAPONS[slot.id];
        if (slot.loaded >= def.magSize) return false;
        if (this.player.ammo[def.ammo] <= 0) return false;
        this.player.reload = {
            slotIndex: this.player.activeSlot,
            weaponId: slot.id,
            duration: def.reloadMs,
            endsAt: now + def.reloadMs,
            startedAt: now
        };
        return true;
    }

    startUseHeal(type, now) {
        const p = this.player;
        const heal = HEALS[type];
        if (!heal || p.heals[type] <= 0 || p.reload) return false;
        if (type === 'bandage' && p.health >= 75) return false;
        if (type === 'medkit' && p.health >= p.maxHealth) return false;
        if ((type === 'soda' || type === 'painkiller') && p.energy >= ENERGY_RULES.max) return false;
        p.useItem = {
            type: 'heal',
            subtype: type,
            duration: heal.useMs,
            startedAt: now,
            endsAt: now + heal.useMs
        };
        return true;
    }

    cancelAction() {
        this.player.reload = null;
        this.player.useItem = null;
    }

    switchSlot(index) {
        if (index < 2 && !this.player.weaponSlots[index]) return;
        if (index === 3 && this.player.throwables.frag <= 0) return;
        if (this.player.activeSlot !== index) this.cancelAction();
        this.player.activeSlot = index;
    }

    cycleSlot(dir) {
        const order = [0, 1, 2, 3];
        let idx = order.indexOf(this.player.activeSlot);
        for (let i = 0; i < order.length; i++) {
            idx = (idx + dir + order.length) % order.length;
            const slot = order[idx];
            if (slot === 0 || slot === 1) {
                if (this.player.weaponSlots[slot]) { this.switchSlot(slot); return; }
            } else if (slot === 2) {
                this.switchSlot(2); return;
            } else if (slot === 3 && this.player.throwables.frag > 0) {
                this.switchSlot(3); return;
            }
        }
    }

    getActiveWeapon() {
        if (this.player.activeSlot !== 0 && this.player.activeSlot !== 1) return null;
        return this.player.weaponSlots[this.player.activeSlot];
    }

    updateBullets(dt) {
        const next = [];
        for (const bullet of this.bullets) {
            const startX = bullet.x;
            const startY = bullet.y;
            const endX = bullet.x + bullet.vx * dt;
            const endY = bullet.y + bullet.vy * dt;
            const travel = Math.hypot(endX - startX, endY - startY);
            const steps = Math.max(1, Math.ceil(travel / 16));
            let hit = false;
            let hitX = endX;
            let hitY = endY;

            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;
                if (x < 0 || y < 0 || x > WORLD.width || y > WORLD.height) {
                    hit = true;
                    hitX = x; hitY = y;
                    break;
                }

                const actorHit = this.findActorAtPoint(x, y, bullet.ownerType, bullet.ownerId);
                if (actorHit) {
                    hit = true;
                    hitX = x; hitY = y;
                    const angle = Math.atan2(bullet.vy, bullet.vx);
                    if (actorHit.kind === 'player') this.damagePlayer(bullet.damage, angle, bullet.ownerType, bullet.ownerId);
                    else this.damageBot(actorHit.ref, bullet.damage, angle, bullet.ownerType, bullet.ownerId);
                    break;
                }

                const collision = this.findStaticBulletCollision(x, y);
                if (collision) {
                    hit = true;
                    hitX = x; hitY = y;
                    const angle = Math.atan2(bullet.vy, bullet.vx);
                    if (collision.type === 'crate') this.damageCrate(collision.obj, bullet.damage, angle);
                    if (collision.type === 'rareCrate') this.damageRareCrate(collision.obj, bullet.damage, angle);
                    if (collision.type === 'barrel') this.damageBarrel(collision.obj, bullet.damage, angle);
                    if (collision.type === 'tree') this.damageTree(collision.obj, bullet.damage, angle);
                    if (collision.type === 'rock') this.damageRock(collision.obj, bullet.damage, angle);
                    if (collision.type === 'airdrop') this.damageAirdrop(collision.obj, bullet.damage, angle);
                    if (collision.type === 'window') this.damageWindow(collision.obj, bullet.damage, angle);
                    if (collision.type === 'toilet') this.damageToilet(collision.obj, bullet.damage, angle);
                    break;
                }
            }

            bullet.x = hitX;
            bullet.y = hitY;
            bullet.life -= dt;
            if (!hit && bullet.life > 0) next.push(bullet);
            else if (!hit || !this.findActorAtPoint(hitX, hitY, bullet.ownerType, bullet.ownerId)) this.spawnImpact(hitX, hitY);
        }
        this.bullets = next;
    }


    updateThrowables(dt) {
        const next = [];
        for (const grenade of this.throwables) {
            const oldX = grenade.x;
            const oldY = grenade.y;
            grenade.x += grenade.vx * dt;
            grenade.y += grenade.vy * dt;
            grenade.vx *= Math.pow(THROWABLES.frag.drag ?? 0.42, dt);
            grenade.vy *= Math.pow(THROWABLES.frag.drag ?? 0.42, dt);
            grenade.rotation += dt * 8;
            grenade.life -= dt;
            if (grenade.life <= 0) {
                this.explodeGrenade(grenade);
                continue;
            }
            const staticHit = this.findStaticBulletCollision(grenade.x, grenade.y);
            if (staticHit) {
                grenade.x = oldX;
                grenade.y = oldY;
                grenade.vx *= -(THROWABLES.frag.bounce + 0.18);
                grenade.vy *= -(THROWABLES.frag.bounce + 0.18);
            }
            if (grenade.x < 10 || grenade.x > WORLD.width - 10) grenade.vx *= -THROWABLES.frag.bounce;
            if (grenade.y < 10 || grenade.y > WORLD.height - 10) grenade.vy *= -THROWABLES.frag.bounce;
            next.push(grenade);
        }
        this.throwables = next;
    }

    updateExplosions(dt) {
        const next = [];
        for (const e of this.explosions) {
            e.life -= dt;
            if (e.life > 0) next.push(e);
        }
        this.explosions = next;
    }

    explodeGrenade(grenade) {
        this.explosions.push({ x: grenade.x, y: grenade.y, radius: THROWABLES.frag.radius, life: 0.36, maxLife: 0.36 });
        for (let i = 0; i < 26; i++) {
            const a = Math.random() * TAU;
            const speed = 60 + Math.random() * 260;
            const color = Math.random() < 0.7 ? '#f0d07e' : '#3e3e3e';
            this.particles.push({
                x: grenade.x, y: grenade.y,
                vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
                life: 0.25 + Math.random() * 0.4, maxLife: 0.65,
                size: 4 + Math.random() * 7, color
            });
        }
        this.damageCircle(grenade.x, grenade.y, THROWABLES.frag.radius, THROWABLES.frag.damage, grenade.ownerType, grenade.ownerId);
    }

    damageCircle(x, y, radius, maxDamage, ownerType = null, ownerId = null) {
        if (this.airdrop && this.airdrop.state === 'landed' && !this.airdrop.opened) {
            const d = Math.hypot(this.airdrop.x - x, this.airdrop.y - y);
            if (d <= radius + 46) this.damageAirdrop(this.airdrop, Math.max(10, maxDamage * (1 - d / (radius + 46))), Math.atan2(this.airdrop.y - y, this.airdrop.x - x));
        }
        for (const crate of this.crates) {
            if (crate.dead) continue;
            const d = Math.hypot(crate.x - x, crate.y - y);
            if (d <= radius + 25) this.damageCrate(crate, Math.max(10, maxDamage * (1 - d / (radius + 25))), Math.atan2(crate.y - y, crate.x - x));
        }
        for (const crate of this.rareCrates) {
            if (crate.dead) continue;
            const d = Math.hypot(crate.x - x, crate.y - y);
            if (d <= radius + 34) this.damageRareCrate(crate, Math.max(10, maxDamage * (1 - d / (radius + 34))), Math.atan2(crate.y - y, crate.x - x));
        }
        for (const barrel of this.barrels) {
            if (barrel.dead) continue;
            const d = Math.hypot(barrel.x - x, barrel.y - y);
            if (d <= radius + barrel.r) this.damageBarrel(barrel, Math.max(15, maxDamage * (1 - d / (radius + barrel.r))), Math.atan2(barrel.y - y, barrel.x - x));
        }
        for (const tree of this.trees) {
            if (tree.dead) continue;
            const d = Math.hypot(tree.x - x, tree.y - y);
            if (d <= radius + tree.trunk) this.damageTree(tree, Math.max(8, maxDamage * 0.65 * (1 - d / (radius + tree.trunk))), Math.atan2(tree.y - y, tree.x - x));
        }
        for (const rock of this.rocks) {
            if (rock.dead) continue;
            const d = Math.hypot(rock.x - x, rock.y - y);
            if (d <= radius + rock.r) this.damageRock(rock, Math.max(8, maxDamage * 0.6 * (1 - d / (radius + rock.r))), Math.atan2(rock.y - y, rock.x - x));
        }
        for (const toilet of this.toilets) {
            if (toilet.dead) continue;
            const d = Math.hypot(toilet.x - x, toilet.y - y);
            if (d <= radius + toilet.r) this.damageToilet(toilet, Math.max(10, maxDamage * 0.55 * (1 - d / (radius + toilet.r))), Math.atan2(toilet.y - y, toilet.x - x));
        }
        for (const house of this.houses) {
            for (const win of house.windows) {
                if (win.broken) continue;
                const d = Math.hypot(win.cx - x, win.cy - y);
                if (d <= radius + 24) this.damageWindow(win, Math.max(10, maxDamage * 0.65 * (1 - d / (radius + 24))), Math.atan2(win.cy - y, win.cx - x));
            }
        }
        if (!this.player.dead) {
            const d = Math.hypot(this.player.x - x, this.player.y - y);
            if (d <= radius + this.player.radius) {
                const amount = Math.max(8, maxDamage * (1 - d / (radius + this.player.radius)));
                this.damagePlayer(amount, Math.atan2(this.player.y - y, this.player.x - x), ownerType, ownerId);
            }
        }
        for (const bot of this.bots) {
            if (bot.dead) continue;
            const d = Math.hypot(bot.x - x, bot.y - y);
            if (d <= radius + bot.radius) {
                const amount = Math.max(8, maxDamage * (1 - d / (radius + bot.radius)));
                this.damageBot(bot, amount, Math.atan2(bot.y - y, bot.x - x), ownerType, ownerId);
            }
        }
    }

    findStaticBulletCollision(x, y) {
        if (this.airdrop && this.airdrop.state === 'landed' && !this.airdrop.opened && (x - this.airdrop.x) ** 2 + (y - this.airdrop.y) ** 2 <= 46 ** 2) return { type: 'airdrop', obj: this.airdrop };
        for (const t of this.trees) if (!t.dead && (x - t.x) ** 2 + (y - t.y) ** 2 <= (t.trunk * t.scale + 7) ** 2) return { type: 'tree', obj: t };
        for (const r of this.rocks) if (!r.dead && (x - r.x) ** 2 + (y - r.y) ** 2 <= (r.r * r.scale + 4) ** 2) return { type: 'rock', obj: r };
        for (const b of this.barrels) if (!b.dead && (x - b.x) ** 2 + (y - b.y) ** 2 <= (b.r * b.scale + 4) ** 2) return { type: 'barrel', obj: b };
        for (const c of this.rareCrates) {
            if (c.dead) continue;
            const half = 44 * c.scale;
            if (x >= c.x - half && x <= c.x + half && y >= c.y - half && y <= c.y + half) return { type: 'rareCrate', obj: c };
        }
        for (const c of this.crates) {
            if (c.dead) continue;
            const half = 38 * c.scale;
            if (x >= c.x - half && x <= c.x + half && y >= c.y - half && y <= c.y + half) return { type: 'crate', obj: c };
        }
        for (const toilet of this.toilets) if (!toilet.dead && (x - toilet.x) ** 2 + (y - toilet.y) ** 2 <= (toilet.r * toilet.scale + 2) ** 2) return { type: 'toilet', obj: toilet };
        for (const w of this.getContainerWalls()) if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return { type: 'wall', obj: w };
        for (const w of this.getHouseBulletBlockers()) {
            if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) {
                if (w.type === 'window') return { type: 'window', obj: w.ref };
                return { type: 'wall', obj: w };
            }
        }
        return null;
    }

    findActorAtPoint(x, y, ownerType = null, ownerId = null) {
        if (!this.player.dead && !(ownerType === 'player' && ownerId === 'player')) {
            if ((x - this.player.x) ** 2 + (y - this.player.y) ** 2 <= (this.player.radius + 2) ** 2) {
                return { kind: 'player', id: 'player', ref: this.player };
            }
        }
        for (const bot of this.bots) {
            if (bot.dead) continue;
            if (ownerType === 'bot' && ownerId === bot.id) continue;
            if ((x - bot.x) ** 2 + (y - bot.y) ** 2 <= (bot.radius + 2) ** 2) return { kind: 'bot', id: bot.id, ref: bot };
        }
        return null;
    }

    damagePlayer(damage, hitAngle = 0, ownerType = null, ownerId = null) {
        if (this.player.dead) return;
        const reduction = [1, 0.90, 0.80, 0.70][this.player.equipment.vest] ?? 1;
        const dealt = Math.max(1, damage * reduction);
        this.player.health = Math.max(0, this.player.health - dealt);
        if (ownerType !== 'zone') this.spawnBlood(this.player.x, this.player.y, hitAngle, dealt);
        if (this.player.health <= 0) {
            this.player.dead = true;
            this.player.respawnAt = this.mode === 'sandbox' ? performance.now() + 1400 : Infinity;
            this.player.reload = null;
            this.player.useItem = null;
        }
    }

    damageBot(bot, damage, hitAngle = 0, ownerType = null, ownerId = null) {
        if (!bot || bot.dead) return;
        const reduction = [1, 0.90, 0.80, 0.70][bot.equipment.vest] ?? 1;
        const dealt = Math.max(1, damage * reduction);
        bot.health = Math.max(0, bot.health - dealt);
        bot.useItem = null;
        bot.safeSince = performance.now();
        if (ownerType !== 'zone') this.spawnBlood(bot.x, bot.y, hitAngle, dealt);
        if (bot.health <= 0) this.handleBotDeath(bot);
    }

    handleBotDeath(bot) {
        if (bot.deathHandled) return;
        bot.deathHandled = true;
        bot.dead = true;
        const angleBase = Math.random() * TAU;
        const drops = [];
        if (bot.weapon) {
            drops.push({ kind: 'weapon', subtype: bot.weapon.id, loaded: bot.weapon.loaded });
            const ammoType = WEAPONS[bot.weapon.id].ammo;
            if ((bot.ammo[ammoType] || 0) > 0) drops.push({ kind: 'ammo', subtype: ammoType, amount: Math.min(bot.ammo[ammoType], ammoType === '9mm' ? 48 : ammoType === '12g' ? 10 : 30) });
        }
        for (const type of ['helmet', 'vest', 'backpack']) {
            if (bot.equipment[type] > 0) drops.push({ kind: 'equipment', subtype: type, level: bot.equipment[type] });
        }
        for (const type of ['bandage', 'medkit', 'soda', 'painkiller']) {
            if (bot.heals[type] > 0) drops.push({ kind: 'heal', subtype: type, amount: bot.heals[type] });
        }
        if (bot.throwables.frag > 0) drops.push({ kind: 'throwable', subtype: 'frag', amount: bot.throwables.frag });
        if (bot.scope > 1) drops.push({ kind: 'scope', subtype: bot.scope });

        drops.forEach((spec, i) => {
            const a = angleBase + i * (TAU / Math.max(1, Math.min(8, drops.length)));
            const d = 42 + (i % 3) * 12;
            this.loot.push(this.makeLoot({
                ...spec,
                x: bot.x + Math.cos(a) * d,
                y: bot.y + Math.sin(a) * d,
                vx: Math.cos(a) * 120,
                vy: Math.sin(a) * 120
            }));
        });
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * TAU;
            const speed = 40 + Math.random() * 130;
            this.particles.push({
                x: bot.x, y: bot.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                life: 0.35 + Math.random() * 0.2,
                maxLife: 0.55,
                size: 3 + Math.random() * 4,
                color: '#ef6b6b',
                shape: 'circle'
            });
        }
    }

    spawnBlood(x, y, hitAngle = 0, damage = 15) {
        const count = Math.max(3, Math.min(8, Math.round(2 + damage / 12)));
        for (let i = 0; i < count; i++) {
            const a = hitAngle + Math.PI + (Math.random() - 0.5) * 1.25;
            const speed = 35 + Math.random() * 85;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 8,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                life: 0.18 + Math.random() * 0.16,
                maxLife: 0.34,
                size: 2.8 + Math.random() * 3.2,
                color: Math.random() < 0.5 ? '#ff7777' : '#ed6666',
                shape: 'circle'
            });
        }
    }


    damageAirdrop(airdrop, damage, hitAngle = 0) {
        if (!airdrop || airdrop.state !== 'landed' || airdrop.opened) return;
        airdrop.crateHp = Math.max(0, airdrop.crateHp - damage);
        this.spawnWoodHit(airdrop.x - Math.cos(hitAngle) * 20, airdrop.y - Math.sin(hitAngle) * 20);
        if (airdrop.crateHp <= 0) this.breakAirdrop();
    }

    damageCrate(crate, damage, hitAngle = 0) {
        crate.hp = Math.max(0, crate.hp - damage);
        crate.scale = 0.66 + 0.34 * (crate.hp / crate.maxHp);
        crate.rotation += (Math.random() - 0.5) * 0.13;
        this.spawnWoodHit(crate.x - Math.cos(hitAngle) * 15, crate.y - Math.sin(hitAngle) * 15);
        if (crate.hp <= 0) this.breakCrate(crate);
    }

    damageRareCrate(crate, damage, hitAngle = 0) {
        crate.hp = Math.max(0, crate.hp - damage);
        crate.scale = 0.72 + 0.28 * (crate.hp / crate.maxHp);
        crate.rotation += (Math.random() - 0.5) * 0.08;
        this.spawnWoodHit(crate.x - Math.cos(hitAngle) * 18, crate.y - Math.sin(hitAngle) * 18);
        if (crate.hp <= 0) this.breakRareCrate(crate);
    }

    damageBarrel(barrel, damage, hitAngle = 0) {
        if (barrel.dead) return;
        barrel.hp = Math.max(0, barrel.hp - damage);
        barrel.scale = 0.82 + 0.18 * (barrel.hp / barrel.maxHp);
        this.spawnImpact(barrel.x - Math.cos(hitAngle) * 12, barrel.y - Math.sin(hitAngle) * 12);
        if (barrel.hp <= 0) this.explodeBarrel(barrel);
    }

    damageTree(tree, damage, hitAngle = 0) {
        tree.hp = Math.max(0, tree.hp - damage);
        tree.scale = 0.73 + 0.27 * (tree.hp / tree.maxHp);
        this.spawnLeafHit(tree.x - Math.cos(hitAngle) * 20, tree.y - Math.sin(hitAngle) * 20);
        if (tree.hp <= 0) this.destroyTree(tree);
    }

    damageRock(rock, damage, hitAngle = 0) {
        rock.hp = Math.max(0, rock.hp - damage);
        rock.scale = 0.70 + 0.30 * (rock.hp / rock.maxHp);
        this.spawnStoneHit(rock.x - Math.cos(hitAngle) * 16, rock.y - Math.sin(hitAngle) * 16);
        if (rock.hp <= 0) this.destroyRock(rock);
    }

    damageWindow(window, damage, hitAngle = 0) {
        if (window.broken) return;
        window.hp = Math.max(0, window.hp - damage);
        this.spawnStoneHit(window.cx - Math.cos(hitAngle) * 10, window.cy - Math.sin(hitAngle) * 10);
        if (window.hp <= 0) {
            window.broken = true;
            const house = this.houses.find(h => h.id === window.houseId);
            if (house) this.rebuildHouseGeometry(house);
        }
    }

    damageToilet(toilet, damage, hitAngle = 0) {
        if (toilet.dead) return;
        toilet.hp = Math.max(0, toilet.hp - damage);
        toilet.scale = 0.82 + 0.18 * (toilet.hp / toilet.maxHp);
        this.spawnStoneHit(toilet.x - Math.cos(hitAngle) * 10, toilet.y - Math.sin(hitAngle) * 10);
        if (toilet.hp <= 0) this.breakToilet(toilet);
    }

    breakCrate(crate) {
        crate.dead = true;
        const template = CRATE_LOOT[crate.loot] || CRATE_LOOT.meds;
        template.forEach((spec, index) => {
            const angle = (index / Math.max(1, template.length)) * TAU + 0.4;
            const dist = 40 + index * 14;
            this.loot.push(this.makeLoot({
                ...spec,
                x: crate.x + Math.cos(angle) * dist,
                y: crate.y + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150
            }));
        });
        for (let i = 0; i < 14; i++) {
            const a = Math.random() * TAU;
            const speed = 70 + Math.random() * 190;
            this.particles.push({
                x: crate.x, y: crate.y,
                vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
                life: 0.35 + Math.random() * 0.28, maxLife: 0.63,
                size: 6 + Math.random() * 9, color: Math.random() < 0.5 ? '#a7681e' : '#6e451c'
            });
        }
    }

    breakRareCrate(crate) {
        crate.dead = true;
        const weaponSpec = this.rollWeighted(RARE_CRATE_LOOT.weapon);
        const weaponAmmo = WEAPONS[weaponSpec.subtype].ammo;
        const ammoAmount = weaponAmmo === '9mm' ? 48 : weaponAmmo === '12g' ? 10 : 30;
        const specs = [
            this.rollWeighted(RARE_CRATE_LOOT.equipment),
            this.rollWeighted(RARE_CRATE_LOOT.heal),
            weaponSpec,
            { kind: 'ammo', subtype: weaponAmmo, amount: ammoAmount }
        ];
        specs.forEach((spec, index) => {
            const angle = index * (TAU / 4) + 0.35;
            const dist = 54;
            this.loot.push(this.makeLoot({
                ...spec,
                x: crate.x + Math.cos(angle) * dist,
                y: crate.y + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 175,
                vy: Math.sin(angle) * 175
            }));
        });
        for (let i = 0; i < 22; i++) {
            const a = Math.random() * TAU;
            const speed = 80 + Math.random() * 220;
            this.particles.push({ x: crate.x, y: crate.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.35 + Math.random() * 0.35, maxLife: 0.7, size: 6 + Math.random() * 10, color: Math.random() < 0.55 ? '#d3a438' : '#49341b' });
        }
    }

    breakToilet(toilet) {
        toilet.dead = true;
        const table = [
            { weight: 5, spec: { kind: 'heal', subtype: 'bandage', amount: 5 } },
            { weight: 3, spec: { kind: 'heal', subtype: 'soda', amount: 1 } },
            { weight: 2, spec: { kind: 'heal', subtype: 'medkit', amount: 1 } }
        ];
        const spec = this.rollWeighted(table);
        this.loot.push(this.makeLoot({
            ...spec,
            x: toilet.x + 10, y: toilet.y + 8,
            vx: 55, vy: 20
        }));
        for (let i = 0; i < 16; i++) {
            const a = Math.random() * TAU;
            const speed = 60 + Math.random() * 170;
            this.particles.push({ x: toilet.x, y: toilet.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.35 + Math.random() * 0.25, maxLife: 0.6, size: 5 + Math.random() * 8, color: Math.random() < 0.5 ? '#ededed' : '#a9a9a9' });
        }
    }

    rollWeighted(entries) {
        const total = entries.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * total;
        for (const entry of entries) {
            roll -= entry.weight;
            if (roll <= 0) return { ...entry.spec };
        }
        return { ...entries[entries.length - 1].spec };
    }

    explodeBarrel(barrel) {
        if (barrel.dead) return;
        barrel.dead = true;
        const radius = 150;
        this.explosions.push({ x: barrel.x, y: barrel.y, radius, life: 0.42, maxLife: 0.42, barrel: true });
        for (let i = 0; i < 30; i++) {
            const a = Math.random() * TAU;
            const speed = 70 + Math.random() * 290;
            this.particles.push({ x: barrel.x, y: barrel.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.28 + Math.random() * 0.42, maxLife: 0.7, size: 5 + Math.random() * 8, color: Math.random() < 0.62 ? '#f0aa38' : '#343434' });
        }
        this.damageCircle(barrel.x, barrel.y, radius, 95);
    }

    destroyTree(tree) {
        tree.dead = true;
        for (let i = 0; i < 18; i++) {
            const a = Math.random() * TAU;
            const speed = 50 + Math.random() * 150;
            const color = Math.random() < 0.65 ? '#4d6d38' : '#7d5a24';
            this.particles.push({ x: tree.x, y: tree.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.45 + Math.random() * 0.3, maxLife: 0.75, size: 5 + Math.random() * 9, color });
        }
    }

    destroyRock(rock) {
        rock.dead = true;
        for (let i = 0; i < 16; i++) {
            const a = Math.random() * TAU;
            const speed = 55 + Math.random() * 150;
            const color = Math.random() < 0.55 ? '#c3c3c6' : '#6a6c72';
            this.particles.push({ x: rock.x, y: rock.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.45 + Math.random() * 0.3, maxLife: 0.72, size: 4 + Math.random() * 8, color });
        }
    }

    spawnWoodHit(x, y) {
        for (let i = 0; i < 4; i++) {
            const a = Math.random() * TAU;
            const speed = 35 + Math.random() * 75;
            this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.18 + Math.random() * 0.15, maxLife: 0.33, size: 4 + Math.random() * 5, color: '#9a621c' });
        }
    }

    spawnLeafHit(x, y) {
        for (let i = 0; i < 5; i++) {
            const a = Math.random() * TAU;
            const speed = 35 + Math.random() * 90;
            this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.2 + Math.random() * 0.18, maxLife: 0.4, size: 4 + Math.random() * 6, color: Math.random() < 0.7 ? '#4a6b37' : '#7b5a24' });
        }
    }

    spawnStoneHit(x, y) {
        for (let i = 0; i < 5; i++) {
            const a = Math.random() * TAU;
            const speed = 35 + Math.random() * 90;
            this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.18 + Math.random() * 0.18, maxLife: 0.38, size: 3 + Math.random() * 5, color: Math.random() < 0.5 ? '#cbcbcf' : '#6e7076' });
        }
    }

    spawnImpact(x, y) {
        for (let i = 0; i < 3; i++) {
            const a = Math.random() * TAU;
            this.particles.push({ x, y, vx: Math.cos(a) * 55, vy: Math.sin(a) * 55, life: 0.12, maxLife: 0.12, size: 3, color: '#ecebdc' });
        }
    }

    updateParticles(dt) {
        const next = [];
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= Math.pow(0.08, dt);
            p.vy *= Math.pow(0.08, dt);
            p.life -= dt;
            if (p.life > 0) next.push(p);
        }
        this.particles = next;
    }

    makeLoot(spec) {
        return {
            id: `loot-${this.nextLootId++}`,
            kind: spec.kind,
            subtype: spec.subtype,
            amount: spec.amount ?? 1,
            level: spec.level ?? 0,
            loaded: spec.loaded ?? 0,
            x: spec.x,
            y: spec.y,
            vx: spec.vx ?? 0,
            vy: spec.vy ?? 0,
            removed: false,
            pulse: Math.random() * TAU
        };
    }

    updateLootMotion(dt) {
        for (const item of this.loot) {
            if (item.removed) continue;
            item.pulse += dt * 2.1;
            if (Math.abs(item.vx) > 0.5 || Math.abs(item.vy) > 0.5) {
                item.x += item.vx * dt;
                item.y += item.vy * dt;
                item.vx *= Math.pow(0.03, dt);
                item.vy *= Math.pow(0.03, dt);
            } else {
                item.vx = 0;
                item.vy = 0;
            }
        }
        this.loot = this.loot.filter(item => !item.removed);
    }

    updatePickupCandidate() {
        let best = null;
        let bestD2 = 74 * 74;
        for (const item of this.loot) {
            if (item.removed || !this.isLootVisible(item)) continue;
            const d2 = (item.x - this.player.x) ** 2 + (item.y - this.player.y) ** 2;
            if (d2 < bestD2) {
                best = item;
                bestD2 = d2;
            }
        }
        this.nearestPickup = best;
        this.nearestDoor = null;
        this.botSpawnCursor = 0;
        this.nextAirdropAt = Infinity;
        let bestDoorD2 = 86 * 86;
        for (const house of this.houses) {
            for (const door of house.doors) {
                const d2 = (door.cx - this.player.x) ** 2 + (door.cy - this.player.y) ** 2;
                if (d2 < bestDoorD2) {
                    this.nearestDoor = door;
                    bestDoorD2 = d2;
                }
            }
        }
    }

    pickupNearest() {
        const door = this.nearestDoor;
        const item = this.nearestPickup;
        if (door) {
            const doorD2 = (door.cx - this.player.x) ** 2 + (door.cy - this.player.y) ** 2;
            const itemD2 = item ? (item.x - this.player.x) ** 2 + (item.y - this.player.y) ** 2 : Infinity;
            if (!item || doorD2 <= itemD2) {
                door.open = !door.open;
                const house = this.houses.find(h => h.id === door.houseId);
                if (house) this.rebuildHouseGeometry(house);
                return;
            }
        }
        if (!item || !this.isLootVisible(item)) return;

        if (item.kind === 'weapon') {
            const slotIndex = this.getBestWeaponPickupSlot();
            const replaced = this.player.weaponSlots[slotIndex];
            this.player.weaponSlots[slotIndex] = { id: item.subtype, loaded: item.loaded ?? 0 };
            this.player.activeSlot = slotIndex;
            item.removed = true;
            if (replaced) {
                this.loot.push(this.makeLoot({
                    kind: 'weapon', subtype: replaced.id, loaded: replaced.loaded,
                    x: this.player.x + Math.cos(this.player.aimAngle + Math.PI * 0.7) * 36,
                    y: this.player.y + Math.sin(this.player.aimAngle + Math.PI * 0.7) * 36,
                    vx: Math.cos(this.player.aimAngle + Math.PI * 0.7) * 100,
                    vy: Math.sin(this.player.aimAngle + Math.PI * 0.7) * 100
                }));
            }
            this.cancelAction();
            return;
        }

        if (item.kind === 'ammo') {
            if (this.addAmmo(item.subtype, item.amount)) item.removed = true;
            else this.bounceLoot(item, 145);
            return;
        }

        if (item.kind === 'heal') {
            if (this.addHeal(item.subtype, item.amount)) item.removed = true;
            else this.bounceLoot(item, 145);
            return;
        }

        if (item.kind === 'equipment') {
            const current = this.player.equipment[item.subtype];
            if (item.level > current) {
                this.player.equipment[item.subtype] = item.level;
                item.removed = true;
            } else this.bounceLoot(item, 120);
            return;
        }

        if (item.kind === 'scope') {
            if (!this.player.scopes.has(item.subtype)) {
                this.player.scopes.add(item.subtype);
                this.player.activeScope = item.subtype;
                item.removed = true;
            } else this.bounceLoot(item, 110);
            return;
        }

        if (item.kind === 'throwable') {
            if (this.addThrowable(item.subtype, item.amount)) item.removed = true;
            else this.bounceLoot(item, 120);
        }
    }

    getBestWeaponPickupSlot() {
        if (this.player.activeSlot === 0 || this.player.activeSlot === 1) return this.player.activeSlot;
        if (!this.player.weaponSlots[0]) return 0;
        if (!this.player.weaponSlots[1]) return 1;
        return 0;
    }

    addAmmo(type, amount) {
        const cap = BACKPACK_CAPACITY[this.player.equipment.backpack].ammo[type];
        if (this.player.ammo[type] >= cap) return false;
        this.player.ammo[type] = Math.min(cap, this.player.ammo[type] + amount);
        return true;
    }

    addHeal(type, amount) {
        const cap = BACKPACK_CAPACITY[this.player.equipment.backpack].heals[type];
        if (this.player.heals[type] >= cap) return false;
        this.player.heals[type] = Math.min(cap, this.player.heals[type] + amount);
        return true;
    }

    addThrowable(type, amount) {
        const cap = BACKPACK_CAPACITY[this.player.equipment.backpack].throwables[type] ?? 0;
        if ((this.player.throwables[type] ?? 0) >= cap) return false;
        this.player.throwables[type] = Math.min(cap, (this.player.throwables[type] ?? 0) + amount);
        return true;
    }

    bounceLoot(item, force = 110) {
        const a = Math.atan2(item.y - this.player.y, item.x - this.player.x) + (Math.random() - 0.5) * 0.5;
        item.vx = Math.cos(a) * force;
        item.vy = Math.sin(a) * force;
    }

    updateVisibleContainer() {
        this.insideContainerId = null;
        for (const c of this.containers) {
            if (this.pointInContainer(this.player.x, this.player.y, c, -8)) {
                this.insideContainerId = c.id;
                break;
            }
        }
        let best = null;
        let bestFactor = 0;
        for (const c of this.containers) {
            const factor = this.getContainerRevealFactor(c);
            if (factor > bestFactor) {
                bestFactor = factor;
                best = c.id;
            }
        }
        this.visibleContainerId = bestFactor > 0.12 ? best : null;

        this.insideHouseId = null;
        for (const house of this.houses) {
            if (this.pointInHouse(this.player.x, this.player.y, house, -10)) {
                this.insideHouseId = house.id;
                break;
            }
        }
        let bestHouse = null;
        let bestHouseFactor = 0;
        for (const house of this.houses) {
            const factor = this.getHouseRevealFactor(house);
            if (factor > bestHouseFactor) {
                bestHouseFactor = factor;
                bestHouse = house.id;
            }
        }
        this.visibleHouseId = bestHouseFactor > 0.12 ? bestHouse : null;
    }

    getContainerRevealFactor(container) {
        if (this.pointInContainer(this.player.x, this.player.y, container, -8)) return 1;
        const entry = this.getContainerEntryPoint(container);
        const dist = Math.hypot(this.player.x - entry.x, this.player.y - entry.y);
        if (dist <= 150) return 1;
        if (dist >= 280) return 0;
        return 1 - (dist - 150) / 130;
    }

    getContainerEntryPoint(container) {
        return {
            x: container.opening === 'left' ? container.x - container.w / 2 + 10 : container.x + container.w / 2 - 10,
            y: container.y
        };
    }

    pointInContainer(x, y, container, margin = 0) {
        return x >= container.x - container.w / 2 + margin
            && x <= container.x + container.w / 2 - margin
            && y >= container.y - container.h / 2 + margin
            && y <= container.y + container.h / 2 - margin;
    }

    pointInHouse(x, y, house, margin = 0) {
        return x >= house.x - house.w / 2 + margin
            && x <= house.x + house.w / 2 - margin
            && y >= house.y - house.h / 2 + margin
            && y <= house.y + house.h / 2 - margin;
    }

    getHouseRevealFactor(house) {
        if (this.pointInHouse(this.player.x, this.player.y, house, -10)) return 1;
        let best = 0;
        for (const point of this.getExteriorHouseDoorPoints(house)) {
            const dist = Math.hypot(this.player.x - point.x, this.player.y - point.y);
            if (dist <= 160) best = Math.max(best, 1);
            else if (dist < 290) best = Math.max(best, 1 - (dist - 160) / 130);
        }
        return best;
    }

    findContainingContainer(x, y) {
        return this.containers.find(c => this.pointInContainer(x, y, c, 0)) || null;
    }

    findContainingHouse(x, y) {
        return this.houses.find(h => this.pointInHouse(x, y, h, 0)) || null;
    }

    isLootVisible(item) {
        const container = this.findContainingContainer(item.x, item.y);
        if (container) return this.getContainerRevealFactor(container) > 0.12;
        const house = this.findContainingHouse(item.x, item.y);
        if (house) return this.getHouseRevealFactor(house) > 0.12;
        return true;
    }

    updateCamera(dt) {
        this.camera.x += (this.player.x - this.camera.x) * Math.min(1, dt * 8.5);
        this.camera.y += (this.player.y - this.camera.y) * Math.min(1, dt * 8.5);
        const base = SCOPES[this.player.activeScope].cameraScale;
        const interiorBoost = this.insideContainerId || this.insideHouseId ? 1.14 : 1;
        this.camera.targetScale = base * interiorBoost;
        this.camera.scale += (this.camera.targetScale - this.camera.scale) * Math.min(1, dt * 7.5);
    }

    getCurrentActionState(now) {
        if (this.player.useItem && this.player.useItem.endsAt > now) {
            const progress = 1 - (this.player.useItem.endsAt - now) / this.player.useItem.duration;
            return { type: 'heal', subtype: this.player.useItem.subtype, progress };
        }
        if (this.player.reload && this.player.reload.endsAt > now) {
            const progress = 1 - (this.player.reload.endsAt - now) / this.player.reload.duration;
            return { type: 'reload', subtype: this.player.reload.weaponId, progress };
        }
        return null;
    }

    destroy() {
        this.running = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        window.removeEventListener('keydown', this.bound.keydown);
        window.removeEventListener('keyup', this.bound.keyup);
        window.removeEventListener('blur', this.bound.blur);
        this.canvas?.removeEventListener('mousemove', this.bound.mousemove);
        this.canvas?.removeEventListener('mousedown', this.bound.mousedown);
        window.removeEventListener('mouseup', this.bound.mouseup);
        this.canvas?.removeEventListener('wheel', this.bound.wheel);
        this.canvas?.removeEventListener('contextmenu', this.bound.contextmenu);
        if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
    }
}
