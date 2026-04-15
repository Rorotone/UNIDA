document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function renderAppAlert(message, type = 'info', options = {}) {
    if (typeof showAppAlert === 'function') {
        showAppAlert(message, type, options);
        return;
    }
    alert(message);
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            renderAppAlert(data.message || 'Error al iniciar sesión.', 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        renderAppAlert('Ocurrió un error durante el inicio de sesión.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            renderAppAlert('Registro exitoso. Por favor, inicia sesión.', 'success');
            window.location.href = 'login.html';
        } else {
            renderAppAlert(data.message || 'Error en el registro.', 'error');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        renderAppAlert('Ocurrió un error durante el registro.', 'error');
    }
}

