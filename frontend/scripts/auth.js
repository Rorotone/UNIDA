document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach((input) => {
      input.addEventListener('input', clearFormAlert);
    });

    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    const inputs = registerForm.querySelectorAll('input, select');
    inputs.forEach((input) => {
      input.addEventListener('input', clearFormAlert);
      input.addEventListener('change', clearFormAlert);
    });

    registerForm.addEventListener('submit', handleRegister);
  }
});

/* =========================================================
   ALERTAS DEL LOGIN / REGISTRO
========================================================= */

function renderAppAlert(message, type = 'error') {
  const errorBox = document.getElementById('error-message') || document.getElementById('form-alert');

  if (errorBox) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    errorBox.className = errorBox.id === 'form-alert' ? `form-alert ${type}` : 'error-message';

    if (errorBox.id === 'error-message') {
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

    return;
  }

  if (typeof showAppAlert === 'function') {
    showAppAlert(message, type, {
      title:
        type === 'success' ? 'Éxito' :
        type === 'warning' ? 'Atención' :
        type === 'error' ? 'Error' : 'Información'
    });
    return;
  }

  window.alert(message);
}

function clearFormAlert() {
  const errorBox = document.getElementById('error-message') || document.getElementById('form-alert');
  if (!errorBox) return;

  errorBox.style.display = 'none';
  errorBox.textContent = '';
  errorBox.className = errorBox.id === 'form-alert' ? 'form-alert' : 'error-message';

  if (errorBox.id === 'error-message') {
    errorBox.style.background = '';
    errorBox.style.color = '';
    errorBox.style.border = '';
  }
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
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '').trim();

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

  if (String(password).length < 6) {
    renderAppAlert('La contraseña debe tener al menos 6 caracteres.', 'warning');
    return false;
  }

  return true;
}

/* =========================================================
   HELPERS GLOBALES DE AUTENTICACIÓN
========================================================= */

function getAuthToken() {
  return localStorage.getItem('token');
}

function clearSessionAndRedirect() {
  localStorage.removeItem('token');
  window.location.replace('/login.html');
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function handleUnauthorized(response) {
  if (response.status === 401) {
    clearSessionAndRedirect();
    return true;
  }
  return false;
}

async function fetchWithAuth(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers: getAuthHeaders(options.headers || {})
  });

  if (handleUnauthorized(response)) {
    throw new Error('Sesión expirada');
  }

  return response;
}

/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(e) {
  e.preventDefault();
  clearFormAlert();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const submitButton = e.target.querySelector('button[type="submit"]');

  const username = usernameInput?.value || '';
  const password = passwordInput?.value || '';

  if (!validateCredentials(username, password)) return;

  setButtonLoading(submitButton, true, 'Ingresando...');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        username: username.trim(),
        password
      })
    });

    const data = await parseJsonSafe(response);

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

/* =========================================================
   REGISTRO
========================================================= */

async function handleRegister(e) {
  e.preventDefault();
  clearFormAlert();

  const nombreInput = document.getElementById('nombre');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rolInput = document.getElementById('rol');
  const submitButton = e.target.querySelector('button[type="submit"]');

  const nombre = nombreInput?.value.trim() || '';
  const username = usernameInput?.value || '';
  const password = passwordInput?.value || '';
  const rol = rolInput?.value || '';

  if (!nombre) {
    renderAppAlert('El nombre completo es obligatorio.', 'warning');
    return;
  }

  if (!validateCredentials(username, password)) return;

  if (!rol) {
    renderAppAlert('Debes seleccionar un rol.', 'warning');
    return;
  }

  setButtonLoading(submitButton, true, 'Creando usuario...');

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      credentials: 'include',
      body: JSON.stringify({
        nombre,
        username: username.trim(),
        password,
        rol
      })
    });

    const data = await parseJsonSafe(response);

    if (handleUnauthorized(response)) return;

    if (response.ok) {
      renderAppAlert(`Usuario "${username.trim()}" creado exitosamente.`, 'success');

      if (nombreInput) nombreInput.value = '';
      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (rolInput) rolInput.value = '';

      return;
    }

    if (response.status === 403) {
      renderAppAlert('Acceso denegado. Solo administradores pueden registrar usuarios.', 'error');
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