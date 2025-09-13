document.addEventListener('DOMContentLoaded', async () => {

    // Calendario semanal

    let fechaSeleccionada = new Date();
    let semanaOffset = 0; // 0 = semana actual, -1 = semana anterior, 1 = siguiente semana, etc.
    renderCalendarioSemanal(fechaSeleccionada, semanaOffset);

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

    // Función para renderizar el calendario semanal
    function renderCalendarioSemanal(fecha, offset = semanaOffset) {
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const calendario = document.getElementById('calendario-semanal');
        calendario.innerHTML = '';

        // Controles de navegación
        const btnPrev = document.createElement('button');
        btnPrev.textContent = '<';
        btnPrev.className = 'btn-semana-nav';
        btnPrev.onclick = () => {
            semanaOffset--;
            const nuevaFecha = new Date(fechaSeleccionada);
            nuevaFecha.setDate(nuevaFecha.getDate() - 7);
            fechaSeleccionada = nuevaFecha;
            renderCalendarioSemanal(fechaSeleccionada, semanaOffset);
            filtrarTareasPorFecha(null); // Mostrar todas hasta seleccionar un día
        };
        calendario.appendChild(btnPrev);

        // Obtener el primer día de la semana (lunes)
        const diaActual = new Date(fecha);
    const primerDia = new Date(diaActual);
    primerDia.setDate(diaActual.getDate() - ((diaActual.getDay() + 6) % 7) + (offset * 7));

        for (let i = 0; i < 7; i++) {
            const dia = new Date(primerDia);
            dia.setDate(primerDia.getDate() + i);
            const btn = document.createElement('button');
            btn.className = 'btn-dia-semana';
            btn.textContent = `${diasSemana[dia.getDay()]} ${dia.getDate()}`;
            btn.style.margin = '0 4px';
            btn.dataset.fecha = dia.toISOString().slice(0, 10);
            if (dia.toDateString() === fechaSeleccionada.toDateString()) {
                btn.classList.add('seleccionado');
            }
            btn.onclick = () => {
                fechaSeleccionada = dia;
                renderCalendarioSemanal(fechaSeleccionada, semanaOffset);
                filtrarTareasPorFecha(dia.toISOString().slice(0, 10));
            };
            calendario.appendChild(btn);
        }

        const btnNext = document.createElement('button');
        btnNext.textContent = '>';
        btnNext.className = 'btn-semana-nav';
        btnNext.onclick = () => {
            semanaOffset++;
            const nuevaFecha = new Date(fechaSeleccionada);
            nuevaFecha.setDate(nuevaFecha.getDate() + 7);
            fechaSeleccionada = nuevaFecha;
            renderCalendarioSemanal(fechaSeleccionada, semanaOffset);
            filtrarTareasPorFecha(null); // Mostrar todas hasta seleccionar un día
        };
        calendario.appendChild(btnNext);
    }

    // Función para filtrar tareas por fecha seleccionada
    window.filtrarTareasPorFecha = function(fechaISO) {
        // Oculta todas las tareas y muestra solo las que coinciden con la fecha
        document.querySelectorAll('.tarea-item').forEach(item => {
            const tareaFecha = item.getAttribute('data-tarea-fecha');
            if (!tareaFecha || tareaFecha === fechaISO) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    };
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
            // Estado de completado local (localStorage)
            const completada = localStorage.getItem(`mentoria_${mentoria.id}_completada`) === 'true';
            const btnCompletar = mentoriaElement.querySelector('.btn-completar');
            btnCompletar.textContent = completada ? 'Completada' : 'Marcar como completada';
            if (completada) {
                btnCompletar.classList.add('completada');
            } else {
                btnCompletar.classList.remove('completada');
            }
            btnCompletar.addEventListener('click', () => {
                const nuevoEstado = !(localStorage.getItem(`mentoria_${mentoria.id}_completada`) === 'true');
                localStorage.setItem(`mentoria_${mentoria.id}_completada`, nuevoEstado);
                cargarMentorias(); // Recargar para reflejar el cambio
            });
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

        // Botones de marcar/desmarcar todas
        const btnMarcarTodas = tareasContainer.querySelector('.btn-marcar-todas');
        const btnDesmarcarTodas = tareasContainer.querySelector('.btn-desmarcar-todas');
        if (btnMarcarTodas && btnDesmarcarTodas) {
            btnMarcarTodas.onclick = async function() {
                for (const tarea of tareas) {
                    if (!tarea.completada) {
                        await toggleTareaCompletada(tarea.id, true);
                    }
                }
                await mostrarTareas(id);
            };
            btnDesmarcarTodas.onclick = async function() {
                for (const tarea of tareas) {
                    if (tarea.completada) {
                        await toggleTareaCompletada(tarea.id, false);
                    }
                }
                await mostrarTareas(id);
            };
        }

        listaTareas.innerHTML = '';

        if (tareas.length === 0) {
            listaTareas.innerHTML = '<li>No hay tareas para esta mentoría</li>';
        } else {
            tareas.forEach(tarea => {
                const li = document.createElement('li');
                const tareaItem = document.createElement('div');
                tareaItem.className = `tarea-item ${tarea.completada ? 'completada' : ''}`;
                tareaItem.setAttribute('data-tarea-id', tarea.id);
                tareaItem.setAttribute('data-mentoria-id', id);
                if (tarea.fecha) {
                    tareaItem.setAttribute('data-tarea-fecha', tarea.fecha.slice(0, 10));
                }

                const h4 = document.createElement('h4');
                h4.textContent = tarea.titulo;
                const p = document.createElement('p');
                p.textContent = tarea.descripcion;

                const actions = document.createElement('div');
                actions.className = 'tarea-actions';

                // Botón de completar/desmarcar con íconos
                const btnCompletar = document.createElement('button');
                btnCompletar.className = 'btn-completar-tarea';
                if (!tarea.completada) {
                    btnCompletar.innerHTML = '<span title="Confirmar">✅</span>';
                    btnCompletar.onclick = function() {
                        toggleTareaCompletada(tarea.id, true);
                    };
                } else {
                    btnCompletar.innerHTML = '<span title="Desmarcar">↩️</span>';
                    btnCompletar.onclick = function() {
                        toggleTareaCompletada(tarea.id, false);
                    };
                }
                actions.appendChild(btnCompletar);

                // Botón eliminar
                const btnEliminar = document.createElement('button');
                btnEliminar.className = 'btn-eliminar-tarea';
                btnEliminar.textContent = 'Eliminar';
                btnEliminar.onclick = function() { eliminarTarea(tarea.id); };
                actions.appendChild(btnEliminar);

                // Input y botón para subir archivo
                const formArchivo = document.createElement('form');
                formArchivo.className = 'form-subir-archivo';
                formArchivo.enctype = 'multipart/form-data';
                formArchivo.style.display = 'inline-block';
                const inputArchivo = document.createElement('input');
                inputArchivo.type = 'file';
                inputArchivo.name = 'archivo';
                inputArchivo.style.marginRight = '5px';
                const btnSubir = document.createElement('button');
                btnSubir.type = 'submit';
                btnSubir.textContent = 'Subir archivo';
                formArchivo.appendChild(inputArchivo);
                formArchivo.appendChild(btnSubir);
                formArchivo.onsubmit = async function(e) {
                    e.preventDefault();
                    if (!inputArchivo.files[0]) {
                        alert('Selecciona un archivo');
                        return;
                    }
                    const formData = new FormData();
                    formData.append('archivo', inputArchivo.files[0]);
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`http://localhost:3000/api/mentorias/${id}/tareas/${tarea.id}/archivo`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: formData
                        });
                        const contentType = res.headers.get('content-type');
                        if (!res.ok) {
                            if (contentType && contentType.includes('application/json')) {
                                const err = await res.json();
                                throw new Error(err.message || 'Error al subir archivo');
                            } else {
                                const text = await res.text();
                                throw new Error(text);
                            }
                        }
                        alert('Archivo subido correctamente');
                        mostrarTareas(id);
                    } catch (err) {
                        alert('Error al subir archivo: ' + err.message);
                    }
                };
                actions.appendChild(formArchivo);

                // Mostrar enlace al archivo si existe
                if (tarea.archivo) {
                    const linkArchivo = document.createElement('a');
                    linkArchivo.href = tarea.archivo;
                    linkArchivo.target = '_blank';
                    linkArchivo.textContent = 'Ver archivo';
                    linkArchivo.style.marginLeft = '10px';
                    actions.appendChild(linkArchivo);
                }

                tareaItem.appendChild(h4);
                // Mostrar fecha si existe
                if (tarea.fecha) {
                    const pFecha = document.createElement('p');
                    pFecha.className = 'tarea-fecha';
                    pFecha.textContent = `Fecha: ${tarea.fecha}`;
                    tareaItem.appendChild(pFecha);
                }
                tareaItem.appendChild(p);
                tareaItem.appendChild(actions);
                li.appendChild(tareaItem);
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
    const fecha = e.target.querySelector('input[name="fecha"]').value;

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
                fecha,
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
