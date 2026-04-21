// Ocultar inmediatamente antes de cualquier render
document.documentElement.style.visibility = 'hidden';

if (!localStorage.getItem('token')) {
  window.location.replace('/login.html');
}

let tiposUsuarioCache = [];
let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    fetch('/nav.html')
      .then(r => r.text())
      .then(html => {
        // Insertar nav en el placeholder
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Mover modales al body para evitar conflictos con el header sticky
        const modales = temp.querySelectorAll('.nav-modal');
        modales.forEach(m => document.body.appendChild(m));

        // El resto va al nav-placeholder
        navPlaceholder.innerHTML = temp.innerHTML;
        initUserBubble();
      })
      .catch(err => console.error('Error al cargar la navegación:', err));
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

async function initUserBubble() {
  const token = localStorage.getItem('token');

  let perfil = {};
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) perfil = await res.json();
  } catch (_) {}

  currentUserId = perfil.id || null;
  const nombre   = perfil.nombre || perfil.username || '?';
  const username = perfil.username || '';
  const rol      = perfil.rol || 'usuario';
  const inicial  = nombre.charAt(0).toUpperCase();

  const bubbleBtn = document.getElementById('user-bubble-btn');
  if (bubbleBtn) bubbleBtn.textContent = inicial;

  const ddAvatar   = document.getElementById('dd-avatar');
  const ddNombre   = document.getElementById('dd-nombre');
  const ddUsername = document.getElementById('dd-username');
  const ddRolBadge = document.getElementById('dd-rol-badge');

  if (ddAvatar)   ddAvatar.textContent   = inicial;
  if (ddNombre)   ddNombre.textContent   = nombre;
  if (ddUsername) ddUsername.textContent = `@${username}`;
  if (ddRolBadge) ddRolBadge.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);

  if (rol === 'admin') {
    const btnGestion = document.getElementById('dd-gestion-usuarios');
    if (btnGestion) btnGestion.style.display = 'flex';
    initModalGestionUsuarios(token);
  }

  // Toggle dropdown
  bubbleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', () => {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.style.display = 'none';
  });

  // Logout
  document.getElementById('dd-logout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.replace('/login.html');
  });

  // Abrir modal cambiar contraseña
  document.getElementById('dd-cambiar-password')?.addEventListener('click', () => {
    document.getElementById('user-dropdown').style.display = 'none';
    const modal = document.getElementById('modal-change-password');
    if (modal) modal.classList.add('is-open');
  });

  // Abrir modal gestión de usuarios
  document.getElementById('dd-gestion-usuarios')?.addEventListener('click', () => {
    document.getElementById('user-dropdown').style.display = 'none';
    abrirModalGestionUsuarios();
  });

  // Modal contraseña — cerrar
  document.getElementById('modal-pwd-cancel')?.addEventListener('click', cerrarModalPassword);
  document.getElementById('modal-change-password')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModalPassword();
  });

  // Modal contraseña — submit
  document.getElementById('modal-pwd-submit')?.addEventListener('click', async () => {
    const current = document.getElementById('modal-current-password').value;
    const newPwd  = document.getElementById('modal-new-password').value;
    const confirm = document.getElementById('modal-confirm-password').value;

    if (!current || !newPwd || !confirm) {
      mostrarAlerta('modal-pwd-alert', 'Completa todos los campos.', 'warning');
      return;
    }
    if (newPwd !== confirm) {
      mostrarAlerta('modal-pwd-alert', 'Las contraseñas nuevas no coinciden.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: newPwd })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarAlerta('modal-pwd-alert', 'Contraseña cambiada exitosamente.', 'success');
        setTimeout(() => cerrarModalPassword(), 1500);
      } else {
        mostrarAlerta('modal-pwd-alert', data.message || 'Error al cambiar la contraseña.', 'error');
      }
    } catch (_) {
      mostrarAlerta('modal-pwd-alert', 'Error de conexión.', 'error');
    }
  });
}

async function initModalGestionUsuarios(token) {
  // Cargar tipos de usuario (roles)
  try {
    const res = await fetch('/api/auth/tipos-usuario', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      tiposUsuarioCache = await res.json();
      const select = document.getElementById('modal-user-rol');
      if (select) {
        tiposUsuarioCache.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1);
          select.appendChild(opt);
        });
      }
    }
  } catch (_) {}

  // Cerrar modal
  document.getElementById('modal-gestion-close')?.addEventListener('click', cerrarModalGestionUsuarios);
  document.getElementById('modal-gestion-usuarios')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModalGestionUsuarios();
  });

  // Tabs
  document.querySelectorAll('#modal-gestion-usuarios .nav-modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('#modal-gestion-usuarios .nav-modal-tab').forEach(t => t.classList.toggle('is-active', t === tab));
      document.querySelectorAll('#modal-gestion-usuarios .nav-modal-panel').forEach(p => {
        p.classList.toggle('is-active', p.dataset.panel === target);
      });
    });
  });

  // Crear usuario
  document.getElementById('modal-user-submit')?.addEventListener('click', async () => {
    const nombre   = document.getElementById('modal-user-nombre').value.trim();
    const username = document.getElementById('modal-user-username').value.trim();
    const password = document.getElementById('modal-user-password').value;
    const rol      = document.getElementById('modal-user-rol').value;

    if (!nombre || !username || !password || !rol) {
      mostrarAlerta('modal-user-alert', 'Completa todos los campos.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, username, password, rol })
      });
      const data = await res.json();
      if (res.ok) {
        showAppAlert(`Usuario "${username}" creado exitosamente.`, 'success');
        document.getElementById('modal-user-nombre').value = '';
        document.getElementById('modal-user-username').value = '';
        document.getElementById('modal-user-password').value = '';
        document.getElementById('modal-user-rol').value = '';
        cargarUsuariosGestion(token);
      } else {
        mostrarAlerta('modal-user-alert', data.message || 'Error al crear el usuario.', 'error');
      }
    } catch (_) {
      mostrarAlerta('modal-user-alert', 'Error de conexión.', 'error');
    }
  });
}

