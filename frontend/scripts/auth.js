document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', clearFormAlert);
    });

    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    const inputs = registerForm.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', clearFormAlert);
    });

    registerForm.addEventListener('submit', handleRegister);
  }
});

function renderAppAlert(message, type = 'error') {
  const errorBox = document.getElementById('error-message');
  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.style.display = 'block';
  errorBox.className = 'error-message';

  if (type === 'success') {
    errorBox.style.background = '#dcfce7';
    errorBox.style.color = '#166534';
    errorBox.style.border = '1px solid #bbf7d0';
  } else if (type === 'warning') {
    errorBox.style.background = '#fef3c7';
    errorBox.style.color = '#92400e';
    errorBox.style.border = '1px solid #fde68a';
  } else {
    errorBox.style.background = '#fee2e2';
    errorBox.style.color = '#b91c1c';
    errorBox.style.border = '1px solid #fecaca';
  }
}

function clearFormAlert() {
  const errorBox = document.getElementById('error-message');
  if (!errorBox) return;

  errorBox.style.display = 'none';
  errorBox.textContent = '';
}

function setButtonLoading(button, isLoading, loadingText = 'Procesando...') {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    button.textContent = loadingText;
    button.disabled = true;
    button.style.opacity = '0.7';
    button.style.cursor = 'not-allowed';
  } else {
    button.textContent = button.dataset.originalText || 'Enviar';
    button.disabled = false;
    button.style.opacity = '';
    button.style.cursor = '';
  }
}

function validateCredentials(username, password) {
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  if (!cleanUsername && !cleanPassword) {
    renderAppAlert('Debes completar usuario y contraseña.', 'warning');
    return false;
  }

  if (!cleanUsername) {
    renderAppAlert('Debes ingresar el usuario.', 'warning');
    return false;
  }

  if (!cleanPassword) {
    renderAppAlert('Debes ingresar la contraseña.', 'warning');
    return false;
  }

  if (cleanUsername.length < 3) {
    renderAppAlert('El usuario debe tener al menos 3 caracteres.', 'warning');
    return false;
  }

  if (password.length < 6) {
    renderAppAlert('La contraseña debe tener al menos 6 caracteres.', 'warning');
    return false;
  }

  return true;
}

async function handleLogin(e) {
  e.preventDefault();
  clearFormAlert();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const submitButton = e.target.querySelector('button[type="submit"]');

  const username = usernameInput.value;
  const password = passwordInput.value;

  if (!validateCredentials(username, password)) return;

  setButtonLoading(submitButton, true, 'Ingresando...');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: username.trim(),
        password
      })
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.ok) {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      clearFormAlert();
      window.location.href = '/index.html';
      return;
    }

    if (response.status === 401) {
      renderAppAlert(data.message || 'Usuario o contraseña incorrectos.', 'error');
      return;
    }

    if (response.status === 400) {
      renderAppAlert(data.message || 'Datos inválidos. Revisa los campos ingresados.', 'warning');
      return;
    }

    renderAppAlert(data.message || 'No se pudo iniciar sesión.', 'error');
  } catch (error) {
    console.error('Error during login:', error);
    renderAppAlert('Ocurrió un error de conexión durante el inicio de sesión.', 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearFormAlert();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const submitButton = e.target.querySelector('button[type="submit"]');

  const username = usernameInput.value;
  const password = passwordInput.value;

  if (!validateCredentials(username, password)) return;

  setButtonLoading(submitButton, true, 'Creando cuenta...');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({
        username: username.trim(),
        password
      })
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.ok) {
      renderAppAlert('Registro exitoso. Serás redirigido al login.', 'success');

      setTimeout(() => {
        window.location.href = '/login.html';
      }, 900);
      return;
    }

    if (response.status === 409) {
      renderAppAlert(data.message || 'El usuario ya existe.', 'warning');
      return;
    }

    if (response.status === 400) {
      renderAppAlert(data.message || 'Datos inválidos para el registro.', 'warning');
      return;
    }

    renderAppAlert(data.message || 'Error en el registro.', 'error');
  } catch (error) {
    console.error('Error during register:', error);
    renderAppAlert('Ocurrió un error de conexión durante el registro.', 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}