// Ocultar inmediatamente antes de cualquier render
document.documentElement.style.visibility = 'hidden';

// Si no hay token redirigir de inmediato
if (!localStorage.getItem('token')) {
  window.location.replace('/login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const navPlaceholder = document.getElementById('nav-placeholder');

    if (navPlaceholder) {
        fetch('/nav.html')
            .then(response => response.text())
            .then(data => {
                navPlaceholder.innerHTML = data;
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', handleLogout);
                }
            })
            .catch(error => {
                console.error('Error al cargar la navegación:', error);
            });
    }
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/login.html');
    } else {
        document.documentElement.style.visibility = '';
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.replace('/login.html');
}