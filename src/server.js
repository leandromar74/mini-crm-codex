const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// El archivo SQLite vive en la raíz del proyecto para que los leads sobrevivan
// a los reinicios del servidor.
const databasePath = path.join(__dirname, "..", "mini-crm.sqlite");
const database = new Database(databasePath);

// WAL permite que SQLite gestione mejor las lecturas mientras se escribe.
database.pragma("journal_mode = WAL");

// La tabla se crea automáticamente la primera vez que arranca la aplicación.
database.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL
  )
`);

// Las consultas se preparan una sola vez y luego se reutilizan en cada petición.
// Los alias conservan los nombres de propiedades que ya espera el frontend.
const findAllLeads = database.prepare(`
  SELECT id, name, email, source, status, created_at AS createdAt
  FROM leads
  ORDER BY id ASC
`);
const findLeadById = database.prepare(`
  SELECT id, name, email, source, status, created_at AS createdAt
  FROM leads
  WHERE id = ?
`);
const insertLead = database.prepare(`
  INSERT INTO leads (name, email, source, status, created_at)
  VALUES (@name, @email, @source, @status, @createdAt)
`);
const updateLead = database.prepare(`
  UPDATE leads
  SET name = @name, email = @email, source = @source, status = @status
  WHERE id = @id
`);
const deleteLead = database.prepare("DELETE FROM leads WHERE id = ?");

// Estos middlewares reciben JSON y sirven el frontend existente sin modificarlo.
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/admin", (request, response) => {
  response.type("text/plain").send("La API de administrador está funcionando.");
});

// GET obtiene siempre la lista actual directamente desde SQLite.
app.get("/leads", (request, response) => {
  response.json(findAllLeads.all());
});

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

const csvSourceLabels = {
  web: "Web",
  referral: "Referido",
  linkedin: "LinkedIn",
  event: "Evento",
  other: "Otra",
};

const csvStatusLabels = {
  new: "Nuevo",
  contacted: "Contactado",
  lost: "Perdido",
};

// Exporta todos los leads en UTF-8. El BOM facilita que Excel detecte
// correctamente los acentos y otros caracteres internacionales.
app.get("/leads/export.csv", (request, response) => {
  const headers = [
    "nombre",
    "correo electrónico",
    "fuente",
    "estado",
    "fecha de creación",
  ];
  const rows = findAllLeads.all().map((lead) =>
    [
      lead.name,
      lead.email,
      csvSourceLabels[lead.source] || lead.source,
      csvStatusLabels[lead.status] || lead.status,
      lead.createdAt,
    ]
      .map(escapeCsvValue)
      .join(","),
  );
  const csv = `\uFEFF${[
    headers.map(escapeCsvValue).join(","),
    ...rows,
  ].join("\r\n")}\r\n`;

  response.set({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="leads.csv"',
  });
  response.send(csv);
});

// POST valida los datos, inserta el lead y devuelve la fila recién creada.
app.post("/leads", (request, response) => {
  const { name, email, source = "", status = "new" } = request.body || {};

  if (!name || !email) {
    return response.status(400).json({
      error: "Los campos name y email son obligatorios.",
    });
  }

  const leadToCreate = {
    name,
    email,
    source,
    status,
    createdAt: new Date().toISOString(),
  };
  const result = insertLead.run(leadToCreate);
  const lead = findLeadById.get(result.lastInsertRowid);

  return response.status(201).json(lead);
});

// PUT actualiza únicamente una fila existente y conserva su fecha de creación.
app.put("/leads/:id", (request, response) => {
  const leadId = Number(request.params.id);
  const existingLead = findLeadById.get(leadId);

  if (!Number.isInteger(leadId) || !existingLead) {
    return response.status(404).json({
      error: "No se encontró el lead.",
    });
  }

  const {
    name,
    email,
    source = existingLead.source,
    status = existingLead.status,
  } = request.body || {};

  if (!name || !email) {
    return response.status(400).json({
      error: "Los campos name y email son obligatorios.",
    });
  }

  updateLead.run({
    id: leadId,
    name,
    email,
    source,
    status,
  });

  return response.json(findLeadById.get(leadId));
});

// DELETE elimina el registro en SQLite e informa si el identificador no existe.
app.delete("/leads/:id", (request, response) => {
  const leadId = Number(request.params.id);

  if (!Number.isInteger(leadId)) {
    return response.status(404).json({
      error: "No se encontró el lead.",
    });
  }

  const result = deleteLead.run(leadId);

  if (result.changes === 0) {
    return response.status(404).json({
      error: "No se encontró el lead.",
    });
  }

  return response.status(204).send();
});

// Arranca la API después de haber inicializado correctamente la base de datos.
const server = app.listen(PORT, () => {
  console.log(`Mini CRM API disponible en http://localhost:${PORT}`);
});

// Al cerrar el proceso se liberan tanto el puerto como el archivo SQLite.
function closeApplication() {
  server.close(() => {
    database.close();
  });
}

process.on("SIGINT", closeApplication);
process.on("SIGTERM", closeApplication);
