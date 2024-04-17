import express from "express";
import cookieParser from 'cookie-parser';
//Fix para __direname
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { methods as authentication } from "./controllers/authentication.controller.js"
import { methods as authorization } from "./middlewares/authorization.js";
import { obtenerUsuarioDeJWT } from './middlewares/authUtils.js';
import pool from './middlewares/database.js';
import cors from 'cors';





//Server
const app = express();

app.set("port", 4000);

app.listen(app.get("port"));
console.log("Servidor corriendo en puerto", app.get("port"));

//Configuración
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser())



//Rutas
app.get('/', (req, res) => {  res.sendFile(path.join(__dirname, '/public/index.html'));});
app.get("/login", authorization.soloPublico, (req, res) => res.sendFile(__dirname + "/pages/login.html"));
app.get("/register", authorization.soloPublico, (req, res) => res.sendFile(__dirname + "/pages/register.html"));
app.get("/admin", authorization.soloAdmin, (req, res) => res.sendFile(__dirname + "/pages/admin/admin.html"));
app.post("/api/login", authentication.login);
app.post("/api/register", authentication.register);
app.post("/api/logout", authentication.logout);



app.use(cors({
  origin: 'http://localhost:4000', // o la URL de tu cliente si es diferente
  credentials: true
}));
// En tu servidor (puede ser en index.js o un archivo de rutas dedicado)



// Endpoint para cargar notas
app.get("/api/cargarNotas", async (req, res) => {
  const user_id = obtenerUsuarioDeJWT(req);
  if (!user_id) return res.status(401).json({ status: "error", message: "No autorizado" });

  // Cargar las notas de la base de datos
  try {
    const [notas] = await pool.query('SELECT * FROM notas WHERE user_id = ?', [user_id]);
    res.json(notas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error al cargar las notas" });
  }
});

app.post("/api/guardarNota", async (req, res) => {
  const { nota } = req.body;

  const user_id = obtenerUsuarioDeJWT(req); 

  if (!user_id) {
    return res.status(401).json({ status: "error", message: "No autorizado" });
  }
  try {
    const [result] = await pool.query('INSERT INTO notas (user_id, nota) VALUES (?, ?)', [user_id, nota]);
  const [notaInsertada] = await pool.query('SELECT * FROM notas WHERE id = ?', [result.insertId]);
  res.json({ 
    status: "ok", 
    nota: notaInsertada[0].nota,
    fecha: notaInsertada[0].fecha.toISOString(), // Convierte la fecha a formato ISO.
    id: notaInsertada[0].id 
  });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error al guardar la nota" });
  }
});



// Endpoint para borrar una nota
app.delete("/api/borrarNota/:id", async (req, res) => {
  const { id } = req.params; // ID de la nota a borrar
  const user_id = obtenerUsuarioDeJWT(req); // Asegúrate de obtener el ID del usuario actual

  if (!user_id) {
    return res.status(401).json({ status: "error", message: "No autorizado" });
  }

  try {
    // Asegúrate de que la nota pertenezca al usuario antes de borrar
    const [result] = await pool.query('DELETE FROM notas WHERE id = ? AND user_id = ?', [id, user_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Nota no encontrada o no pertenece al usuario" });
    }
    res.json({ status: "ok", message: "Nota borrada", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error al borrar la nota" });
  }
});

app.post('/api/notas', async (req, res) => {
  // Suponiendo que 'notaText' es el texto de la nota enviado en la solicitud
  const { notaText } = req.body;

  try {
    // Suponiendo que 'user_id' es el ID del usuario que está guardando la nota
    const user_id = obtenerUsuarioDeJWT(req);
    const fecha = new Date(); // Esto obtiene la fecha y hora actuales
    const result = await pool.query('INSERT INTO notas (user_id, nota, fecha) VALUES (?, ?, ?)', [user_id, notaText, fecha]);

    // Envía la nota recién creada y la fecha de creación de vuelta al cliente
    res.status(201).json({ nota: notaText, fecha: fecha.toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la nota' });
  }
});

app.get("/admin",authorization.soloAdmin, async (req, res) => {
  const user_id = obtenerUsuarioDeJWT(req);
  if (!user_id) {
      // Redirigir al login si no está autenticado
      return res.redirect('/login');
  }

  try {
      // Obtener los detalles del usuario usando el user_id
      const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
      const usuario = userRows[0];

      res.render('admin', { userName: usuario.user });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error al obtener la información del usuario');
  }
});

app.get('/api/usuario', authorization.soloAdmin, async (req, res) => {
  const user_id = obtenerUsuarioDeJWT(req);
  if (!user_id) {
      return res.status(401).json({ status: "error", message: "No autorizado" });
  }

  try {
      const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
      const usuario = userRows[0];

      res.json({ status: "ok", userName: usuario.user });
  } catch (error) {
      console.error(error);
      res.status(500).json({ status: "error", message: "Error al cargar los datos del usuario" });
  }
});