function abrirModalGestionUsuarios() {
  const modal = document.getElementById('modal-gestion-usuarios');
  if (!modal) return;
  modal.classList.add('is-open');
  const token = localStorage.getItem('token');
  cargarUsuariosGestion(token);
}

function cerrarModalGestionUsuarios() {
  const modal = document.getElementById('modal-gestion-usuarios');
  if (modal) modal.classList.remove('is-open');
  document.getElementById('modal-user-nombre').value = '';
  document.getElementById('modal-user-username').value = '';
  document.getElementById('modal-user-password').value = '';
  document.getElementById('modal-user-rol').value = '';
  const alerts = ['modal-gestion-alert', 'modal-user-alert'];
  alerts.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  // Reset tabs a "Usuarios registrados"
  document.querySelectorAll('#modal-gestion-usuarios .nav-modal-tab').forEach(t => {
    t.classList.toggle('is-active', t.dataset.tab === 'usuarios-registrados');
  });
  document.querySelectorAll('#modal-gestion-usuarios .nav-modal-panel').forEach(p => {
    p.classList.toggle('is-active', p.dataset.panel === 'usuarios-registrados');
  });
}

async function cargarUsuariosGestion(token) {
  const tbody = document.getElementById('gestion-users-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" class="gestion-empty">Cargando usuarios...</td></tr>`;

  try {
    const res = await fetch('/api/auth/users/manage', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="4" class="gestion-empty">Error al cargar usuarios.</td></tr>`;
      return;
    }
    const users = await res.json();
    renderUsuariosGestion(users);
  } catch (_) {
    tbody.innerHTML = `<tr><td colspan="4" class="gestion-empty">Error de conexión.</td></tr>`;
  }
}

function renderUsuariosGestion(users) {
  const tbody = document.getElementById('gestion-users-body');
  if (!tbody) return;
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="gestion-empty">No hay usuarios registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const disabled = u.deleted_at !== null && u.deleted_at !== undefined;
    const esPropioUsuario = Number(u.id) === Number(currentUserId);
    return `
      <tr data-user-id="${u.id}" class="${disabled ? 'gestion-row-disabled' : ''}">
        <td>${escapeHtml(u.nombre)}${disabled ? ' <span class="gestion-badge-disabled">Deshabilitado</span>' : ''}</td>
        <td>@${escapeHtml(u.username)}</td>
        <td><span class="gestion-rol-badge">${escapeHtml(capitalize(u.rol_nombre))}</span></td>
        <td class="gestion-acciones-cell">
          ${!disabled ? `<button type="button" class="gestion-btn-edit" data-action="edit" data-id="${u.id}">Editar</button>` : ''}
          ${disabled
            ? `<button type="button" class="gestion-btn-enable" data-action="enable" data-id="${u.id}">Habilitar</button>`
            : `<button type="button" class="gestion-btn-disable" data-action="disable" data-id="${u.id}" ${esPropioUsuario ? 'disabled title="No puedes deshabilitar tu propio usuario"' : ''}>Deshabilitar</button>`
          }
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => toggleEditRow(Number(btn.dataset.id), users));
  });
  tbody.querySelectorAll('button[data-action="disable"]').forEach(btn => {
    btn.addEventListener('click', () => confirmarDeshabilitarUsuario(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('button[data-action="enable"]').forEach(btn => {
    btn.addEventListener('click', () => confirmarHabilitarUsuario(Number(btn.dataset.id)));
  });
}

function toggleEditRow(userId, users) {
  const tbody = document.getElementById('gestion-users-body');
  if (!tbody) return;

  const existingEdit = tbody.querySelector(`tr.gestion-edit-row[data-edit-for="${userId}"]`);
  if (existingEdit) {
    existingEdit.remove();
    return;
  }

  // Eliminar cualquier otra fila de edición abierta
  tbody.querySelectorAll('tr.gestion-edit-row').forEach(r => r.remove());

  const user = users.find(u => Number(u.id) === Number(userId));
  if (!user) return;

  const row = tbody.querySelector(`tr[data-user-id="${userId}"]`);
  if (!row) return;

  const rolesOptions = tiposUsuarioCache.map(t => `
    <option value="${t.id}" ${Number(t.id) === Number(user.rol) ? 'selected' : ''}>${escapeHtml(capitalize(t.tipo))}</option>
  `).join('');

  const editRow = document.createElement('tr');
  editRow.className = 'gestion-edit-row';
  editRow.dataset.editFor = String(userId);
  editRow.innerHTML = `
    <td colspan="4">
      <div class="gestion-edit-form">
        <h4 class="gestion-edit-title">Editar usuario</h4>
        <div id="gestion-edit-alert-${userId}" class="nav-modal-alert"></div>
        <div class="gestion-edit-grid">
          <div class="nav-modal-field">
            <label>Nombre</label>
            <input type="text" class="gestion-edit-nombre" value="${escapeAttr(user.nombre)}">
          </div>
          <div class="nav-modal-field">
            <label>Username</label>
            <input type="text" class="gestion-edit-username" value="${escapeAttr(user.username)}">
          </div>
          <div class="nav-modal-field">
            <label>Rol</label>
            <select class="gestion-edit-rol">${rolesOptions}</select>
          </div>
        </div>
        <div class="gestion-edit-actions">
          <button type="button" class="btn-cancel" data-cancel>Cancelar</button>
          <button type="button" class="btn-primary" data-save>Guardar cambios</button>
        </div>
      </div>
    </td>
  `;
  row.after(editRow);

  editRow.querySelector('[data-cancel]').addEventListener('click', () => editRow.remove());
  editRow.querySelector('[data-save]').addEventListener('click', () => guardarEdicionUsuario(userId, editRow));
}

async function guardarEdicionUsuario(userId, editRow) {
  const token = localStorage.getItem('token');
  const nombre   = editRow.querySelector('.gestion-edit-nombre').value.trim();
  const username = editRow.querySelector('.gestion-edit-username').value.trim();
  const rol      = editRow.querySelector('.gestion-edit-rol').value;
  const alertId  = `gestion-edit-alert-${userId}`;

  if (!nombre || !username || !rol) {
    mostrarAlerta(alertId, 'Completa todos los campos.', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/auth/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre, username, rol })
    });
    const data = await res.json();
    if (res.ok) {
      showAppAlert('Usuario actualizado exitosamente.', 'success');
      cargarUsuariosGestion(token);
    } else {
      mostrarAlerta(alertId, data.message || 'Error al actualizar el usuario.', 'error');
    }
  } catch (_) {
    mostrarAlerta(alertId, 'Error de conexión.', 'error');
  }
}

async function confirmarDeshabilitarUsuario(userId) {
  const confirmed = await showAppConfirm({
    title: 'Deshabilitar usuario',
    message: '¿Seguro que deseas deshabilitar este usuario? No podrá iniciar sesión.',
    confirmText: 'Deshabilitar',
    cancelText: 'Cancelar',
    danger: true
  });
  if (!confirmed) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/auth/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      showAppAlert('Usuario deshabilitado exitosamente.', 'success');
      cargarUsuariosGestion(token);
    } else {
      showAppAlert(data.message || 'Error al deshabilitar el usuario.', 'error');
    }
  } catch (_) {
    showAppAlert('Error de conexión.', 'error');
  }
}

