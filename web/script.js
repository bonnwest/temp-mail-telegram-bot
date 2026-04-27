// ── constants (mirror bot.py settings) ──
const API               = 'https://api.mail.tm';
const POLL_INTERVAL     = 5000;       // 5 s, same as bot
const LISTEN_DURATION   = 5 * 60;    // 300 s, same as bot
const NEW_EMAIL_COOLDOWN = 5 * 60 * 1000;
const CHECK_COOLDOWN     = 30 * 1000;

// ── state ──
const state = {
  token:         null,
  email:         null,
  seenIds:       new Set(),
  pollTimer:     null,
  countdownTimer: null,
  secondsLeft:   0,
  lastEmailTime: 0,
  lastCheckTime: 0,
};

// ── DOM refs ──
const chatBody  = document.getElementById('chatBody');
const chatStatus = document.getElementById('chatStatus');
let typingEl = null;

// ── UI helpers ──
function addBubble(side, html) {
  removeTyping();
  const b = document.createElement('div');
  b.className = `bubble ${side}`;
  b.innerHTML = html.replace(/\n/g, '<br>');
  chatBody.appendChild(b);
  chatBody.scrollTop = chatBody.scrollHeight;
  return b;
}

function showTyping() {
  removeTyping();
  typingEl = document.createElement('div');
  typingEl.className = 'typing';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(typingEl);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTyping() {
  if (typingEl) { typingEl.remove(); typingEl = null; }
}

function updateStatus() {
  if (!state.pollTimer) { chatStatus.textContent = 'online'; return; }
  const m = Math.floor(state.secondsLeft / 60);
  const s = state.secondsLeft % 60;
  chatStatus.textContent = `listening · ${m}:${s.toString().padStart(2, '0')}`;
}

function fmtRemaining(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// ── mail.tm API ──
function randomStr(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function getDomain() {
  const res = await fetch(`${API}/domains?page=1`);
  if (!res.ok) throw new Error('domain fetch failed');
  const data = await res.json();
  return data['hydra:member'][0].domain;
}

async function createAndLogin() {
  const domain   = await getDomain();
  const address  = `${randomStr(10)}@${domain}`;
  const password = randomStr(24);

  const accRes = await fetch(`${API}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!accRes.ok) throw new Error('account creation failed');

  const tokRes = await fetch(`${API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!tokRes.ok) throw new Error('token fetch failed');
  const { token } = await tokRes.json();

  return { address, token };
}

async function fetchMessages() {
  try {
    const res = await fetch(`${API}/messages`, {
      headers: { 'Authorization': `Bearer ${state.token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data['hydra:member'] || [];
  } catch {
    return [];
  }
}

// ── polling ──
function startPolling() {
  state.secondsLeft = LISTEN_DURATION;
  updateStatus();

  state.countdownTimer = setInterval(() => {
    state.secondsLeft--;
    updateStatus();
    if (state.secondsLeft <= 0) stopPolling();
  }, 1000);

  state.pollTimer = setInterval(async () => {
    const messages = await fetchMessages();
    for (const msg of messages) {
      if (state.seenIds.has(msg.id)) continue;
      state.seenIds.add(msg.id);
      const from    = msg.from?.address || 'Unknown';
      const subject = msg.subject || 'No subject';
      const intro   = msg.intro   || '';
      addBubble('bot',
        `📬 <b>New message!</b>\nFrom: ${from}\nSubject: ${subject}\n\n${intro}`
      );
    }
  }, POLL_INTERVAL);
}

function stopPolling() {
  clearInterval(state.pollTimer);
  clearInterval(state.countdownTimer);
  state.pollTimer = null;
  updateStatus();
  addBubble('bot', 'Listener stopped after 5 minutes.\nTap <b>Get Email</b> to get a fresh inbox.');
}

// ── button: Get Email ──
document.getElementById('kbGet').addEventListener('click', async () => {
  const now = Date.now();
  const sinceLastEmail = now - state.lastEmailTime;

  if (state.token && sinceLastEmail < NEW_EMAIL_COOLDOWN) {
    addBubble('user', 'Get Email');
    addBubble('bot', `Please wait ${fmtRemaining(NEW_EMAIL_COOLDOWN - sinceLastEmail)} before requesting a new email.`);
    return;
  }

  // tear down existing session
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
    clearInterval(state.countdownTimer);
    state.pollTimer = null;
  }

  state.lastEmailTime = now;
  state.seenIds = new Set();

  addBubble('user', 'Get Email');
  showTyping();

  try {
    const { address, token } = await createAndLogin();
    state.token = token;
    state.email = address;

    addBubble('bot',
      `Your new email:\n<code>${address}</code>\n` +
      `<button class="copy-inline" data-email="${address}" onclick="copyEmail(this)">Copy</button>`
    );
    startPolling();
  } catch {
    addBubble('bot', 'Something went wrong. Please try again in a moment.');
  }
});

// ── button: Check Inbox ──
document.getElementById('kbCheck').addEventListener('click', async () => {
  const now = Date.now();

  if (!state.token) {
    addBubble('user', 'Check Inbox');
    addBubble('bot', 'Create an email first.');
    return;
  }

  const sinceLastCheck = now - state.lastCheckTime;
  if (sinceLastCheck < CHECK_COOLDOWN) {
    addBubble('user', 'Check Inbox');
    addBubble('bot', `Please wait ${fmtRemaining(CHECK_COOLDOWN - sinceLastCheck)} before checking again.`);
    return;
  }

  state.lastCheckTime = now;
  addBubble('user', 'Check Inbox');
  showTyping();

  const messages = await fetchMessages();

  if (!messages.length) {
    addBubble('bot', 'No messages yet.');
    return;
  }

  for (const msg of messages) {
    const from    = msg.from?.address || 'Unknown';
    const subject = msg.subject || 'No subject';
    const intro   = msg.intro   || '';
    addBubble('bot', `From: ${from}\nSubject: ${subject}\n\n${intro}`);
  }
});

// ── copy helpers ──
window.copyEmail = function (btn) {
  const address = btn.dataset.email;
  navigator.clipboard.writeText(address).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
};

function copyCode(btn) {
  const code = btn.closest('.code-block').querySelector('pre').innerText;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}

// ── init: welcome message ──
setTimeout(() => {
  addBubble('bot', "Hey! Don't want to share your personal email?\nI've got something for you.");
}, 600);
