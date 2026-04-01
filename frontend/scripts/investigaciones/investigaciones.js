document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            cargarMentores(),
            cargarProfesores()
        ]);
        cargarInvestigaciones();
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
    }

    document.getElementById('crear-investigacion-form').addEventListener('submit', crearInvestigacion);
    document.getElementById('aplicar-filtros').addEventListener('click', aplicarFiltros);
    document.getElementById('limpiar-filtros').addEventListener('click', limpiarFiltros);
});

async function cargarMentores() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch('http://localhost:3000/api/auth/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener mentores: ${response.status} ${response.statusText}`);
        }

        const mentores = await response.json();
        const select = document.getElementById('mentor-select');
        select.innerHTML = '<option value="">Seleccione un mentor</option>';
        
        mentores.forEach(mentor => {
            const option = document.createElement('option');
            option.value = mentor.id;
            option.textContent = mentor.username;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar mentores:', error);
        alert('Error al cargar la lista de mentores: ' + error.message);
    }
}

async function cargarProfesores() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch('http://localhost:3000/api/profesores', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener profesores: ${response.status} ${response.statusText}`);
        }

        const profesores = await response.json();
        const select = document.getElementById('profesor-select');
        select.innerHTML = '<option value="">Seleccione un profesor</option>';
        
        profesores.forEach(profesor => {
            const option = document.createElement('option');
            option.value = profesor.id_profesor;
            option.textContent = profesor.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar profesores:', error);
        alert('Error al cargar la lista de profesores: ' + error.message);
    }
}

async function crearInvestigacion(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch('http://localhost:3000/api/investigaciones', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear investigación');
        }

        alert('Investigación creada exitosamente');
        document.getElementById('crear-investigacion-form').reset();
        cargarInvestigaciones();
    } catch (error) {
        console.error('Error al crear investigación:', error);
        alert(error.message || 'Error al crear la investigación');
    }
}

async function cargarInvestigaciones(filtros = {}) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        let url = 'http://localhost:3000/api/investigaciones';
        
        // Add query parameters for filtering
        const queryParams = new URLSearchParams(filtros).toString();
        if (queryParams) {
            url += `?${queryParams}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener investigaciones');
        }

        const investigaciones = await response.json();
        const tablaInvestigaciones = document.getElementById('tabla-investigaciones');
        const tbody = tablaInvestigaciones.querySelector('tbody');
        tbody.innerHTML = '';

        if (investigaciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No hay investigaciones que coincidan con los filtros</td></tr>';
            return;
        }

        investigaciones.forEach(investigacion => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${investigacion.titulo}</td>
                <td>${investigacion.area}</td>
                <td>${new Date(investigacion.fecha_inicio).toLocaleDateString()}</td>
                <td>${new Date(investigacion.fecha_fin).toLocaleDateString()}</td>
                <td>${investigacion.profesor_nombre}</td>
                <td>${investigacion.mentor_nombre}</td>
                <td>${investigacion.archivo_nombre ? `<a href="/api/investigaciones/${investigacion.id}/archivo" target="_blank">${investigacion.archivo_nombre}</a>` : 'No hay archivo'}</td>
                <td>
                    <button onclick="editarInvestigacion(${investigacion.id})">Editar</button>
                    <button onclick="eliminarInvestigacion(${investigacion.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error al cargar investigaciones:', error);
        alert('Error al cargar la lista de investigaciones');
    }
}

