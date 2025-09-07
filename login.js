// ------- Config / constants -------
const APP_VERSION = 'v3.25'; // for footer display only
const ALLOWED_EMAILS = [
  // Demo allowlist — replace with your emails or remove to allow any
  'you@farm.com',
  'boss@dowsonfarms.com'
];
// For demo: one or more acceptable invite codes (case-insensitive)
const VALID_CODES = ['HARVEST25', 'WELCOME', 'DEMO'];

// ------- Utilities -------
function pad2(n){ return n<10 ? '0'+n : ''+n; }
function formatClock12(d=new Date()){
  let h = d.getHours(); const m = d.getMinutes(); const ampm = h>=12 ? 'PM':'AM';
  h = h%12 || 12; return `${h}:${pad2(m)} ${ampm}`;
}
function ordinal(n){ const s=["th","st","nd","rd"], v=n%100; return n + (s[(v-20)%10] || s[v] || s[0]); }
function prettyDate(d=new Date()){
  const dow = d.toLocaleString(undefined,{ weekday:'long' });
  const month = d.toLocaleString(undefined,{ month:'long' });
  return `${dow} ${month} ${ordinal(d.getDate())} ${d.getFullYear()}`;
}
function normalizeVersion(v){
  const m = String(v || '').trim().replace(/^v/i,'');
  const [maj='0', min='0'] = m.split('.');
  return `${maj}.${min}`;
}
function displayVersion(v){ return 'v' + normalizeVersion(v); }

// ------- DOM refs -------
const versionEl = document.getElementById('version');
const todayEl = document.getElementById('today');
const clockEl = document.getElementById('clock');
const formEl = document.getElementById('login-form');
const emailEl = document.getElementById('email');
const codeEl = document.getElementById('code');
const loginBtn = document.getElementById('login-btn');
const msgEl = document.getElementById('login-msg');

const passkeySetupBtn = document.getElementById('passkey-setup');
const passkeySigninBtn = document.getElementById('passkey-signin');
const passkeyNote = document.getElementById('passkey-note');

// footer/header text
if (versionEl) versionEl.textContent = displayVersion(APP_VERSION);
if (todayEl) todayEl.textContent = prettyDate();
function tick(){ if (clockEl) clockEl.textContent = formatClock12(new Date()); }
tick(); setInterval(tick, 15000);

// ------- Auth state helpers (demo) -------
function setAuthed(email){
  try {
    localStorage.setItem('df_auth', '1');
    localStorage.setItem('df_user', email);
  } catch {}
}
function clearAuth(){
  try {
    localStorage.removeItem('df_auth');
    localStorage.removeItem('df_user');
  } catch {}
}
function isAuthed(){ try { return localStorage.getItem('df_auth') === '1'; } catch { return false; } }

// If already signed in, go to app
if (isAuthed()) {
  window.location.replace('index.html');
}

// ------- Invite-code login (demo) -------
formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = (emailEl.value || '').trim().toLowerCase();
  const code = (codeEl.value || '').trim();

  // Basic allowlist (optional)
  if (ALLOWED_EMAILS.length && !ALLOWED_EMAILS.includes(email)) {
    return showMsg('That email is not enabled yet. Ask admin for an invite.', 'error');
  }

  // Accept empty code if you want email-only access; otherwise validate
  if (VALID_CODES.length && !VALID_CODES.map(c => c.toLowerCase()).includes(code.toLowerCase())) {
    return showMsg('Invalid invite code.', 'error');
  }

  // "Success"
  setAuthed(email);
  showMsg('Signed in. Redirecting…', 'ok');
  setTimeout(() => window.location.replace('index.html'), 400);
});

function showMsg(text, type){
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = 'msg ' + (type || '');
}

// ------- Passkeys (WebAuthn) demo -------
// NOTE: This is a client-only demo using randomized challenges and
// storing credential IDs in localStorage. For production you need a server.

const canUsePasskey = !!(window.PublicKeyCredential && window.isSecureContext);
passkeySigninBtn.disabled = !canUsePasskey;
passkeyNote.textContent = canUsePasskey
  ? 'You can create a passkey for quicker sign-in on this device.'
  : 'Passkeys need a secure context (HTTPS) and a compatible device.';

function rpIdFromLocation(){
  // Works on GitHub Pages or custom domains
  return location.hostname;
}
function randomChallenge(len=32){
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return a;
}
function b64urlToArrayBuffer(b64url){
  const pad = '='.repeat((4 - b64url.length % 4) % 4);
  const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
}
function arrayBufferToB64url(buf){
  const bytes = new Uint8Array(buf);
  let bin=''; for (let i=0;i<bytes.byteLength;i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function saveCredential(email, cred){
  try {
    const id = arrayBufferToB64url(cred.rawId);
    localStorage.setItem('df_passkey_id', id);
    localStorage.setItem('df_passkey_user', email);
  } catch {}
}
function getSavedCredentialId(){
  try { return localStorage.getItem('df_passkey_id') || ''; } catch { return ''; }
}
function getSavedCredentialUser(){
  try { return localStorage.getItem('df_passkey_user') || ''; } catch { return ''; }
}

// Create a passkey (register)
passkeySetupBtn?.addEventListener('click', async () => {
  if (!canUsePasskey) return showMsg('Passkeys not supported here.', 'error');

  const email = (emailEl.value || '').trim().toLowerCase();
  if (!email) return showMsg('Enter your email before setting up a passkey.', 'error');

  try {
    const pubKey = {
      challenge: randomChallenge(32),
      rp: { name: 'Dowson Farms', id: rpIdFromLocation() },
      user: {
        id: new TextEncoder().encode(email), // demo only
        name: email,
        displayName: email
      },
      pubKeyCredParams: [{ type:'public-key', alg: -7 }], // ES256
      authenticatorSelection: { userVerification: 'preferred' },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = await navigator.credentials.create({ publicKey: pubKey });
    if (!credential) throw new Error('Credential not created');

    saveCredential(email, credential);
    showMsg('Passkey created for this device. You can now use Face ID / Touch ID.', 'ok');
    passkeySigninBtn.disabled = false;
  } catch (err) {
    console.error(err);
    showMsg('Could not create passkey. Try again.', 'error');
  }
});

// Sign in with passkey (assert)
passkeySigninBtn?.addEventListener('click', async () => {
  if (!canUsePasskey) return showMsg('Passkeys not supported here.', 'error');

  const savedId = getSavedCredentialId();
  const allow = savedId ? [{ id: b64urlToArrayBuffer(savedId), type:'public-key' }] : undefined;

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(32),
        rpId: rpIdFromLocation(),
        allowCredentials: allow,
        userVerification: 'preferred',
        timeout: 60000
      }
    });
    if (!assertion) throw new Error('No assertion');

    // Demo "success" — in real world you verify with server
    const email = getSavedCredentialUser() || (emailEl.value || '').trim().toLowerCase();
    if (!email) return showMsg('Signed in, but we could not resolve your email. Enter it once and try again.', 'error');

    setAuthed(email);
    showMsg('Signed in with passkey. Redirecting…', 'ok');
    setTimeout(() => window.location.replace('index.html'), 400);
  } catch (err) {
    console.error(err);
    showMsg('Passkey sign-in failed. Try again or use invite code.', 'error');
  }
});
