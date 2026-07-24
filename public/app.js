const form = document.querySelector("#lead-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const sourceInput = document.querySelector("#source");
const statusInput = document.querySelector("#status");
const nameError = document.querySelector("#name-error");
const emailError = document.querySelector("#email-error");
const formTitle = document.querySelector("#form-title");
const formDescription = document.querySelector("#form-description");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const formMessage = document.querySelector("#form-message");
const leadCount = document.querySelector("#lead-count");
const searchInput = document.querySelector("#lead-search");
const statusFilter = document.querySelector("#status-filter");
const loadingState = document.querySelector("#loading-state");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const errorState = document.querySelector("#error-state");
const tableWrapper = document.querySelector("#table-wrapper");
const tableBody = document.querySelector("#leads-table-body");
let editingLeadId = null;
let allLeads = [];

const sourceLabels = {
  web: "Web",
  referral: "Referido",
  linkedin: "LinkedIn",
  event: "Evento",
  other: "Otra",
};

const statusLabels = {
  new: "Nuevo",
  contacted: "Contactado",
  lost: "Perdido",
};

function setViewState(state) {
  loadingState.hidden = state !== "loading";
  emptyState.hidden = state !== "empty";
  errorState.hidden = state !== "error";
  tableWrapper.hidden = state !== "ready";
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function setFormMessage(message = "", type = "") {
  formMessage.textContent = message;
  formMessage.className = "form-message";

  if (type) {
    formMessage.classList.add(type);
  }
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");
}

function getVisibleLeads() {
  const query = normalizeText(searchInput.value.trim());
  const selectedStatus = statusFilter.value;

  return allLeads.filter((lead) => {
    const matchesSearch =
      !query ||
      normalizeText(lead.name).includes(query) ||
      normalizeText(lead.email).includes(query);
    const matchesStatus =
      selectedStatus === "all" || lead.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });
}

function resetFormMode() {
  editingLeadId = null;
  form.reset();
  formTitle.textContent = "Añadir un lead";
  formDescription.textContent = "Introduce los datos básicos del contacto.";
  submitButton.querySelector("span").textContent = "Añadir lead";
  cancelEditButton.hidden = true;
  nameError.textContent = "";
  emailError.textContent = "";
  nameInput.removeAttribute("aria-invalid");
  emailInput.removeAttribute("aria-invalid");
}

function editLead(lead) {
  editingLeadId = lead.id;
  nameInput.value = lead.name;
  emailInput.value = lead.email;
  sourceInput.value = lead.source || "";
  statusInput.value = lead.status || "new";
  formTitle.textContent = "Editar lead";
  formDescription.textContent = "Modifica los datos y guarda los cambios.";
  submitButton.querySelector("span").textContent = "Guardar cambios";
  cancelEditButton.hidden = false;
  setFormMessage();
  nameError.textContent = "";
  emailError.textContent = "";
  nameInput.removeAttribute("aria-invalid");
  emailInput.removeAttribute("aria-invalid");
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  nameInput.focus({ preventScroll: true });
}

async function deleteLead(lead, deleteButton) {
  const shouldDelete = window.confirm(
    `¿Quieres eliminar a ${lead.name} de la lista?`,
  );

  if (!shouldDelete) {
    return;
  }

  deleteButton.disabled = true;
  deleteButton.textContent = "Eliminando…";
  setFormMessage();

  try {
    const response = await fetch(`/leads/${lead.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "No se pudo eliminar el lead.");
    }

    if (editingLeadId === lead.id) {
      resetFormMode();
    }

    await loadLeads();
    setFormMessage(`${lead.name} se eliminó correctamente.`, "success");
  } catch (error) {
    setFormMessage(error.message, "error");
    deleteButton.disabled = false;
    deleteButton.textContent = "Eliminar";
  }
}

function renderLeads(leads) {
  tableBody.replaceChildren();
  leadCount.textContent = `${leads.length} ${
    leads.length === 1 ? "lead visible" : "leads visibles"
  }`;

  if (leads.length === 0) {
    const hasActiveFilters =
      searchInput.value.trim() || statusFilter.value !== "all";

    emptyTitle.textContent =
      allLeads.length > 0 && hasActiveFilters
        ? "No hay coincidencias."
        : "Todavía no hay leads.";
    emptyCopy.textContent =
      allLeads.length > 0 && hasActiveFilters
        ? "Prueba con otra búsqueda o cambia el estado seleccionado."
        : "Utiliza el formulario para añadir el primer contacto.";
    setViewState("empty");
    return;
  }

  leads.forEach((lead, index) => {
    const row = document.createElement("tr");
    row.style.setProperty("--row-index", index);

    const idCell = document.createElement("td");
    const nameCell = document.createElement("td");
    const emailCell = document.createElement("td");
    const sourceCell = document.createElement("td");
    const statusCell = document.createElement("td");
    const dateCell = document.createElement("td");
    const actionsCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    idCell.className = "lead-id";
    idCell.textContent = lead.id;
    nameCell.textContent = lead.name;
    emailCell.textContent = lead.email;
    sourceCell.textContent = sourceLabels[lead.source] || lead.source || "—";
    statusBadge.className = `status-badge status-${lead.status || "new"}`;
    statusBadge.textContent = statusLabels[lead.status] || "Nuevo";
    statusCell.append(statusBadge);
    dateCell.textContent = formatDate(lead.createdAt);
    actions.className = "row-actions";
    editButton.className = "table-action";
    editButton.type = "button";
    editButton.textContent = "Editar";
    editButton.setAttribute("aria-label", `Editar a ${lead.name}`);
    editButton.addEventListener("click", () => editLead(lead));
    deleteButton.className = "table-action table-action-danger";
    deleteButton.type = "button";
    deleteButton.textContent = "Eliminar";
    deleteButton.setAttribute("aria-label", `Eliminar a ${lead.name}`);
    deleteButton.addEventListener("click", () =>
      deleteLead(lead, deleteButton),
    );
    actions.append(editButton, deleteButton);
    actionsCell.append(actions);

    row.append(
      idCell,
      nameCell,
      emailCell,
      sourceCell,
      statusCell,
      dateCell,
      actionsCell,
    );
    tableBody.append(row);
  });

  setViewState("ready");
}

function applyFilters() {
  renderLeads(getVisibleLeads());
}

async function loadLeads() {
  setViewState("loading");
  searchInput.disabled = true;
  statusFilter.disabled = true;

  try {
    const response = await fetch("/leads");

    if (!response.ok) {
      throw new Error("No se pudieron cargar los leads.");
    }

    const leads = await response.json();
    allLeads = Array.isArray(leads) ? leads : [];
    searchInput.disabled = false;
    statusFilter.disabled = false;
    applyFilters();
  } catch (error) {
    leadCount.textContent = "Leads no disponibles";
    setViewState("error");
  }
}

function validateForm() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  let isValid = true;

  nameError.textContent = "";
  emailError.textContent = "";
  nameInput.removeAttribute("aria-invalid");
  emailInput.removeAttribute("aria-invalid");

  if (!name) {
    nameError.textContent = "Escribe el nombre del contacto.";
    nameInput.setAttribute("aria-invalid", "true");
    isValid = false;
  }

  if (!email) {
    emailError.textContent = "Escribe un email.";
    emailInput.setAttribute("aria-invalid", "true");
    isValid = false;
  } else if (!emailInput.validity.valid) {
    emailError.textContent = "Introduce un email válido.";
    emailInput.setAttribute("aria-invalid", "true");
    isValid = false;
  }

  return isValid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFormMessage();

  if (!validateForm()) {
    return;
  }

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Guardando...";

  try {
    const isEditing = editingLeadId !== null;
    const response = await fetch(
      isEditing ? `/leads/${editingLeadId}` : "/leads",
      {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        source: sourceInput.value,
        status: statusInput.value,
      }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "No se pudo guardar el lead.");
    }

    const successMessage = isEditing
      ? `${result.name} se actualizó correctamente.`
      : `${result.name} se añadió correctamente.`;
    resetFormMode();
    await loadLeads();
    setFormMessage(successMessage, "success");
    nameInput.focus();
  } catch (error) {
    setFormMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent =
      editingLeadId === null ? "Añadir lead" : "Guardar cambios";
  }
});

cancelEditButton.addEventListener("click", () => {
  resetFormMode();
  setFormMessage("Edición cancelada.");
  nameInput.focus();
});

searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

loadLeads();
