/* Refactor exacto basado en profesores(8).js */

export function validarProfesorPayload(data) {
  if (!data.nombre?.trim()) {
    throw new Error('El nombre del profesor es obligatorio.');
  }

  if (!data.departamento?.trim()) {
    throw new Error('El departamento es obligatorio.');
  }
}
