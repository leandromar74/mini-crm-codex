# Mini CRM

Aplicación web sencilla para registrar, consultar y gestionar leads desde una única interfaz. El proyecto reúne un frontend en HTML, CSS y JavaScript con una API REST desarrollada en Express y una base de datos SQLite local.

## Funcionalidades

- Crear leads con nombre, correo electrónico, fuente y estado.
- Consultar todos los contactos registrados.
- Editar y eliminar leads existentes.
- Buscar leads por nombre o correo electrónico.
- Filtrar contactos por estado.
- Consultar métricas de leads totales, nuevos, contactados y perdidos.
- Exportar todos los registros a un archivo CSV compatible con Excel.
- Conservar los datos entre reinicios mediante SQLite.

## Tecnologías utilizadas

### Backend

- [Node.js](https://nodejs.org/) como entorno de ejecución.
- [Express 5](https://expressjs.com/) para el servidor web y la API REST.
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) para acceder a SQLite.

### Frontend

- HTML5.
- CSS3.
- JavaScript moderno sin frameworks.
- Fetch API para la comunicación con el backend.

### Base de datos

- SQLite con modo WAL para mejorar la convivencia entre lecturas y escrituras.
- Creación automática de la tabla `leads` al iniciar la aplicación.

## Requisitos previos

Antes de instalar el proyecto, asegúrate de tener:

- Node.js 22 o una versión posterior.
- npm, incluido con Node.js.
- Git, únicamente si vas a clonar el repositorio.

Puedes comprobar las versiones instaladas con:

```bash
node --version
npm --version
```

## Instalación

1. Clona el repositorio y entra en su directorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd mini-crm-codex
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

La base de datos no requiere una instalación adicional. La aplicación utiliza el archivo `mini-crm.sqlite` ubicado en la raíz del proyecto y crea la tabla necesaria automáticamente si todavía no existe.

## Ejecución local

### Modo normal

Inicia el servidor con:

```bash
npm start
```

Después abre en el navegador:

```text
http://localhost:3000
```

### Modo desarrollo

Para reiniciar automáticamente el servidor cuando cambie un archivo del backend:

```bash
npm run dev
```

### Usar otro puerto

El puerto predeterminado es `3000`. Puedes cambiarlo mediante la variable de entorno `PORT`.

En macOS o Linux:

```bash
PORT=4000 npm start
```

En PowerShell:

```powershell
$env:PORT=4000
npm start
```

## Uso de la aplicación

1. Completa el formulario con los datos del contacto.
2. Selecciona la fuente y el estado del lead.
3. Pulsa **Añadir lead**.
4. Utiliza la búsqueda o el selector de estado para filtrar la tabla.
5. Usa las acciones de cada fila para editar o eliminar un contacto.
6. Pulsa **Descargar CSV** para exportar todos los leads.

Los estados disponibles son:

- `new`: nuevo.
- `contacted`: contactado.
- `lost`: perdido.

## API REST

La interfaz consume los siguientes endpoints:

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/leads` | Devuelve todos los leads. |
| `GET` | `/leads/export.csv` | Descarga todos los leads en formato CSV. |
| `POST` | `/leads` | Crea un lead. |
| `PUT` | `/leads/:id` | Actualiza un lead existente. |
| `DELETE` | `/leads/:id` | Elimina un lead. |
| `GET` | `/admin` | Comprueba que la API de administración responde. |

### Ejemplo de creación

```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marina Costa",
    "email": "marina@empresa.com",
    "source": "web",
    "status": "new"
  }'
```

Los campos `name` y `email` son obligatorios. `source` utiliza una cadena vacía como valor predeterminado y `status` utiliza `new`.

### Modelo de datos

Cada lead tiene la siguiente estructura:

```json
{
  "id": 1,
  "name": "Marina Costa",
  "email": "marina@empresa.com",
  "source": "web",
  "status": "new",
  "createdAt": "2026-07-24T12:00:00.000Z"
}
```

## Estructura del proyecto

```text
mini-crm-codex/
├── public/
│   ├── app.js          # Lógica del frontend y consumo de la API
│   ├── index.html      # Estructura de la interfaz
│   └── styles.css      # Estilos visuales y diseño adaptable
├── src/
│   └── server.js       # Servidor Express, API y acceso a SQLite
├── .gitignore          # Archivos excluidos del control de versiones
├── mini-crm.sqlite     # Base de datos local persistente
├── package-lock.json   # Versiones exactas de las dependencias
├── package.json        # Metadatos, scripts y dependencias
└── README.md           # Documentación del proyecto
```

## Arquitectura

El servidor Express cumple dos funciones:

1. Sirve los archivos estáticos de `public/`.
2. Expone la API REST que utiliza el frontend.

El navegador realiza peticiones con `fetch` a la API. El servidor valida los datos básicos, ejecuta consultas preparadas sobre SQLite y devuelve respuestas JSON. La exportación CSV se genera directamente desde los registros almacenados.

```text
Navegador
   │
   ├── Archivos estáticos (HTML, CSS y JavaScript)
   │
   └── Peticiones HTTP a /leads
              │
          Express
              │
       better-sqlite3
              │
       mini-crm.sqlite
```

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Ejecuta la aplicación con Node.js. |
| `npm run dev` | Ejecuta el servidor en modo observación y lo reinicia ante cambios. |

## Persistencia de datos

Los leads se almacenan en `mini-crm.sqlite`. Los archivos auxiliares `mini-crm.sqlite-shm` y `mini-crm.sqlite-wal` pueden aparecer mientras la aplicación está en ejecución y están excluidos de Git.

Antes de reemplazar o eliminar `mini-crm.sqlite`, crea una copia si deseas conservar los contactos existentes.

## Licencia

Este proyecto declara la licencia MIT en `package.json`.
