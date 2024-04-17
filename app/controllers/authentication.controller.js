import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import pool from '../middlewares/database.js'; // Asegúrate de que esta es la ruta correcta a tu archivo database.js


dotenv.config();

// Función login actualizada para usar MySQL.
async function login(req, res) {
  const { user, password } = req.body;
  if (!user || !password) {
    return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
  }

  try {
    // Verificar si el usuario existe en la base de datos.
    const [rows] = await pool.query('SELECT * FROM users WHERE user = ?', [user]);
    const usuarioAResvisar = rows[0];
    if (!usuarioAResvisar) {
      return res.status(400).send({ status: "Error", message: "Error durante login" });
    }

    // Comprobar la contraseña.
    const loginCorrecto = await bcryptjs.compare(password, usuarioAResvisar.password);
    if (!loginCorrecto) {
      return res.status(400).send({ status: "Error", message: "Error durante login" });
    }

    // Crear el token JWT.
   // Cuando crees el token, asegúrate de usar el ID numérico del usuario
const token = jsonwebtoken.sign(
  { id: usuarioAResvisar.id }, // Asegúrate de que esto sea el ID numérico, no el nombre de usuario
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRATION }
);


    const cookieOption = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
      path: "/"
    };

    // Establecer la cookie y redireccionar.
    res.cookie("jwt", token, cookieOption);
    res.send({ status: "ok", message: "Usuario loggeado", redirect: "/admin" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error", message: "Error interno del servidor" });
  }
}

// Función register actualizada para usar MySQL.
async function register(req, res) {
  const { user, password, email } = req.body;
  if (!user || !password || !email) {
    return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
  }

  try {
    // Verificar si el usuario ya existe.
    const [rows] = await pool.query('SELECT * FROM users WHERE user = ?', [user]);
    if (rows.length > 0) {
      return res.status(400).send({ status: "Error", message: "Este usuario ya existe" });
    }

    // Cifrar la contraseña.
    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(password, salt);

    // Insertar el nuevo usuario en la base de datos.
    await pool.query('INSERT INTO users (user, email, password) VALUES (?, ?, ?)', [user, email, hashPassword]);
    res.status(201).send({ status: "ok", message: `Usuario ${user} agregado`, redirect: "/" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "Error", message: "Error interno del servidor" });
  }
}

async function logout(req, res) {
  const token = req.cookies.jwt;
  if (token) {
    try {
      // Aquí asumimos que has importado 'pool' desde tu archivo de conexión de la base de datos
      await pool.query('INSERT INTO tokens_invalidados (token) VALUES (?)', [token]);
      res.clearCookie('jwt');
      res.json({ status: "ok", message: "Sesión cerrada" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error al cerrar sesión" });
    }
  } else {
    res.status(400).json({ status: "error", message: "No hay sesión para cerrar" });
  }
}



export const methods = {
  login,
  register,
  logout // Asegúrate de exportar la función logout
};

