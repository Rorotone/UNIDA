document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            cargarMentores(),
            cargarProfesores()
        ]);
        cargarMentorias();
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
    }

    document.getElementById('crear-mentoria-form').addEventListener('submit', crearMentoria);
});

async function cargarMentores() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        console.log('Cargando mentores...');
        const response = await fetch('http://localhost:3000/api/auth/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener mentores: ${response.status} ${response.statusText}`);
        }

        const mentores = await response.json();
        console.log('Mentores cargados:', mentores);

        const select = document.getElementById('mentor-select');
        select.innerHTML = '<option value="">Seleccione un mentor</option>';
        
        mentores.forEach(mentor => {
            const option = document.createElement('option');
            option.value = mentor.id;
            option.textContent = mentor.username;
            select.appendChild(option);
        });
        console.log('Opciones de mentores agregadas al select');
    } catch (error) {
        console.error('Error al cargar mentores:', error);
        alert('Error al cargar la lista de mentores: ' + error.message);
    }
}

async function cargarProfesores() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        console.log('Cargando profesores...');
        const response = await fetch('http://localhost:3000/api/profesores', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener profesores: ${response.status} ${response.statusText}`);
        }

        const profesores = await response.json();
        console.log('Profesores cargados:', profesores);

        const select = document.getElementById('profesor-select');
        select.innerHTML = '<option value="">Seleccione un profesor</option>';
        
        profesores.forEach(profesor => {
            const option = document.createElement('option');
            option.value = profesor.id_profesor;
            option.textContent = profesor.nombre;
            select.appendChild(option);
        });
        console.log('Opciones de profesores agregadas al select');
    } catch (error) {
        console.error('Error al cargar profesores:', error);
        alert('Error al cargar la lista de profesores: ' + error.message);
    }
}

async function crearMentoria(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('titulo-mentoria').value;
    const id_mentor = document.getElementById('mentor-select').value;
    const id_profesor = document.getElementById('profesor-select').value;

    if (!titulo || !id_mentor || !id_profesor) {
        alert('Por favor, complete todos los campos');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch('http://localhost:3000/api/mentorias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ titulo, id_mentor, id_profesor })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear mentoría');
        }

        const result = await response.json();
        alert('Mentoría creada exitosamente');
        document.getElementById('crear-mentoria-form').reset();
        cargarMentorias();
    } catch (error) {
        console.error('Error al crear mentoría:', error);
        alert(error.message || 'Error al crear la mentoría');
    }
}

async function cargarMentorias() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch('http://localhost:3000/api/mentorias', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener mentorías');
        }

        const mentorias = await response.json();
        const listaMentorias = document.getElementById('lista-mentorias');
        listaMentorias.innerHTML = '';

        if (mentorias.length === 0) {
            listaMentorias.innerHTML = '<p>No hay mentorías registradas</p>';
            return;
        }

        const template = document.getElementById('mentoria-template');

        mentorias.forEach(mentoria => {
            const mentoriaElement = template.content.cloneNode(true);
            
            mentoriaElement.querySelector('.mentoria-card').dataset.mentoriaId = mentoria.id;
            mentoriaElement.querySelector('h3').textContent = mentoria.titulo;
            mentoriaElement.querySelector('.mentor').textContent = `Mentor: ${mentoria.mentor}`;
            mentoriaElement.querySelector('.profesor').textContent = `Profesor: ${mentoria.profesor}`;

            mentoriaElement.querySelector('.btn-ver-tareas').addEventListener('click', () => mostrarTareas(mentoria.id));
            mentoriaElement.querySelector('.btn-completar').addEventListener('click', () => completarMentoria(mentoria.id));
            mentoriaElement.querySelector('.btn-eliminar').addEventListener('click', () => eliminarMentoria(mentoria.id));
            
            mentoriaElement.querySelector('.btn-mostrar-form-tarea').addEventListener('click', (e) => {
                const formTarea = e.target.nextElementSibling;
                formTarea.style.display = formTarea.style.display === 'none' ? 'block' : 'none';
            });

            mentoriaElement.querySelector('.form-nueva-tarea').addEventListener('submit', (e) => agregarTarea(e, mentoria.id));

            listaMentorias.appendChild(mentoriaElement);
        });
    } catch (error) {
        console.error('Error al cargar mentorías:', error);
        alert('Error al cargar la lista de mentorías');
    }
}

async function mostrarTareas(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch(`http://localhost:3000/api/mentorias/${id}/tareas`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener tareas');
        }

        const tareas = await response.json();
        const mentoriaCard = document.querySelector(`.mentoria-card[data-mentoria-id="${id}"]`);
        const listaTareas = mentoriaCard.querySelector('.lista-tareas');
        const tareasContainer = mentoriaCard.querySelector('.tareas-container');

        listaTareas.innerHTML = '';

        if (tareas.length === 0) {
            listaTareas.innerHTML = '<li>No hay tareas para esta mentoría</li>';
        } else {
            tareas.forEach(tarea => {
                const li = document.createElement('li');
                
                li.innerHTML = `
                    <div class="tarea-item ${tarea.completada ? 'completada' : ''}"
                        data-tarea-id="${tarea.id}"
                        data-mentoria-id="${id}">
                        <h4>${tarea.titulo}</h4>
                        <p>${tarea.descripcion}</p>
                        <div class="tarea-actions">
                            <button onclick="toggleTareaCompletada(${tarea.id}, ${!tarea.completada})" class="btn-completar-tarea">
                                ${tarea.completada ? 'Desmarcar' : 'Completar'}
                            </button>
                            <button onclick="eliminarTarea(${tarea.id})" class="btn-eliminar-tarea">Eliminar</button>
                        </div>
                    </div>
                `;
                listaTareas.appendChild(li);
            });
        }

        tareasContainer.style.display = 'block';
    } catch (error) {
        console.error('Error al mostrar tareas:', error);
        alert('Error al cargar las tareas de la mentoría');
    }
}

