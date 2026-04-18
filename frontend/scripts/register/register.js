(async () => {
  // Verificar que sea admin
  try {
    const perfil = await RegisterAPI.getProfile();
    if (perfil.rol !== 'admin') {
      alert('Acceso denegado. Solo administradores pueden registrar usuarios.');
      window.location.replace('/index.html');
      return;
    }
  } catch (_) {
    window.location.replace('/index.html');
    return;
  }

  // Cargar y poblar roles
  try {
    const tipos = await RegisterAPI.getTiposUsuario();
    RegisterUI.poblarSelectRoles(tipos);
  } catch (error) {
    console.error(error.message);
  }
})();