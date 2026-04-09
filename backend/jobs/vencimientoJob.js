import cron from 'node-cron';
import db from '../config/database.js';

async function verificarVencimientos() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyStr = hoy.toISOString().slice(0, 10); // "YYYY-MM-DD"

  try {
    // =====================================================
    // 1. Marcar tareas vencidas
    //    - Tienen fecha definida
    //    - La fecha ya pasó
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
    //    - No están completadas (completada != 1) ni ya vencidas (completada != 2)
    // =====================================================
    const [mentoriasResult] = await db.execute(
      `UPDATE mentorias
       SET completada = 2
       WHERE fecha_termino < ?
         AND completada NOT IN (1, 2)`,
      [hoyStr]
    );

    console.log(`[Cron ${new Date().toLocaleString('es-CL')}] Vencimientos procesados — Tareas: ${tareasResult.affectedRows}, Mentorías: ${mentoriasResult.affectedRows}`);
  } catch (error) {
    console.error('[Cron] Error al verificar vencimientos:', error);
  }
}

export function iniciarCronVencimientos() {
  // Ejecutar todos los días a las 00:00
  cron.schedule('0 0 * * *', verificarVencimientos, {
    timezone: 'America/Santiago'
  });

  // Ejecutar también al iniciar el servidor por si el servidor estuvo apagado
  verificarVencimientos();

  console.log('[Cron] Job de vencimientos iniciado — corre diariamente a las 00:00 (America/Santiago)');
}