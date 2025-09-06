ldocument.addEventListener('DOMContentLoaded', () => {
  const loginDiv = document.getElementById('login');
  const dashboardDiv = document.getElementById('dashboard');
  const loginForm = document.getElementById('login-form');
  const content = document.getElementById('content');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const clock = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const logout = document.querySelector('.logout');

  // Placeholder login (replace with real auth/biometrics later)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Login submitted'); // Check dev tools console to see if it logs
    loginDiv.style.display = 'none';
    dashboardDiv.style.display = 'block';
    loadSection('home');
  });

  // Logout
  logout.addEventListener('click', () => {
    dashboardDiv.style.display = 'none';
    loginDiv.style.display = 'flex';
  });

  // Clock (12-hour format)
  function updateClock() {
    const now = new Date();
    let hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    clock.textContent = `${hours}:${minutes} ${ampm}`;
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
    const suffix = (date % 10 === 1 && date !== 11) ? 'st' : (date % 10 === 2 && date !== 12) ? 'nd' : (date % 10 === 3 && date !== 13) ? 'rd' : 'th';
    dateEl.textContent = `${day} ${month} ${date}${suffix} ${year}`;
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

  // Load section (placeholders for now)
  function loadSection(section) {
    let html = '';
    let crumb = 'Home > ';
    switch (section) {
      case 'home':
        html = /* html for dashboard grid, but since it's the default, redirect or keep */;
        crumb = 'Home';
        break;
      case 'crop':
        html = '<h1>Crop Production</h1><p>Placeholder for yields, rotations, etc.</p>';
        crumb += 'Crop Production';
        break;
      case 'calculator':
        html = '<h1>Calculator</h1><p>Placeholder for farming calcs.</p>';
        crumb += 'Calculator';
        break;
      // Add cases for other sections...
      default:
        html = '<h1>Section Coming Soon</h1>';
        crumb += 'Unknown';
    }
    content.innerHTML = html;
    breadcrumbs.innerHTML = crumb;
  }

  // Service worker for PWA/offline (versioned caching for updates)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
});