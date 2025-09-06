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

  // Placeholder login (replace with real auth/biometrics later)
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Login submitted');
      if (loginDiv) loginDiv.style.display = 'none';
      if (dashboardDiv) dashboardDiv.style.display = 'block';
      loadSection('home');
    });
  }

  // Logout (guard in case .logout isn't on the page yet)
  if (logout) {
    logout.addEventListener('click', () => {
      if (dashboardDiv) dashboardDiv.style.display = 'none';
      if (loginDiv) loginDiv.style.display = 'flex';
    });
  }

  // Clock (12-hour format)
  function updateClock() {
    const now = new Date();
    let hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    if (clock) clock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateClock();
  setInterval(updateClock, 60000);

  // Date in footer (e.g., Thursday September 4th 2025)
  function updateDate() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    // Correct 11th/12th/13th handling using %100
    const suffix = (date % 10 === 1 && date % 100 !== 11) ? 'st'
                 : (date % 10 === 2 && date % 100 !== 12) ? 'nd'
                 : (date % 10 === 3 && date % 100 !== 13) ? 'rd'
                 : 'th';
    if (dateEl) dateEl.textContent = `${day} ${month} ${date}${suffix} ${year}`;
  }
  updateDate();

  // Menu buttons
  const menuButtons = document.querySelectorAll('.menu-button');
  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      const section = button.dataset.section;
      loadSection(section);
    });
  });

  // Load section
  function loadSection(section) {
    let html = '';
    let crumb = 'Home';

    switch (section) {
      case 'home':
        // Keep the dashboard grid already in your HTML;
        // leave content alone or set a small welcome.
        html = '<h1>Dashboard</h1><p>Welcome to Dowson Farms.</p>';
        crumb = 'Home';
        break;

      case 'crop':
        html = '<h1>Crop Production</h1><p>Placeholder for yields, rotations, etc.</p>';
        crumb = 'Home > Crop Production';
        break;

      case 'calculator':
        html = '<h1>Calculator</h1><p>Placeholder for farming calcs.</p>';
        crumb = 'Home > Calculator';
        break;

      default:
        html = '<h1>Section Coming Soon</h1>';
        crumb = 'Home > Unknown';
    }

    if (content) content.innerHTML = html;
    if (breadcrumbs) breadcrumbs.textContent = crumb;
  }

  // Service worker for PWA/offline (versioned caching for updates)
  if ('serviceWorker' in navigator) {
    // If your sw.js lives at the site root in GitHub Pages under /DowsonFarms/,
    // use a relative path so it works at that subpath:
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
});
</script>