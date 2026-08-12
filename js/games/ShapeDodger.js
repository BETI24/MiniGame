export default {
  manifest: {
    id: "shape-dodger",
    name: "Void Dodger",
    description:
      "Überlebe einen immer härter werdenden Meteor- und Bullet-Hell-Sturm.",
    icon: "🚀",
    imageUrl: "js/assets/images/ShapeDodger.png",
    tags: ["Survival", "Arcade", "Bullet Hell"],
  },

  init: (container, services) => {
    // ============================================================
    // SETUP / STATE
    // ============================================================

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.style.cssText = "display:block;width:100%;height:100%";
    container.appendChild(canvas);

    const player = {
      x: 0,
      y: 0,
      size: 20,
      hitbox: 7,
      speed: 7,
    };

    let invincibleMode = false;

    const enemies = [];
    const bullets = [];
    const particles = [];

    const keys = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      a: false,
      d: false,
      w: false,
      s: false,
    };

    let animationId = null;
    let isGameOver = false;
    let score = 0;
    let elapsedTime = 0;
    let lastFrameTime = performance.now();

    let stars = [];
    let meteorSpawnTimer = 0;

    let specialWave = null;
    let waveCooldown = 6;
    let lastWaveType = null;
    let waveNumber = 0;

    let waveBannerTimer = 0;
    let waveBannerText = "";

    // ============================================================
    // GENERAL HELPERS
    // ============================================================

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const randomX = (padding = 30) =>
      padding + Math.random() * Math.max(1, canvas.width - padding * 2);

    const addEnemy = (enemy) => enemies.push(enemy);

    const circlesCollide = (ax, ay, ar, bx, by, br) => {
      const dx = ax - bx;
      const dy = ay - by;
      const r = ar + br;

      return dx * dx + dy * dy < r * r;
    };

    // ============================================================
    // CANVAS / STARS
    // ============================================================

    const createStars = () => {
      const amount = Math.max(
        60,
        Math.floor((canvas.width * canvas.height) / 15000)
      );

      stars = Array.from({ length: amount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.25,
        alpha: Math.random() * 0.45 + 0.12,
      }));
    };

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      createStars();

      if (player.x === 0) {
        player.x = canvas.width / 2;
        player.y = canvas.height - 55;
      } else {
        player.x = clamp(player.x, player.size, canvas.width - player.size);

        player.y = clamp(player.y, player.size, canvas.height - player.size);
      }
    };

    resize();

    // ============================================================
    // INPUT
    // ============================================================

    const normalizeKey = (event) =>
      event.key.length === 1 ? event.key.toLowerCase() : event.key;

    const onKeyDown = (event) => {
      const key = normalizeKey(event);

      if (key === "i") {
        // Drücke 'i', um den invincible mode zu aktivieren/deaktivieren
        invincibleMode = !invincibleMode;
      }

      if (Object.prototype.hasOwnProperty.call(keys, key)) {
        keys[key] = true;

        if (key.startsWith("Arrow")) {
          event.preventDefault();
        }
      }

      if (isGameOver && key === "r") {
        resetGame();
      }
    };

    const onKeyUp = (event) => {
      const key = normalizeKey(event);

      if (Object.prototype.hasOwnProperty.call(keys, key)) {
        keys[key] = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    window.addEventListener("keyup", onKeyUp);

    window.addEventListener("resize", resize);

    // ============================================================
    // DIFFICULTY
    // ============================================================

    const getMeteorSpawnInterval = () =>
      Math.max(0.055, 0.22 - elapsedTime * 0.0022);

    const getMeteorSpeedMultiplier = () =>
      Math.min(1.85, 1 + elapsedTime / 115);

    const getWaveIntensity = () =>
      Math.min(5, 1 + Math.floor(elapsedTime / 20));

    const getPhaseName = () => {
      if (elapsedTime < 10) {
        return "METEOR FIELD";
      }

      if (elapsedTime < 22) {
        return "FIRST CONTACT";
      }

      if (elapsedTime < 36) {
        return "SWARM";
      }

      if (elapsedTime < 50) {
        return "HOSTILE VOID";
      }

      if (elapsedTime < 65) {
        return "BULLET STORM";
      }

      return "VOID HELL";
    };

    // ============================================================
    // ENEMY SPAWNERS
    // ============================================================

    const spawnMeteor = (custom = {}) => {
      if (enemies.length >= 300) {
        return;
      }

      const size = custom.size ?? Math.random() * 15 + 10;

      addEnemy({
        type: "asteroid",
        special: false,

        x: custom.x ?? randomX(size + 5),

        y: custom.y ?? -size - 15,

        size,
        hitRadius: size - 2,

        speed:
          custom.speed ??
          (Math.random() * 2.4 + 2.7) * getMeteorSpeedMultiplier(),

        vx: custom.vx ?? (Math.random() - 0.5) * 0.16,

        rotation: Math.random() * Math.PI * 2,

        rotationSpeed: (Math.random() - 0.5) * 0.045,
      });
    };

    const spawnDart = (x, y = -25, vx = 0) => {
      addEnemy({
        type: "dart",
        special: true,
        x,
        y,
        size: 10,
        hitRadius: 8,

        speed: 6.0 + getWaveIntensity() * 0.6,

        vx,
        rotation: 0,
      });
    };

    const spawnZigzag = (x, y = -35) => {
      addEnemy({
        type: "zigzag",
        special: true,

        x,
        baseX: x,
        y,

        size: 15,
        hitRadius: 12,

        speed: 3.2 + getWaveIntensity() * 0.35,

        amplitude: 42 + Math.random() * 38,

        phase: Math.random() * Math.PI * 2,

        waveSpeed: 0.042 + Math.random() * 0.018,
      });
    };

    const spawnSeeker = (x, y = -35) => {
      addEnemy({
        type: "seeker",
        special: true,

        x,
        y,

        size: 13,
        hitRadius: 10,

        speed: 3.3 + getWaveIntensity() * 0.32,

        vx: 0,

        maxSteer: 2.4 + getWaveIntensity() * 0.25,

        steerStrength: 0.03,
      });
    };

    const spawnShooter = (x, targetY) => {
      addEnemy({
        type: "shooter",
        special: true,

        x,
        baseX: x,
        y: -45,

        size: 18,
        hitRadius: 15,
        speed: 2.4,

        targetY,

        state: "enter",

        hoverTime: 0,
        hoverDuration: 4.8,

        fireTimer: 0.65 + Math.random() * 0.25,

        phase: Math.random() * Math.PI * 2,

        waveSpeed: 0.032,
      });
    };

    const spawnSplitter = (x, y = -45) => {
      addEnemy({
        type: "splitter",
        special: true,

        x,
        y,

        size: 24,
        hitRadius: 20,

        speed: 2.7 + getWaveIntensity() * 0.2,

        splitY: canvas.height * (0.26 + Math.random() * 0.18),
      });
    };

    const spawnFragment = (x, y, vx) => {
      addEnemy({
        type: "fragment",
        special: true,

        x,
        y,

        size: 8,
        hitRadius: 6,

        speed: 5.0 + getWaveIntensity() * 0.28,

        vx,
      });
    };

    // ============================================================
    // BULLETS
    // ============================================================

    const spawnBullet = (x, y, angle, speed, size = 5, color = "#b36cff") => {
      if (bullets.length >= 500) {
        return;
      }

      bullets.push({
        x,
        y,

        vx: Math.cos(angle) * speed,

        vy: Math.sin(angle) * speed,

        size,
        color,
      });
    };

    const fireAtPlayer = (enemy) => {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

      const intensity = getWaveIntensity();

      const speed = 4.5 + intensity * 0.45;

      // Early Game: einzelner Schuss
      if (intensity <= 2) {
        spawnBullet(enemy.x, enemy.y, angle, speed);

        return;
      }

      // Mid Game: 3er Spread
      if (intensity <= 4) {
        const spread = 0.17;

        spawnBullet(enemy.x, enemy.y, angle - spread, speed);

        spawnBullet(enemy.x, enemy.y, angle, speed, 5, "#e66cff");

        spawnBullet(enemy.x, enemy.y, angle + spread, speed);

        return;
      }

      // Late Game: 5er Spread
      for (let i = -2; i <= 2; i++) {
        spawnBullet(enemy.x, enemy.y, angle + i * 0.12, speed);
      }
    };

    // ============================================================
    // CONTINUOUS METEORS
    // ============================================================

    const updateMeteorSpawning = (deltaSeconds) => {
      meteorSpawnTimer += deltaSeconds;

      const interval = getMeteorSpawnInterval();

      while (meteorSpawnTimer >= interval) {
        meteorSpawnTimer -= interval;

        spawnMeteor();

        if (elapsedTime >= 28 && Math.random() < 0.22) {
          spawnMeteor({
            y: -60 - Math.random() * 40,
          });
        }

        if (elapsedTime >= 52 && Math.random() < 0.2) {
          spawnMeteor({
            y: -100 - Math.random() * 40,
          });
        }

        if (elapsedTime >= 75 && Math.random() < 0.16) {
          spawnMeteor({
            y: -140 - Math.random() * 50,
          });
        }
      }
    };

    // ============================================================
    // SPECIAL WAVE DATA
    // ============================================================

    const waveNames = {
      dartRush: "DART RUSH",

      zigzagWall: "DISTORTION WAVE",

      seekerPack: "HUNTER SWARM",

      shooterSquad: "VOID BATTERY",

      splitterStorm: "SHATTER STORM",

      bulletFan: "BULLET FAN",
    };

    const waveDurations = {
      dartRush: 4.4,
      zigzagWall: 4.8,
      seekerPack: 5.0,
      shooterSquad: 6.2,
      splitterStorm: 5.2,
      bulletFan: 4.8,
    };

    const waveBurstBaseIntervals = {
      dartRush: 0.85,
      zigzagWall: 1.25,
      seekerPack: 1.45,
      shooterSquad: 4.8,
      splitterStorm: 1.7,
      bulletFan: 0.68,
    };

    const countActiveSpecialEnemies = () =>
      enemies.reduce((count, enemy) => count + (enemy.special ? 1 : 0), 0);

    const getAvailableWaveTypes = () => {
      if (elapsedTime < 16) {
        return ["dartRush"];
      }

      if (elapsedTime < 26) {
        return ["dartRush", "zigzagWall"];
      }

      if (elapsedTime < 38) {
        return ["dartRush", "zigzagWall", "seekerPack"];
      }

      if (elapsedTime < 50) {
        return ["zigzagWall", "seekerPack", "shooterSquad"];
      }

      if (elapsedTime < 62) {
        return ["seekerPack", "shooterSquad", "splitterStorm", "bulletFan"];
      }

      return [
        "dartRush",
        "zigzagWall",
        "seekerPack",
        "shooterSquad",
        "splitterStorm",
        "bulletFan",
      ];
    };

    const chooseWaveType = () => {
      const available = getAvailableWaveTypes();

      const candidates = available.filter((type) => type !== lastWaveType);

      const pool = candidates.length ? candidates : available;

      return pool[Math.floor(Math.random() * pool.length)];
    };

    const getWaveName = (type) => waveNames[type] ?? "UNKNOWN WAVE";

    const getWaveDuration = (type) => waveDurations[type] ?? 5;

    const getWaveBurstInterval = (type) =>
      waveBurstBaseIntervals[type] * (1 - (getWaveIntensity() - 1) * 0.045);

    const getCooldownAfterWave = () => Math.max(2.4, 4.2 - elapsedTime * 0.022);

    // ============================================================
    // WAVE SPAWN PATTERNS
    // ============================================================

    const spawnDartRushBurst = (wave) => {
      const intensity = getWaveIntensity();

      const lanes = 11 + intensity;

      const gapSize = intensity >= 4 ? 1 : 2;

      const gapStart = Math.floor(Math.random() * Math.max(1, lanes - gapSize));

      const direction = wave.burstIndex % 2 === 0 ? 1 : -1;

      for (let i = 0; i < lanes; i++) {
        if (i >= gapStart && i < gapStart + gapSize) {
          continue;
        }

        const x = ((i + 0.5) / lanes) * canvas.width;

        spawnDart(x, -25 - (i % 2) * 24, direction * 0.28);
      }
    };

    const spawnZigzagWallBurst = () => {
      const count = 6 + getWaveIntensity();

      for (let i = 0; i < count; i++) {
        const x = ((i + 0.5) / count) * canvas.width;

        spawnZigzag(x, -35 - (i % 3) * 28);
      }
    };

    const spawnSeekerPackBurst = () => {
      const count = 5 + getWaveIntensity();

      const spacing = canvas.width / (count + 1);

      for (let i = 0; i < count; i++) {
        spawnSeeker(spacing * (i + 1), -30 - Math.random() * 45);
      }
    };

    const spawnShooterSquadBurst = () => {
      const count = Math.min(7, 1 + getWaveIntensity());

      const margin = 70;

      for (let i = 0; i < count; i++) {
        const progress = count === 1 ? 0.5 : i / (count - 1);

        const x = margin + progress * (canvas.width - margin * 2);

        const targetY = 85 + (i % 2) * 55;

        spawnShooter(x, targetY);
      }
    };

    const spawnSplitterStormBurst = () => {
      const count = 4 + getWaveIntensity();

      const spacing = canvas.width / (count + 1);

      for (let i = 0; i < count; i++) {
        spawnSplitter(spacing * (i + 1), -40 - (i % 2) * 45);
      }
    };

    const spawnBulletFanBurst = (wave) => {
      const intensity = getWaveIntensity();

      const fromLeft = wave.burstIndex % 2 === 0;

      const x = fromLeft ? 12 : canvas.width - 12;

      const y = canvas.height * (0.2 + (wave.burstIndex % 3) * 0.11);

      const baseAngle = fromLeft ? 0 : Math.PI;

      const bulletCount = 8 + intensity * 2;

      const spread = 0.095;

      for (let i = 0; i < bulletCount; i++) {
        const centered = i - (bulletCount - 1) / 2;

        spawnBullet(
          x,
          y,
          baseAngle + centered * spread,
          4.4 + intensity * 0.35,
          5,
          "#ff4d8d"
        );
      }
    };

    // ============================================================
    // WAVE DIRECTOR
    // ============================================================

    const waveSpawners = {
      dartRush: spawnDartRushBurst,

      zigzagWall: spawnZigzagWallBurst,

      seekerPack: spawnSeekerPackBurst,

      shooterSquad: spawnShooterSquadBurst,

      splitterStorm: spawnSplitterStormBurst,

      bulletFan: spawnBulletFanBurst,
    };

    const spawnWaveBurst = (wave) => {
      waveSpawners[wave.type]?.(wave);

      wave.burstIndex++;
    };

    const startSpecialWave = () => {
      const type = chooseWaveType();

      lastWaveType = type;

      waveNumber++;

      specialWave = {
        type,
        time: 0,

        duration: getWaveDuration(type),

        burstTimer: 0,
        burstIndex: 0,
      };

      waveBannerText = getWaveName(type);

      waveBannerTimer = 1.8;

      spawnWaveBurst(specialWave);

      specialWave.burstTimer = getWaveBurstInterval(type);
    };

    const finishSpecialWave = () => {
      specialWave = null;

      waveCooldown = getCooldownAfterWave();
    };

    const updateWaveDirector = (deltaSeconds) => {
      if (!specialWave) {
        waveCooldown -= deltaSeconds;

        const previousWaveCleared =
          countActiveSpecialEnemies() <= 3 && bullets.length <= 26;

        if (waveCooldown <= 0 && previousWaveCleared) {
          startSpecialWave();
        }

        return;
      }

      specialWave.time += deltaSeconds;

      specialWave.burstTimer -= deltaSeconds;

      if (specialWave.burstTimer <= 0) {
        spawnWaveBurst(specialWave);

        specialWave.burstTimer += getWaveBurstInterval(specialWave.type);
      }

      if (specialWave.time >= specialWave.duration) {
        finishSpecialWave();
      }
    };

    // ============================================================
    // PARTICLES / GAME OVER
    // ============================================================

    const spawnDeathParticles = (x, y, color) => {
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;

        const speed = Math.random() * 3.5 + 1;

        particles.push({
          x,
          y,

          vx: Math.cos(angle) * speed,

          vy: Math.sin(angle) * speed,

          size: Math.random() * 3 + 1,

          life: 1,

          decay: 0.022 + Math.random() * 0.025,

          color,
        });
      }
    };

    const updateParticles = (frameScale) => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx * frameScale;

        p.y += p.vy * frameScale;

        p.life -= p.decay * frameScale;

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
    };

    const triggerGameOver = () => {
      if (isGameOver) {
        return;
      }

      isGameOver = true;

      spawnDeathParticles(player.x, player.y, "#00ff88");

      services?.highscores?.saveHighscore?.("shape-dodger", Math.floor(score));
    };

    // ============================================================
    // PLAYER UPDATE
    // ============================================================

    const updatePlayer = (frameScale) => {
      const left = keys.ArrowLeft || keys.a;

      const right = keys.ArrowRight || keys.d;

      const up = keys.ArrowUp || keys.w;

      const down = keys.ArrowDown || keys.s;

      if (left) {
        player.x -= player.speed * frameScale;
      }

      if (right) {
        player.x += player.speed * frameScale;
      }

      if (up) {
        player.y -= player.speed * frameScale;
      }

      if (down) {
        player.y += player.speed * frameScale;
      }

      player.x = clamp(player.x, player.size, canvas.width - player.size);

      player.y = clamp(player.y, player.size, canvas.height - player.size);
    };

    // ============================================================
    // ENEMY UPDATE
    // ============================================================

    const updateEnemies = (deltaSeconds, frameScale) => {
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        switch (enemy.type) {
          // --------------------------------------------
          // STANDARD METEOR
          // --------------------------------------------

          case "asteroid":
            enemy.y += enemy.speed * frameScale;

            enemy.x += enemy.vx * frameScale;

            enemy.rotation += enemy.rotationSpeed * frameScale;

            break;

          // --------------------------------------------
          // DART
          // --------------------------------------------

          case "dart":
            enemy.y += enemy.speed * frameScale;

            enemy.x += enemy.vx * frameScale;

            enemy.rotation += 0.075 * frameScale;

            break;

          // --------------------------------------------
          // ZIGZAG
          // --------------------------------------------

          case "zigzag":
            enemy.y += enemy.speed * frameScale;

            enemy.phase += enemy.waveSpeed * frameScale;

            enemy.x = enemy.baseX + Math.sin(enemy.phase) * enemy.amplitude;

            break;

          // --------------------------------------------
          // SEEKER
          // --------------------------------------------

          case "seeker": {
            const dx = player.x - enemy.x;

            const desiredVX = clamp(
              dx * 0.013,
              -enemy.maxSteer,
              enemy.maxSteer
            );

            enemy.vx +=
              (desiredVX - enemy.vx) * enemy.steerStrength * frameScale;

            enemy.x += enemy.vx * frameScale;

            enemy.y += enemy.speed * frameScale;

            break;
          }

          // --------------------------------------------
          // SHOOTER
          // --------------------------------------------

          case "shooter":
            if (enemy.state === "enter") {
              enemy.y += enemy.speed * frameScale;

              if (enemy.y >= enemy.targetY) {
                enemy.state = "hover";

                enemy.baseX = enemy.x;
              }
            } else if (enemy.state === "hover") {
              enemy.hoverTime += deltaSeconds;

              enemy.phase += enemy.waveSpeed * frameScale;

              enemy.x = enemy.baseX + Math.sin(enemy.phase) * 34;

              enemy.fireTimer -= deltaSeconds;

              if (enemy.fireTimer <= 0) {
                fireAtPlayer(enemy);

                enemy.fireTimer = Math.max(
                  0.48,
                  1.15 - getWaveIntensity() * 0.09
                );
              }

              if (enemy.hoverTime >= enemy.hoverDuration) {
                enemy.state = "leave";
              }
            } else {
              enemy.y += 5 * frameScale;
            }

            break;

          // --------------------------------------------
          // SPLITTER
          // --------------------------------------------

          case "splitter":
            enemy.y += enemy.speed * frameScale;

            if (enemy.y >= enemy.splitY) {
              spawnFragment(enemy.x, enemy.y, -2.7);

              spawnFragment(enemy.x, enemy.y, 0);

              spawnFragment(enemy.x, enemy.y, 2.7);

              enemies.splice(i, 1);

              continue;
            }

            break;

          // --------------------------------------------
          // FRAGMENT
          // --------------------------------------------

          case "fragment":
            enemy.x += enemy.vx * frameScale;

            enemy.y += enemy.speed * frameScale;

            break;
        }

        // --------------------------------------------
        // PLAYER COLLISION
        // --------------------------------------------

        if (
          !invincibleMode &&
          circlesCollide(
            player.x,
            player.y,
            player.hitbox,

            enemy.x,
            enemy.y,
            enemy.hitRadius
          )
        ) {
          triggerGameOver();

          return;
        }

        // --------------------------------------------
        // CLEANUP
        // --------------------------------------------

        if (
          enemy.y > canvas.height + 100 ||
          enemy.x < -150 ||
          enemy.x > canvas.width + 150
        ) {
          enemies.splice(i, 1);
        }
      }
    };

    // ============================================================
    // BULLET UPDATE
    // ============================================================

    const updateBullets = (frameScale) => {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * frameScale;

        bullet.y += bullet.vy * frameScale;

        if (
          !invincibleMode &&
          circlesCollide(
            player.x,
            player.y,
            player.hitbox,

            bullet.x,
            bullet.y,
            bullet.size
          )
        ) {
          triggerGameOver();

          return;
        }

        if (
          bullet.x < -50 ||
          bullet.x > canvas.width + 50 ||
          bullet.y < -50 ||
          bullet.y > canvas.height + 50
        ) {
          bullets.splice(i, 1);
        }
      }
    };

    // ============================================================
    // DRAW HELPERS
    // ============================================================

    const circle = (
      x,
      y,
      radius,
      fill = null,
      stroke = null,
      lineWidth = 1
    ) => {
      ctx.beginPath();

      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (fill) {
        ctx.fillStyle = fill;

        ctx.fill();
      }

      if (stroke) {
        ctx.strokeStyle = stroke;

        ctx.lineWidth = lineWidth;

        ctx.stroke();
      }
    };

    // ============================================================
    // BACKGROUND
    // ============================================================

    const drawBackground = () => {
      ctx.fillStyle = "#0d0d12";

      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        ctx.globalAlpha = star.alpha;

        circle(star.x, star.y, star.size, "#d9efff");
      }

      ctx.globalAlpha = 1;
    };

    // ============================================================
    // PLAYER DRAW
    // ============================================================

    const drawPlayer = () => {
      ctx.save();

      ctx.shadowBlur = 18;
      ctx.shadowColor = "#00ff88";

      circle(player.x, player.y, player.size, "#00ff88");

      ctx.shadowBlur = 0;

      circle(player.x - 5, player.y - 5, 5, "#d9ffef");

      ctx.restore();
    };

    // ============================================================
    // ENEMY DRAW
    // ============================================================

    const drawEnemy = (enemy) => {
      ctx.save();

      ctx.translate(enemy.x, enemy.y);

      switch (enemy.type) {
        // --------------------------------------------
        // ASTEROID
        // --------------------------------------------

        case "asteroid":
          ctx.rotate(enemy.rotation);

          ctx.shadowBlur = 11;
          ctx.shadowColor = "#ff3366";

          circle(0, 0, enemy.size, "#ff3366");

          ctx.shadowBlur = 0;

          circle(
            -enemy.size * 0.28,
            -enemy.size * 0.18,
            enemy.size * 0.22,
            "#b51f48"
          );

          circle(
            enemy.size * 0.26,
            enemy.size * 0.21,
            enemy.size * 0.16,
            "#b51f48"
          );

          break;

        // --------------------------------------------
        // DART
        // --------------------------------------------

        case "dart":
          ctx.rotate(enemy.rotation);

          ctx.shadowBlur = 15;
          ctx.shadowColor = "#ff9b3d";

          ctx.fillStyle = "#ff9b3d";

          ctx.beginPath();

          ctx.moveTo(0, enemy.size + 5);

          ctx.lineTo(-enemy.size, -enemy.size);

          ctx.lineTo(enemy.size, -enemy.size);

          ctx.closePath();

          ctx.fill();

          break;

        // --------------------------------------------
        // ZIGZAG
        // --------------------------------------------

        case "zigzag":
          ctx.rotate(Math.PI / 4);

          ctx.shadowBlur = 16;
          ctx.shadowColor = "#ff4bd8";

          ctx.fillStyle = "#ff4bd8";

          ctx.fillRect(
            -enemy.size * 0.72,
            -enemy.size * 0.72,
            enemy.size * 1.44,
            enemy.size * 1.44
          );

          break;

        // --------------------------------------------
        // SEEKER
        // --------------------------------------------

        case "seeker":
          ctx.shadowBlur = 16;
          ctx.shadowColor = "#ff624e";

          circle(0, 0, enemy.size, null, "#ff624e", 4);

          circle(0, 0, 5, "#ffca76");

          break;

        // --------------------------------------------
        // SHOOTER
        // --------------------------------------------

        case "shooter":
          ctx.shadowBlur = 18;
          ctx.shadowColor = "#9b6cff";

          ctx.fillStyle = "#7a4ce0";

          ctx.beginPath();

          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;

            const x = Math.cos(angle) * enemy.size;

            const y = Math.sin(angle) * enemy.size;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.closePath();
          ctx.fill();

          circle(0, 0, 5, "#eee6ff");

          break;

        // --------------------------------------------
        // SPLITTER
        // --------------------------------------------

        case "splitter":
          ctx.shadowBlur = 18;
          ctx.shadowColor = "#ff2f7d";

          circle(0, 0, enemy.size, "#ff2f7d");

          ctx.shadowBlur = 0;

          ctx.strokeStyle = "#ffd1df";

          ctx.lineWidth = 3;

          ctx.beginPath();

          ctx.moveTo(-8, -11);

          ctx.lineTo(2, -1);

          ctx.lineTo(-5, 10);

          ctx.moveTo(5, -13);

          ctx.lineTo(-1, -3);

          ctx.lineTo(10, 9);

          ctx.stroke();

          break;

        // --------------------------------------------
        // FRAGMENT
        // --------------------------------------------

        case "fragment":
          ctx.shadowBlur = 11;
          ctx.shadowColor = "#ff4c94";

          circle(0, 0, enemy.size, "#ff4c94");

          break;
      }

      ctx.restore();
    };

    // ============================================================
    // BULLETS / PARTICLES
    // ============================================================

    const drawBullets = () => {
      for (const bullet of bullets) {
        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor = bullet.color;

        circle(bullet.x, bullet.y, bullet.size, bullet.color);

        ctx.restore();
      }
    };

    const drawParticles = () => {
      for (const particle of particles) {
        ctx.save();

        ctx.globalAlpha = Math.max(0, particle.life);

        circle(particle.x, particle.y, particle.size, particle.color);

        ctx.restore();
      }
    };

    // ============================================================
    // HUD
    // ============================================================

    const drawHUD = () => {
      ctx.save();

      ctx.textAlign = "left";

      ctx.fillStyle = "rgba(255,255,255,0.92)";

      ctx.font = "700 22px sans-serif";

      ctx.fillText(`Punkte: ${Math.floor(score)}`, 24, 38);

      ctx.fillStyle = "rgba(255,255,255,0.52)";

      ctx.font = "13px sans-serif";

      ctx.fillText(`Phase: ${getPhaseName()}`, 25, 61);

      ctx.fillText(`Zeit: ${elapsedTime.toFixed(1)}s`, 25, 80);

      const progress = Math.min(1, elapsedTime / 65);

      const width = Math.min(220, canvas.width * 0.24);

      ctx.fillStyle = "rgba(255,255,255,0.09)";

      ctx.fillRect(24, 92, width, 5);

      ctx.fillStyle = "#ff3366";

      ctx.fillRect(24, 92, width * progress, 5);

      if (specialWave) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";

        ctx.font = "700 12px sans-serif";

        ctx.fillText(
          `WAVE ${waveNumber}: ${getWaveName(specialWave.type)}`,
          25,
          119
        );
      }

      ctx.restore();
    };

    // ============================================================
    // WAVE BANNER
    // ============================================================

    const drawWaveBanner = () => {
      if (waveBannerTimer <= 0) {
        return;
      }

      const alpha = Math.min(1, waveBannerTimer * 1.5);

      ctx.save();

      ctx.globalAlpha = alpha;

      ctx.textAlign = "center";

      ctx.font = "800 14px sans-serif";

      ctx.fillStyle = "#ff6aa6";

      ctx.fillText(`WAVE ${waveNumber}`, canvas.width / 2, 55);

      ctx.font = "900 30px sans-serif";

      ctx.fillStyle = "#ffffff";

      ctx.shadowBlur = 16;

      ctx.shadowColor = "#ff3366";

      ctx.fillText(waveBannerText, canvas.width / 2, 87);

      ctx.restore();
    };

    // ============================================================
    // GAME OVER
    // ============================================================

    const drawGameOver = () => {
      ctx.save();

      ctx.fillStyle = "rgba(5,5,10,0.70)";

      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = "center";

      ctx.fillStyle = "#ffffff";

      ctx.font = "900 48px sans-serif";

      ctx.fillText("CRASH!", canvas.width / 2, canvas.height / 2 - 35);

      ctx.fillStyle = "#ff668d";

      ctx.font = "700 23px sans-serif";

      ctx.fillText(
        `${Math.floor(score)} Punkte`,
        canvas.width / 2,
        canvas.height / 2 + 10
      );

      ctx.fillStyle = "rgba(255,255,255,0.7)";

      ctx.font = "16px sans-serif";

      ctx.fillText(
        `Überlebt: ${elapsedTime.toFixed(1)} Sekunden`,
        canvas.width / 2,
        canvas.height / 2 + 42
      );

      ctx.fillText(
        "Drücke R für einen neuen Versuch",
        canvas.width / 2,
        canvas.height / 2 + 75
      );

      ctx.restore();
    };

    // ============================================================
    // RESET
    // ============================================================

    const resetGame = () => {
      enemies.length = 0;
      bullets.length = 0;
      particles.length = 0;

      score = 0;
      elapsedTime = 0;

      meteorSpawnTimer = 0;

      specialWave = null;
      waveCooldown = 6;
      lastWaveType = null;
      waveNumber = 0;

      waveBannerTimer = 0;
      waveBannerText = "";

      isGameOver = false;

      player.x = canvas.width / 2;

      player.y = canvas.height - 55;

      lastFrameTime = performance.now();

      cancelAnimationFrame(animationId);

      animationId = requestAnimationFrame(loop);
    };

    // ============================================================
    // MAIN LOOP
    // ============================================================

    const loop = (timestamp) => {
      const deltaSeconds = Math.min(
        0.034,
        Math.max(0, (timestamp - lastFrameTime) / 1000)
      );

      lastFrameTime = timestamp;

      const frameScale = deltaSeconds * 60;

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      if (!isGameOver) {
        elapsedTime += deltaSeconds;

        score += 0.1 * frameScale;

        if (waveBannerTimer > 0) {
          waveBannerTimer -= deltaSeconds;
        }

        updatePlayer(frameScale);

        updateMeteorSpawning(deltaSeconds);

        updateWaveDirector(deltaSeconds);

        updateEnemies(deltaSeconds, frameScale);

        if (!isGameOver) {
          updateBullets(frameScale);
        }
      }

      updateParticles(frameScale);

      // --------------------------------------------------------
      // DRAW
      // --------------------------------------------------------

      drawBackground();

      for (const enemy of enemies) {
        drawEnemy(enemy);
      }

      drawBullets();

      drawPlayer();

      drawParticles();

      drawHUD();

      drawWaveBanner();

      if (isGameOver) {
        drawGameOver();

        return;
      }

      animationId = requestAnimationFrame(loop);
    };

    // ============================================================
    // START
    // ============================================================

    animationId = requestAnimationFrame(loop);

    // ============================================================
    // CLEANUP
    // ============================================================

    return {
      destroy: () => {
        isGameOver = true;

        cancelAnimationFrame(animationId);

        window.removeEventListener("resize", resize);

        window.removeEventListener("keydown", onKeyDown);

        window.removeEventListener("keyup", onKeyUp);
      },
    };
  },
};
