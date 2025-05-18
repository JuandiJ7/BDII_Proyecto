import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mysql',
  user: 'usuario',
  password: 'contraseña',
  database: 'nombre_db',
});

export default pool;