async function editarInvestigacion(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        // Fetch the specific investigation details
        const response = await fetch(`http://localhost:3000/api/investigaciones/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener los detalles de la investigación');
        }

        const investigacion = await response.json();

        // Crear un modal o formulario de edición
        const modalHtml = `
            <div id="editar-investigacion-modal" class="modal">
                <div class="modal-content">
                    <h2>Editar Investigación</h2>
                    <form id="editar-investigacion-form" enctype="multipart/form-data">
                        <input type="hidden" name="id" value="${investigacion.id}">
                        
                        <div>
                            <label for="titulo">Título:</label>
                            <input type="text" id="titulo" name="titulo" value="${investigacion.titulo}" required>
                        </div>

                        <div>
                            <label for="area">Área:</label>
                            <input type="text" id="area" name="area" value="${investigacion.area}" required>
                        </div>

                        <div>
                            <label for="fecha_inicio">Fecha de inicio:</label>
                            <input type="date" id="fecha_inicio" name="fecha_inicio" 
                                   value="${new Date(investigacion.fecha_inicio).toISOString().split('T')[0]}" required>
                        </div>

                        <div>
                            <label for="fecha_fin">Fecha de fin:</label>
                            <input type="date" id="fecha_fin" name="fecha_fin" 
                                   value="${new Date(investigacion.fecha_fin).toISOString().split('T')[0]}" required>
                        </div>

                        <div>
                            <label for="profesor-select">Profesor:</label>
                            <select id="profesor-select" name="id_profesor" required>
                                <!-- Se llenarán los profesores dinámicamente -->
                            </select>
                        </div>

                        <div>
                            <label for="mentor-select">Mentor:</label>
                            <select id="mentor-select" name="id_mentor" required>
                                <!-- Se llenarán los mentores dinámicamente -->
                            </select>
                        </div>

                        <div>
                            <label for="archivo">Archivo:</label>
                            <input type="file" id="archivo" name="archivo">
                            ${investigacion.archivo_nombre ? `<p>Archivo actual: ${investigacion.archivo_nombre}</p>` : ''}
                        </div>

                        <div>
                            <button type="submit">Guardar Cambios</button>
                            <button type="button" onclick="cerrarModalEdicion()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Insertar el modal en el documento
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            const div = document.createElement('div');
            div.id = 'modal-container';
            document.body.appendChild(div);
        }
        document.getElementById('modal-container').innerHTML = modalHtml;

        // Cargar profesores y mentores en los selects
        await Promise.all([
            cargarProfesoresParaEdicion(investigacion.id_profesor),
            cargarMentoresParaEdicion(investigacion.id_mentor)
        ]);

        // Mostrar el modal
        document.getElementById('editar-investigacion-modal').style.display = 'block';

        // Agregar listener para el submit del formulario
        document.getElementById('editar-investigacion-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarCambiosInvestigacion(e.target);
        });

    } catch (error) {
        console.error('Error al preparar edición de investigación:', error);
        alert('Error al preparar la edición: ' + error.message);
    }
}

async function cargarProfesoresParaEdicion(profesorSeleccionadoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch('http://localhost:3000/api/profesores', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener profesores: ${response.status} ${response.statusText}`);
        }

        const profesores = await response.json();
        const select = document.getElementById('profesor-select');
        select.innerHTML = '<option value="">Seleccione un profesor</option>';
        
        profesores.forEach(profesor => {
            const option = document.createElement('option');
            option.value = profesor.id_profesor;
            option.textContent = profesor.nombre;
            if (profesor.id_profesor === profesorSeleccionadoId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar profesores para edición:', error);
        alert('Error al cargar la lista de profesores: ' + error.message);
    }
}

async function cargarMentoresParaEdicion(mentorSeleccionadoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch('http://localhost:3000/api/auth/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener mentores: ${response.status} ${response.statusText}`);
        }

        const mentores = await response.json();
        const select = document.getElementById('mentor-select');
        select.innerHTML = '<option value="">Seleccione un mentor</option>';
        
        mentores.forEach(mentor => {
            const option = document.createElement('option');
            option.value = mentor.id;
            option.textContent = mentor.username;
            if (mentor.id === mentorSeleccionadoId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar mentores para edición:', error);
        alert('Error al cargar la lista de mentores: ' + error.message);
    }
}

async function guardarCambiosInvestigacion(form) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const formData = new FormData(form);
        const id = formData.get('id');

        const response = await fetch(`http://localhost:3000/api/investigaciones/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar investigación');
        }

        alert('Investigación actualizada exitosamente');
        cerrarModalEdicion();
        cargarInvestigaciones();
    } catch (error) {
        console.error('Error al guardar cambios de investigación:', error);
        alert(error.message || 'Error al actualizar la investigación');
    }
}

function cerrarModalEdicion() {
    const modal = document.getElementById('editar-investigacion-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Asegúrate de que estas funciones estén disponibles globalmente


async function eliminarInvestigacion(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta investigación?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch(`http://localhost:3000/api/investigaciones/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la investigación');
        }

        alert('Investigación eliminada exitosamente');
        cargarInvestigaciones();
    } catch (error) {
        console.error('Error al eliminar investigación:', error);
        alert('Error al eliminar la investigación');
    }
}

// Asegúrate de que estas funciones estén disponibles globalmente
window.editarInvestigacion = editarInvestigacion;
window.eliminarInvestigacion = eliminarInvestigacion;
window.cerrarModalEdicion = cerrarModalEdicion;

function aplicarFiltros() {
    const filtros = {
        titulo: document.getElementById('filtro-titulo').value,
        area: document.getElementById('filtro-area').value,
        profesor: document.getElementById('filtro-profesor').value,
        mentor: document.getElementById('filtro-mentor').value
    };

    // Remove empty filters
    Object.keys(filtros).forEach(key => {
        if (!filtros[key]) {
            delete filtros[key];
        }
    });

    cargarInvestigaciones(filtros);
}

function limpiarFiltros() {
    document.getElementById('filtro-titulo').value = '';
    document.getElementById('filtro-area').value = '';
    document.getElementById('filtro-profesor').value = '';
    document.getElementById('filtro-mentor').value = '';
    cargarInvestigaciones();
}

window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;

