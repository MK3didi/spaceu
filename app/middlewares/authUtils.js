// app/middlewares/authUtils.js

import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();


export function obtenerUsuarioDeJWT(req) {
    try {
      const cookieJWT = req.cookies.jwt;
      if (!cookieJWT) return null;
      const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
      return decodificada && decodificada.id; // Asegúrate de que aquí también usas el ID numérico
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  
  