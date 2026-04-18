// Ocultar inmediatamente antes de cualquier render
document.documentElement.style.visibility = 'hidden';

if (!localStorage.getItem('token')) {
  window.location.replace('/login.html');
}

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
    const btnAgregar = document.getElementById('dd-agregar-usuario');
    if (btnAgregar) btnAgregar.style.display = 'flex';
    initModalAgregarUsuario(token);
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

  // Abrir modal agregar usuario
  document.getElementById('dd-agregar-usuario')?.addEventListener('click', () => {
    document.getElementById('user-dropdown').style.display = 'none';
    const modal = document.getElementById('modal-agregar-usuario');
    if (modal) modal.classList.add('is-open');
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

async function initModalAgregarUsuario(token) {
  try {
    const res = await fetch('/api/auth/tipos-usuario', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const tipos = await res.json();
      const select = document.getElementById('modal-user-rol');
      if (select) {
        tipos.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1);
          select.appendChild(opt);
        });
      }
    }
  } catch (_) {}

  document.getElementById('modal-user-cancel')?.addEventListener('click', cerrarModalAgregarUsuario);
  document.getElementById('modal-agregar-usuario')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarModalAgregarUsuario();
  });

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
        mostrarAlerta('modal-user-alert', `Usuario "${username}" creado exitosamente.`, 'success');
        document.getElementById('modal-user-nombre').value = '';
        document.getElementById('modal-user-username').value = '';
        document.getElementById('modal-user-password').value = '';
        document.getElementById('modal-user-rol').value = '';
      } else {
        mostrarAlerta('modal-user-alert', data.message || 'Error al crear el usuario.', 'error');
      }
    } catch (_) {
      mostrarAlerta('modal-user-alert', 'Error de conexión.', 'error');
    }
  });
}

function cerrarModalPassword() {
  const modal = document.getElementById('modal-change-password');
  if (modal) modal.classList.remove('is-open');
  document.getElementById('modal-current-password').value = '';
  document.getElementById('modal-new-password').value = '';
  document.getElementById('modal-confirm-password').value = '';
  document.getElementById('modal-pwd-alert').style.display = 'none';
}

function cerrarModalAgregarUsuario() {
  const modal = document.getElementById('modal-agregar-usuario');
  if (modal) modal.classList.remove('is-open');
  document.getElementById('modal-user-nombre').value = '';
  document.getElementById('modal-user-username').value = '';
  document.getElementById('modal-user-password').value = '';
  document.getElementById('modal-user-rol').value = '';
  document.getElementById('modal-user-alert').style.display = 'none';
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