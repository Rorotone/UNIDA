document.addEventListener('DOMContentLoaded', () => {
    const navPlaceholder = document.getElementById('nav-placeholder');
    
    if (navPlaceholder) {
        // Cargar el menú de navegación
        fetch('/nav.html')
            .then(response => response.text())
            .then(data => {
                navPlaceholder.innerHTML = data;
                
                // Agregar evento de cierre de sesión
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', handleLogout);
                }
                
            })
            .catch(error => {
                console.error('Error al cargar la navegación:', error);
            });
    } else {
        console.error('Elemento nav-placeholder no encontrado');
    }
    
    // Verificar si el usuario está autenticado
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Si no hay token, redirigir al login
        window.location.href = '/login.html';
        
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}
