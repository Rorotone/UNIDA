import cron from 'node-cron';
import db from '../config/database.js';

async function verificarVencimientos() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyStr = hoy.toISOString().slice(0, 10); // "YYYY-MM-DD"

  try {
    // =====================================================
    // 1. Marcar tareas vencidas
    //    - Tienen fecha definida, la fecha ya pasó
    //    - No están completadas (estado != 2) ni ya vencidas (estado != 3)
    // =====================================================
    const [tareasResult] = await db.execute(
      `UPDATE tareas 
       SET estado = 3
       WHERE fecha IS NOT NULL
         AND fecha < ?
         AND estado NOT IN (2, 3)`,
      [hoyStr]
    );

    // =====================================================
    // 2. Marcar mentorías vencidas
    //    - fecha_termino ya pasó
    //    - No están completadas (1) ni ya vencidas (2)
    // =====================================================
    const [mentoriasVencidas] = await db.execute(
      `UPDATE mentorias
       SET completada = 2
       WHERE fecha_termino < ?
         AND completada NOT IN (1, 2)`,
      [hoyStr]
    );

    // =====================================================
    // 3. Marcar mentorías próximas
    //    - fecha_inicio es futura (todavía no ha comenzado)
    //    - No están completadas (1), vencidas (2), ni ya próximas (3)
    // =====================================================
    const [mentoriasProximas] = await db.execute(
      `UPDATE mentorias
       SET completada = 3
       WHERE fecha_inicio > ?
         AND completada NOT IN (1, 2, 3)`,
      [hoyStr]
    );

    // =====================================================
    // 4. Reactivar mentorías próximas cuya fecha_inicio ya llegó
    //    - Estaban como próximas (3) pero hoy ya empezaron
    // =====================================================
    const [mentoriasActivadas] = await db.execute(
      `UPDATE mentorias
       SET completada = 0
       WHERE fecha_inicio <= ?
         AND fecha_termino >= ?
         AND completada = 3`,
      [hoyStr, hoyStr]
    );

    console.log(`[Cron ${new Date().toLocaleString('es-CL')}] Procesado — Tareas vencidas: ${tareasResult.affectedRows}, Mentorías vencidas: ${mentoriasVencidas.affectedRows}, Próximas: ${mentoriasProximas.affectedRows}, Activadas: ${mentoriasActivadas.affectedRows}`);
  } catch (error) {
    console.error('[Cron] Error al verificar vencimientos:', error);
  }
}

export function iniciarCronVencimientos() {
  cron.schedule('0 0 * * *', verificarVencimientos, {
    timezone: 'America/Santiago'
  });

  // Ejecutar también al iniciar el servidor por si estuvo apagado
  verificarVencimientos();

  console.log('[Cron] Job de vencimientos iniciado — corre diariamente a las 00:00 (America/Santiago)');
}