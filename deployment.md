### Fase 1: Cambios en el código (en tu entorno local)

 1. Crear y pararte en la rama de práctica
    ```bash
      git checkout -b deploy-practica
    ```

  2. Agregar el script start en backend/package.json
    Actualmente solo tenés dev. Agregá la línea de producción:
    ```json
      "scripts": {
        "dev": "node --watch --env-file=.env src/server.js",
        "start": "node src/server.js"
      }✅
    ```

 3. Configurar express.static y el catch-all en backend/src/app.js
     - Importá path arriba: const path = require('path');
     - Agregá el middleware para los estáticos apuntando a frontend/dist:
       ```js
         app.use(express.static(path.join(__dirname, "../../frontend/dist")));✅
       ```
     - Al final de todo (justo después de todas las rutas de /api/* y middlewares de error), agregá el catch-all para la SPA:
       ```js
         app.get(/^(?!\/api).*/, (req, res) => {
           res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
         });✅
       ```

 4. Verificar VITE_API_URL en el Frontend
    Como ahora es same-origin, en produccion VITE_API_URL debe ser una string vacía "" (o no pasarse), para que los fetch('/api/...') le peguen directamente al dominio actual.

 5. Guardar y commitear los cambios
    ```bash
      git add .
      git commit -m "feat: setup single-service express.static and SPA catch-all for deployment"
    ```
✅
 ────────────────────────────────────────────────────────────────────────────────

 ### Fase 2: Prueba de Build Local

 6. Simular el build de producción en tu máquina
     - Compilar el frontend:
       ```bash
         pnpm --filter frontend build
       ```
       (Verificá que se cree la carpeta frontend/dist).
     - Levantar el backend con NODE_ENV=production:
       ```bash
         NODE_ENV=production pnpm --filter backend start
       ```
     - Entrar a http://localhost:3000 en el navegador:
         - Comprobá que carga la app.
         - Entrá a una ruta como /agenda y apretá F5 (recargar). Si vuelve a cargar bien y no tira 404 de Express, el catch-all funciona perfecto.

 ────────────────────────────────────────────────────────────────────────────────

 ### Fase 3: Configuración en Railway

 7. Crear el proyecto y la DB en Railway
     - Creá un nuevo proyecto en Railway dashboard.
     - Agregá un servicio de MySQL.

 8. Crear el servicio de la App (desde GitHub)
     - Conectá tu repositorio de GitHub y seleccioná la rama deploy-practica.
     - En la configuración del servicio:
         - Root Directory: / (la raíz del proyecto).
         - Build Command: pnpm install && pnpm --filter frontend build
         - Start Command: pnpm --filter backend start

 9. Cargar las Variables de Entorno en el servicio de Railway
     - NODE_ENV = production
     - DB_HOST = ${{MySQL.MYSQLHOST}} (Variable de referencia de Railway)
     - DB_PORT = ${{MySQL.MYSQLPORT}}
     - DB_USER = ${{MySQL.MYSQLUSER}}
     - DB_PASSWORD = ${{MySQL.MYSQLPASSWORD}}
     - DB_NAME = ${{MySQL.MYSQLDATABASE}}
     - JWT_SECRET = (Un string largo y aleatorio)

 ────────────────────────────────────────────────────────────────────────────────

 ### Fase 4: Inicialización de DB y Check Final

 10. Cargar tablas y datos semilla
     - Obtené la URL pública/credenciales de conexión a MySQL de Railway.
     - Ejecutá tu schema.sql y seed.sql desde tu cliente de base de datos habitual (DBeaver, MySQL Workbench, o desde la consola local).

 11. Prueba final en producción
     - Entrá al dominio generado por Railway (https://xxxx.up.railway.app).
     - Probá hacer login/registro (verificá en DevTools que la cookie access_token se guarde bien).
     - Navegá entre pantallas y recargá con F5.