async function confirmarHabilitarUsuario(userId) {
  const confirmed = await showAppConfirm({
    title: 'Habilitar usuario',
    message: '¿Deseas habilitar este usuario? Podrá iniciar sesión nuevamente.',
    confirmText: 'Habilitar',
    cancelText: 'Cancelar',
    danger: false
  });
  if (!confirmed) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/auth/users/${userId}/enable`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      showAppAlert('Usuario habilitado exitosamente.', 'success');
      cargarUsuariosGestion(token);
    } else {
      showAppAlert(data.message || 'Error al habilitar el usuario.', 'error');
    }
  } catch (_) {
    showAppAlert('Error de conexión.', 'error');
  }
}

function cerrarModalPassword() {
  const modal = document.getElementById('modal-change-password');
  if (modal) modal.classList.remove('is-open');
  document.getElementById('modal-current-password').value = '';
  document.getElementById('modal-new-password').value = '';
  document.getElementById('modal-confirm-password').value = '';
  document.getElementById('modal-pwd-alert').style.display = 'none';
}

function mostrarAlerta(elementId, msg, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = type === 'success' ? '#dcfce7' : type === 'warning' ? '#fef3c7' : '#fee2e2';
  el.style.color      = type === 'success' ? '#166534' : type === 'warning' ? '#92400e' : '#b91c1c';
  el.style.border     = type === 'success' ? '1px solid #bbf7d0' : type === 'warning' ? '1px solid #fde68a' : '1px solid #fecaca';
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(text) {
  return escapeHtml(text);
}

function capitalize(text) {
  const s = String(text ?? '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
