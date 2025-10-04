const AUTO_FLAG = 'fvAutoUpdateCheck';
const STYLE_ID = 'fv-update-toast-style';
const GLOBAL_TOAST_ID = 'fvGlobalUpdateToast';
const TOAST_CLASS = 'fv-toast';
const VERSION_URL = new URL('./version.js', import.meta.url);

const ensureToastStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .fv-toast {
      position: fixed;
      inset: auto 16px 16px 16px;
      max-width: 420px;
      padding: 14px 18px;
      border-radius: var(--fv-radius-md, 16px);
      background: linear-gradient(135deg, rgba(54, 94, 90, 0.92), rgba(216, 193, 121, 0.92));
      color: #fff;
      box-shadow: 0 18px 32px rgba(27, 53, 50, 0.32);
      font-weight: 600;
      z-index: 1200;
      opacity: 0;
      transform: translateY(14px);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .fv-toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    .fv-toast[data-tone="success"] {
      background: linear-gradient(135deg, rgba(54, 94, 90, 0.92), rgba(159, 191, 111, 0.92));
    }

    .fv-toast[data-tone="error"] {
      background: linear-gradient(135deg, rgba(160, 40, 40, 0.92), rgba(216, 193, 121, 0.92));
    }

    .fv-toast[data-tone="info"] {
      background: linear-gradient(135deg, rgba(54, 94, 90, 0.92), rgba(216, 193, 121, 0.92));
    }
  `;
  document.head.appendChild(style);
};

const ensureToastElement = () => {
  ensureToastStyles();
  let toast = document.getElementById('updateToast');
  if (toast) {
    toast.classList.add(TOAST_CLASS);
  } else {
    toast = document.getElementById(GLOBAL_TOAST_ID);
  }
  if (!toast) {
    toast = document.createElement('div');
    toast.id = GLOBAL_TOAST_ID;
    toast.hidden = true;
    document.body.appendChild(toast);
  }
  toast.classList.add(TOAST_CLASS);
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  return toast;
};

const showToast = (message, tone = 'info') => {
  const toast = ensureToastElement();
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.hidden = false;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => {
      toast.hidden = true;
    }, 250);
  }, 3000);
};

const parseRemoteVersion = (text) => {
  const tryMatch = (regex) => {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };
  return (
    tryMatch(/DF_VERSION\s*=\s*["'`](.+?)["'`]/) ||
    tryMatch(/SOURCE_VERSION\s*=\s*["'`](.+?)["'`]/) ||
    null
  );
};

const compareVersions = (next, current) => {
  if (!next && !current) return 0;
  if (next && !current) return 1;
  if (!next && current) return -1;
  if (next === current) return 0;
  const toParts = (ver) => ver
    .replace(/^v/i, '')
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((n) => parseInt(n, 10) || 0);
  const a = toParts(next);
  const b = toParts(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return next.localeCompare(current);
};

const fetchLatestVersion = async () => {
  const url = new URL(VERSION_URL.href);
  url.searchParams.set('ts', Date.now().toString());
  const res = await fetch(url.href, { cache: 'no-store' });
  if (!res.ok) throw new Error('Version fetch failed: ' + res.status);
  const text = await res.text();
  const remote = parseRemoteVersion(text);
  if (!remote) throw new Error('Version string not found in response.');
  return remote;
};

const clearCaches = async () => {
  if (!('caches' in window)) return;
  try {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name).catch(() => {})));
  } catch (err) {
    console.warn('Cache clear failed', err);
  }
};

const refreshServiceWorkers = async (forceUnregister = false) => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs.map(async (reg) => {
        try {
          if (forceUnregister) {
            await reg.unregister();
          } else if (reg.update) {
            await reg.update();
          }
        } catch (err) {
          console.warn('Service worker refresh failed', err);
        }
      })
    );
  } catch (err) {
    console.warn('Service worker registration lookup failed', err);
  }
};

const reloadWithNotice = (hash, delayMs = 1500) => {
  window.setTimeout(() => {
    try {
      if (typeof hash === 'string') {
        const base = location.href.split('#')[0];
        const target = hash.startsWith('#') ? `${base}${hash}` : hash;
        location.href = target;
      }
      location.reload();
    } catch (err) {
      console.warn('Reload failed, forcing reload', err);
      location.reload();
    }
  }, delayMs);
};

let activeCheck = null;

const runUpdateCheck = (options = {}) => {
  if (activeCheck) return activeCheck;

  const {
    onStatus,
    reloadHash = '#check-updates',
    showToasts = true,
  } = options;

  const updateStatus = (message) => {
    if (typeof onStatus === 'function') {
      try {
        onStatus(message);
      } catch (_) {}
    }
  };

  const exec = (async () => {
    const currentVersion = (window.DF_VERSION || '').toString().trim();
    updateStatus('Checking for updates…');

    try {
      const latestVersion = await fetchLatestVersion();
      const hasNewer = compareVersions(latestVersion, currentVersion) > 0;
      await clearCaches();
      await refreshServiceWorkers(hasNewer);
      const displayVersion = latestVersion || currentVersion || 'unknown';

      if (hasNewer) {
        const message = `New version ${latestVersion} ready. Reloading…`;
        updateStatus(`New version ${latestVersion} available. Reloading…`);
        if (showToasts) showToast(message, 'success');
        reloadWithNotice(reloadHash);
      } else {
        const message = `You're on the latest version (${displayVersion}).`;
        updateStatus(message);
        if (showToasts) showToast(message, 'info');
      }

      return { latestVersion, currentVersion, hasNewer };
    } catch (err) {
      console.error(err);
      const message = 'Could not check for updates. Please try again later.';
      updateStatus(message);
      if (showToasts) showToast('Update check failed. Please try again later.', 'error');
      throw err;
    } finally {
      activeCheck = null;
    }
  })();

  activeCheck = exec;
  return exec;
};

const shouldAutoCheck = () => {
  let flag = false;
  try {
    if (sessionStorage.getItem(AUTO_FLAG) === '1') {
      sessionStorage.removeItem(AUTO_FLAG);
      flag = true;
    }
  } catch (_) {}
  if (flag) return true;
  return (location.hash || '').includes('auto-check');
};

const triggerAutoCheck = () => {
  try {
    sessionStorage.setItem(AUTO_FLAG, '1');
  } catch (_) {}
};

const api = {
  runUpdateCheck,
  showToast,
  shouldAutoCheck,
  triggerAutoCheck,
};

if (typeof window !== 'undefined') {
  window.FV_UPDATE_CHECK = Object.assign({}, window.FV_UPDATE_CHECK || {}, api);
}

export { runUpdateCheck, showToast, shouldAutoCheck, triggerAutoCheck };
export default api;
