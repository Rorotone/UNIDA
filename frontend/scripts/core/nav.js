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

    // Mover modales al body para escapar el stacking context del header (backdrop-filter)
    document.querySelectorAll('#nav-placeholder .nav-modal').forEach((modal) => {
      document.body.appendChild(modal);
    });

    await initUserBubble();
    bindNavEvents();
  } catch (error) {
    console.error('Error cargando navegación:', error);
  }
}

let currentUserId = null;

async function initUserBubble() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetchWithAuth('/api/auth/profile');
    const perfil = await parseJsonSafe(res);

    currentUserId = perfil?.id ?? null;

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
      option.value = rol.id;
      option.textContent = rol.tipo;
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
      tbody.innerHTML = `<tr><td colspan="4" class="gestion-empty">No hay usuarios registrados.</td></tr>`;
      return;
    }

    users.forEach((user) => {
      const userId = user.id;
      const disabled = !!user.deleted_at;
      const rolNombre = user.rol_nombre || user.rol || '—';

      // Fila principal
      const tr = document.createElement('tr');
      if (disabled) tr.classList.add('gestion-row-disabled');
      tr.dataset.userId = userId;

      const isSelf = String(userId) === String(currentUserId);

      tr.innerHTML = `
        <td>${user.nombre || '—'} ${disabled ? '<span class="gestion-badge-disabled">Inactivo</span>' : ''}</td>
        <td>${user.username || '—'}</td>
        <td><span class="gestion-rol-badge">${rolNombre}</span></td>
        <td>
          <div class="gestion-acciones-cell">
            <button type="button" class="gestion-btn-edit" data-action="edit" data-user-id="${userId}">Editar</button>
            <button type="button" class="${disabled ? 'gestion-btn-enable' : 'gestion-btn-disable'}"
              data-action="${disabled ? 'enable' : 'disable'}"
              data-user-id="${userId}"
              ${isSelf ? 'disabled title="No puedes deshabilitar tu propia sesión"' : ''}
            >${disabled ? 'Habilitar' : 'Deshabilitar'}</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);

      // Fila de edición (oculta inicialmente)
      const editTr = document.createElement('tr');
      editTr.classList.add('gestion-edit-row');
      editTr.style.display = 'none';
      editTr.dataset.editFor = userId;
      editTr.innerHTML = `
        <td colspan="4">
          <div class="gestion-edit-form">
            <p class="gestion-edit-title">Editando: <strong>${user.nombre || ''}</strong></p>
            <div class="gestion-edit-grid">
              <div class="nav-modal-field">
                <label>Nombre</label>
                <input type="text" class="edit-nombre" value="${user.nombre || ''}">
              </div>
              <div class="nav-modal-field">
                <label>Username</label>
                <input type="text" class="edit-username" value="${user.username || ''}">
              </div>
              <div class="nav-modal-field">
                <label>Rol</label>
                <select class="edit-rol"></select>
              </div>
            </div>
            <div class="gestion-edit-actions">
              <button type="button" class="btn-cancel edit-cancel">Cancelar</button>
              <button type="button" class="btn-primary edit-save">Guardar</button>
            </div>
          </div>
        </td>
      `;
      tbody.appendChild(editTr);

      // Poblar select de roles en la fila de edición desde el backend
      const editRolSelect = editTr.querySelector('.edit-rol');
      fetchWithAuth('/api/auth/tipos-usuario')
        .then(r => r.json())
        .then(tipos => {
          editRolSelect.innerHTML = '<option value="">Seleccione un rol...</option>';
          (tipos || []).forEach(t => {
            const o = document.createElement('option');
            o.value = t.id;
            o.textContent = t.tipo;
            if (String(t.id) === String(user.rol)) o.selected = true;
            editRolSelect.appendChild(o);
          });
        })
        .catch(() => {});

      // Botón Editar → mostrar fila edición
      tr.querySelector('[data-action="edit"]').addEventListener('click', () => {
        const isOpen = editTr.style.display !== 'none';
        // Cerrar todas las filas de edición abiertas
        tbody.querySelectorAll('.gestion-edit-row').forEach(r => r.style.display = 'none');
        editTr.style.display = isOpen ? 'none' : '';
      });

      // Botón Cancelar
      editTr.querySelector('.edit-cancel').addEventListener('click', () => {
        editTr.style.display = 'none';
      });

      // Botón Guardar
      editTr.querySelector('.edit-save').addEventListener('click', async () => {
        const nombre = editTr.querySelector('.edit-nombre').value.trim();
        const username = editTr.querySelector('.edit-username').value.trim();
        const rol = editTr.querySelector('.edit-rol').value;
        await editarUsuario(userId, { nombre, username, rol });
      });

      // Botón Activar/Desactivar
      tr.querySelector(`[data-action="${disabled ? 'enable' : 'disable'}"]`).addEventListener('click', async () => {
        await cambiarEstadoUsuario(userId, disabled ? 'enable' : 'disable');
      });
    });
  } catch (error) {
    if (error.message !== 'Sesión expirada') {
      console.error('Error cargando usuarios:', error);
    }
  }
}

async function editarUsuario(userId, { nombre, username, rol }) {
  try {
    const response = await fetchWithAuth(`/api/auth/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, username, rol })
    });
    const data = await parseJsonSafe(response);
    if (!response.ok) {
      alert(data.message || 'No se pudo actualizar el usuario.');
      return;
    }
    await cargarUsuariosGestion();
  } catch (error) {
    if (error.message !== 'Sesión expirada') console.error('Error editando usuario:', error);
  }
}

async function cambiarEstadoUsuario(userId, action) {
  try {
    const endpoint =
      action === 'enable'
        ? `/api/auth/users/${userId}/enable`
        : `/api/auth/users/${userId}`;

    const method = action === 'enable' ? 'PUT' : 'DELETE';

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