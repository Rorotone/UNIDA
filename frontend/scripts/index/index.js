const getToken = () => localStorage.getItem('token');
    const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

    function escapeHTML(text) {
      return String(text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
    }

    async function init() {
      try {
        const res = await fetch('/api/auth/profile', { headers: authHeader() });
        if (res.ok) {
          const data = await res.json();
          document.getElementById('hero-username').textContent = data.username;
        }
      } catch (_) {}

      try {
        const res = await fetch('/api/mentorias', { headers: authHeader() });
        if (!res.ok) return;
        const mentorias = await res.json();

        document.getElementById('stat-activas').textContent     = mentorias.filter(m => Number(m.completada) === 0).length;
        document.getElementById('stat-finalizadas').textContent = mentorias.filter(m => Number(m.completada) === 1).length;
        document.getElementById('stat-vencidas').textContent    = mentorias.filter(m => Number(m.completada) === 2).length;

        const lista = document.getElementById('mentorias-recientes');
        const recientes = mentorias.slice(0, 4);

        if (recientes.length === 0) {
          lista.innerHTML = '<p class="loading-text">No hay mentorías registradas.</p>';
          return;
        }

        lista.innerHTML = recientes.map(m => {
          const estado = Number(m.completada);
          const badgeClass = estado === 1 ? 'badge-finalizada' : estado === 2 ? 'badge-vencida' : 'badge-activa';
          const badgeLabel = estado === 1 ? '✓ Finalizada' : estado === 2 ? '⏰ Vencida' : 'Activa';
          const termino = m.fecha_termino ? String(m.fecha_termino).slice(0, 10) : '-';
          const rowClass = estado === 2 ? 'vencida' : estado === 1 ? 'finalizada' : '';
          return `
            <div class="mentoria-row ${rowClass}">
              <div class="mentoria-row-info">
                <div class="mentoria-row-titulo">${escapeHTML(m.titulo || 'Sin título')}</div>
                <div class="mentoria-row-meta">${escapeHTML(m.mentor || '-')} · hasta ${termino}</div>
              </div>
              <span class="mentoria-row-badge ${badgeClass}">${badgeLabel}</span>
            </div>`;
        }).join('');

      } catch (_) {
        document.getElementById('mentorias-recientes').innerHTML =
          '<p class="loading-text">No se pudo cargar la información.</p>';
      }
    }

    document.addEventListener('DOMContentLoaded', init);