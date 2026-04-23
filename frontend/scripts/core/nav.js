document.documentElement.style.visibility = 'hidden';

function checkAuth() {
  const token = getAuthToken();

  if (!token) {
    window.location.replace('/login.html');
    return false;
  }

  document.documentElement.style.visibility = '';
  return true;
}

async function loadNav() {
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (!navPlaceholder) return;

  try {
    const response = await fetch('/nav.html');
    const html = await response.text();
    navPlaceholder.innerHTML = html;

    await initUserBubble();
    bindNavEvents();
  } catch (error) {
    console.error('Error cargando navegación:', error);
  }
}

async function initUserBubble() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetchWithAuth('/api/auth/profile');
    const perfil = await parseJsonSafe(res);

    const nombre = perfil?.nombre || 'Usuario';
    const username = perfil?.username || 'sin-usuario';
    const rol = perfil?.rol || '';

    const ddNombre = document.getElementById('dd-nombre');
    const ddUsername = document.getElementById('dd-username');
    const ddAvatar = document.getElementById('dd-avatar');
    const ddRolBadge = document.getElementById('dd-rol-badge');
    const bubbleBtn = document.getElementById('user-bubble-btn');
    const gestionBtn = document.getElementById('dd-gestion-usuarios');

    if (ddNombre) ddNombre.textContent = nombre;
    if (ddUsername) ddUsername.textContent = `@${username}`;
    if (ddAvatar) ddAvatar.textContent = nombre.charAt(0).toUpperCase();
    if (bubbleBtn) bubbleBtn.textContent = nombre.charAt(0).toUpperCase();

    if (ddRolBadge) {
      ddRolBadge.textContent = rol ? rol.toUpperCase() : '';
      ddRolBadge.style.display = rol ? 'inline-flex' : 'none';
    }

    if (gestionBtn && rol.toLowerCase() === 'admin') {
      gestionBtn.style.display = 'block';
    }
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error cargando perfil:', error);
    }
  }
}

function bindNavEvents() {
  const bubbleBtn = document.getElementById('user-bubble-btn');
  const dropdown = document.getElementById('user-dropdown');
  const logoutBtn = document.getElementById('dd-logout');

  const changePasswordBtn = document.getElementById('dd-cambiar-password');
  const changePasswordModal = document.getElementById('modal-change-password');
  const changePasswordCancel = document.getElementById('modal-pwd-cancel');
  const changePasswordSubmit = document.getElementById('modal-pwd-submit');

  const gestionBtn = document.getElementById('dd-gestion-usuarios');
  const gestionModal = document.getElementById('modal-gestion-usuarios');
  const gestionClose = document.getElementById('modal-gestion-close');
  const modalUserSubmit = document.getElementById('modal-user-submit');

  bubbleBtn?.addEventListener('click', () => {
    dropdown?.classList.toggle('is-open');
  });

  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('user-bubble-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      dropdown?.classList.remove('is-open');
    }
  });

  logoutBtn?.addEventListener('click', () => {
    clearSessionAndRedirect();
  });

  changePasswordBtn?.addEventListener('click', () => {
    dropdown?.classList.remove('is-open');
    changePasswordModal?.classList.add('is-open');
  });

  changePasswordCancel?.addEventListener('click', () => {
    changePasswordModal?.classList.remove('is-open');
  });

  changePasswordSubmit?.addEventListener('click', handleChangePassword);

  gestionBtn?.addEventListener('click', async () => {
    dropdown?.classList.remove('is-open');
    gestionModal?.classList.add('is-open');
    await cargarUsuariosGestion();
    await cargarRolesGestion();
  });

  gestionClose?.addEventListener('click', () => {
    gestionModal?.classList.remove('is-open');
  });

  modalUserSubmit?.addEventListener('click', handleCreateUserFromNav);

  document.querySelectorAll('.nav-modal-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      document.querySelectorAll('.nav-modal-tab').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.tab === tab);
      });

      document.querySelectorAll('.nav-modal-panel').forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.panel === tab);
      });
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === changePasswordModal) {
      changePasswordModal?.classList.remove('is-open');
    }

    if (e.target === gestionModal) {
      gestionModal?.classList.remove('is-open');
    }
  });
}