async function completarMentoria(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch(`http://localhost:3000/api/mentorias/${id}/completar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al completar la mentoría');
        }

        alert('Mentoría completada exitosamente');
        cargarMentorias();
    } catch (error) {
        console.error('Error al completar mentoría:', error);
        alert('Error al completar la mentoría');
    }
}


async function eliminarMentoria(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta mentoría?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch(`http://localhost:3000/api/mentorias/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la mentoría');
        }

        alert('Mentoría eliminada exitosamente');
        cargarMentorias();
    } catch (error) {
        console.error('Error al eliminar mentoría:', error);
        alert('Error al eliminar la mentoría');
    }
}

async function agregarTarea(e, id_mentoria) {
    e.preventDefault();
    const titulo = e.target.querySelector('input[name="titulo"]').value;
    const descripcion = e.target.querySelector('textarea[name="descripcion"]').value;

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch(`http://localhost:3000/api/mentorias/${id_mentoria}/tareas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id_mentoria,
                titulo,
                descripcion,
                completada: 0 // Por defecto la tarea no está completada
            })
        });

        if (!response.ok) {
            throw new Error('Error al agregar la tarea');
        }

        alert('Tarea agregada exitosamente');
        e.target.reset();
        mostrarTareas(id_mentoria);
    } catch (error) {
        console.error('Error al agregar tarea:', error);
        alert('Error al agregar la tarea');
    }
}

async function toggleTareaCompletada(id_tarea, completada) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        const response = await fetch(`http://localhost:3000/api/tareas/${id_tarea}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completada: completada ? 1 : 0 })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el estado de la tarea');
        }

        // Recargar las tareas para mostrar el cambio
        const mentoriaCard = document.querySelector(`.tarea-item[data-tarea-id="${id_tarea}"]`).closest('.mentoria-card');
        const id_mentoria = mentoriaCard.dataset.mentoriaId;
        mostrarTareas(id_mentoria);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        alert('Error al actualizar el estado de la tarea');
    }
}

// ... (previous code remains the same until eliminarTarea function)
async function eliminarTarea(id_tarea) {
    if (!confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        // Find the tarea-item element and get both tarea and mentoria IDs
        const tareaItem = document.querySelector(`.tarea-item[data-tarea-id="${id_tarea}"]`);
        if (!tareaItem) throw new Error('No se pudo encontrar el elemento de la tarea');

        const id_mentoria = tareaItem.getAttribute('data-mentoria-id');
        if (!id_mentoria) throw new Error('No se pudo encontrar el ID de la mentoría');

        const response = await fetch(`http://localhost:3000/api/mentorias/${id_mentoria}/tareas/${id_tarea}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la tarea');
        }

        // Remove the task item from the DOM
        const listItem = tareaItem.closest('li');
        if (listItem) {
            listItem.remove();
        } else {
            tareaItem.remove();
        }

        // If there are no more tasks, update the list
        const listaTareas = document.querySelector(`.mentoria-card[data-mentoria-id="${id_mentoria}"] .lista-tareas`);
        if (listaTareas && listaTareas.children.length === 0) {
            listaTareas.innerHTML = '<li>No hay tareas para esta mentoría</li>';
        }

    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea: ' + error.message);
    }
}

// Update the toggleTareaCompletada function to use the correct route as well
async function toggleTareaCompletada(id_tarea, completada) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token');

        // Get the mentoria ID from the DOM structure
        const mentoriaCard = document.querySelector(`.tarea-item[data-tarea-id="${id_tarea}"]`).closest('.mentoria-card');
        const id_mentoria = mentoriaCard.dataset.mentoriaId;

        // Use the nested route structure
        const response = await fetch(`http://localhost:3000/api/mentorias/${id_mentoria}/tareas/${id_tarea}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completada: completada ? 1 : 0 })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el estado de la tarea');
        }

        // Reload tasks to show the change
        await mostrarTareas(id_mentoria);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        alert('Error al actualizar el estado de la tarea');
    }
}

// Asegúrate de que estas funciones estén disponibles globalmente
window.mostrarTareas = mostrarTareas;
window.completarMentoria = completarMentoria;
window.eliminarMentoria = eliminarMentoria;
window.toggleTareaCompletada = toggleTareaCompletada;
window.eliminarTarea = eliminarTarea;
