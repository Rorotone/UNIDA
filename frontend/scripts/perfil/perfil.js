document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    fetchUserProfile();

    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
});

function renderAppAlert(message, type = 'info', options = {}) {
    if (typeof showAppAlert === 'function') {
        showAppAlert(message, type, options);
        return;
    }
    alert(message);
}

async function fetchUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const userData = await response.json();
        document.getElementById('username-display').textContent = userData.username;
        document.getElementById('user-id-display').textContent = userData.id;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        renderAppAlert('Error al cargar el perfil de usuario', 'error');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        renderAppAlert('Las nuevas contraseñas no coinciden', 'warning');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            renderAppAlert('Contraseña cambiada exitosamente', 'success');
            document.getElementById('change-password-form').reset();
        } else {
            renderAppAlert(data.message || 'Error al cambiar la contraseña', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        renderAppAlert('Error al cambiar la contraseña', 'error');
    }
}