async function handleChangePassword() {
  const currentPassword = document.getElementById('modal-current-password')?.value || '';
  const newPassword = document.getElementById('modal-new-password')?.value || '';
  const confirmPassword = document.getElementById('modal-confirm-password')?.value || '';
  const alertBox = document.getElementById('modal-pwd-alert');

  if (alertBox) {
    alertBox.textContent = '';
    alertBox.className = 'nav-modal-alert';
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    if (alertBox) {
      alertBox.textContent = 'Debes completar todos los campos.';
      alertBox.classList.add('is-error');
    }
    return;
  }

  if (newPassword !== confirmPassword) {
    if (alertBox) {
      alertBox.textContent = 'La nueva contraseña y su confirmación no coinciden.';
      alertBox.classList.add('is-error');
    }
    return;
  }

  try {
    const response = await fetchWithAuth('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      if (alertBox) {
        alertBox.textContent = data.message || 'No se pudo cambiar la contraseña.';
        alertBox.classList.add('is-error');
      }
      return;
    }

    if (alertBox) {
      alertBox.textContent = data.message || 'Contraseña actualizada correctamente.';
      alertBox.classList.add('is-success');
    }

    document.getElementById('modal-current-password').value = '';
    document.getElementById('modal-new-password').value = '';
    document.getElementById('modal-confirm-password').value = '';
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error al cambiar contraseña:', error);
    }
  }
}

async function cargarRolesGestion() {
  try {
    const response = await fetchWithAuth('/api/auth/tipos-usuario');
    const data = await parseJsonSafe(response);

    if (!response.ok) return;

    const select = document.getElementById('modal-user-rol');
    if (!select) return;

    select.innerHTML = `<option value="">Seleccione un rol...</option>`;

    (data || []).forEach((rol) => {
      const option = document.createElement('option');
      option.value = rol.nombre_tipo || rol.nombre || rol.id_tipo_usuario;
      option.textContent = rol.nombre_tipo || rol.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error cargando roles:', error);
    }
  }
}

async function cargarUsuariosGestion() {
  try {
    const response = await fetchWithAuth('/api/auth/users/manage');
    const users = await parseJsonSafe(response);

    if (!response.ok) return;

    const tbody = document.getElementById('gestion-users-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;">No hay usuarios registrados.</td>
        </tr>
      `;
      return;
    }

    users.forEach((user) => {
      const tr = document.createElement('tr');

      const estadoTexto = Number(user.estado ?? 1) === 1 ? 'Desactivar' : 'Activar';
      const accionClase = Number(user.estado ?? 1) === 1 ? 'danger' : 'success';
      const action = Number(user.estado ?? 1) === 1 ? 'disable' : 'enable';

      tr.innerHTML = `
        <td>${user.nombre || '—'}</td>
        <td>${user.username || '—'}</td>
        <td>${user.rol || user.tipo_usuario || '—'}</td>
        <td>
          <button
            type="button"
            class="dd-btn ${accionClase}"
            data-user-id="${user.id_usuario}"
            data-action="${action}"
          >
            ${estadoTexto}
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-user-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.userId;
        const action = btn.dataset.action;

        await cambiarEstadoUsuario(userId, action);
      });
    });
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error cargando usuarios:', error);
    }
  }
}

async function cambiarEstadoUsuario(userId, action) {
  try {
    const endpoint =
      action === 'enable'
        ? `/api/auth/users/${userId}/enable`
        : `/api/auth/users/${userId}`;

    const method = action === 'enable' ? 'PATCH' : 'DELETE';

    const response = await fetchWithAuth(endpoint, {
      method
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      console.error(data.message || 'No se pudo actualizar el usuario.');
      return;
    }

    await cargarUsuariosGestion();
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error cambiando estado usuario:', error);
    }
  }
}

async function handleCreateUserFromNav() {
  const nombre = document.getElementById('modal-user-nombre')?.value.trim() || '';
  const username = document.getElementById('modal-user-username')?.value.trim() || '';
  const password = document.getElementById('modal-user-password')?.value || '';
  const rol = document.getElementById('modal-user-rol')?.value || '';
  const alertBox = document.getElementById('modal-user-alert');

  if (alertBox) {
    alertBox.textContent = '';
    alertBox.className = 'nav-modal-alert';
  }

  if (!nombre || !username || !password || !rol) {
    if (alertBox) {
      alertBox.textContent = 'Debes completar todos los campos.';
      alertBox.classList.add('is-error');
    }
    return;
  }

  try {
    const response = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        username,
        password,
        rol
      })
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      if (alertBox) {
        alertBox.textContent = data.message || 'No se pudo crear el usuario.';
        alertBox.classList.add('is-error');
      }
      return;
    }

    if (alertBox) {
      alertBox.textContent = data.message || 'Usuario creado correctamente.';
      alertBox.classList.add('is-success');
    }

    document.getElementById('modal-user-nombre').value = '';
    document.getElementById('modal-user-username').value = '';
    document.getElementById('modal-user-password').value = '';
    document.getElementById('modal-user-rol').value = '';

    await cargarUsuariosGestion();
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error creando usuario:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  await loadNav();
});