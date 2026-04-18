const RegisterAPI = (() => {
  const token = () => localStorage.getItem('token');

  async function getTiposUsuario() {
    const res = await fetch('/api/auth/tipos-usuario', {
      headers: { Authorization: `Bearer ${token()}` }
    });
    if (!res.ok) throw new Error('No se pudieron cargar los tipos de usuario.');
    return res.json();
  }

  async function getProfile() {
    const res = await fetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token()}` }
    });
    if (!res.ok) throw new Error('No se pudo obtener el perfil.');
    return res.json();
  }

  return { getTiposUsuario, getProfile };
})();