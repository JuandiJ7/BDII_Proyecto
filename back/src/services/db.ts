import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mysql.reto-ucu.net',
  port: 50006,
  user: 'XR_g1_admin',
  password: 'Bd2025!',
  database: 'XR_Grupo1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;