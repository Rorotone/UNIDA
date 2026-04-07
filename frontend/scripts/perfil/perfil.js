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
        alert('Error al cargar el perfil de usuario');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('Las nuevas contraseñas no coinciden');
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
            alert('Contraseña cambiada exitosamente');
            document.getElementById('change-password-form').reset();
        } else {
            alert(data.message || 'Error al cambiar la contraseña');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error al cambiar la contraseña');
    }
}