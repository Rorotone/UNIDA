document.addEventListener('DOMContentLoaded', () => {
    const profesorForm = document.getElementById('profesor-form');
    const formTitle = document.getElementById('form-title');
    const searchButton = document.getElementById('search-btn');

    profesorForm.addEventListener('submit', handleFormSubmit);
    searchButton.addEventListener('click', filtrarProfesores);

    // Cargar profesores al iniciar la página
    cargarProfesores();
});

// Función para obtener el encabezado de autorización
function getAuthHeader() {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id_profesor = document.getElementById('id_profesor').value;

    const profesorData = {
        nombre: document.getElementById('nombre').value,
        departamento: document.getElementById('departamento').value,
        Sede: document.getElementById('Sede').value,
        Sede_actual: document.getElementById('Sede_actual').value,
        Talleres: document.getElementById('Talleres').value,
        Formacion: document.getElementById('Formacion').checked ? 1 : 0,
        Estado_I: document.getElementById('Estado_I').checked ? 1 : 0,
        Magister: document.getElementById('Magister').checked ? 1 : 0,
        Otro_I: document.getElementById('Otro_I').value,
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
                    <td>${profesor.Sede}</td>
                    <td>${profesor.Sede_actual}</td>
                    <td>${profesor.Talleres}</td>
                    <td>${profesor.Formacion === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.Estado_I === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.Magister === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.Otro_i || 'No value'}</td>
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
                    <td>${profesor.Sede}</td>
                    <td>${profesor.Sede_actual}</td>
                    <td>${profesor.Talleres}</td>
                    <td>${profesor.Formacion === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.Estado_I === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.Magister === 1 ? 'Sí' : 'No'}</td>
                    <td>${profesor.Otro_I || 'No value'}</td>
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
            document.getElementById('Sede').value = profesor.Sede;
            document.getElementById('Sede_actual').value = profesor.Sede_actual;
            document.getElementById('Talleres').value = profesor.Talleres;
            document.getElementById('Formacion').checked = profesor.Formacion === 1;
            document.getElementById('Estado_I').checked = profesor.Estado_I === 1;
            document.getElementById('Magister').checked = profesor.Magister === 1;
            document.getElementById('Otro_I').value = profesor.Otro_I;

            document.getElementById('form-title').textContent = 'Editar Profesor';
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
