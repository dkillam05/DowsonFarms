<script>
document.addEventListener('DOMContentLoaded', () => {
  const loginDiv = document.getElementById('login');
  const dashboardDiv = document.getElementById('dashboard');
  const loginForm = document.getElementById('login-form');
  const content = document.getElementById('content');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const clock = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const logout = document.querySelector('.logout');

  // --- Initial state ---
  if (loginDiv) loginDiv.style.display = 'flex';
  if (dashboardDiv) dashboardDiv.style.display = 'none';

  // --- Login (placeholder) ---
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Login submitted');
      if (loginDiv) loginDiv.style.display = 'none';
      if (dashboardDiv) dashboardDiv.style.display = 'block';
      loadSection('home');
    });
  }

  // --- Logout ---
  if (logout) {
    logout.addEventListener('click', () => {
      if (dashboardDiv) dashboardDiv.style.display = 'none';
      if (loginDiv) loginDiv.style.display = 'flex';
    });
  }

  // --- Clock (12-hour) ---
  function updateClock() {
    if (!clock) return;
    const now = new Date();
    const h24 = now.getHours();
    const hours = h24 % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    clock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateClock();
  setInterval(updateClock, 60_000);

  // --- Date (e.g., Thursday September 4th 2025) ---
  function ordinalSuffix(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  function updateDate() {
    if (!dateEl) return;
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const day = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    dateEl.textContent = `${day} ${month} ${date}${ordinalSuffix(date)} ${year}`;
  }
  updateDate();

  // --- Menu: event delegation (handles current & future buttons) ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.menu-button');
    if (!btn) return;
    const section = btn.dataset.section || 'home';
    loadSection(section);
  });

  // --- Section loader ---
  function loadSection(section) {
    if (!content || !breadcrumbs) return;
    let html = '';
    let crumb = 'Home';

    switch (section) {
      case 'home':
        html = `
          <div class="grid">
            <a class="menu-button" data-section="crop">🌽 Crop Production</a>
            <a class="menu-button" data-section="calculator">🧮 Calculator</a>
            <!-- Add more tiles as needed -->
          </div>
        `;
        crumb = 'Home';
        break;

      case 'crop':
        html = '<h1>Crop Production</h1><p>Placeholder for yields, rotations, etc.</p>';
        crumb = 'Home › Crop Production';
        break;

      case 'calculator':
        html = '<h1>Calculator</h1><p>Placeholder for farming calcs.</p>';
        crumb = 'Home › Calculator';
        break;

      default:
        html = '<h1>Section Coming Soon</h1>';
        crumb = 'Home › Unknown';
    }

    content.innerHTML = html;
    breadcrumbs.textContent = crumb;
  }

  // --- Service worker (relative path so it works on GitHub Pages) ---
  if ('serviceWorker' in navigator) {
    // If your sw file lives next to index.html, this is safest:
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  }
});
</script>