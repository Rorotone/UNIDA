function renderAppAlert(message, type = 'error') {
  const box = document.getElementById('form-alert');
  if (!box) return;

  box.className = `form-alert ${type}`;
  box.textContent = message;
  box.style.display = 'block';
}

function clearFormAlert() {
  const box = document.getElementById('form-alert');
  if (!box) return;

  box.textContent = '';
  box.className = 'form-alert';
  box.style.display = 'none';
}

function setButtonLoading(button, isLoading, loadingText = 'Procesando...') {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Enviar';
  }
}

function validateCredentials(username, password) {
  if (!username?.trim()) {
    renderAppAlert('El usuario es obligatorio.', 'warning');
    return false;
  }

  if (!password?.trim()) {
    renderAppAlert('La contraseña es obligatoria.', 'warning');
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

  const nombre = nombreInput?.value.trim();
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

/* =========================================================
   INICIALIZACIÓN
========================================================= */

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