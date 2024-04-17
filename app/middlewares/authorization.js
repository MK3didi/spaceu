import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "./database.js";  

dotenv.config();


async function revisarCookie(req) {
  try {
    // Asegúrate de que la cookie existe antes de intentar dividirla
    const cookie = req.headers.cookie;
    if (!cookie) {
      return false;
    }
    const cookieJWT = cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).split('=')[1];
    const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
    
    // Buscar en la base de datos en lugar del array 'usuarios'
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decodificada.id]);
    if (users.length === 0) {
      return false;
    }

    // Comprueba si el token ha sido invalidado
    const [tokensInvalidados] = await pool.query('SELECT * FROM tokens_invalidados WHERE token = ?', [cookieJWT]);
    if (tokensInvalidados.length > 0) {
      return false; // Token encontrado en la lista de invalidados
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}


function soloAdmin(req, res, next){
  revisarCookie(req).then(logueado => {
    if(logueado) return next();
    return res.redirect("/");
  }).catch(error => {
    console.error(error);
    return res.status(500).send('Error al verificar la sesión');
  });
}

function soloPublico(req, res, next){
  revisarCookie(req).then(logueado => {
    if(!logueado) return next();
    return res.redirect("/admin");
  }).catch(error => {
    console.error(error);
    return res.status(500).send('Error al verificar la sesión');
  });
}

export const methods = {
  soloAdmin,
  soloPublico,
};
