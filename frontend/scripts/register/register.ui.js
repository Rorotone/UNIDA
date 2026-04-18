const RegisterUI = (() => {
  function poblarSelectRoles(tipos) {
    const select = document.getElementById('rol');
    if (!select) return;
    tipos.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1);
      select.appendChild(option);
    });
  }

  return { poblarSelectRoles };
})();