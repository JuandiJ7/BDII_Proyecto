import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mysql.reto-ucu.net',
  port: 50006,
  user: 'xr_g3_admin',
  password: 'Bd2025!',
  database: 'XR_Grupo3',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;