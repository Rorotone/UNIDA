document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('open-modal-btn');
    const modal = document.getElementById('modal-profesor');
    const profesorForm = document.getElementById('profesor-form');
    const searchButton = document.getElementById('search-btn');

    profesorForm.addEventListener('submit', handleFormSubmit);
    searchButton.addEventListener('click', filtrarProfesores);

    openModalBtn.addEventListener('click', () => {
        document.getElementById('profesor-form').reset();
        document.getElementById('id_profesor').value = '';
        document.getElementById('form-title').textContent = 'Agregar Profesor';

        modal.style.display = 'block';
    });

    // Cargar profesores al iniciar la página
    cargarProfesores();
});

// Función para obtener el encabezado de autorización
function getAuthHeader() {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
}

function normalizeProfesor(profesor) {
    return {
        ...profesor,
        sede: profesor.Sede ?? profesor.sede ?? '',
        sede_actual: profesor.Sede_actual ?? profesor.sede_actual ?? '',
        talleres: profesor.Talleres ?? profesor.talleres ?? '',
        formacion: profesor.Formacion ?? profesor.formacion ?? 0,
        estado_I: profesor.Estado_I ?? profesor.estado_I ?? 0,
        magister: profesor.Magister ?? profesor.magister ?? 0,
        otro_i: profesor.Otro_I ?? profesor.Otro_i ?? profesor.otro_i ?? '',
    };
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id_profesor = document.getElementById('id_profesor').value;

    const profesorData = {
        nombre: document.getElementById('nombre').value,
        departamento: document.getElementById('departamento').value,
        sede: document.getElementById('sede').value,
        sede_actual: document.getElementById('sede_actual').value,
        talleres: document.getElementById('talleres').value,
        formacion: document.getElementById('formacion').checked ? 1 : 0,
        estado_I: document.getElementById('estado_I').checked ? 1 : 0,
        magister: document.getElementById('magister').checked ? 1 : 0,
        otro_i: document.getElementById('otro_i').value,
    };

    try {
        const response = await fetch(`/api/profesores${id_profesor ? `/${id_profesor}` : ''}`, {
            method: id_profesor ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(profesorData),
        });

        if (response.ok) {
            alert(`Profesor ${id_profesor ? 'actualizado' : 'creado'} exitosamente.`);
            document.getElementById('profesor-form').reset();
            document.getElementById('form-title').textContent = 'Crear Profesor';
            await cargarProfesores();
        } else if (response.status === 401) {
            alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login.html';
        } else {
            alert('Error al guardar el profesor.');
        }
    } catch (error) {
        console.error('Error al guardar profesor:', error);
    }
}

async function cargarProfesores() {
    try {
        const response = await fetch('/api/profesores', {
            headers: getAuthHeader()
        });

        if (response.ok) {
            const profesores = await response.json();
            const profesoresBody = document.getElementById('profesores-body');
            profesoresBody.innerHTML = ''; // Limpia el cuerpo de la tabla antes de cargar nuevos profesores

            profesores.forEach((profesor) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                        <td>${profesor.nombre}</td>
                    <td>${profesor.departamento}</td>
                    <td>${profesor.sede}</td>
                    <td>${profesor.sede_actual}</td>
                    <td>${profesor.talleres}</td>
                    <td>${profesor.formacion === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.estado_I === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.magister === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.otro_i || 'No value'}</td>
                    <td>
                        <button onclick="editarProfesor(${profesor.id_profesor})">Editar</button>
                        <button onclick="eliminarProfesor(${profesor.id_profesor})">Eliminar</button>
                    </td>
                `;
                profesoresBody.appendChild(row);
            });
        } else if (response.status === 401) {
            alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login.html';
        } else {
            alert('Error al cargar los profesores.');
        }
    } catch (error) {
        console.error('Error al cargar profesores:', error);
    }
}

async function filtrarProfesores() {
    const filtroNombre = document.getElementById('search-nombre').value;
    const filtroDepartamento = document.getElementById('search-departamento').value;
    const filtroSede = document.getElementById('search-sede').value;
    const filtroSedeClases = document.getElementById('search-sede-clases').value;
    const filtroTalleresVRA = document.getElementById('search-talleres-vra').value;

    try {
        let url = '/api/profesores';
        const params = new URLSearchParams();

        if (filtroNombre) params.append('nombre', filtroNombre);
        if (filtroDepartamento) params.append('departamento', filtroDepartamento);
        if (filtroSede) params.append('sede', filtroSede);
        if (filtroSedeClases) params.append('sede_actual', filtroSedeClases);
        if (filtroTalleresVRA) params.append('talleres', filtroTalleresVRA);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
            headers: getAuthHeader()
        });

        if (response.ok) {
            const profesores = await response.json();
            const profesoresBody = document.getElementById('profesores-body');
            profesoresBody.innerHTML = ''; // Limpia la tabla antes de cargar nuevos resultados

            profesores.forEach((profesor) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${profesor.nombre}</td>
                    <td>${profesor.departamento}</td>
                    <td>${profesor.sede}</td>
                    <td>${profesor.sede_actual}</td>
                    <td>${profesor.talleres}</td>
                    <td>${profesor.formacion === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.estado_I === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.magister === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.otro_i || 'No value'}</td>
                    <td>
                        <button onclick="editarProfesor(${profesor.id_profesor})">Editar</button>
                        <button onclick="eliminarProfesor(${profesor.id_profesor})">Eliminar</button>
                    </td>
                `;
                profesoresBody.appendChild(row);
            });
        } else if (response.status === 401) {
            alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login.html';
        } else {
            alert('Error al cargar los profesores.');
        }
    } catch (error) {
        console.error('Error al cargar profesores:', error);
    }
}

async function editarProfesor(id_profesor) {
    try {
        const response = await fetch(`/api/profesores/${id_profesor}`, {
            headers: getAuthHeader()
        });

        if (response.ok) {
            const profesor = await response.json();

            document.getElementById('id_profesor').value = profesor.id_profesor;
            document.getElementById('nombre').value = profesor.nombre;
            document.getElementById('departamento').value = profesor.departamento;
            document.getElementById('sede').value = profesor.sede;
            document.getElementById('sede_actual').value = profesor.sede_actual;
            document.getElementById('talleres').value = profesor.talleres;
            document.getElementById('formacion').checked = profesor.formacion === 1;
            document.getElementById('estado_I').checked = profesor.estado_I === 1;
            document.getElementById('magister').checked = profesor.magister === 1;
            document.getElementById('otro_i').value = profesor.otro_i;

            document.getElementById('form-title').textContent = 'Editar Profesor';
            document.getElementById('modal-profesor').style.display = 'block';
        } else if (response.status === 401) {
            alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login.html';
        } else {
            alert('Error al cargar la información del profesor.');
        }
    } catch (error) {
        console.error('Error al cargar la información del profesor:', error);
    }
}

async function eliminarProfesor(id_profesor) {
    if (!confirm('¿Estás seguro de que deseas eliminar este profesor?')) return;

    try {
        const response = await fetch(`/api/profesores/${id_profesor}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });

        if (response.ok) {
            alert('Profesor eliminado exitosamente.');
            await cargarProfesores(); // Recarga la lista de profesores
        } else if (response.status === 401) {
            alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login.html';
        } else {
            alert('Error al eliminar el profesor.');
        }
    } catch (error) {
        console.error('Error al eliminar profesor:', error);
    }
}

// Asegúrate de que estas funciones estén disponibles globalmente
window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;