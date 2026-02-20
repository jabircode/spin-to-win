/* ── Spin-to-Win Wheel ── */
(() => {
  "use strict";

  // ── DOM refs ──
  const $ = (id) => document.getElementById(id);
  const screens = {
    loading: $("screen-loading"),
    error: $("screen-error"),
    wheel: $("screen-wheel"),
    result: $("screen-result"),
    played: $("screen-played"),
  };
  const canvas = $("wheel-canvas");
  const ctx = canvas.getContext("2d");
  const spinBtn = $("spin-btn");

  // ── Apply config to DOM ──
  $("logo-container").innerHTML = CONFIG.logo;
  $("app-title").innerHTML = CONFIG.title;
  $("app-subtitle").textContent = CONFIG.subtitle;
  $("result-heading").innerHTML = CONFIG.resultHeading;
  $("result-note").textContent = CONFIG.resultNote;
  $("already-played-message").textContent = CONFIG.alreadyPlayedMessage;

  // ── State ──
  let contactId = null;
  let currentRotation = 0;
  let isSpinning = false;
  let workingBaseUrl = null; // Cached working base URL for this session
  let currentChanceNumber = 1; // Track which chance the user is on

  // ── Screen management ──
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ── API Base URL Failover ──
  // Try each base URL until one works, then cache it for the session
  async function findWorkingBaseUrl() {
    if (workingBaseUrl) return workingBaseUrl;

    for (const baseUrl of CONFIG.baseUrls) {
      try {
        // Test with a simple HEAD or GET request
        const testUrl = `${baseUrl}${CONFIG.endpoints.contact}test`;
        const response = await fetch(testUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Sleekflow-Api-Key": CONFIG.apiKey,
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout per URL
        });

        // If we get any response (even 404), the base URL is reachable
        workingBaseUrl = baseUrl;
        console.log(`[API] Using base URL: ${baseUrl}`);
        return baseUrl;
      } catch (err) {
        console.warn(`[API] Failed to reach ${baseUrl}:`, err.message);
        continue;
      }
    }

    throw new Error("All API base URLs are unreachable");
  }

  // ── Check Remaining Chances ──
  async function checkRemainingChances(contactId) {
    if (!CONFIG.allowMultipleSpins) {
      return { hasChances: true, used: 0, total: 0 };
    }

    const baseUrl = await findWorkingBaseUrl();
    const maxChances = CONFIG.numberOfChances || 3;

    // Check from the max chance number down to 1 to find the highest used chance
    for (let chanceNum = maxChances; chanceNum >= 1; chanceNum--) {
      const recordId = `spinToWin-${contactId}-${chanceNum}`;

      try {
        const response = await fetch(`${baseUrl}${CONFIG.endpoints.customObjects}${encodeURIComponent(recordId)}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Sleekflow-Api-Key": CONFIG.apiKey,
          },
        });

        if (response.ok) {
          const data = await response.json();

          // If we got a valid response with data, this chance has been used
          if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
            // User has used up to this chance number
            if (chanceNum >= maxChances) {
              return { hasChances: false, used: maxChances, total: maxChances };
            } else {
              // User still has chances remaining
              currentChanceNumber = chanceNum + 1;
              return { hasChances: true, used: chanceNum, total: maxChances };
            }
          }
        }
      } catch (err) {
        console.warn(`[Chance Check] Error checking chance ${chanceNum}:`, err);
      }
    }

    // No records found - user hasn't used any chances
    currentChanceNumber = 1;
    return { hasChances: true, used: 0, total: maxChances };
  }

  // ── Prize selection (weighted random) ──
  function pickPrize() {
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.probability, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < PRIZES.length; i++) {
      rand -= PRIZES[i].probability;
      if (rand <= 0) return i;
    }
    return PRIZES.length - 1;
  }

  // ── Draw the wheel ──
  function drawWheel() {
    const totalSlices = PRIZES.length;
    const sliceAngle = (2 * Math.PI) / totalSlices;
    const radius = canvas.width / 2;
    const center = radius;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    PRIZES.forEach((prize, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius - 2, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color || `hsl(${(i * 360) / totalSlices}, 60%, 50%)`;
      ctx.fill();

      // Border between slices
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = CONFIG.wheelLabelColor;
      ctx.font = `600 ${Math.min(13, radius / 12)}px Inter, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 3;

      const maxWidth = radius - 30;
      ctx.fillText(prize.label, radius - 14, 4, maxWidth);

      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = CONFIG.wheelCenterFill;
    ctx.fill();
    ctx.strokeStyle = CONFIG.wheelCenterStroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // ── Spin the wheel ──
  function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.add("spinning");
    spinBtn.querySelector(".spin-text").textContent = "SPINNING";

    const winnerIndex = pickPrize();
    const totalSlices = PRIZES.length;
    const sliceAngle = 360 / totalSlices;

    const targetSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
    const targetAngle = 360 - targetSliceCenter;
    const fullSpins = CONFIG.extraRotations * 360;
    const finalRotation = currentRotation + fullSpins + (targetAngle - (currentRotation % 360) + 360) % 360;

    canvas.style.transition = `transform ${CONFIG.spinDurationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    canvas.style.transform = `rotate(${finalRotation}deg)`;
    currentRotation = finalRotation;

    setTimeout(() => {
      isSpinning = false;

      // Mark as played (only if multiple spins not allowed)
      if (!CONFIG.allowMultipleSpins && contactId) {
        localStorage.setItem(`spinwheel_${contactId}`, "played");
      }

      // Show result
      $("result-prize-text").textContent = PRIZES[winnerIndex].label;
      showScreen("result");
      launchConfetti();

      // Record the spin and fire webhook
      recordSpinToCustomObjects(winnerIndex);
      fireWebhook(winnerIndex);
    }, CONFIG.spinDurationMs + 300);
  }

  // ── Record Spin to Custom Objects ──
  async function recordSpinToCustomObjects(winnerIndex) {
    if (!CONFIG.allowMultipleSpins) return;

    try {
      const baseUrl = await findWorkingBaseUrl();
      const recordId = `spinToWin-${contactId}-${currentChanceNumber}`;

      await fetch(`${baseUrl}${CONFIG.endpoints.customObjects}${encodeURIComponent(recordId)}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Sleekflow-Api-Key": CONFIG.apiKey,
        },
        body: JSON.stringify({
          id: recordId,
          contactId: contactId,
          chanceNumber: currentChanceNumber,
          prize: PRIZES[winnerIndex].label,
          prizeIndex: winnerIndex,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log(`[Custom Objects] Recorded spin ${currentChanceNumber} for contact ${contactId}`);
    } catch (err) {
      console.warn("[Custom Objects] Failed to record spin:", err);
    }
  }

  // ── Webhook ──
  async function fireWebhook(winnerIndex) {
    const { url, payload } = CONFIG.webhook;
    if (!url) return; // disabled

    const tokens = {
      "{{contactId}}":     contactId,
      "{{prize}}":         PRIZES[winnerIndex].label,
      "{{prizeIndex}}":    winnerIndex,
      "{{timestamp}}":     new Date().toISOString(),
      "{{chanceNumber}}":  currentChanceNumber,
    };

    // Resolve tokens in payload values; pass non-string values through as-is
    const body = {};
    for (const [key, val] of Object.entries(payload)) {
      if (val === null) continue;
      body[key] = typeof val === "string" && tokens[val] !== undefined ? tokens[val] : val;
    }

    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors", // webhook.site & most endpoints don't return CORS headers
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn("[webhook] failed to deliver:", err);
    }
  }

  // ── Confetti ──
  function launchConfetti() {
    const confettiCanvas = $("confetti-canvas");
    const cCtx = confettiCanvas.getContext("2d");
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = CONFIG.confettiColors;
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function animate() {
      if (frame >= maxFrames) {
        cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        return;
      }
      frame++;
      cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;

        cCtx.save();
        cCtx.translate(p.x, p.y);
        cCtx.rotate((p.rotation * Math.PI) / 180);
        cCtx.fillStyle = p.color;
        cCtx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
        cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        cCtx.restore();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ── Contact verification ──
  async function verifyContact(id) {
    // Test mode
    if (id === "test" || CONFIG.allowMultipleSpins) {
      return { valid: true, name: "Test User" };
    }

    try {
      const baseUrl = await findWorkingBaseUrl();
      const response = await fetch(`${baseUrl}${CONFIG.endpoints.contact}${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Sleekflow-Api-Key": CONFIG.apiKey,
        },
      });

      if (!response.ok) {
        return { valid: false, error: "Contact not found. Please check your link." };
      }

      const data = await response.json();
      return { valid: true, name: data.firstName || data.name || "there" };
    } catch (err) {
      return { valid: false, error: "Unable to verify your entry. Please try again." };
    }
  }

  // ── Resize wheel for screen ──
  function resizeWheel() {
    const maxSize = Math.min(window.innerWidth - 40, window.innerHeight * 0.42, 380);
    const size = Math.max(260, maxSize);
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    drawWheel();
  }

  // ── Init ──
  async function init() {
    const params = new URLSearchParams(window.location.search);
    contactId = params.get("contactId");

    if (!contactId) {
      $("error-message").textContent = CONFIG.noContactMessage;
      showScreen("error");
      return;
    }

    // Check if already played (skip for test or if multiple spins allowed)
    if (!CONFIG.allowMultipleSpins && contactId !== "test" && localStorage.getItem(`spinwheel_${contactId}`) === "played") {
      showScreen("played");
      return;
    }

    // Verify contact
    const result = await verifyContact(contactId);

    if (!result.valid) {
      $("error-message").textContent = result.error;
      showScreen("error");
      return;
    }

    // Check remaining chances if multiple spins are allowed
    if (CONFIG.allowMultipleSpins && contactId !== "test") {
      const chanceStatus = await checkRemainingChances(contactId);

      if (!chanceStatus.hasChances) {
        // Update the message to show they've used all chances
        $("already-played-message").textContent = `You've used all ${chanceStatus.total} of your spins! Stay tuned for your prizes.`;
        showScreen("played");
        return;
      }

      // Update button text to show remaining chances
      const remainingChances = chanceStatus.total - chanceStatus.used;
      if (remainingChances > 1) {
        spinBtn.querySelector(".spin-text").textContent = `SPIN (${remainingChances} chances left)`;
      }
    }

    // Setup wheel
    resizeWheel();
    window.addEventListener("resize", resizeWheel);

    // Wire up spin button
    spinBtn.addEventListener("click", spin);

    // Show wheel
    showScreen("wheel");
  }

  // Wire up close button
  $("close-btn").addEventListener("click", () => {
    showScreen("wheel");
    spinBtn.disabled = true;
    spinBtn.classList.remove("spinning");
    spinBtn.querySelector(".spin-text").textContent = "ALREADY PLAYED";
  });

  // Go
  init();
})();
