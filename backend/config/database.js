import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
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