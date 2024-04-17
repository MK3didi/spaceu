document.getElementById("nota-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const notaText = document.getElementById("nota-text").value;
  if (!notaText.trim()) return;

  // Envía la nota al servidor
  const guardarRes = await fetch("/api/guardarNota", {  
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: 'include',  // Asegúrate de incluir las credenciales
    body: JSON.stringify({ nota: notaText })
  });

  const guardarResJson = await guardarRes.json();
  console.log(guardarResJson); // Imprime la respuesta completa para depuración
  if (guardarRes.ok) {
    agregarNotaAlDOM(guardarResJson);
  } else {
    console.error('Error guardando la nota');
  }
  });

// Función para cargar notas del usuario al iniciar sesión
async function cargarNotas() {
  const cargarRes = await fetch("/api/cargarNotas", {  
    credentials: 'include'  // Asegúrate de incluir las credenciales
  });
  const cargarNotasJson = await cargarRes.json();
  if (cargarRes.ok) {
    cargarNotasJson.forEach(nota => {
      console.log("Nota recibida:", nota);
      agregarNotaAlDOM(nota);
          });
  } else {
    console.error('Error cargando las notas');
  }
}

function agregarNotaAlDOM(notaObjeto) {
  const notasContainer = document.getElementById("notas-container");
  const notaElement = document.createElement("div");
  notaElement.classList.add("nota");

  // Contenido de la nota
  const textoElement = document.createElement("div");
  textoElement.classList.add("texto");
  textoElement.textContent = notaObjeto.nota;
  
  // Fecha de la nota
  const fechaElement = document.createElement("div");
  fechaElement.classList.add("fecha");
  console.log("Valor original de la fecha:", notaObjeto.fecha); // Esto debería mostrarte la fecha
  const fecha = new Date(notaObjeto.fecha); // notaObjeto.fecha debe ser una fecha en formato ISO o un timestamp.
  console.log("Fecha convertida:", fecha.toLocaleString()); // Verifica si la fecha es válida
  // ..

  fechaElement.textContent = fecha.toLocaleString();

  // Botón de borrar
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Borrar";
  deleteButton.classList.add("delete-button");
  deleteButton.onclick = async () => {
    if (!confirm('¿Estás seguro de que quieres borrar esta nota?')) return;

    try {
      const res = await fetch(`/api/borrarNota/${notaObjeto.id}`, {
        method: 'DELETE',
        credentials: 'include'  // Para asegurarse de que se envíen las cookies
      });

      if (res.ok) {
        notaElement.remove();  // Remueve la nota del DOM si la eliminación fue exitosa
      } else {
        throw new Error('No se pudo borrar la nota');
      }
    } catch (error) {
      console.error(error);
      alert('Hubo un error al borrar la nota.');
    }
  };

  // Agregar los elementos al contenedor de la nota
  notaElement.appendChild(textoElement);
  notaElement.appendChild(fechaElement);
  notaElement.appendChild(deleteButton);
  notasContainer.appendChild(notaElement);
}

// Añadir al principio de tu archivo admin.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
      const response = await fetch('/api/usuario', { credentials: 'include' });
      if (response.ok) {
          const data = await response.json();
          document.getElementById('nombre-usuario').textContent = `Bienvenido(a) ${data.userName}`;
      } else {
          throw new Error('No se pudo obtener el nombre del usuario');
      }
  } catch (error) {
      console.error(error);
  }
});






cargarNotas();
document.getElementById("logout-button").addEventListener("click", () => {
  document.cookie ='jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.location.href = "/login"
});

  
