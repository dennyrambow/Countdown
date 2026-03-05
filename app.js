/* Terminal Rooftop Countdown Mission Experience
   - No matrix overlay, clean terminal aesthetic
   - Sticky countdown timer (Scene 3+)
   - Scene-by-scene clearing with fade effects
   - Audio: typewriter + progress sfx + background loop
   - Fast paced with variable line speeds + glitch effects
*/

(() => {
  // =============================
  // CONFIG
  // =============================
  const CONFIG = {
    VERSION: "1.0.0",
    SITE_ORIGIN: "countdown.dennyrambow.de",
    TARGET_UTC_ISO: "2026-03-09T23:00:00Z",
    TARGET_LABEL: "10 MARCH · 00:00 (EUROPE/BERLIN)",
    TAGLINE: "MAKE IT LEGENDARY. LEVEL 40 AWAITS. UNIT ROOFTOP FOREVER.",

    SELF_DESTRUCT_SECONDS: 10,

    EVENT_DETAILS: [
      "DATE: MONDAY · MARCH 9 2026",
      "START: ~21:00",
      "EXECUTION: 10. MÄRZ · 00:00:00 UHR",
      "DRESSCODE: URBAN STEALTH · BERLIN CASUAL",
      "EXIT STRATEGY: LEAVE ANYTIME",
      "",
      "",
      "LOCATION - LOCKED",
      "TO UNLOCK: PROCEED",
    ],

    ADDRESS_TEXT: [
      "LOCATION RECEIVED",
      "",
      "LINIENSTR. 72",
      "10119 BERLIN, GERMANY",
      "",
      "TOP BUZZER - ORANGERIE",
      "WAIT FOR THE DOOR TO OPEN",
    ],

    FOOTER_LINES: [
      "© DENNY RAMBOW",
      "COUNTDOWN TO LEVEL 40",
      "BERLIN · 2026",
      "IF YOU KNOW, YOU KNOW.",
    ],

    GOOGLE_APPS_SCRIPT_ENDPOINT:
      "https://script.google.com/macros/s/AKfycbx0kMzdeCsTNRoH_uxxS4kjpzm276fV_-_BbKUtKm-Zo-bcjZssn-kHRDY-Rx0Raw3Vnw/exec",

    AUDIO: {
      volumeLoop: 0.05,
      volumeSfx: 0.18,
    },
  };

  // =============================
  // DOM REFERENCES
  // =============================
  const terminal = document.getElementById("terminal");
  const stickyBar = document.getElementById("stickyBar");
  const stickyCountdown = document.getElementById("stickyCountdown");
  const terminalInner = document.getElementById("terminalInner");
  const hiddenInput = document.getElementById("hiddenInput");
  const hint = document.getElementById("hint");

  // =============================
  // AUDIO BUS (IIFE) — Web Audio API
  // =============================
  const AudioBus = (() => {
    let audioContext = null;
    let loopNode = null;
    let tickerNode = null;

    const ctx = () => {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      return audioContext;
    };

    const gain = (value = 1) => {
      const g = ctx().createGain();
      g.gain.value = value;
      return g;
    };

    const connect = (...nodes) => {
      for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].connect(nodes[i + 1]);
      }
    };

    // Keyboard click: white noise + high-pass filter
    const playTypeClick = () => {
      try {
        const now = ctx().currentTime;
        const duration = 0.012;
        const buffer = ctx().createBuffer(1, ctx().sampleRate * duration, ctx().sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx().createBufferSource();
        src.buffer = buffer;
        const filter = ctx().createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        const env = gain(0.15);
        env.gain.setValueAtTime(0.15, now);
        env.gain.exponentialRampToValueAtTime(0.01, now + duration);

        connect(src, filter, env, ctx().destination);
        src.start(now);
        src.stop(now + duration);
      } catch {}
    };

    // Simple beep
    const playBeep = (freq = 800, dur = 0.1) => {
      try {
        const now = ctx().currentTime;
        const osc = ctx().createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const env = gain(0.15);
        env.gain.setValueAtTime(0.15, now);
        env.gain.exponentialRampToValueAtTime(0.01, now + dur);

        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + dur);
      } catch {}
    };

    // Triple beep for boot
    const playTripleBeep = () => {
      const now = ctx().currentTime;
      playBeep(800, 0.08);
      setTimeout(() => playBeep(800, 0.08), 120);
      setTimeout(() => playBeep(800, 0.08), 240);
    };

    // Rising chord: C → E → G
    const playAccept = () => {
      try {
        const now = ctx().currentTime;
        const playNote = (freq, start) => {
          const osc = ctx().createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;

          const env = gain(0.18);
          env.gain.setValueAtTime(0, start);
          env.gain.linearRampToValueAtTime(0.18, start + 0.05);
          env.gain.exponentialRampToValueAtTime(0.01, start + 0.08);

          connect(osc, env, ctx().destination);
          osc.start(start);
          osc.stop(start + 0.12);
        };

        playNote(261, now);        // C4
        playNote(329, now + 0.12); // E4
        playNote(392, now + 0.24); // G4
      } catch {}
    };

    // Frequency sweep (extended to 1.8s for more dramatic effect)
    const playReveal = () => {
      try {
        const now = ctx().currentTime;
        const osc = ctx().createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 1.8);

        const env = gain(0.12);
        env.gain.setValueAtTime(0.12, now);
        env.gain.exponentialRampToValueAtTime(0.01, now + 1.8);

        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + 1.8);
      } catch {}
    };

    // Descending tone + burst
    const playDestruct = () => {
      try {
        const now = ctx().currentTime;
        const osc = ctx().createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        const env = gain(0.2);
        env.gain.setValueAtTime(0.2, now);
        env.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + 0.3);

        // Burst at end
        setTimeout(() => playBeep(600, 0.08), 300);
      } catch {}
    };

    // Tiny click for progress
    const playProgress = () => {
      try {
        const now = ctx().currentTime;
        const dur = 0.008;
        const buffer = ctx().createBuffer(1, ctx().sampleRate * dur, ctx().sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx().createBufferSource();
        src.buffer = buffer;
        const filter = ctx().createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;

        const env = gain(0.1);
        env.gain.setValueAtTime(0.1, now);
        env.gain.exponentialRampToValueAtTime(0.01, now + dur);

        connect(src, filter, env, ctx().destination);
        src.start(now);
        src.stop(now + dur);
      } catch {}
    };

    // Modem-style tick: short digital click for progress bars
    const playTick = () => {
      try {
        const now = ctx().currentTime;
        const dur = 0.04; // 40ms digital click

        // Square wave with quick decay (modem-like)
        const osc = ctx().createOscillator();
        osc.type = 'square';
        osc.frequency.value = 800; // Bright digital tone

        const env = gain(0.18);
        env.gain.setValueAtTime(0.18, now);
        env.gain.exponentialRampToValueAtTime(0.01, now + dur);

        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + dur);
      } catch {}
    };

    // Calculate tick delay (in ms) based on progress percentage
    const getTickDelayMs = (percent) => {
      if (percent < 30) return 250;
      if (percent < 60) return 160;
      if (percent < 80) return 90;
      if (percent < 95) return 50;
      if (percent < 100) return 20;
      return 0; // Stop at 100%
    };

    // Progress step: deep bass swell (low frequencies, resonant build)
    const playProgressStep = (percent = 50) => {
      try {
        const now = ctx().currentTime;
        const dur = 0.28; // Slightly longer for deep resonance

        // Deep fundamental bass: 40-110 Hz (subwoofer range)
        const minFreq = 45;
        const maxFreq = 110;
        const baseFreq = minFreq + (maxFreq - minFreq) * (percent / 100);

        // Main oscillator: deep sine wave
        const osc1 = ctx().createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);

        // Sub-harmonic layer: even deeper (0.5x frequency for richness)
        const osc2 = ctx().createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 0.5, now);

        // Volume: builds with progress for intensity
        const baseVol = 0.04 + (percent / 100) * 0.12; // 0.04 → 0.16

        const env1 = gain(baseVol * 0.8);
        env1.gain.setValueAtTime(0.005, now);
        env1.gain.linearRampToValueAtTime(baseVol * 0.8, now + 0.06);
        env1.gain.exponentialRampToValueAtTime(0.0005, now + dur);

        const env2 = gain(baseVol * 0.4);
        env2.gain.setValueAtTime(0.002, now);
        env2.gain.linearRampToValueAtTime(baseVol * 0.4, now + 0.08);
        env2.gain.exponentialRampToValueAtTime(0.0002, now + dur);

        connect(osc1, env1, ctx().destination);
        connect(osc2, env2, ctx().destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + dur);
        osc2.stop(now + dur);
      } catch {}
    };

    // Prompt ready: two rising tones (D5 → A5)
    const playPromptReady = () => {
      try {
        const now = ctx().currentTime;
        const notes = [[587, now, 0.15], [880, now + 0.13, 0.22]];
        notes.forEach(([freq, t, dur]) => {
          const osc = ctx().createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const env = gain(0.12);
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(0.12, t + 0.03);
          env.gain.exponentialRampToValueAtTime(0.01, t + dur);
          connect(osc, env, ctx().destination);
          osc.start(t);
          osc.stop(t + dur);
        });
      } catch {}
    };

    // Mission title: low boom + high sparkle
    const playMissionTitle = () => {
      try {
        const now = ctx().currentTime;
        const osc = ctx().createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);
        const env = gain(0.28);
        env.gain.setValueAtTime(0.28, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + 0.6);
        setTimeout(() => playBeep(1200, 0.15), 80);
        setTimeout(() => playBeep(1800, 0.12), 220);
      } catch {}
    };

    // Enter confirm: two rapid ascending tones
    const playEnterConfirm = () => {
      try {
        const now = ctx().currentTime;
        const notes = [[600, now, 0.07], [900, now + 0.08, 0.1]];
        notes.forEach(([freq, t, dur]) => {
          const osc = ctx().createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const env = gain(0.13);
          env.gain.setValueAtTime(0.13, t);
          env.gain.exponentialRampToValueAtTime(0.01, t + dur);
          connect(osc, env, ctx().destination);
          osc.start(t);
          osc.stop(t + dur);
        });
      } catch {}
    };

    // Modem chaos: rapid FSK-like frequency shifts
    const playModem = (duration = 2.0) => {
      try {
        const now = ctx().currentTime;
        const freqs = [1200, 2200, 1800, 980, 600, 1400, 2400, 880, 440, 3000];
        const step = 0.035;
        const steps = Math.floor(duration / step);
        for (let i = 0; i < steps; i++) {
          const t = now + i * step;
          const freq = freqs[Math.floor(Math.random() * freqs.length)];
          const osc = ctx().createOscillator();
          osc.type = i % 4 === 0 ? 'square' : i % 3 === 0 ? 'sawtooth' : 'sine';
          osc.frequency.value = freq;
          const env = gain(0.055);
          env.gain.setValueAtTime(0.055, t);
          env.gain.exponentialRampToValueAtTime(0.001, t + step);
          connect(osc, env, ctx().destination);
          osc.start(t);
          osc.stop(t + step + 0.005);
        }
      } catch {}
    };

    // Address reveal: long sweep 80 Hz → 2400 Hz + accent tones
    const playAddressReveal = () => {
      try {
        const now = ctx().currentTime;
        const osc = ctx().createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 1.8);
        const env = gain(0.15);
        env.gain.setValueAtTime(0.01, now);
        env.gain.linearRampToValueAtTime(0.15, now + 0.3);
        env.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + 2.0);
        setTimeout(() => playBeep(1400, 0.2), 1600);
        setTimeout(() => playBeep(2000, 0.15), 1900);
      } catch {}
    };

    // Bomb tick: short beep that increases in frequency/intensity (0.0=slow, 1.0=fast)
    const playBombTick = (intensity = 0.5) => {
      try {
        const now = ctx().currentTime;
        const freq = 200 + intensity * 800; // 200 Hz (cold) → 1000 Hz (hot)
        const vol = 0.1 + intensity * 0.2;
        const osc = ctx().createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        const env = gain(vol);
        env.gain.setValueAtTime(vol, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch {}
    };

    // Tension loop: rising sawtooth wave for countdown drama
    const playTensionLoop = (duration = 5.0) => {
      try {
        const now = ctx().currentTime;
        const osc = ctx().createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + duration);
        const env = gain(0.06);
        env.gain.setValueAtTime(0.06, now);
        env.gain.linearRampToValueAtTime(0.14, now + duration * 0.8);
        env.gain.exponentialRampToValueAtTime(0.001, now + duration);
        connect(osc, env, ctx().destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch {}
    };

    // Sub-bass drone only (ticker starts separately with startTicker)
    const startLoop = () => {
      try {
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
        }

        // Sub-bass drone for atmosphere
        const droneOsc = ctx().createOscillator();
        droneOsc.type = 'sine';
        droneOsc.frequency.value = 40;
        const droneGain = gain(CONFIG.AUDIO.volumeLoop * 0.4);
        connect(droneOsc, droneGain, ctx().destination);
        droneOsc.start();

        loopNode = { drone: droneOsc, droneGain };
      } catch {}
    };

    // Countdown second ticker (starts only when sticky countdown is visible)
    const startTicker = () => {
      try {
        if (tickerNode) return; // Avoid double start

        let nextTick = ctx().currentTime + 0.05;

        const playTick = (t) => {
          try {
            const bufLen = Math.ceil(ctx().sampleRate * 0.018);
            const buf = ctx().createBuffer(1, bufLen, ctx().sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            const src = ctx().createBufferSource();
            src.buffer = buf;
            const f = ctx().createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = 1800;
            f.Q.value = 2;
            const g = gain(CONFIG.AUDIO.volumeLoop * 3);
            g.gain.setValueAtTime(CONFIG.AUDIO.volumeLoop * 3, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
            connect(src, f, g, ctx().destination);
            src.start(t);
            src.stop(t + 0.02);
          } catch {}
        };

        const schedule = () => {
          const lookahead = ctx().currentTime + 0.2;
          while (nextTick < lookahead) {
            playTick(nextTick);
            nextTick += 1.0;
          }
        };

        const timer = setInterval(schedule, 100);
        schedule();
        tickerNode = { timer };
      } catch {}
    };

    const stopTicker = () => {
      try {
        if (tickerNode) {
          clearInterval(tickerNode.timer);
          tickerNode = null;
        }
      } catch {}
    };

    const stopLoop = () => {
      try {
        stopTicker();
        if (loopNode) {
          loopNode.droneGain.gain.exponentialRampToValueAtTime(0.0001, ctx().currentTime + 0.5);
          setTimeout(() => {
            if (loopNode?.drone) {
              loopNode.drone.stop();
              loopNode = null;
            }
          }, 500);
        }
      } catch {}
    };

    // Progress tick loop: plays accelerating ticks based on progress percentage
    let tickLoopTimer = null;
    let lastTickTime = 0;

    const startProgressTicks = (getProgressFn) => {
      if (tickLoopTimer) return; // Already running

      const tick = () => {
        const now = Date.now();
        const percent = getProgressFn();
        const delay = getTickDelayMs(percent);

        if (delay === 0) {
          // Progress complete: stop ticks and play beep
          clearInterval(tickLoopTimer);
          tickLoopTimer = null;
          playBeep(1000, 0.2); // Confirmation beep
          return;
        }

        // Play tick if enough time has passed since last tick
        if (now - lastTickTime >= delay) {
          playTick();
          lastTickTime = now;
        }
      };

      lastTickTime = Date.now();
      tickLoopTimer = setInterval(tick, 10); // Check every 10ms for tight timing
    };

    const stopProgressTicks = () => {
      if (tickLoopTimer) {
        clearInterval(tickLoopTimer);
        tickLoopTimer = null;
      }
    };

    return {
      start: startLoop,
      stop: stopLoop,
      startTicker,
      startProgressTicks,
      stopProgressTicks,
      sfx: {
        type: playTypeClick,
        beep: playBeep,
        tripleBeep: playTripleBeep,
        accept: playAccept,
        reveal: playReveal,
        destruct: playDestruct,
        progress: playProgress,
        progressStep: playProgressStep,
        promptReady: playPromptReady,
        missionTitle: playMissionTitle,
        enterConfirm: playEnterConfirm,
        modem: playModem,
        addressReveal: playAddressReveal,
        bombTick: playBombTick,
        tensionLoop: playTensionLoop,
        tick: playTick,
      },
    };
  })();

  // =============================
  // TERMINAL ENGINE CLASS
  // =============================
  class TerminalEngine {
    constructor(root) {
      this.root = root;
      this.currentPrompt = null;
      this._waitingEnter = null;
      this._countdownInterval = null;
      this._destroyed = false;
      this._flickerTimer = null;
      this._flickerCursor = null;
      this.lineCount = 0;
    }

    async clearScene() {
      // Scroll to top and clear all content
      this.root.innerHTML = "";
      this.lineCount = 0;
      // Stop any running progress ticks
      AudioBus.stopProgressTicks();
    }


    appendLine(text, { cls = "line", dim = false, faint = false } = {}) {
      const p = document.createElement("div");
      p.className = cls + (dim ? " dim" : "") + (faint ? " faint" : "");
      p.textContent = text;
      this.root.appendChild(p);
      this.lineCount++;
      return p;
    }

    appendBlank() {
      return this.appendLine("", { faint: true });
    }

    appendBlock(lines) {
      const block = document.createElement("div");
      block.className = "block";
      for (const line of lines) {
        const d = document.createElement("div");
        d.className = "line";
        d.textContent = line;
        block.appendChild(d);
      }
      this.root.appendChild(block);
      this.lineCount++;
      return block;
    }

    sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    // Glitch effect: random letter speed variance
    _getGlitchSpeed(baseSpeed) {
      // 80% of time normal, 20% glitch with variance
      if (Math.random() < 0.2) {
        const variance = Math.random() < 0.5 ? baseSpeed * 0.5 : baseSpeed * 1.5;
        return Math.max(5, Math.floor(variance));
      }
      return baseSpeed;
    }

    async typeLine(text, { speedMs = null, durationMs = null, dim = false, faint = false, glitch = true } = {}) {
      const el = document.createElement("div");
      el.className = "line" + (dim ? " dim" : "") + (faint ? " faint" : "");
      el.textContent = "";
      this.root.appendChild(el);

      let actualSpeed;
      if (durationMs != null) {
        actualSpeed = Math.max(10, Math.floor(durationMs / Math.max(1, text.length)));
      } else if (speedMs != null) {
        actualSpeed = speedMs;
      } else {
        actualSpeed = 10;
      }

      for (let i = 0; i < text.length; i++) {
        if (this._destroyed) return;
        el.textContent += text[i];
        if (text[i] !== " ") AudioBus.sfx.type();

        const speed = glitch ? this._getGlitchSpeed(actualSpeed) : actualSpeed;
        await this.sleep(speed);
      }
      return el;
    }

    // Loading bar: 0→100%, no label text, removed immediately after
    async loadingBar(durationMs = 2000, steps = 28) {
      const line = document.createElement("div");
      line.className = "line";
      this.root.appendChild(line);
      this.lineCount++;

      const stepDelay = Math.max(10, Math.floor(durationMs / steps));
      let currentPercent = 0;

      // Start dynamic modem-style ticking
      AudioBus.startProgressTicks(() => currentPercent);

      for (let i = 0; i <= steps; i++) {
        const pct = Math.floor((i / steps) * 100);
        currentPercent = pct;
        const filled = "█".repeat(i);
        const empty = "░".repeat(steps - i);
        line.textContent = `[${filled}${empty}] ${String(pct).padStart(3, " ")}%`;
        await this.sleep(stepDelay);
      }
      // Remove immediately after reaching 100%
      try { line.remove(); } catch {}
      AudioBus.stopProgressTicks(); // Ensure ticks are stopped
      return line;
    }

    // Progress bar with label, removed immediately after 100%
    async progressBar(label = "PROGRESS", steps = 24, delay = 45, { startAt = 0, capPercent = null, endAtStep = null } = {}) {
      const line = document.createElement("div");
      line.className = "line";
      this.root.appendChild(line);
      this.lineCount++;

      const startStep = Math.floor(steps * startAt);
      const finalStep = endAtStep !== null ? endAtStep : steps;

      let currentPercent = 0;

      // Start dynamic modem-style ticking
      AudioBus.startProgressTicks(() => currentPercent);

      for (let i = startStep; i <= finalStep; i++) {
        let percent = Math.floor((i / steps) * 100);
        if (capPercent !== null) percent = Math.min(percent, capPercent);
        currentPercent = percent;
        const filled = "█".repeat(i);
        const empty = "░".repeat(steps - i);
        line.textContent = `${label} [${filled}${empty}] ${String(percent).padStart(3, " ")}%`;
        await this.sleep(delay);
      }
      // Remove immediately after reaching 100%
      try { line.remove(); } catch {}
      AudioBus.stopProgressTicks(); // Ensure ticks are stopped
      return line;
    }

    async waitForEnter(labelText = null) {
      if (labelText) this.appendLine(labelText);
      return new Promise((resolve) => {
        const line = document.createElement("div");
        line.className = "line";

        const prefix = document.createElement("span");
        prefix.textContent = "> ";

        const cursor = document.createElement("span");
        cursor.className = "cursor blink";
        cursor.textContent = "_";

        line.appendChild(prefix);
        line.appendChild(cursor);

        this.root.appendChild(line);
        this.lineCount++;

        this.startCursorFlicker(cursor);
        this._waitingEnter = { resolve, el: line };
      });
    }

    startCursorFlicker(cursorEl) {
      this.stopCursorFlicker();
      if (!cursorEl) return;
      this._flickerCursor = cursorEl;

      this._flickerTimer = setInterval(() => {
        if (!this._flickerCursor || !this._flickerCursor.isConnected) return;
        if (Math.random() < 0.18) {
          this._flickerCursor.style.opacity = "0";
          setTimeout(() => {
            if (this._flickerCursor) this._flickerCursor.style.opacity = "";
          }, 40 + Math.floor(Math.random() * 80));
        }
      }, 120);
    }

    stopCursorFlicker() {
      if (this._flickerTimer) {
        clearInterval(this._flickerTimer);
        this._flickerTimer = null;
      }
      if (this._flickerCursor) {
        this._flickerCursor.style.opacity = "";
        this._flickerCursor = null;
      }
    }

    prompt(question, {
      validator,
      normalize = (s) => s,
      allowedChars = null,
      maxLen = 120,
    } = {}) {
      if (this.currentPrompt) this._finalizePrompt();

      // Add extra blank line for spacing before prompt
      this.appendBlank();
      this.appendBlank();

      // Play "ready for input" chime
      AudioBus.sfx.promptReady();

      const line = document.createElement("div");
      line.className = "line prompt";

      const q = document.createElement("span");
      q.textContent = question;

      const br = document.createElement("br");

      const prefix = document.createElement("span");
      prefix.textContent = "> ";

      const inputSpan = document.createElement("span");
      inputSpan.textContent = "";

      const cursor = document.createElement("span");
      cursor.className = "cursor blink";
      cursor.textContent = "_";

      line.appendChild(q);
      line.appendChild(br);
      line.appendChild(prefix);
      line.appendChild(inputSpan);
      line.appendChild(cursor);

      this.root.appendChild(line);
      this.lineCount++;

      this.startCursorFlicker(cursor);

      return new Promise((resolve) => {
        this.currentPrompt = {
          lineEl: line,
          inputSpan,
          cursorSpan: cursor,
          buffer: "",
          resolve,
          validator,
          normalize,
          allowedChars,
          maxLen,
        };
      });
    }

    _finalizePrompt() {
      if (!this.currentPrompt) return;
      this.currentPrompt.cursorSpan.classList.remove("blink");
      this.stopCursorFlicker();
      this.currentPrompt = null;
    }

    async handleKey(e) {
      if (this._destroyed) return;

      const flickerCursor = this.currentPrompt
        ? this.currentPrompt.cursorSpan
        : this._waitingEnter
          ? this._waitingEnter.el.querySelector(".cursor")
          : null;

      if (flickerCursor) this.startCursorFlicker(flickerCursor);

      // Waiting for Enter
      if (this._waitingEnter) {
        if (e.key === "Enter") {
          e.preventDefault();
          const c = this._waitingEnter.el.querySelector(".cursor");
          if (c) c.classList.remove("blink");
          this.stopCursorFlicker();
          AudioBus.sfx.enterConfirm();
          const res = this._waitingEnter.resolve;
          this._waitingEnter = null;
          res();
        } else if (e.key.length === 1 || e.key === "Backspace") {
          AudioBus.sfx.beep();
        }
        return;
      }

      if (!this.currentPrompt) return;
      const p = this.currentPrompt;

      if (e.key === "Enter") {
        e.preventDefault();
        const raw = p.buffer;
        const normalized = p.normalize(raw);
        const result = p.validator ? p.validator(normalized) : { ok: true, value: normalized };

        if (result.ok) {
          p.cursorSpan.classList.remove("blink");
          this._finalizePrompt();
          AudioBus.sfx.enterConfirm();
          p.resolve(result.value);
        } else {
          AudioBus.sfx.beep();
          this.appendLine(result.error || "INVALID INPUT", { dim: true });
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (p.buffer.length > 0) {
          p.buffer = p.buffer.slice(0, -1);
          p.inputSpan.textContent = p.buffer;
        } else {
          AudioBus.sfx.beep();
        }
        return;
      }

      const ignored = ["Shift", "Tab", "CapsLock", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (ignored.includes(e.key)) return;

      if (e.key.length === 1) {
        e.preventDefault();
        if (p.buffer.length >= p.maxLen) {
          AudioBus.sfx.beep();
          return;
        }
        const ch = e.key;

        if (p.allowedChars && !p.allowedChars(ch, p.buffer)) {
          AudioBus.sfx.beep();
          return;
        }

        p.buffer += ch;
        p.inputSpan.textContent = p.buffer;
        return;
      }
    }

    startStickyCountdown() {
      const targetMs = Date.parse(CONFIG.TARGET_UTC_ISO);
      stickyBar.classList.add("on");

      const pad2 = (n) => String(n).padStart(2, "0");

      const tick = () => {
        const now = Date.now();
        let diff = Math.max(0, targetMs - now);

        const totalSeconds = Math.floor(diff / 1000);
        const dd = Math.floor(totalSeconds / 86400);
        const hh = Math.floor((totalSeconds % 86400) / 3600);
        const mm = Math.floor((totalSeconds % 3600) / 60);
        const ss = totalSeconds % 60;

        stickyCountdown.textContent = `${pad2(dd)} : ${pad2(hh)} : ${pad2(mm)} : ${pad2(ss)}`;
      };

      tick();
      this._countdownInterval = setInterval(tick, 250);
    }

    stopStickyCountdown() {
      if (this._countdownInterval) clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }

    async wipeScreenAnimated() {
      const children = Array.from(this.root.children);
      for (let i = children.length - 1; i >= 0; i--) {
        if (this._destroyed) break;
        try {
          this.root.removeChild(children[i]);
        } catch {}
        await this.sleep(14);
      }
    }

    async blackOut(ms = 2000) {
      this.root.innerHTML = "";
      await this.sleep(ms);
    }

    async leaveBlinkingCursorOnly() {
      this.root.innerHTML = "";
      const line = document.createElement("div");
      line.className = "line";
      const cursor = document.createElement("span");
      cursor.className = "cursor blink";
      cursor.textContent = "_";
      line.appendChild(cursor);
      this.root.appendChild(line);
      this.startCursorFlicker(cursor);
    }

    destroy() {
      this._destroyed = true;
      this.stopStickyCountdown();
    }
  }

  const term = new TerminalEngine(terminalInner);

  // =============================
  // INPUT & FOCUS HANDLING
  // =============================
  const focusInput = () => {
    try {
      hiddenInput.focus({ preventScroll: true });
    } catch {
      hiddenInput.focus();
    }
    hint.classList.add("hidden");
  };

  terminal.addEventListener("click", focusInput);
  terminal.addEventListener("touchstart", focusInput, { passive: true });

  window.addEventListener("pointerdown", focusInput, { passive: true });
  window.addEventListener("touchend", focusInput, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) setTimeout(() => focusInput(), 120);
  });

  setInterval(() => {
    if (document.activeElement !== hiddenInput) focusInput();
  }, 3000);

  hiddenInput.addEventListener("keydown", (e) => term.handleKey(e));
  document.addEventListener("keydown", (e) => {
    if (document.activeElement !== hiddenInput) term.handleKey(e);
  });

  // =============================
  // VALIDATORS
  // =============================
  const validateYN = (s) => {
    const v = String(s || "").trim().toUpperCase();
    if (v === "Y") return { ok: true, value: "Y" };
    if (v === "N") return { ok: true, value: "N" };
    return { ok: false, error: "INVALID INPUT. USE Y OR N." };
  };

  const isLetter = (ch) => {
    try {
      return /\p{L}/u.test(ch);
    } catch {
      return /^[A-Za-zÀ-ÖØ-öø-ÿ]$/.test(ch);
    }
  };

  const allowedNameChar = (ch) => {
    if (ch === " " || ch === "-" || ch === "'") return true;
    return isLetter(ch);
  };

  const validateName = (s) => {
    const name = String(s || "").trim();
    if (!name) return { ok: false, error: "NAME REQUIRED." };
    if (name.length > 40) return { ok: false, error: "NAME TOO LONG. MAX 40." };
    for (const ch of name) {
      if (!(ch === " " || ch === "-" || ch === "'" || isLetter(ch))) {
        return { ok: false, error: "INVALID NAME CHARACTERS." };
      }
    }
    return { ok: true, value: name };
  };

  const validateRooftop = (s) => {
    const v = String(s || "").trim().toUpperCase();
    if (v === "ROOFTOP") return { ok: true, value: "ROOFTOP" };
    return { ok: false, error: "INVALID COMMAND. TYPE ROOFTOP." };
  };

  // =============================
  // Y/N PROMPT WITH CONFIRMATION
  // =============================
  const promptYNWithConfirmation = async (question) => {
    let confirmed = false;
    while (!confirmed) {
      const answer = await term.prompt(question, {
        validator: validateYN,
        normalize: (s) => String(s || "").trim(),
        allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
        maxLen: 1,
      });
      if (answer === "Y") {
        return "Y";
      } else {
        // User said No, ask for confirmation
        term.appendBlank();
        const isReallySure = await term.prompt("ARE YOU SURE? [Y/N]", {
          validator: validateYN,
          normalize: (s) => String(s || "").trim(),
          allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
          maxLen: 1,
        });
        if (isReallySure === "Y") {
          // Confirmed No
          return "N";
        }
        // Go back to original question
        term.appendBlank();
      }
    }
  };

  // =============================
  // GOOGLE APPS SCRIPT POST
  // =============================
  const postRsvp = async ({ name, plus_one }) => {
    const endpoint = CONFIG.GOOGLE_APPS_SCRIPT_ENDPOINT;

    if (!endpoint) {
      return { ok: true, simulated: true };
    }

    const payload = {
      name,
      plus_one,
      timestamp: new Date().toISOString(),
      source: CONFIG.SITE_ORIGIN,
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) return { ok: false, status: res.status, text };

      try {
        const j = JSON.parse(text);
        return { ok: !!j.ok, ...j };
      } catch {
        return { ok: true, raw: text };
      }
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };

  // =============================
  // FLOW (Scenes)
  // =============================
  const FLOW = async () => {
    focusInput();

    // ========== SCENE 1: Boot Sequence with Audio ==========
    await term.clearScene();

    // Minimal static prompt for first user interaction
    // This unlocks the AudioContext browser restriction
    await term.waitForEnter("[ PRESS ENTER TO INITIALIZE ]");

    // FIRST USER INTERACTION — Audio unlocked
    await AudioBus.start();

    // Modem/connection sound: 0.8s "connecting to distant galaxy"
    AudioBus.sfx.modem(0.8);
    await term.sleep(900);

    // Boot sequence now WITH audio (type clicks play automatically)
    const initLine = await term.typeLine("INITIALIZING SYSTEM", { dim: true, durationMs: 1600 });
    initLine.classList.add("system-dots");
    await term.sleep(300);
    AudioBus.sfx.beep(400, 0.15); // Low beep confirmation
    await term.sleep(400);

    const channelLine = await term.typeLine("SECURE CHANNEL ESTABLISHED", { dim: true, durationMs: 2000 });
    channelLine.classList.add("system-dots");
    await term.sleep(300);
    AudioBus.sfx.beep(600, 0.15); // Mid beep
    await term.sleep(400);

    const transmitLine = await term.typeLine("TRANSMISSION RECEIVED", { dim: true, durationMs: 1800 });
    transmitLine.classList.add("system-dots");
    await term.sleep(300);
    AudioBus.sfx.beep(800, 0.15); // High beep
    await term.sleep(600);

    // Loading transition to Scene 2
    await term.loadingBar(2000);

    // ========== SCENE 2: Mission Invite ==========
    await term.clearScene();
    await term.loadingBar(2000);

    await term.typeLine("HELLO AGENT", { durationMs: 1400 });
    await term.sleep(300);
    await term.typeLine("YOU ARE INVITED!", { durationMs: 1800 });
    await term.sleep(2000);

    term.appendBlank();
    await term.typeLine("YOUR MISSION:", { durationMs: 1600 });
    await term.sleep(4000);

    // Mission box with all info
    term.appendBlank();
    const missionBox = document.createElement("div");
    missionBox.className = "mission-box";

    const missionTitle = document.createElement("div");
    missionTitle.className = "mission-title";
    missionTitle.textContent = "ROOFTOP COUNTDOWN";
    missionBox.appendChild(missionTitle);

    const missionSubtitle = document.createElement("div");
    missionSubtitle.className = "mission-subtitle";
    missionSubtitle.textContent = "ESCORT HIM INTO HIS NEXT DECADE";
    missionBox.appendChild(missionSubtitle);

    const missionTagline = document.createElement("div");
    missionTagline.className = "mission-tagline";
    missionTagline.textContent = "MAKE IT LEGENDARY · LEVEL 40 AWAITS · ROOFTOP FOREVER";
    missionBox.appendChild(missionTagline);

    // Play mission title accent sound
    AudioBus.sfx.missionTitle();

    terminalInner.appendChild(missionBox);
    term.lineCount++;

    // User reads the box for ~10 seconds
    await term.sleep(10000);

    const acceptMission = await promptYNWithConfirmation("ACCEPT MISSION? [Y/N]");

    if (acceptMission === "N") {
      await term.clearScene();
      await term.typeLine("TRANSMISSION TERMINATED.", { dim: true, durationMs: 2200 });
      term.appendBlank();
      await term.typeLine("PRESS ENTER TO RESTART", { durationMs: 2000 });
      await term.waitForEnter();
      return FLOW();
    }

    AudioBus.sfx.accept();

    // ========== SCENE 3: Identity Scan & Briefing ==========
    await term.clearScene();
    await term.loadingBar(2000);

    await term.typeLine("PLEASE LOOK INTO THE CAMERA", { durationMs: 2200 });
    await term.sleep(3000);
    const eyesLine = await term.typeLine("OPEN YOUR EYES", { durationMs: 1600 });
    eyesLine.classList.add("system-dots");
    await term.sleep(2000);
    await term.typeLine("and smile 😊", { durationMs: 1200 });
    await term.sleep(2000);

    term.appendBlank();
    const scanLine = await term.typeLine("SCANNING AGENT CREDENTIALS", { dim: true, durationMs: 1800 });
    scanLine.classList.add("system-dots");
    AudioBus.sfx.modem(1.5); // Analysis chaos sound
    await term.sleep(1800); // Long pause for analysis

    // Rising analysis beeps (system scanning)
    AudioBus.sfx.beep(300, 0.1);
    await term.sleep(200);
    AudioBus.sfx.beep(500, 0.1);
    await term.sleep(200);
    AudioBus.sfx.beep(700, 0.1);
    await term.sleep(200);
    AudioBus.sfx.beep(900, 0.1);
    await term.sleep(400);

    const verifyLine = await term.typeLine("VERIFYING IDENTITY", { dim: true, durationMs: 1800 });
    verifyLine.classList.add("system-dots");
    AudioBus.sfx.modem(0.8);
    await term.sleep(1200);

    const confirmLine = await term.typeLine("SECURE CHANNEL CONFIRMED", { dim: true, durationMs: 1800 });
    confirmLine.classList.add("system-dots");
    await term.sleep(400);
    AudioBus.sfx.beep(1200, 0.15); // High confirm beep
    await term.sleep(300);
    await term.typeLine("IDENTITY APPROVED", { durationMs: 2000 });

    term.appendBlank();
    term.appendBlank();
    await term.typeLine("WELCOME AGENT TO UNIT ROOFTOP.", { durationMs: 2200 });

    await term.sleep(8000);

    const ready = await promptYNWithConfirmation("READY FOR YOUR MISSION BRIEFING? [Y/N]");

    if (ready === "N") {
      await term.clearScene();
      await term.typeLine("BRIEFING ABORTED.", { dim: true, durationMs: 2200 });
      term.appendBlank();
      await term.typeLine("PRESS ENTER TO RESTART", { durationMs: 2000 });
      await term.waitForEnter();
      return FLOW();
    }

    await term.clearScene();
    await term.loadingBar(2000);
    term.startStickyCountdown();
    AudioBus.startTicker(); // Countdown ticks start here

    // Show progress bars before briefing
    term.appendBlank();

    // Level 39 at 99%
    const level39Bar = document.createElement("div");
    level39Bar.className = "line";
    const filled39 = "█".repeat(24);
    level39Bar.textContent = `LEVEL 39 [${filled39}]  99%`;
    terminalInner.appendChild(level39Bar);
    term.lineCount++;

    term.appendBlank();

    // Level 40 IN PROGRESS
    const level40Bar = document.createElement("div");
    level40Bar.className = "line";
    level40Bar.textContent = "LEVEL 40 [░░░░░░░░░░░░░░░░░░░░░░] IN PROGRESS";
    terminalInner.appendChild(level40Bar);
    term.lineCount++;

    term.appendBlank();
    term.appendBlank();

    // Briefing blocks
    const briefingBlocks = [
      [
        "LEVEL 39 IS ALMOST COMPLETE.",
        "FOR 39 YEARS THE SYSTEM HAS BEEN RUNNING STABLE.",
        "NOW THE CLOCK APPROACHES LEVEL 40.",
      ],
      [
        "YOUR MISSION IS SIMPLE.",
        "YOUR ROLE IS NOT TO SAVE THE WORLD.",
        "IT IS MORE IMPORTANT:",
        "YOU NEED TO GIVE HIM A GOOD PUSH INTO THE NEXT DECADE.",
      ],
      [
        "THIS IS A SUPPORT MISSION.",
        "NO PRESSURE. NO FORMALITIES.",
        "JUST GOOD PEOPLE ON A BERLIN ROOFTOP.",
        "YOU CAN BRING YOUR OWN DRINK.",
        "BUT THERE WILL BE DRINKS PROVIDED.",
        "TOASTS ARE OPTIONAL.",
        "THE VIEW IS NOT.",
      ],
      [
        "THE FINAL MOMENT WILL OCCUR AT EXACTLY MIDNIGHT.",
        "AT THAT POINT LEVEL 40 WILL BE UNLOCKED.",
        "LOCATION: ABOVE GROUND LEVEL.",
        "BRING STEADY NERVES IF YOU'RE AFRAID OF HEIGHTS.",
      ],
      [
        "MISSION BRIEFING COMPLETE.",
      ],
    ];

    for (const block of briefingBlocks) {
      for (const line of block) {
        if (line === "") {
          term.appendBlank();
        } else {
          await term.typeLine(line, { durationMs: 2200 });
        }
      }
      term.appendBlank();
      term.appendBlank();
      term.appendBlank();
      await term.sleep(1200);
    }

    term.appendBlank();
    let understood = false;
    while (!understood) {
      const resp = await term.prompt("CONFIRM YOU UNDERSTAND YOUR RESPONSIBILITIES. [Y/N]", {
        validator: validateYN,
        normalize: (s) => String(s || "").trim(),
        allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
        maxLen: 1,
      });

      if (resp === "Y") {
        understood = true;
      } else {
        await term.clearScene();
        await term.loadingBar(2000);
        term.startStickyCountdown();
        AudioBus.startTicker(); // Restart ticks for replayed briefing

        await term.typeLine("REPLAYING BRIEFING (SHORT VERSION)...", { dim: true, durationMs: 2400 });
        await term.sleep(1200);
        await term.typeLine("You escort him into Level 40. Quietly. Cleanly.", { durationMs: 2800 });
        await term.sleep(1200);
        await term.typeLine("Midnight on a Berlin rooftop. Bring bubbles.", { durationMs: 2400 });
        await term.sleep(2000);

        term.appendBlank();
      }
    }

    // ========== SCENE 4: Mission Summary ==========
    await term.clearScene();
    await term.loadingBar(2000);

    await term.typeLine("MISSION SUMMARY", { durationMs: 2000 });
    term.appendBlank();
    term.appendBlock(CONFIG.EVENT_DETAILS);

    const confirmSummary = await promptYNWithConfirmation("CONFIRM MISSION DETAILS? [Y/N]");

    if (confirmSummary === "N") {
      await term.clearScene();
      await term.typeLine("MISSION DECLINED.", { dim: true, durationMs: 2200 });
      term.appendBlank();
      await term.typeLine("PRESS ENTER TO RESTART", { durationMs: 2000 });
      await term.waitForEnter();
      term.stopStickyCountdown();
      stickyBar.classList.remove("on");
      return FLOW();
    }

    // ========== SCENE 5: Personal Details ==========
    await term.clearScene();
    await term.loadingBar(2000);

    await term.typeLine("THANK YOU, AGENT.", { durationMs: 2000 });
    await term.sleep(500);
    await term.typeLine("WE WON'T FORGET THIS.", { dim: true, durationMs: 2200 });

    let detailsConfirmed = false;
    let name = "";
    let plus_one = false;

    while (!detailsConfirmed) {
      name = await term.prompt("ENTER YOUR REAL FULL NAME", {
        validator: validateName,
        normalize: (s) => String(s || ""),
        allowedChars: allowedNameChar,
        maxLen: 40,
      });

      const plusOneYN = await term.prompt("BRINGING ANOTHER AGENT (+1)? [Y/N]", {
        validator: validateYN,
        normalize: (s) => String(s || "").trim(),
        allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
        maxLen: 1,
      });
      plus_one = plusOneYN === "Y";

      // Show summary in box
      const summaryLines = [`${String(name).toUpperCase()}`];
      if (plus_one) {
        summaryLines.push("PLUS ONE");
      }
      term.appendBlock(summaryLines);

      const correctDetails = await term.prompt("DETAILS CORRECT OR WANT TO CHANGE? (Y=CORRECT, N=CHANGE)", {
        validator: validateYN,
        normalize: (s) => String(s || "").trim(),
        allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
        maxLen: 1,
      });

      if (correctDetails === "Y") {
        detailsConfirmed = true;
      } else {
        await term.clearScene();
        await term.loadingBar(1000);
        await term.typeLine("RESTARTING DATA ENTRY...", { dim: true, durationMs: 2000 });
        term.appendBlank();
      }
    }

    const cmd = await term.prompt("WRITE ROOFTOP TO SEND DATA", {
      validator: validateRooftop,
      normalize: (s) => String(s || ""),
      allowedChars: (ch) => /[a-zA-Z]/.test(ch),
      maxLen: 7,
    });

    if (cmd !== "ROOFTOP") return;

    await term.clearScene();
    await term.loadingBar(2000);

    const uplinkLine = await term.typeLine("UPLINKING DATA", { dim: true, durationMs: 1800 });
    uplinkLine.classList.add("system-dots");
    await term.progressBar("UPLINK", 50, 100, { startAt: 0, capPercent: 100, endAtStep: 50 });

    let postResult = null;
    try {
      postResult = await postRsvp({ name, plus_one });
    } catch (err) {
      postResult = { ok: false, error: String(err) };
    }

    while (!postResult.ok) {
      AudioBus.sfx.beep();
      term.appendLine("UPLINK FAILED.", { dim: true });
      const retry = await term.prompt("RETRY? [Y/N]", {
        validator: validateYN,
        normalize: (s) => String(s || "").trim(),
        allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
        maxLen: 1,
      });
      if (retry === "N") {
        await term.clearScene();
        await term.typeLine("TRANSMISSION TERMINATED.", { dim: true, durationMs: 2400 });
        term.appendBlank();
        await term.typeLine("PRESS ENTER TO RESTART", { durationMs: 2000 });
        await term.waitForEnter();
        term.stopStickyCountdown();
        stickyBar.classList.remove("on");
        return FLOW();
      }
      await term.typeLine("RETRYING UPLINK...", { dim: true, durationMs: 2000 });
      try {
        postResult = await postRsvp({ name, plus_one });
      } catch (err) {
        postResult = { ok: false, error: String(err) };
      }
    }

    await term.clearScene();

    await term.typeLine("MISSION ACCEPTED.", { durationMs: 2000 });
    await term.sleep(500);
    const agentName = plus_one ? `${String(name).toUpperCase()} (+1)` : String(name).toUpperCase();
    await term.typeLine(`AGENT: ${agentName}`, { dim: true, durationMs: 2000 });

    term.appendBlank();
    term.appendBlank();
    const transLine = await term.typeLine("TRANSMITTING COORDINATES", { dim: true, durationMs: 1800 });
    transLine.classList.add("system-dots");
    AudioBus.sfx.modem(3.0);
    await term.sleep(3000);

    AudioBus.sfx.reveal();
    await term.sleep(300);
    const verifiedLine = await term.typeLine("COORDINATES VERIFIED", { dim: true, durationMs: 1800 });
    verifiedLine.classList.add("system-dots");
    AudioBus.sfx.modem(1.2);
    await term.sleep(3000);

    term.appendBlank();
    term.appendBlank();
    const locationLine = await term.typeLine("LOCATION RECEIVED", { durationMs: 2000 });
    locationLine.classList.add("blink-line");
    await term.sleep(10000); // Blink for 10 seconds

    term.appendBlank();
    // Only the address in the box
    const addressOnly = CONFIG.ADDRESS_TEXT.slice(1); // Skip "LOCATION RECEIVED"
    AudioBus.sfx.addressReveal();
    const addressBlock = term.appendBlock(addressOnly);
    addressBlock.classList.add("blink-line");

    await term.sleep(10000); // Wait 10 seconds after address appears

    let locationConfirmed = false;
    while (!locationConfirmed) {
      const answer = await term.prompt("CONFIRM YOU HAVE MEMORIZED THE LOCATION. [Y/N]", {
        validator: validateYN,
        normalize: (s) => String(s || "").trim(),
        allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
        maxLen: 1,
      });
      if (answer === "Y") {
        locationConfirmed = true;
      } else {
        // User said No, ask for confirmation
        term.appendBlank();
        const isReallySure = await term.prompt("ARE YOU SURE? [Y/N]", {
          validator: validateYN,
          normalize: (s) => String(s || "").trim(),
          allowedChars: (ch, buffer) => buffer.length === 0 && /[yYnN]/.test(ch),
          maxLen: 1,
        });
        if (isReallySure === "Y") {
          // Confirmed No - grant additional time
          term.appendBlank();
          await term.typeLine("ADDITIONAL TIME GRANTED.", { dim: true, durationMs: 2400 });
          term.appendBlank();
          await term.sleep(10000); // 10 seconds to memorize
        } else {
          // Go back to original question
          term.appendBlank();
        }
      }
    }

    // ========== SCENE 6: Self-Destruct ==========
    // Keep address on screen, don't clear. Just wipe after countdown.
    term.appendBlank();
    term.appendBlank();
    await term.loadingBar(2000);

    await term.typeLine("THIS BRIEFING WILL SELF-DESTRUCT IN", { dim: true, durationMs: 2400 });

    // Countdown total duration for tension sound (~11s)
    const totalCountdownMs = (CONFIG.SELF_DESTRUCT_SECONDS + 1) * 1100;
    AudioBus.sfx.tensionLoop(totalCountdownMs / 1000);

    for (let i = CONFIG.SELF_DESTRUCT_SECONDS; i >= 0; i--) {
      const intensity = 1 - (i / CONFIG.SELF_DESTRUCT_SECONDS); // 0 at 10, 1 at 0
      AudioBus.sfx.bombTick(intensity);

      await term.typeLine(String(i), { durationMs: 800 });
      await term.sleep(300);
    }

    AudioBus.sfx.destruct();
    await term.sleep(450);

    term.stopStickyCountdown();
    await term.wipeScreenAnimated();

    // Stop all audio after destruction
    AudioBus.stop();

    stickyBar.classList.remove("on");
    await term.blackOut(2000);

    // Footer
    term.appendBlock(CONFIG.FOOTER_LINES);
    term.appendBlank();

    // Display live countdown
    const countdownLine = document.createElement("div");
    countdownLine.className = "line";
    countdownLine.style.fontSize = "18px";
    terminalInner.appendChild(countdownLine);
    term.lineCount++;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(CONFIG.TARGET_UTC_ISO);
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const timeStr = `${String(days).padStart(2, '0')} : ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
      countdownLine.textContent = timeStr;
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);

    term.appendBlank();
    await term.typeLine("MAKE IT LEGENDARY · UNIT ROOFTOP FOREVER", { durationMs: 2200 });

    term.appendBlank();
    await term.typeLine("THANK YOU FOR YOUR SERVICE, AGENT.", { durationMs: 3000 });

    // 30 seconds for footer
    await term.sleep(30000);
    clearInterval(countdownInterval);
    await term.wipeScreenAnimated();

    await term.waitForEnter();
  };

  // Auto-update version badge: use commit count as patch version
  // Every commit automatically increments: 1.0.{commit_count}
  fetch("https://api.github.com/repos/dennyrambow/Countdown/commits?per_page=1")
    .then((r) => {
      const link = r.headers.get('Link') || "";
      console.log("Link header:", link);
      let commitCount = 1;

      // Extract total commit count from Link header
      // The Link header has: <...&page=2>; rel="next", <...&page=18>; rel="last"
      // We need to extract the page number from the "last" link only
      const lastLinkPart = link.split(',').find((part) => part.includes('rel="last"')) || "";
      console.log("Last link part:", lastLinkPart);
      const lastMatch = lastLinkPart.match(/page=(\d+)/);
      console.log("Link header match:", lastMatch);
      if (lastMatch) {
        commitCount = parseInt(lastMatch[1], 10);
        console.log("Extracted commit count:", commitCount);
      } else {
        console.log("No 'last' page found in Link header, using fallback count");
      }

      return r.json().then((data) => {
        console.log("API response data:", data);
        if (data.length > 0) {
          const hash = data[0].sha.slice(0, 7);
          const autoVersion = `1.0.${commitCount}`;
          const el = document.getElementById("version");
          console.log("Version element:", el, "Text will be:", `v${autoVersion}-${hash}`);
          if (el) {
            el.textContent = `v${autoVersion}-${hash}`;
            console.log(`✓ Version updated: v${autoVersion}-${hash} (${commitCount} commits)`);
          }
        }
      });
    })
    .catch((err) => {
      console.error("Version badge fetch failed:", err);
    });

  // Start flow
  FLOW().catch((err) => {
    console.error(err);
    terminalInner.innerHTML = "";
    stickyBar.classList.remove("on");
    const fallbackLine = document.createElement("div");
    fallbackLine.className = "line dim";
    fallbackLine.textContent = "SYSTEM ERROR — RELOAD PAGE TO RETRY";
    terminalInner.appendChild(fallbackLine);

    const e = document.createElement("div");
    e.className = "line faint";
    e.textContent = String(err);
    terminalInner.appendChild(e);
  });
})();
