import mysql from 'mysql2/promise';
/*
const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'roro',
  password: '1234',
  database: 'pagina',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

*/
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pagina',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('Conexión a la base de datos exitosa');
    connection.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
}

testConnection();

export default db;

