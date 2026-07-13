const STATUS_LABELS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_producao: "Em produção",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const state = { companies: [], orders: [], role: "representante" };
let editingCompanyId = null;

const empresaForm = document.getElementById("form-empresa");
const empresaSubmitBtn = document.getElementById("empresa-submit");
const empresaCancelBtn = document.getElementById("empresa-cancel-edit");
const empresaFormTitle = document.getElementById("empresa-form-title");
const empresaFormHint = document.getElementById("empresa-form-hint");
const filialExtra = document.getElementById("filial-extra");
const inputCnpjMatriz = document.getElementById("input-cnpj-matriz");
const companyTypeHint = document.getElementById("company-type-hint");
const cnpjLabelSuffix = document.getElementById("cnpj-label-suffix");

// ---------- Tipo de cadastro (matriz / filial) ----------
function applyCompanyTypeUI(type) {
  const isFilial = type === "filial";
  filialExtra.hidden = !isFilial;
  inputCnpjMatriz.required = isFilial;
  if (!isFilial) inputCnpjMatriz.value = "";
  cnpjLabelSuffix.textContent = isFilial ? "(desta filial)" : "";
  companyTypeHint.textContent = isFilial
    ? "Filial: informe o CNPJ desta unidade e o CNPJ da matriz."
    : "Loja única: informe apenas os dados de cadastro abaixo.";
}

document.querySelectorAll('input[name="company_type"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (radio.checked) applyCompanyTypeUI(radio.value);
  });
});

function getSelectedCompanyType() {
  const checked = empresaForm.querySelector('input[name="company_type"]:checked');
  return checked ? checked.value : "matriz";
}

function setCompanyType(type) {
  const value = type === "filial" ? "filial" : "matriz";
  empresaForm.querySelectorAll('input[name="company_type"]').forEach((r) => {
    r.checked = r.value === value;
  });
  applyCompanyTypeUI(value);
}

function startEditCompany(company) {
  editingCompanyId = company.id;
  setCompanyType(company.company_type || "matriz");
  empresaForm.cnpj.value = company.cnpj || "";
  inputCnpjMatriz.value = company.cnpj_matriz || "";
  empresaForm.email.value = company.email || "";
  empresaForm.phone.value = company.phone || "";
  empresaForm.name.value = company.name || "";
  empresaForm.company_name.value = company.company_name || "";
  empresaForm.logradouro.value = company.logradouro || "";
  empresaForm.numero.value = company.numero || "";
  empresaForm.complemento.value = company.complemento || "";
  empresaForm.bairro.value = company.bairro || "";
  empresaForm.cidade.value = company.cidade || "";
  empresaForm.uf.value = company.uf || "";
  empresaForm.cep.value = company.cep || "";
  document.getElementById("company-name-status").textContent = company.company_name ? `Empresa: ${company.company_name}` : "";
  empresaFormTitle.textContent = "Editar empresa";
  empresaFormHint.textContent = `Alterando os dados de ${company.name || company.cnpj}.`;
  empresaSubmitBtn.textContent = "Salvar alterações";
  empresaCancelBtn.hidden = false;
  setCnpjStatus("");
  activateTab("empresas");
  activateSubtab("cadastrar");
  renderCompanies();
  empresaForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEditCompany() {
  editingCompanyId = null;
  empresaForm.reset();
  setCompanyType("matriz");
  document.getElementById("company-name-status").textContent = "";
  empresaFormTitle.textContent = "Cadastrar empresa";
  empresaFormHint.textContent = "Cada empresa cadastrada aqui vira um destinatário disponível na hora de lançar pedidos.";
  empresaSubmitBtn.textContent = "Registrar empresa";
  empresaCancelBtn.hidden = true;
  setCnpjStatus("Digite o CNPJ para preencher o endereço automaticamente.");
  renderCompanies();
}

empresaCancelBtn.addEventListener("click", cancelEditCompany);

const CRUMB_LABELS = { dashboard: "Dashboard", empresas: "Empresas", pedidos: "Pedidos", "meus-pedidos": "Meus Pedidos", usuarios: "Usuários", catalogo: "Catálogo" };

// ---------- Sub-tabs (dentro de Empresas) ----------
function activateSubtab(name) {
  document.querySelectorAll(".subtab").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.subtab === name);
  });
  document.querySelectorAll(".subpanel").forEach((p) => p.classList.remove("is-active"));
  document.getElementById(`subpanel-${name}`).classList.add("is-active");
}
document.querySelectorAll(".subtab").forEach((btn) => {
  btn.addEventListener("click", () => activateSubtab(btn.dataset.subtab));
});

// ---------- Sidebar navigation ----------
function activateTab(tab) {
  document.querySelectorAll(".side-nav__item[data-tab]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
  document.getElementById(`panel-${tab}`).classList.add("is-active");
  document.getElementById("crumb-current").textContent = CRUMB_LABELS[tab] || tab;
  if (tab === "catalogo") renderCatalogoTable();
}

document.querySelectorAll(".side-nav__item[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.tab);
    if (isMobileViewport()) closeMobileSidebar();
  });
});

// ---------- Sidebar: pin (desktop) / drawer (mobile) ----------
const shellEl = document.getElementById("shell");
const sidebarEl = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const MOBILE_BREAKPOINT = 860;

function isMobileViewport() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function openMobileSidebar() {
  shellEl.classList.add("is-mobile-open");
  sidebarBackdrop.hidden = false;
}
function closeMobileSidebar() {
  shellEl.classList.remove("is-mobile-open");
  sidebarBackdrop.hidden = true;
}

document.getElementById("sidebar-toggle").addEventListener("click", () => {
  if (isMobileViewport()) {
    shellEl.classList.contains("is-mobile-open") ? closeMobileSidebar() : openMobileSidebar();
  } else {
    sidebarEl.classList.toggle("is-pinned");
  }
});

// Sidebar já expandida por padrão em telas desktop (mobile continua fechada/drawer).
if (!isMobileViewport()) {
  sidebarEl.classList.add("is-pinned");
}
document.getElementById("sidebar-collapse-toggle")?.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebarEl.classList.toggle("is-pinned");
});
document.getElementById("sidebar-mobile-close").addEventListener("click", closeMobileSidebar);
sidebarBackdrop.addEventListener("click", closeMobileSidebar);

// ---------- Helpers ----------
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T") + "Z");
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fmtCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function api(path, options = {}) {
  const res = await fetch('https://goseller.devgogroup.com/api' + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro na requisição.");
  return data;
}

// ---------- Load user ----------
async function loadMe(prefetchedMe) {
  const avatar = document.getElementById("user-avatar");
  const sideAvatar = document.getElementById("sidebar-profile-avatar");
  const sideName = document.getElementById("sidebar-profile-name");
  const sideRole = document.getElementById("sidebar-profile-role");
  try {
    const me = prefetchedMe || (await api("/api/me"));
    const initial = (me.name || me.email).charAt(0).toUpperCase();
    avatar.textContent = initial;
    avatar.title = `${me.name ? me.name + " — " : ""}${me.email} (${me.role === "admin" ? "Admin" : "Representante"}) · clique para ver seu perfil`;
    state.role = me.role;
    state.currentUserEmail = me.email;
    state.currentUserName = me.name || "";
    state.me = me;
    document.getElementById("nav-group-admin").hidden = me.role !== "admin";
    if (me.role === "admin") loadUsers();

    if (sideAvatar) sideAvatar.textContent = initial;
    if (sideName) sideName.textContent = me.name || me.email;
    if (sideRole) sideRole.textContent = me.role === "admin" ? "Admin" : "Representante";
  } catch {
    avatar.textContent = "?";
    avatar.title = "Não foi possível identificar o usuário.";
  }
}

// ---------- Popup "Meu perfil" ----------
const profileModal = document.getElementById("profile-modal");
const formProfile = document.getElementById("form-profile");

function openProfileModal() {
  const me = state.me || {};
  formProfile.name.value = me.name || "";
  document.getElementById("profile-email").value = me.email || "";
  formProfile.phone.value = me.phone || "";
  formProfile.segmento.value = me.segmento || "";
  formProfile.rep_company_name.value = me.rep_company_name || "";
  formProfile.rep_cnpj.value = me.rep_cnpj || "";
  formProfile.regiao.value = me.regiao || "";
  document.getElementById("profile-error").textContent = "";
  document.getElementById("profile-status").style.display = "none";
  profileModal.hidden = false;
}
function closeProfileModal() {
  profileModal.hidden = true;
}

document.getElementById("user-avatar").addEventListener("click", openProfileModal);
document.getElementById("sidebar-profile-btn").addEventListener("click", openProfileModal);
document.getElementById("profile-modal-close").addEventListener("click", closeProfileModal);
document.getElementById("profile-modal-backdrop").addEventListener("click", closeProfileModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !profileModal.hidden) closeProfileModal();
});

formProfile.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("profile-error");
  const statusEl = document.getElementById("profile-status");
  errEl.textContent = "";
  statusEl.style.display = "none";
  const name = formProfile.name.value.trim();
  const phone = formProfile.phone.value.trim();
  const segmento = formProfile.segmento.value;
  const rep_company_name = formProfile.rep_company_name.value.trim();
  const rep_cnpj = formProfile.rep_cnpj.value.trim();
  const regiao = formProfile.regiao.value;
  const btn = formProfile.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await api("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ name, phone, segmento, rep_company_name, rep_cnpj, regiao }),
    });
    await loadMe();
    statusEl.textContent = "Dados atualizados com sucesso.";
    statusEl.style.display = "block";
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("profile-change-password").addEventListener("click", async () => {
  const nova = prompt("Digite a nova senha (mínimo 6 caracteres):");
  if (nova === null) return;
  if (nova.trim().length < 6) {
    alert("A senha deve ter pelo menos 6 caracteres.");
    return;
  }
  try {
    await api("/api/me", { method: "PATCH", body: JSON.stringify({ password: nova.trim() }) });
    alert("Senha atualizada com sucesso.");
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Popup genérico "Detalhes" (Empresas e Pedidos) ----------
const detailModal = document.getElementById("detail-modal");
const detailModalBody = document.getElementById("detail-modal-body");
const detailModalTitle = document.getElementById("detail-modal-title");

function openDetailModal(title, bodyHtml) {
  detailModalTitle.textContent = title;
  detailModalBody.innerHTML = bodyHtml;
  detailModal.hidden = false;
}
function closeDetailModal() {
  detailModal.hidden = true;
  detailModalBody.innerHTML = "";
}
document.getElementById("detail-modal-close").addEventListener("click", closeDetailModal);
document.getElementById("detail-modal-backdrop").addEventListener("click", closeDetailModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !detailModal.hidden) closeDetailModal();
});

function showCompanyDetail(company) {
  const enderecoPartes = [
    company.logradouro,
    company.numero && `nº ${company.numero}`,
    company.complemento,
    company.bairro,
    [company.cidade, company.uf].filter(Boolean).join("/"),
    company.cep && `CEP ${company.cep}`,
  ].filter(Boolean);
  const isFilial = company.company_type === "filial";

  const rows = [
    ["CNPJ", `${escapeHtml(company.cnpj || "—")} <span class="type-badge type-badge--${isFilial ? "filial" : "matriz"}">${isFilial ? "Filial" : "Matriz"}</span>`],
    ["Responsável", escapeHtml(company.name || "—")],
    ["Empresa", escapeHtml(company.company_name || "—")],
    ["E-mail", escapeHtml(company.email || "—")],
    ["Telefone", escapeHtml(company.phone || "—")],
  ];
  if (isFilial && company.cnpj_matriz) rows.push(["CNPJ da matriz", escapeHtml(company.cnpj_matriz)]);
  rows.push(["Endereço", enderecoPartes.length ? enderecoPartes.map(escapeHtml).join(", ") : "—"]);
  if (state.role === "admin") rows.push(["Criado por", escapeHtml(company.owner_email)]);
  rows.push(["ID", `EMPRESA #${String(company.id).padStart(4, "0")}`]);

  const body = `
    <div class="detail-grid">
      ${rows.map(([label, value]) => `<div class="detail-row"><span class="detail-label">${label}</span><span>${value}</span></div>`).join("")}
    </div>
    <div class="detail-modal__actions">
      <button class="btn-outline" id="detail-edit-company">Editar</button>
      ${state.role === "admin" ? `<button class="btn-outline" id="detail-remove-company" style="color:var(--stamp-red); border-color:var(--stamp-red);">Remover</button>` : ""}
    </div>
  `;
  openDetailModal("Detalhes da empresa", body);

  document.getElementById("detail-edit-company").addEventListener("click", () => {
    closeDetailModal();
    startEditCompany(company);
  });
  const removeBtn = document.getElementById("detail-remove-company");
  if (removeBtn) {
    removeBtn.addEventListener("click", async () => {
      if (!confirm("Remover esta empresa? Essa ação não pode ser desfeita.")) return;
      try {
        await api(`/api/companies/${company.id}`, { method: "DELETE" });
        if (String(editingCompanyId) === String(company.id)) cancelEditCompany();
        closeDetailModal();
        await loadCompanies();
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

async function showOrderDetail(order, allowStatusChange) {
  let events = [];
  try {
    events = await api(`/api/orders/${order.id}/events`);
  } catch {
    events = [];
  }
  const historyHtml = events.length
    ? `<div class="timeline is-open">${events
        .map(
          (ev) => `
        <div class="timeline-item">
          <span class="t-status">${STATUS_LABELS[ev.status] || ev.status}</span>
          <span class="t-date">${fmtDate(ev.created_at)}</span>
          ${ev.note ? `<span class="t-note">${escapeHtml(ev.note)}</span>` : ""}
        </div>`
        )
        .join("")}</div>`
    : `<p class="empty-state">Sem histórico ainda.</p>`;

  const docHtml = order.document_name
    ? `<a class="ticket-doc" href="https://goseller.devgogroup.com/api/orders/${order.id}/document" target="_blank" rel="noopener">📎 ${escapeHtml(order.document_name)}</a>`
    : `<span class="ticket-doc ticket-doc--empty">sem documento anexado</span>`;

  const rows = [
    ["Código", escapeHtml(order.order_code || `PED-${String(order.id).padStart(6, "0")}`)],
    ["Data", fmtDate(order.created_at)],
    ["Empresa", `${escapeHtml(order.company_cnpj || "")} — ${escapeHtml(order.company_name)}`],
  ];
  if (state.role === "admin") rows.push(["Lançado por", escapeHtml(order.owner_email)]);
  rows.push(["Valor", fmtCurrency(order.order_value)]);
  rows.push(["Status", `<span class="stamp stamp--${order.status}">${STATUS_LABELS[order.status] || order.status}</span>`]);
  rows.push(["Documento", docHtml]);

  const body = `
    <div class="detail-grid">
      ${rows.map(([label, value]) => `<div class="detail-row"><span class="detail-label">${label}</span><span>${value}</span></div>`).join("")}
    </div>
    ${
      allowStatusChange
        ? `<div class="ticket-actions" style="margin-top:14px; border-top:1px dashed var(--line); padding-top:14px;">
            <select id="detail-status-select">
              ${Object.entries(STATUS_LABELS)
                .map(([v, l]) => `<option value="${v}" ${v === order.status ? "selected" : ""}>${l}</option>`)
                .join("")}
            </select>
            <button id="detail-status-update">Atualizar status</button>
          </div>`
        : ""
    }
    <div style="margin-top:16px;">
      <div class="detail-label" style="margin-bottom:6px;">Histórico</div>
      ${historyHtml}
    </div>
  `;
  openDetailModal("Detalhes do pedido", body);

  const updateBtn = document.getElementById("detail-status-update");
  if (updateBtn) {
    updateBtn.addEventListener("click", async () => {
      const status = document.getElementById("detail-status-select").value;
      try {
        await api(`/api/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
        closeDetailModal();
        await loadOrders();
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

// ---------- Usuários (admin only) ----------
const formUsuario = document.getElementById("form-usuario");
if (formUsuario) {
  formUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("usuario-error");
    errEl.textContent = "";
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const segmento = form.segmento.value;
    const rep_company_name = form.rep_company_name.value.trim();
    const rep_cnpj = form.rep_cnpj.value.trim();
    const regiao = form.regiao.value;
    const password = form.password.value;
    const role = form.querySelector('input[name="role"]:checked').value;
    try {
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, segmento, rep_company_name, rep_cnpj, regiao, password, role }),
      });
      form.reset();
      loadUsers();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}

async function loadUsers() {
  const el = document.getElementById("lista-usuarios");
  try {
    const users = await api("/api/users");
    renderUsers(users);
  } catch (err) {
    el.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

function renderUsers(users) {
  const el = document.getElementById("lista-usuarios");
  if (users.length === 0) {
    el.innerHTML = '<p class="empty-state">Nenhum usuário cadastrado ainda.</p>';
    return;
  }
  el.innerHTML = users
    .map(
      (u) => `
    <div class="user-row" data-email="${escapeHtml(u.email)}">
      <div class="user-row__info">
        <input type="text" class="user-row__name" value="${escapeHtml(u.name || "")}" placeholder="Sem nome cadastrado" style="font-weight:600; font-size:14px; border:1px solid transparent; border-radius:8px; padding:2px 6px; margin:-2px 0 2px -6px; width:70%;" />
        <div class="user-row__email">${escapeHtml(u.email)}</div>
        <div class="user-row__meta">${[u.segmento, u.rep_company_name, u.regiao].filter(Boolean).map(escapeHtml).join(" · ")}</div>
        <div class="user-row__meta">${[u.phone].filter(Boolean).map(escapeHtml).join(" · ")}</div>
        <div class="user-row__meta">Desde ${fmtDate(u.created_at)}${u.email === state.currentUserEmail ? " · você" : ""}</div>
      </div>
      <select class="user-row__role" ${u.email === state.currentUserEmail ? "disabled title=\"Você não pode alterar seu próprio papel\"" : ""}>
        <option value="representante" ${u.role === "representante" ? "selected" : ""}>Representante</option>
        <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
      </select>
    </div>`
    )
    .join("");

  el.querySelectorAll(".user-row").forEach((row) => {
    const select = row.querySelector(".user-row__role");
    const nameInput = row.querySelector(".user-row__name");
    select.addEventListener("change", async () => {
      const email = row.dataset.email;
      const role = select.value;
      select.disabled = true;
      try {
        await api(`/api/users/${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify({ role }) });
      } catch (err) {
        alert(err.message);
      } finally {
        loadUsers();
      }
    });
    nameInput.addEventListener("change", async () => {
      const email = row.dataset.email;
      try {
        await api(`/api/users/${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify({ name: nameInput.value.trim() }) });
        if (email === state.currentUserEmail) await loadMe();
      } catch (err) {
        alert(err.message);
        loadUsers();
      }
    });
  });
}

// ---------- Empresas ----------
async function loadCompanies() {
  state.companies = await api("/api/companies");
  renderCompanies();
  renderCompanySelect();
  renderDashboard();
}

function renderCompanies() {
  const el = document.getElementById("lista-empresas");
  if (state.companies.length === 0) {
    el.innerHTML = '<p class="empty-state">Nenhuma empresa cadastrada ainda. Comece pelo formulário ao lado.</p>';
    return;
  }
  el.innerHTML = state.companies
    .map((c) => {
      const enderecoPartes = [
        c.logradouro,
        c.numero && `nº ${c.numero}`,
        c.complemento,
        c.bairro,
        [c.cidade, c.uf].filter(Boolean).join("/"),
        c.cep && `CEP ${c.cep}`,
      ].filter(Boolean);
      const isFilial = c.company_type === "filial";
      return `
    <div class="dossie ${String(c.id) === String(editingCompanyId) ? "is-editing" : ""}" data-id="${c.id}">
      <div>
        <div class="dossie__name">${escapeHtml(c.cnpj || "CNPJ não informado")} <span class="type-badge type-badge--${isFilial ? "filial" : "matriz"}">${isFilial ? "Filial" : "Matriz"}</span></div>
        <div class="dossie__meta">${[c.name, c.email, c.phone].filter(Boolean).map(escapeHtml).join(" · ")}</div>
        ${state.role === "admin" ? `<div class="dossie__meta">Criado por: ${escapeHtml(c.owner_email)}</div>` : ""}
        ${isFilial && c.cnpj_matriz ? `<div class="dossie__meta">CNPJ da matriz: ${escapeHtml(c.cnpj_matriz)}</div>` : ""}
        ${enderecoPartes.length ? `<div class="dossie__address">${enderecoPartes.map(escapeHtml).join(", ")}</div>` : ""}
        <div class="dossie__id">EMPRESA #${String(c.id).padStart(4, "0")}</div>
      </div>
      ${state.role === "admin"
        ? `<button class="dossie__remove" data-remove="${c.id}">remover</button>`
        : `<span class="dossie__remove" style="color:var(--stamp-grey); cursor:default; text-decoration:none;" title="Somente administradores podem excluir. Solicite ao Administrador.">exclusão restrita ao admin</span>`}
    </div>`;
    })
    .join("");

  el.querySelectorAll(".dossie").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-remove]")) return;
      const company = state.companies.find((c) => String(c.id) === card.dataset.id);
      if (company) showCompanyDetail(company);
    });
  });

  el.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Remover esta empresa?")) return;
      await api(`/api/companies/${btn.dataset.remove}`, { method: "DELETE" });
      if (String(editingCompanyId) === String(btn.dataset.remove)) cancelEditCompany();
      await loadCompanies();
    });
  });
}

function renderCompanySelect() {
  const sel = document.getElementById("select-empresa");
  const current = sel.value;
  sel.innerHTML =
    '<option value="">Selecione o CNPJ…</option>' +
    state.companies.map((c) => `<option value="${c.id}">${escapeHtml(c.cnpj || "sem CNPJ")} — ${escapeHtml(c.name)}</option>`).join("");
  sel.value = current;
}

document.getElementById("form-empresa").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("empresa-error");
  errEl.textContent = "";
  const form = e.target;

  if (getSelectedCompanyType() === "filial" && !inputCnpjMatriz.value.trim()) {
    errEl.textContent = "Informe o CNPJ da matriz para cadastrar uma filial.";
    inputCnpjMatriz.focus();
    return;
  }

  const body = Object.fromEntries(new FormData(form).entries());
  try {
    if (editingCompanyId) {
      await api(`/api/companies/${editingCompanyId}`, { method: "PATCH", body: JSON.stringify(body) });
    } else {
      await api("/api/companies", { method: "POST", body: JSON.stringify(body) });
    }
    cancelEditCompany();
    await loadCompanies();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

// ---------- Consulta de CNPJ na Receita Federal ----------
function formatCnpj(value) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length > 12) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
  if (d.length > 8) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
  if (d.length > 5) return d.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
  if (d.length > 2) return d.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
  return d;
}

const cnpjInput = document.getElementById("input-cnpj");
const cnpjStatus = document.getElementById("cnpj-status");
const lookupBtn = document.getElementById("lookup-cnpj");

function setCnpjStatus(text, kind) {
  cnpjStatus.textContent = text;
  cnpjStatus.className = "field-status" + (kind ? ` field-status--${kind}` : "");
}

async function lookupCnpj(digits) {
  lookupBtn.disabled = true;
  lookupBtn.classList.add("is-loading");
  setCnpjStatus("Consultando Receita Federal…");
  try {
    const data = await api(`/api/cnpj/${digits}`);
    const form = document.getElementById("form-empresa");
    if (data.email) form.email.value = data.email;
    // Telefone não é preenchido automaticamente: o representante deve digitar manualmente.
    if (data.logradouro) form.logradouro.value = data.logradouro;
    if (data.numero) form.numero.value = data.numero;
    if (data.complemento) form.complemento.value = data.complemento;
    if (data.bairro) form.bairro.value = data.bairro;
    if (data.cidade) form.cidade.value = data.cidade;
    if (data.uf) form.uf.value = data.uf;
    if (data.cep) form.cep.value = data.cep;
    const razaoSocial = data.razao_social || data.nome_fantasia || "";
    if (razaoSocial) form.company_name.value = razaoSocial;
    const label = data.nome_fantasia || data.razao_social || "";
    setCnpjStatus(label ? `Encontrado: ${label}` : "Dados encontrados e preenchidos.", "ok");
    document.getElementById("company-name-status").textContent = razaoSocial ? `Empresa: ${razaoSocial}` : "";
  } catch (err) {
    setCnpjStatus(err.message, "error");
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.classList.remove("is-loading");
  }
}

cnpjInput.addEventListener("input", () => {
  cnpjInput.value = formatCnpj(cnpjInput.value);
  const digits = cnpjInput.value.replace(/\D/g, "");
  if (digits.length === 14) {
    lookupCnpj(digits);
  } else {
    setCnpjStatus("Digite o CNPJ para preencher o endereço automaticamente.");
  }
});

lookupBtn.addEventListener("click", () => {
  const digits = cnpjInput.value.replace(/\D/g, "");
  if (digits.length !== 14) {
    setCnpjStatus("Digite um CNPJ completo (14 dígitos) para buscar.", "error");
    return;
  }
  lookupCnpj(digits);
});

// Máscara também para o campo de CNPJ da matriz
inputCnpjMatriz.addEventListener("input", () => {
  inputCnpjMatriz.value = formatCnpj(inputCnpjMatriz.value);
});

// ---------- Pedidos ----------
async function loadOrders() {
  state.orders = await api("/api/orders");
  renderOrders();
  renderDashboard();
}

function renderDashboard() {
  const companiesCount = state.companies.length;
  const ordersCount = state.orders.length;
  const totalValue = state.orders.reduce((sum, o) => sum + (Number(o.order_value) || 0), 0);
  const pendingCount = state.orders.filter((o) => o.status === "pendente").length;

  document.getElementById("dash-companies").textContent = companiesCount;
  document.getElementById("dash-orders").textContent = ordersCount;
  document.getElementById("dash-total-value").textContent = fmtCurrency(totalValue);
  document.getElementById("dash-pending").textContent = pendingCount;

  const counts = {};
  Object.keys(STATUS_LABELS).forEach((s) => (counts[s] = 0));
  state.orders.forEach((o) => {
    if (counts[o.status] !== undefined) counts[o.status]++;
  });
  const max = Math.max(1, ...Object.values(counts));

  const barsEl = document.getElementById("dash-status-bars");
  if (ordersCount === 0) {
    barsEl.innerHTML = '<p class="empty-state">Sem pedidos ainda pra mostrar estatísticas.</p>';
  } else {
    barsEl.innerHTML = Object.entries(STATUS_LABELS)
      .map(([key, label]) => {
        const count = counts[key] || 0;
        const pct = Math.round((count / max) * 100);
        return `
      <div class="dash-bar-row">
        <span class="dash-bar-label">${label}</span>
        <div class="dash-bar-track"><div class="dash-bar-fill stamp--${key}" style="width:${pct}%"></div></div>
        <span class="dash-bar-count">${count}</span>
      </div>`;
      })
      .join("");
  }

  const recentEl = document.getElementById("dash-recent");
  const recent = state.orders.slice(0, 5);
  if (recent.length === 0) {
    recentEl.innerHTML = '<p class="empty-state">Nenhum pedido lançado ainda.</p>';
  } else {
    recentEl.innerHTML = recent
      .map(
        (o) => `
      <div class="dash-recent-item">
        <div>
          <div class="dash-recent-company">${escapeHtml(o.company_name)}</div>
          <div class="dash-recent-meta">${fmtDate(o.created_at)} · ${fmtCurrency(o.order_value)}</div>
        </div>
        <span class="stamp stamp--${o.status}">${STATUS_LABELS[o.status] || o.status}</span>
      </div>`
      )
      .join("");
  }
}

function renderOrders() {
  const el = document.getElementById("lista-pedidos");
  if (state.orders.length === 0) {
    el.innerHTML = '<p class="empty-state">Nenhum pedido lançado ainda.</p>';
    return;
  }
  el.innerHTML = state.orders
    .map(
      (o) => `
    <div class="ticket" data-id="${o.id}">
      <div class="ticket-top">
        <div>
          <div class="ticket-id">${escapeHtml(o.order_code || `PED-${String(o.id).padStart(6, "0")}`)} · ${fmtDate(o.created_at)}</div>
          <div class="ticket-company">${escapeHtml(o.company_cnpj || "")} — ${escapeHtml(o.company_name)}</div>
          ${state.role === "admin" ? `<div class="ticket-doc">Lançado por: ${escapeHtml(o.owner_email)}</div>` : ""}
          <div class="ticket-value">${fmtCurrency(o.order_value)}</div>
          ${
            o.document_name
              ? `<a class="ticket-doc" href="https://goseller.devgogroup.com/api/orders/${o.id}/document" target="_blank" rel="noopener">📎 ${escapeHtml(o.document_name)}</a>`
              : `<span class="ticket-doc ticket-doc--empty">sem documento anexado</span>`
          }
        </div>
        <span class="stamp stamp--${o.status}">${STATUS_LABELS[o.status] || o.status}</span>
      </div>
      <div class="ticket-actions">
        <select data-status-select>
          ${Object.entries(STATUS_LABELS)
            .map(([v, l]) => `<option value="${v}" ${v === o.status ? "selected" : ""}>${l}</option>`)
            .join("")}
        </select>
        <button data-update>Atualizar status</button>
      </div>
    </div>`
    )
    .join("");

  el.querySelectorAll(".ticket").forEach((ticket) => {
    const id = ticket.dataset.id;

    ticket.querySelector("[data-update]").addEventListener("click", async (e) => {
      e.stopPropagation();
      const status = ticket.querySelector("[data-status-select]").value;
      await api(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadOrders();
    });

    ticket.addEventListener("click", (e) => {
      if (e.target.closest("select, button, a")) return;
      const order = state.orders.find((o) => String(o.id) === id);
      if (order) showOrderDetail(order, state.role === "admin");
    });
  });
}

// ---------- Meus Pedidos (área exclusiva do representante) ----------
async function loadMyOrders() {
  try {
    state.myOrders = await api("/api/orders/mine");
  } catch (err) {
    state.myOrders = [];
  }
  renderMyOrders();
}

function renderMyOrders() {
  const el = document.getElementById("lista-meus-pedidos");
  if (!el) return;
  const orders = state.myOrders || [];
  if (orders.length === 0) {
    el.innerHTML = '<p class="empty-state">Você ainda não lançou nenhum pedido.</p>';
    return;
  }
  el.innerHTML = orders
    .map(
      (o) => `
    <div class="ticket" data-id="${o.id}">
      <div class="ticket-top">
        <div>
          <div class="ticket-id">${escapeHtml(o.order_code || `PED-${String(o.id).padStart(6, "0")}`)} · ${fmtDate(o.created_at)}</div>
          <div class="ticket-company">${escapeHtml(o.company_cnpj || "")} — ${escapeHtml(o.company_name)}</div>
          <div class="ticket-value">${fmtCurrency(o.order_value)}</div>
          ${
            o.document_name
              ? `<a class="ticket-doc" href="https://goseller.devgogroup.com/api/orders/${o.id}/document" target="_blank" rel="noopener">📎 ${escapeHtml(o.document_name)}</a>`
              : `<span class="ticket-doc ticket-doc--empty">sem documento anexado</span>`
          }
        </div>
        <span class="stamp stamp--${o.status}">${STATUS_LABELS[o.status] || o.status}</span>
      </div>
    </div>`
    )
    .join("");

  el.querySelectorAll(".ticket").forEach((ticket) => {
    const id = ticket.dataset.id;
    ticket.addEventListener("click", (e) => {
      if (e.target.closest("select, button, a")) return;
      const order = orders.find((o) => String(o.id) === id);
      if (order) showOrderDetail(order, false);
    });
  });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Command palette (busca) ----------
const cmdk = document.getElementById("cmdk");
const cmdkInput = document.getElementById("cmdk-input");
const cmdkResults = document.getElementById("cmdk-results");

function openCmdk() {
  cmdk.hidden = false;
  cmdkInput.value = "";
  renderCmdkResults("");
  setTimeout(() => cmdkInput.focus(), 0);
}
function closeCmdk() {
  cmdk.hidden = true;
}

document.getElementById("open-search-sidebar").addEventListener("click", openCmdk);
document.getElementById("open-search-topbar").addEventListener("click", openCmdk);
document.getElementById("cmdk-backdrop").addEventListener("click", closeCmdk);

document.addEventListener("keydown", (e) => {
  const isK = e.key.toLowerCase() === "k";
  if ((e.metaKey || e.ctrlKey) && isK) {
    e.preventDefault();
    cmdk.hidden ? openCmdk() : closeCmdk();
  } else if (e.key === "Escape" && !cmdk.hidden) {
    closeCmdk();
  }
});

cmdkInput.addEventListener("input", () => renderCmdkResults(cmdkInput.value.trim().toLowerCase()));

function renderCmdkResults(query) {
  if (!query) {
    cmdkResults.innerHTML = '<p class="cmdk__empty">Digite para buscar empresas e pedidos.</p>';
    return;
  }

  const matchedCompanies = state.companies.filter((c) =>
    [c.name, c.cnpj, c.email, c.phone].some((f) => String(f || "").toLowerCase().includes(query))
  );
  const matchedOrders = state.orders.filter((o) =>
    [o.company_name, o.company_cnpj, String(o.id), o.order_code].some((f) => String(f || "").toLowerCase().includes(query))
  );

  if (matchedCompanies.length === 0 && matchedOrders.length === 0) {
    cmdkResults.innerHTML = '<p class="cmdk__empty">Nada encontrado para essa busca.</p>';
    return;
  }

  let html = "";
  if (matchedCompanies.length > 0) {
    html += '<div class="cmdk__group-label">Empresas</div>';
    html += matchedCompanies
      .map(
        (c) => `
      <button class="cmdk__result" data-goto="empresas" data-id="${c.id}">
        <span class="cmdk__result-title">${escapeHtml(c.name)}</span>
        <span class="cmdk__result-meta">${escapeHtml(c.cnpj || "sem CNPJ")}</span>
      </button>`
      )
      .join("");
  }
  if (matchedOrders.length > 0) {
    html += '<div class="cmdk__group-label">Pedidos</div>';
    html += matchedOrders
      .map(
        (o) => `
      <button class="cmdk__result" data-goto="pedidos" data-id="${o.id}">
        <span class="cmdk__result-title">${escapeHtml(o.order_code || `PED-${String(o.id).padStart(6, "0")}`)} — ${escapeHtml(o.company_name)}</span>
        <span class="cmdk__result-meta">${fmtCurrency(o.order_value)} · ${STATUS_LABELS[o.status] || o.status}</span>
      </button>`
      )
      .join("");
  }
  cmdkResults.innerHTML = html;

  cmdkResults.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.goto === "empresas") {
        activateTab("empresas");
        activateSubtab("cadastradas");
      } else {
        activateTab("pedidos");
      }
      closeCmdk();
      const target = document.querySelector(`.${btn.dataset.goto === "empresas" ? "dossie" : "ticket"}[data-id="${btn.dataset.id}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.style.outline = "2px solid var(--stamp-red)";
        setTimeout(() => (target.style.outline = ""), 1500);
      }
    });
  });
}

/* ============================================================
   CATÁLOGO — catálogo de produtos + carrinho ("Novo pedido")
   e Catálogo — administração (import de planilha + tabela)
   ============================================================ */

const FRANQUIA_COLORS = {
  'Harry Potter': '#0050C3',
  'Friends': '#0050C3',
  'Geral': '#0050C3',
};
const CATEGORY_ICON = { 'Térmicos':'🧴', 'Têxteis':'👜', 'Capinhas':'📱', 'Malas':'🧳' };

function categoriaFor(produto) {
  const p = produto.toLowerCase();
  if (p.includes('mala')) return 'Malas';
  if (p.includes('tote') || p.includes('mochila') || p.includes('bolsa') || p.includes('necessaire') || p.includes('lancheira')) return 'Têxteis';
  if (p.includes('garrafa') || p.includes('copo') || p.includes('taça') || p.includes('térmic')) return 'Térmicos';
  if (p.includes('capinha')) return 'Capinhas';
  return 'Outros';
}

/* ---------- Racional de código interno (v2 — compacto) ----------
   Formato: {CATEGORIA-2}{SEQ-3} → 5 caracteres, ex: TX047, TR012, CP003, ML005
   - 2 letras fixas por categoria (TX=Têxteis, TR=Térmicos, CP=Capinhas, ML=Malas, OT=Outros)
   - 3 dígitos sequenciais, numerados dentro de cada categoria
   - É buscável: digitar "TX" no campo de busca do catálogo filtra só têxteis; digitar o
     código completo (ex "TX047") acha o item exato. ---------- */
const CATEGORIA_SHORT = { 'Térmicos':'TR', 'Têxteis':'TX', 'Capinhas':'CP', 'Malas':'ML', 'Outros':'OT' };
const categorySeqCounters = {};
function nextCategorySeq(categoria) {
  categorySeqCounters[categoria] = (categorySeqCounters[categoria] || 0) + 1;
  return categorySeqCounters[categoria];
}
function buildCodigo(p) {
  const prefix = CATEGORIA_SHORT[p.categoria] || 'OT';
  return prefix + String(p.seq).padStart(3, '0');
}
const COLOR_CODE_MAP = {
  'preto':1, 'branco':1, 'rosa':1, 'rosa claro':1, 'vinho':1, 'bordô':1,
  'lilás':1, 'roxo':1, 'azul':1, 'azul marinho':1, 'azul claro':1, 'verde':1,
  'vermelho':1, 'nude':1, 'bege':1, 'cinza':1, 'dourado':1, 'prateado':1,
  'laranja':1, 'amarelo':1, 'pink':1, 'marrom':1, 'off-white':1,
};
function detectColorFromText(text) {
  const t = text.toLowerCase();
  for (const cor of Object.keys(COLOR_CODE_MAP)) {
    if (t.includes(cor)) return cor;
  }
  return null;
}

// Catálogo agora vive no banco de dados (tabela `products`), com CRUD real —
// antes ficava hardcoded aqui e qualquer alteração do admin (preço, cor, remover,
// importar) não persistia nem aparecia para os outros usuários. PRODUCTS é
// preenchido de forma assíncrona por loadProducts() (chamado no boot() e no
// polling de sincronização — ver startLivePolling()).
let PRODUCTS = [];

async function loadProducts() {
  try {
    const rows = await api("/api/products");
    PRODUCTS.length = 0;
    rows.forEach((r) => {
      PRODUCTS.push({
        id: r.id,
        produto: r.produto,
        estampa: r.estampa || '',
        franquia: r.franquia || '',
        categoria: r.categoria || '',
        cor: r.cor || '',
        linha: r.linha || '',
        price: Number(r.price) || 0,
        seq: Number(r.seq) || 0,
        image: r.image || '',
        dedupKey: r.dedup_key || '',
      });
    });
  } catch (err) {
    console.error('Falha ao carregar catálogo:', err);
  }
}

/* ---------- Critérios de importação (mesmos do catalogador — base separada) ---------- */
const KNOWN_PRODUTO_KEYS = [
  'Garrafa Térmica Fresh 650', 'Garrafa Fresh 650', 'Garrafa Térmica Fresh 950', 'Garrafa Fresh 950',
  'Garrafa Mini 350', 'Garrafa Pro 750', 'Garrafa Flip Pro', 'Garrafa Magsafe', 'Garrafa Urban',
  'Copo Térmico Life 1170', 'Copo Life 1170', 'Copo Life 1,2', 'Copo Térmico Life 880', 'Copo Life 880', 'Copo Life 0,9',
  'Copo Vibe', 'Taça Térmica',
  'Tote Puffer', 'Tote Puff', 'Tote Daily', 'Tote Pop', 'Tote Mini',
  'Mala Trip', 'Mala Joy',
  'Mochila Executiva', 'Mochila Voyage', 'Mochila Fun', 'Mochila Pop',
  'Bolsa Térmica Fruit Pro', 'Bolsa de Garrafa', 'Bolsa Voyage', 'Bolsa Moove', 'Bolsa Joy',
  'Necessaire Makup', 'Necessaire Makeup', 'Necessaire Trip', 'Necessaire Puffer',
  'Lancheira Fruit', 'Capinha',
  // Fallbacks genéricos (sem tamanho no nome) — checados por último, depois de todas as
  // variantes específicas acima, para não engolir nomes que já trazem o tamanho certo.
  'Garrafa Fresh', 'Garrafa Mini', 'Garrafa Pro', 'Copo Life',
];
const PRODUTO_ALIASES = {
  'Garrafa Térmica Fresh 650': 'Garrafa Fresh 650',
  'Garrafa Térmica Fresh 950': 'Garrafa Fresh 950',
  'Copo Térmico Life 1170': 'Copo Life 1170',
  'Copo Life 1,2': 'Copo Life 1170',
  'Copo Térmico Life 880': 'Copo Life 880',
  'Copo Life 0,9': 'Copo Life 880',
  'Necessaire Makup': 'Necessaire Makeup',
  'Tote Puff': 'Tote Puffer',
  // Fallbacks genéricos → variante padrão quando o nome não informa o tamanho
  'Garrafa Fresh': 'Garrafa Fresh 650',
  'Garrafa Mini': 'Garrafa Mini 350',
  'Garrafa Pro': 'Garrafa Pro 750',
  'Copo Life': 'Copo Life 880',
};
function matchProduto(str) {
  let normalized = str.trim().replace(/(\d+)\s*(ml|l|kg|g)\s*$/i, '$1').trim();
  normalized = normalized.replace(/\s*\+\s*ebook\s*$/i, '').trim();
  normalized = normalized.replace(/^(Garrafa|Copo)\s+T[ée]rmic[ao]\s+/i, '$1 ');
  const lower = normalized.toLowerCase();
  for (const key of KNOWN_PRODUTO_KEYS) {
    if (lower.startsWith(key.toLowerCase())) return PRODUTO_ALIASES[key] || key;
  }
  return null; // → Capinha
}

const FRANQUIA_KEYWORDS = [
  { franquia: 'Harry Potter', keywords: ['harry potter','hogwarts','grifinória','sonserina','corvinal','lufa-lufa','dobby','maroto','pomo'] },
  { franquia: 'Friends', keywords: ['friends','central perk','monica'] },
];
function detectFranquiaFromText(text) {
  const t = text.toLowerCase();
  for (const f of FRANQUIA_KEYWORDS) if (f.keywords.some(k => t.includes(k))) return f.franquia;
  return null;
}
function franquiaFromUrl(url) {
  const m = String(url || '').match(/\/collections\/([^/?]+)/);
  if (!m) return null;
  return m[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// TABELA DE PREÇO DO CANAL DE REVENDA — importada de TABELA_DE_PREÇO_PROJETO_REPRESENTANTE.xlsx (aba "Canal Revendas").
const PRICE_TABLE = [
  { key: 'Garrafa Fresh 650', price: 84.94 }, { key: 'Garrafa Fresh 950', price: 90.61 },
  { key: 'Garrafa Mini 350', price: 73.61 }, { key: 'Garrafa Pro 750', price: 112.77 },
  { key: 'Garrafa Flip Pro', price: 132.67 },
  { key: 'Garrafa Magsafe', price: 146.77 }, { key: 'Garrafa Urban', price: 61.77 },
  { key: 'Copo Life 1170', price: 118.43 }, { key: 'Copo Life 880', price: 107.10 },
  { key: 'Copo Vibe', price: 78.77 }, { key: 'Taça Térmica', price: 118.43 },
  { key: 'Tote Puffer', price: 152.43 }, { key: 'Tote Daily', price: 124.10 },
  { key: 'Tote Pop', price: 112.77 }, { key: 'Tote Mini', price: 124.10 },
  { key: 'Mala Trip', price: 282.70 }, { key: 'Mala Joy', price: 135.43 },
  { key: 'Mochila Executiva', price: 152.43 }, { key: 'Mochila Voyage', price: 220.43 },
  { key: 'Mochila Fun', price: 186.43 }, { key: 'Mochila Pop', price: 112.77 },
  { key: 'Bolsa Térmica Fruit Pro', price: 133.27 }, { key: 'Bolsa de Garrafa', price: 109.00 },
  { key: 'Bolsa Voyage', price: 246.00 }, { key: 'Bolsa Moove', price: 118.43 }, { key: 'Bolsa Joy', price: 146.00 },
  { key: 'Necessaire Makeup', price: 61.77 }, { key: 'Necessaire Trip', price: 44.77 }, { key: 'Necessaire Puffer', price: 33.94 },
  { key: 'Lancheira Fruit', price: 130.33 }, { key: 'Capinha', price: 26.41 },
];
const PRICE_TABLE_LISOS = [
  { key: 'Garrafa Fresh 650', price: 73.61 }, { key: 'Garrafa Fresh 950', price: 79.28 },
  { key: 'Garrafa Mini 350', price: 62.28 }, { key: 'Garrafa Pro 750', price: 101.43 },
  { key: 'Garrafa Flip Pro', price: 115.42 },
  { key: 'Garrafa Magsafe', price: 129.77 }, { key: 'Garrafa Urban', price: 50.94 },
  { key: 'Copo Life 1170', price: 107.10 }, { key: 'Copo Life 880', price: 95.77 },
  { key: 'Copo Vibe', price: 67.43 }, { key: 'Taça Térmica', price: 118.43 },
  { key: 'Tote Puffer', price: 152.43 }, { key: 'Tote Daily', price: 112.77 },
  { key: 'Tote Pop', price: 101.43 }, { key: 'Tote Mini', price: 107.10 },
  { key: 'Mala Trip', price: 270.11 }, { key: 'Mala Joy', price: 124.10 },
  { key: 'Mochila Executiva', price: 135.43 }, { key: 'Mochila Voyage', price: 209.10 },
  { key: 'Mochila Fun', price: 186.43 }, { key: 'Mochila Pop', price: 101.43 },
  { key: 'Bolsa Térmica Fruit Pro', price: 133.27 }, { key: 'Bolsa de Garrafa', price: 109.00 },
  { key: 'Bolsa Voyage', price: 246.00 }, { key: 'Bolsa Moove', price: 101.43 }, { key: 'Bolsa Joy', price: 146.00 },
  { key: 'Necessaire Makeup', price: 61.77 }, { key: 'Necessaire Trip', price: 39.61 }, { key: 'Necessaire Puffer', price: 33.94 },
  { key: 'Lancheira Fruit', price: 113.28 }, { key: 'Capinha', price: 26.41 },
];
function getPrice(produto, table) {
  const clean = produto.toLowerCase();
  for (const entry of table) if (clean.includes(entry.key.toLowerCase())) return entry.price;
  return null;
}

function parseName(name) {
  const parts = name.split(' - ').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const matched = matchProduto(parts[0]);
    return { produto: matched || parts[0].replace(/\s*\+\s*ebook\s*$/i, '').trim(), colecao: parts[1], estampa: parts.slice(2).join(' - ') };
  }
  if (parts.length === 2) {
    const knownFranquias = FRANQUIA_KEYWORDS.map(f => f.franquia.toLowerCase());
    if (knownFranquias.includes(parts[0].toLowerCase())) return { produto: 'Capinha', colecao: parts[0], estampa: parts[1] };
    const matched = matchProduto(parts[0]);
    return { produto: matched || parts[0].replace(/\s*\+\s*ebook\s*$/i, '').trim(), colecao: '', estampa: parts[1] };
  }
  const matched = matchProduto(name);
  return { produto: matched || 'Capinha', colecao: 'Geral', estampa: '' };
}

function stripBrindeSuffix(str) {
  return String(str || '')
    .replace(/\s*\(?\+\s*e-?book\)?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function runImport(rows, linha, franquiaOverride) {
  // Antes esta função só empurrava objetos pro array PRODUCTS em memória (sumia ao
  // recarregar a página). Agora monta a lista de itens novos e manda pro banco via
  // /api/products/bulk (que já faz a deduplicação e a numeração de sequência do lado
  // do servidor); depois recarrega PRODUCTS a partir do banco pra refletir o estado real.
  let skippedLocal = 0;
  const existingDedupKeys = new Set(PRODUCTS.map(p => p.dedupKey));
  const table = linha === 'Lisa' ? PRICE_TABLE_LISOS : PRICE_TABLE;
  const toCreate = [];
  for (const rawRow of rows) {
    const row = {};
    Object.keys(rawRow).forEach(k => { row[k.toLowerCase().trim()] = rawRow[k]; });
    const name = stripBrindeSuffix(row['name']);
    if (!name) { skippedLocal++; continue; }
    const image = String(row['image'] || '').trim();
    const isFormatA = !!row['web_scraper_start_url'];
    const parsed = parseName(name);
    let franquia = franquiaOverride || null;
    if (!franquia && isFormatA) franquia = franquiaFromUrl(row['web_scraper_start_url']);
    if (!franquia) franquia = detectFranquiaFromText(name) || parsed.colecao || 'Geral';
    let produtoFinal = PRODUTO_ALIASES[parsed.produto] || parsed.produto;
    const isKnownProduto = produtoFinal === 'Capinha' || KNOWN_PRODUTO_KEYS.some((k) => (PRODUTO_ALIASES[k] || k) === produtoFinal);
    if (!isKnownProduto && /iphone|galaxy|infiniteair|antiimpacto|slimair|impactoslim/i.test(image)) {
      // Nome não bateu com nenhum produto conhecido (ex: "Harry Potter E A Câmara Secreta - Colagem"),
      // mas a imagem é claramente de uma capinha de celular — assume Capinha em vez do texto cru.
      produtoFinal = 'Capinha';
    }
    let price = null;
    if (row['price'] !== undefined && row['price'] !== '') {
      const parsedPrice = parseFloat(String(row['price']).replace(',', '.'));
      if (!isNaN(parsedPrice) && parsedPrice > 0) price = parsedPrice;
    }
    if (!price) price = getPrice(produtoFinal, table);
    if (!price) price = 0;
    const dedupKey = name.toLowerCase() + '|' + image;
    if (existingDedupKeys.has(dedupKey)) { skippedLocal++; continue; }
    existingDedupKeys.add(dedupKey);
    const corFromName = detectColorFromText(name);
    const categoriaImportada = categoriaFor(produtoFinal);
    toCreate.push({
      produto: produtoFinal,
      colecao: parsed.colecao || franquia,
      estampa: parsed.estampa,
      franquia,
      categoria: categoriaImportada,
      price,
      cor: corFromName || '',
      image, dedupKey, linha,
    });
  }
  let serverAdded = 0, serverSkipped = 0;
  if (toCreate.length > 0) {
    try {
      const result = await api('/api/products/bulk', { method: 'POST', body: JSON.stringify({ products: toCreate }) });
      serverAdded = result.added || 0;
      serverSkipped = result.skipped || 0;
    } catch (err) {
      console.error('Falha ao importar produtos:', err);
      throw err;
    }
  }
  await loadProducts();
  return { added: serverAdded, skipped: skippedLocal + serverSkipped };
}

const catalogState = { franquia: '', categoria: '', text: '', cart: {}, freshSize: {} };

// ---------- Tamanhos da Garrafa Fresh (650ML / 950ML) ----------
// Cada card de Garrafa Fresh oferece essas 2 opções na hora de adicionar ao pedido,
// em vez de um "+" único. O código mantém o mesmo prefixo/sequência do produto:
// 650ML sem sufixo, 950ML com sufixo "M".
const GARRAFA_FRESH_SIZES = [
  { key: '650', label: '650ML', suffix: '', priceKey: 'Garrafa Fresh 650' },
  { key: '950', label: '950ML', suffix: 'M', priceKey: 'Garrafa Fresh 950' },
];
function isFreshBottle(p) {
  return p.produto === 'Garrafa Fresh 650' || p.produto === 'Garrafa Fresh 950';
}
// Nome de exibição sem o tamanho "cravado": produto importado guarda "Garrafa Fresh 650"
// como valor interno (usado pra achar preço/categoria), mas na tela e no webhook o
// tamanho certo é o que a pessoa selecionou no card — por isso tiramos o número fixo daqui.
function displayProdutoName(p) {
  return isFreshBottle(p) ? p.produto.replace(/\s+\d+$/, '') : p.produto;
}
// Resolve uma chave de carrinho (id simples, ou "id::tamanho" pra Garrafa Fresh)
// no produto base + preço/código/rótulo já considerando o tamanho escolhido.
function resolveCartEntry(cartKey) {
  const [id, sizeKey] = cartKey.split('::');
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return null;
  if (!sizeKey) {
    return { product: p, price: p.price, codigo: buildCodigo(p), sizeLabel: null };
  }
  const sizeInfo = GARRAFA_FRESH_SIZES.find((s) => s.key === sizeKey);
  const table = p.linha === 'Lisa' ? PRICE_TABLE_LISOS : PRICE_TABLE;
  const price = getPrice(sizeInfo.priceKey, table) ?? p.price;
  return { product: p, price, codigo: buildCodigo(p) + sizeInfo.suffix, sizeLabel: sizeInfo.label };
}

function franquiaList() { return [...new Set(PRODUCTS.map(p => p.franquia))].sort((a,b)=>a.localeCompare(b)); }
function categoriaList() { return [...new Set(PRODUCTS.map(p => p.categoria))].sort((a,b)=>a.localeCompare(b)); }

function filteredProducts() {
  return PRODUCTS.filter(p => {
    if (catalogState.franquia && p.franquia !== catalogState.franquia) return false;
    if (catalogState.categoria && p.categoria !== catalogState.categoria) return false;
    if (catalogState.text) {
      const t = catalogState.text.toLowerCase();
      if (!(p.produto.toLowerCase().includes(t) || p.estampa.toLowerCase().includes(t) || buildCodigo(p).toLowerCase().includes(t))) return false;
    }
    return true;
  });
}

function renderChips() {
  const fEl = document.getElementById('chips-franquia');
  const cEl = document.getElementById('chips-categoria');
  const availableFranquias = new Set(PRODUCTS.filter(p => !catalogState.categoria || p.categoria === catalogState.categoria).map(p => p.franquia));
  const availableCategorias = new Set(PRODUCTS.filter(p => !catalogState.franquia || p.franquia === catalogState.franquia).map(p => p.categoria));

  fEl.innerHTML = ['', ...franquiaList()].map(f => {
    const label = f || 'Todas';
    const active = catalogState.franquia === f;
    const unavailable = f && !availableFranquias.has(f);
    return `<button class="filter-chip ${active ? 'is-active' : ''} ${unavailable ? 'chip-unavailable' : ''}" data-franquia="${f}">${label}${active && f ? '<span class="filter-chip__clear" data-clear-franquia>×</span>' : ''}</button>`;
  }).join('');

  cEl.innerHTML = ['', ...categoriaList()].map(c => {
    const label = c || 'Todas';
    const active = catalogState.categoria === c;
    const unavailable = c && !availableCategorias.has(c);
    return `<button class="filter-chip ${active ? 'is-active' : ''} ${unavailable ? 'chip-unavailable' : ''}" data-categoria="${c}">${label}${active && c ? '<span class="filter-chip__clear" data-clear-categoria>×</span>' : ''}</button>`;
  }).join('');

  fEl.querySelectorAll('[data-franquia]').forEach(btn => btn.addEventListener('click', () => { catalogState.franquia = btn.dataset.franquia; renderCatalogAll(); }));
  cEl.querySelectorAll('[data-categoria]').forEach(btn => btn.addEventListener('click', () => { catalogState.categoria = btn.dataset.categoria; renderCatalogAll(); }));
  fEl.querySelectorAll('[data-clear-franquia]').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); catalogState.franquia = ''; renderCatalogAll(); }));
  cEl.querySelectorAll('[data-clear-categoria]').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); catalogState.categoria = ''; renderCatalogAll(); }));
}

function renderGrid() {
  const grid = document.getElementById('catalog-grid');
  const list = filteredProducts();
  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-catalog">Nenhum produto encontrado com esses filtros.</div>';
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="product-card">
      <div class="product-card__thumb ${p.image ? 'has-image' : ''}" style="${p.image ? '' : `background:${FRANQUIA_COLORS[p.franquia] || FRANQUIA_COLORS.Geral}`}">
        ${p.image
          ? `<img src="${p.image}" alt="${p.produto}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.parentElement.classList.remove('has-image'); this.parentElement.style.background='${FRANQUIA_COLORS[p.franquia] || FRANQUIA_COLORS.Geral}';" /><span style="display:none; position:absolute; inset:0; align-items:center; justify-content:center; font-size:34px;">${CATEGORY_ICON[p.categoria] || '📦'}</span>`
          : `<span>${CATEGORY_ICON[p.categoria] || '📦'}</span>`
        }
      </div>
      <div class="product-card__body">
        <div class="product-card__estampa-main">${p.estampa || 'Sem estampa (linha Lisa)'}</div>
        <div class="product-card__produto-sub">${displayProdutoName(p)}</div>
        ${(() => {
          const isFresh = isFreshBottle(p);
          const selected = isFresh ? (catalogState.freshSize[p.id] || null) : null;
          const selectedInfo = selected ? GARRAFA_FRESH_SIZES.find(s => s.key === selected) : null;
          const codigoExibido = selectedInfo ? buildCodigo(p) + selectedInfo.suffix : buildCodigo(p);
          const tagsRow = `
        <div class="product-card__tags-row">
          <span class="product-card__franq-tag">${p.franquia}</span>
          <span class="product-card__code-tag">${codigoExibido}</span>
        </div>`;
          if (!isFresh) {
            return `${tagsRow}
        <div class="product-card__foot">
          <span class="product-card__price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
          <button class="product-card__add" data-add="${p.id}">+</button>
        </div>`;
          }
          const table = p.linha === 'Lisa' ? PRICE_TABLE_LISOS : PRICE_TABLE;
          const selectedPrice = selectedInfo ? (getPrice(selectedInfo.priceKey, table) ?? p.price) : null;
          return `${tagsRow}
        <div class="product-card__sizes">
          ${GARRAFA_FRESH_SIZES.map(s => `<button class="product-card__size-btn ${s.key === selected ? 'is-active' : ''}" data-size-select="${p.id}" data-size="${s.key}">${s.label}</button>`).join('')}
        </div>
        <div class="product-card__foot">
          <span class="product-card__price">${selectedPrice !== null ? 'R$ ' + selectedPrice.toFixed(2).replace('.', ',') : 'Selecione o tamanho'}</span>
          <button class="product-card__add" data-add="${p.id}" data-size="${selected || ''}" ${selected ? '' : 'disabled'}>+</button>
        </div>`;
        })()}
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('[data-size-select]').forEach(btn => btn.addEventListener('click', () => {
    catalogState.freshSize[btn.dataset.sizeSelect] = btn.dataset.size;
    renderGrid();
  }));
  grid.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => { addToCart(btn.dataset.add, btn.dataset.size || null); }));
}

function addToCart(id, sizeKey) {
  const cartKey = sizeKey ? `${id}::${sizeKey}` : id;
  catalogState.cart[cartKey] = (catalogState.cart[cartKey] || 0) + 1;
  renderCart();
}
function changeQty(cartKey, delta) {
  catalogState.cart[cartKey] = (catalogState.cart[cartKey] || 0) + delta;
  if (catalogState.cart[cartKey] <= 0) delete catalogState.cart[cartKey];
  renderCart();
}
function setQty(cartKey, rawValue) {
  const n = Math.floor(Number(rawValue));
  if (!Number.isFinite(n) || n <= 0) { delete catalogState.cart[cartKey]; }
  else { catalogState.cart[cartKey] = n; }
  renderCart();
}

function renderCart() {
  const listEl = document.getElementById('cart-list');
  const emptyEl = document.getElementById('cart-empty');
  const cartKeys = Object.keys(catalogState.cart);

  if (cartKeys.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    listEl.innerHTML = cartKeys.map(cartKey => {
      const entry = resolveCartEntry(cartKey);
      const p = entry.product;
      const qty = catalogState.cart[cartKey];
      return `
        <div class="cart-item">
          <div class="cart-item__info">
            <div class="cart-item__name">${displayProdutoName(p)}${entry.sizeLabel ? ' · ' + entry.sizeLabel : ''}</div>
            <div class="cart-item__estampa">${p.estampa || 'Linha Lisa'} · ${p.franquia}</div>
          </div>
          <div class="cart-item__qty">
            <button class="qty-btn" data-dec="${cartKey}">−</button><input type="number" class="qty-input" min="1" step="1" inputmode="numeric" value="${qty}" data-qty-input="${cartKey}" /><button class="qty-btn" data-inc="${cartKey}">+</button>
          </div>
          <div class="cart-item__price">R$ ${(entry.price*qty).toFixed(2).replace('.', ',')}</div>
          <button class="cart-item__remove" data-remove="${cartKey}">✕</button>
        </div>`;
    }).join('');
    listEl.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => changeQty(b.dataset.inc, 1)));
    listEl.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => changeQty(b.dataset.dec, -1)));
    listEl.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { delete catalogState.cart[b.dataset.remove]; renderCart(); }));
    listEl.querySelectorAll('[data-qty-input]').forEach(inp => {
      const commit = () => setQty(inp.dataset.qtyInput, inp.value);
      inp.addEventListener('change', commit);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    });
  }

  renderSummary();
}

function fmtCat(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

function computeCartTotals() {
  const ids = Object.keys(catalogState.cart);
  const subtotal = ids.reduce((sum, cartKey) => {
    const entry = resolveCartEntry(cartKey);
    return sum + entry.price * catalogState.cart[cartKey];
  }, 0);

  let volumePct = 0, volumeLabel = '';
  if (subtotal >= 20000) { volumePct = 10; volumeLabel = 'Desconto Volume II (10%)'; }
  else if (subtotal >= 10000) { volumePct = 5; volumeLabel = 'Desconto Volume I (5%)'; }

  const cashOn = document.getElementById('toggle-cash').checked;
  const cashPct = cashOn ? 3 : 0;

  const volumeValue = subtotal * volumePct / 100;
  const afterVolume = subtotal - volumeValue;
  const cashValue = afterVolume * cashPct / 100;
  const total = afterVolume - cashValue;

  return { ids, subtotal, volumePct, volumeLabel, volumeValue, cashOn, cashValue, total };
}

function renderSummary() {
  const { ids, subtotal, volumePct, volumeLabel, volumeValue, cashOn, cashValue, total } = computeCartTotals();

  document.getElementById('sum-subtotal').textContent = fmtCat(subtotal);

  const rowVolume = document.getElementById('row-volume');
  const volumeHint = document.getElementById('volume-hint');
  if (volumePct > 0) {
    rowVolume.style.display = 'flex';
    document.getElementById('label-volume').innerHTML = volumeLabel + ' <span class="discount-badge">auto</span>';
    document.getElementById('sum-volume').textContent = '- ' + fmtCat(volumeValue);
    if (volumeHint) {
      volumeHint.style.display = 'block';
      volumeHint.textContent = volumePct < 10
        ? `Faltam ${fmtCat(20000 - subtotal)} em pedidos para desbloquear 10% de desconto.`
        : 'Desconto de volume máximo (10%) desbloqueado.';
    }
  } else {
    rowVolume.style.display = 'none';
    if (volumeHint) {
      if (subtotal > 0) {
        volumeHint.style.display = 'block';
        volumeHint.textContent = `Desconto de volume bloqueado — faltam ${fmtCat(10000 - subtotal)} para liberar 5%.`;
      } else {
        volumeHint.style.display = 'none';
      }
    }
  }

  const rowCash = document.getElementById('row-cash');
  if (cashOn) {
    rowCash.style.display = 'flex';
    document.getElementById('sum-cash').textContent = '- ' + fmtCat(cashValue);
  } else {
    rowCash.style.display = 'none';
  }

  document.getElementById('sum-total').textContent = fmtCat(total);

  const empresaSelected = document.getElementById('select-empresa').value;
  const btn = document.getElementById('btn-finalizar');
  if (empresaSelected && ids.length > 0) {
    btn.disabled = false;
    btn.textContent = `Finalizar pedido — ${fmtCat(total)}`;
  } else {
    btn.disabled = true;
    btn.textContent = 'Selecione a empresa e adicione itens';
  }
}

function renderCatalogAll() { renderChips(); renderGrid(); }

document.getElementById('search-input').addEventListener('input', (e) => { catalogState.text = e.target.value.trim(); renderGrid(); });
document.getElementById('toggle-cash').addEventListener('change', renderSummary);
document.getElementById('select-empresa').addEventListener('change', (e) => {
  const label = e.target.options[e.target.selectedIndex] ? e.target.options[e.target.selectedIndex].text : '';
  document.getElementById('empresa-status').textContent = e.target.value ? label : 'nenhuma empresa selecionada';
  renderSummary();
});

// Finaliza o pedido de verdade: grava em /api/orders com o valor total calculado
// (subtotal - desconto de volume - desconto à vista) e anexa um resumo dos itens
// do carrinho como documento do pedido, já que a tabela `orders` guarda um valor
// único por pedido (sem itens linha a linha).

const PEDIDO_WEBHOOK_URL = 'https://n8n-study.gogroupgl.com/webhook/pedido-reseller';
const PEDIDO_WEBHOOK_INTERVAL_MS = 2000;
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

// Envia um POST por item do pedido, um de cada vez, com 2s de intervalo entre eles —
// não é um único payload com a lista toda, é uma chamada separada por produto.
async function sendPedidoWebhooks(items, orderCode) {
  const statusEl = document.getElementById('webhook-status');
  statusEl.style.display = 'block';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    statusEl.textContent = `${orderCode ? orderCode + ' — ' : ''}Enviando itens ao webhook… (${i + 1}/${items.length})`;
    try {
      await fetch(PEDIDO_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PEDIDO: orderCode || '',
          NOME: it.nome,
          QUANTIDADE: it.qty,
          'VALOR UNITÁRIO': it.price,
          'VALOR TOTAL': it.total,
          'URL DA IMAGEM': it.image || '',
        }),
      });
    } catch (err) {
      console.error('Falha ao enviar webhook do item', it.nome, err);
    }
    if (i < items.length - 1) await sleep(PEDIDO_WEBHOOK_INTERVAL_MS);
  }
  statusEl.textContent = `${orderCode ? orderCode + ' — ' : ''}Itens enviados ao webhook (${items.length}/${items.length}).`;
  setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
}

// ---------- Resumo do pedido no Google Chat ----------
// Dispara em paralelo com o sendPedidoWebhooks acima (nenhum dos dois espera o outro):
// uma única mensagem compilada com todos os itens, quem vendeu e os totais, em vez de
// uma chamada por item.
const PEDIDO_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAyXjEqe8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=9yUgIyRB3muDu4vfl2gpFYg3VWA19nF-lPG3-XJoS14';

async function sendOrderSummaryToChat(items, meta) {
  const linhasItens = items.map((it) => `• ${it.produto}${it.estampa ? ' - ' + it.estampa : ''} ×${it.qty} — ${fmtCat(it.total)}`);
  const textoPartes = [
    '*🧾 Novo pedido finalizado — Goseller*',
    `*Pedido:* ${meta.orderCode || 'sem código'}`,
    `*Vendedor:* ${meta.vendedor}`,
    `*Empresa:* ${meta.empresaLabel}`,
    '',
    '*Itens:*',
    ...linhasItens,
    '',
    `*Subtotal:* ${fmtCat(meta.subtotal)}`,
  ];
  if (meta.volumePct) textoPartes.push(`*Desconto de volume (${meta.volumePct}%):* -${fmtCat(meta.volumeValue)}`);
  if (meta.cashOn) textoPartes.push('*Desconto à vista (3%):* -' + fmtCat(meta.cashValue));
  textoPartes.push(`*Total: ${fmtCat(meta.total)}*`);

  try {
    await fetch(PEDIDO_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textoPartes.join('\n') }),
    });
  } catch (err) {
    console.error('Falha ao enviar resumo do pedido pro Google Chat', err);
  }
}

document.getElementById('btn-finalizar').addEventListener('click', async () => {
  const companyId = document.getElementById('select-empresa').value;
  const { ids, subtotal, volumePct, volumeValue, cashOn, cashValue, total } = computeCartTotals();
  if (!companyId || ids.length === 0) return;

  const errEl = document.getElementById('pedido-error');
  errEl.textContent = '';

  const items = ids.map((cartKey) => {
    const entry = resolveCartEntry(cartKey);
    const p = entry.product;
    const qty = catalogState.cart[cartKey];
    const produtoLabel = entry.sizeLabel ? `${displayProdutoName(p)} ${entry.sizeLabel}` : displayProdutoName(p);
    const nome = produtoLabel + (p.estampa ? ` - ${p.estampa}` : '');
    return { codigo: entry.codigo, produto: produtoLabel, nome, estampa: p.estampa, franquia: p.franquia, qty, price: entry.price, total: entry.price * qty, image: p.image };
  });

  const empresaSelect = document.getElementById('select-empresa');
  const empresaLabel = empresaSelect.options[empresaSelect.selectedIndex] ? empresaSelect.options[empresaSelect.selectedIndex].text : '';

  const linhas = items.map((it) => `${it.codigo}  ${it.produto}${it.estampa ? ' - ' + it.estampa : ''} (${it.franquia}) x${it.qty}  ${fmtCat(it.total)}`);
  linhas.push('');
  linhas.push(`Subtotal: ${fmtCat(subtotal)}`);
  if (volumePct) linhas.push(`Desconto de volume (${volumePct}%): -${fmtCat(volumeValue)}`);
  if (cashOn) linhas.push(`Desconto à vista (3%): -${fmtCat(cashValue)}`);
  linhas.push(`Total: ${fmtCat(total)}`);
  const resumoBlob = new Blob([linhas.join('\n')], { type: 'text/plain' });

  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const fd = new FormData();
  fd.append('company_id', companyId);
  fd.append('order_value', total.toFixed(2));
  fd.append('document', resumoBlob, 'itens-do-pedido.txt');

  try {
    const res = await fetch('/api/orders', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro na requisição.');
    catalogState.cart = {};
    renderCart();
    await loadOrders();
    loadMyOrders();
    // Os dois webhooks disparam em paralelo — nenhum espera o outro terminar.
    sendPedidoWebhooks(items, data.order_code);
    sendOrderSummaryToChat(items, {
      orderCode: data.order_code,
      vendedor: state.currentUserName || state.currentUserEmail || 'desconhecido',
      empresaLabel,
      subtotal, volumePct, volumeValue, cashOn, cashValue, total,
    });
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    renderSummary();
  }
});

function renderCatalogoTable() {
  const el = document.getElementById('catalogo-table');
  document.getElementById('catalogo-count').textContent = PRODUCTS.length;
  if (PRODUCTS.length === 0) {
    el.innerHTML = '<p class="empty-state">Nenhum produto na base ainda. Importe uma planilha acima.</p>';
    return;
  }
  el.innerHTML = `
    <table class="cat-table">
      <thead><tr><th>Código</th><th>Produto</th><th>Franquia/Coleção</th><th>Cor</th><th>Linha</th><th>Preço</th><th>Imagem (URL)</th><th></th></tr></thead>
      <tbody>
        ${PRODUCTS.map(p => `
          <tr data-row="${p.id}">
            <td class="mono" style="font-size:11px; color:var(--ink-soft);">${buildCodigo(p)}</td>
            <td>${p.produto}${p.estampa ? `<div style="font-size:10.5px; color:var(--stamp-grey);">${p.estampa}</div>` : ''}</td>
            <td>${p.franquia}</td>
            <td><input type="text" class="cor-input" data-cor-input="${p.id}" value="${p.cor || ''}" placeholder="detectar…" style="width:90px; font-size:11.5px; padding:4px 6px; border:1px solid var(--line); border-radius:8px;" /></td>
            <td><span class="cat-table__linha-tag">${p.linha === 'Lisa' ? 'Lisa' : 'Padrão'}</span></td>
            <td>
              <div style="display:flex; align-items:center; gap:3px;">
                <span class="mono" style="font-size:11px; color:var(--stamp-grey);">R$</span>
                <input type="text" class="mono ${p.price === 0 ? 'price-input--zero' : ''}" data-price-input="${p.id}" value="${p.price.toFixed(2).replace('.', ',')}" style="width:64px; font-size:12px; padding:4px 6px; border:1px solid ${p.price === 0 ? 'var(--stamp-red)' : 'var(--line)'}; border-radius:8px;" />
              </div>
            </td>
            <td><input type="text" class="image-input" data-image-input="${p.id}" value="${p.image || ''}" placeholder="https://…" style="width:160px; font-size:11px; padding:4px 6px; border:1px solid var(--line); border-radius:8px; font-family:monospace;" title="Cole aqui o URL da imagem do produto" /></td>
            <td><button class="cat-table__remove" data-remove-product="${p.id}">remover</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  el.querySelectorAll('[data-remove-product]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.removeProduct;
      btn.disabled = true;
      try {
        await api(`/api/products/${id}`, { method: 'DELETE' });
        const idx = PRODUCTS.findIndex(p => p.id === id);
        if (idx > -1) PRODUCTS.splice(idx, 1);
        renderCatalogoTable();
        renderCatalogAll();
        renderCart();
      } catch (err) {
        alert('Não foi possível remover: ' + err.message);
        btn.disabled = false;
      }
    });
  });
  el.querySelectorAll('[data-cor-input]').forEach(input => {
    input.addEventListener('change', async () => {
      const p = PRODUCTS.find(x => x.id === input.dataset.corInput);
      if (!p) return;
      const cor = input.value.trim();
      try {
        await api(`/api/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ cor }) });
        p.cor = cor;
        renderCatalogoTable();
      } catch (err) {
        alert('Não foi possível salvar a cor: ' + err.message);
        input.value = p.cor || '';
      }
    });
  });
  el.querySelectorAll('[data-price-input]').forEach(input => {
    input.addEventListener('change', async () => {
      const p = PRODUCTS.find(x => x.id === input.dataset.priceInput);
      const parsed = parseFloat(input.value.replace(',', '.'));
      if (!p || isNaN(parsed) || parsed < 0) return;
      try {
        await api(`/api/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ price: parsed }) });
        p.price = parsed;
        renderCatalogoTable(); renderCatalogAll(); renderCart();
      } catch (err) {
        alert('Não foi possível salvar o preço: ' + err.message);
        input.value = p.price.toFixed(2).replace('.', ',');
      }
    });
  });
  el.querySelectorAll('[data-image-input]').forEach(input => {
    input.addEventListener('change', async () => {
      const p = PRODUCTS.find(x => x.id === input.dataset.imageInput);
      if (!p) return;
      const imageUrl = input.value.trim();
      try {
        await api(`/api/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ image: imageUrl }) });
        p.image = imageUrl;
        renderCatalogoTable(); renderCatalogAll(); renderCart();
      } catch (err) {
        alert('Não foi possível salvar a imagem: ' + err.message);
        input.value = p.image || '';
      }
    });
  });
}

document.getElementById('btn-clear-base').addEventListener('click', async () => {
  if (!confirm('Remover todos os produtos da base? Essa ação não pode ser desfeita — afeta todos os usuários.')) return;
  try {
    await api('/api/products', { method: 'DELETE' });
    PRODUCTS.length = 0;
    renderCatalogoTable();
    renderCatalogAll();
    renderCart();
  } catch (err) {
    alert('Não foi possível limpar a base: ' + err.message);
  }
});

function readFileRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet, { defval: '' }));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('falha ao ler o arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ---------- Importar planilha de PEDIDO (Pedido atual) ----------
// Diferente do import do Catálogo (que cadastra produtos novos), este import lê uma
// planilha de itens + quantidades e joga direto no carrinho do pedido em andamento,
// casando cada linha com um produto já existente na base (por código ou por nome).
const toggleBtnPedidoImport = document.getElementById('btn-toggle-pedido-import');
const pedidoImportPanel = document.getElementById('pedido-import-panel');
if (toggleBtnPedidoImport && pedidoImportPanel) {
  toggleBtnPedidoImport.addEventListener('click', () => {
    pedidoImportPanel.classList.toggle('is-open');
  });
}

function normalizeKey(s) {
  return String(s || '').trim().toLowerCase();
}
function getRowValue(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((k) => normalizeKey(k) === alias);
    if (found !== undefined && String(row[found]).trim() !== '') return row[found];
  }
  return '';
}

// Tenta achar o produto (e o tamanho, no caso da Garrafa Fresh) a partir do código
// exibido no catálogo (ex: TX047, ou TX047M pra variante 950ml) ou, na falta dele,
// por nome + estampa + franquia (todos opcionais, usados pra desempatar).
function matchPedidoRow(codigoRaw, produtoRaw, estampaRaw, franquiaRaw, tamanhoRaw) {
  const codigo = normalizeKey(codigoRaw).replace(/\s+/g, '');
  if (codigo) {
    for (const p of PRODUCTS) {
      const base = buildCodigo(p).toLowerCase();
      if (isFreshBottle(p)) {
        for (const s of GARRAFA_FRESH_SIZES) {
          if ((base + s.suffix.toLowerCase()) === codigo) return { product: p, sizeKey: s.key };
        }
      }
      if (base === codigo) {
        return { product: p, sizeKey: isFreshBottle(p) ? (p.produto.includes('950') ? '950' : '650') : null };
      }
    }
  }

  const produto = normalizeKey(produtoRaw);
  if (!produto) return null;
  const estampa = normalizeKey(estampaRaw);
  const franquia = normalizeKey(franquiaRaw);

  let candidates = PRODUCTS.filter((p) => {
    const nomeP = normalizeKey(p.produto);
    return nomeP.includes(produto) || produto.includes(nomeP);
  });
  if (candidates.length > 1 && estampa) {
    const narrowed = candidates.filter((p) => normalizeKey(p.estampa).includes(estampa));
    if (narrowed.length) candidates = narrowed;
  }
  if (candidates.length > 1 && franquia) {
    const narrowed = candidates.filter((p) => normalizeKey(p.franquia).includes(franquia));
    if (narrowed.length) candidates = narrowed;
  }
  if (candidates.length !== 1) return null;

  const p = candidates[0];
  let sizeKey = isFreshBottle(p) ? (p.produto.includes('950') ? '950' : '650') : null;
  const tamanho = normalizeKey(tamanhoRaw);
  if (isFreshBottle(p) && tamanho) {
    if (tamanho.includes('950')) sizeKey = '950';
    else if (tamanho.includes('650')) sizeKey = '650';
  }
  return { product: p, sizeKey };
}

function runPedidoImport(rows) {
  let added = 0;
  const notFound = [];
  for (const row of rows) {
    const codigo = getRowValue(row, ['codigo', 'código', 'code', 'cod']);
    const produto = getRowValue(row, ['produto', 'item', 'nome', 'descricao', 'descrição', 'description']);
    const estampa = getRowValue(row, ['estampa', 'print', 'desenho']);
    const franquia = getRowValue(row, ['franquia', 'coleção', 'colecao', 'licenca', 'licença']);
    const tamanho = getRowValue(row, ['tamanho', 'size', 'ml', 'volume']);
    const qtdRaw = getRowValue(row, ['quantidade', 'qtd', 'qtde', 'quantity', 'qty']);

    if (!codigo && !produto) continue; // linha vazia — ignora silenciosamente

    const match = matchPedidoRow(codigo, produto, estampa, franquia, tamanho);
    if (!match) {
      notFound.push(String(codigo || produto));
      continue;
    }
    const qty = Math.max(1, Math.floor(Number(String(qtdRaw).replace(',', '.'))) || 1);
    const cartKey = match.sizeKey ? `${match.product.id}::${match.sizeKey}` : match.product.id;
    catalogState.cart[cartKey] = (catalogState.cart[cartKey] || 0) + qty;
    added += qty;
  }
  return { added, notFound };
}

document.getElementById('btn-run-pedido-import')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('pedido-import-file');
  const resultEl = document.getElementById('pedido-import-result');
  const file = fileInput.files[0];

  if (!file) {
    resultEl.textContent = 'Selecione um arquivo (.csv, .xlsx ou .xls) antes de importar.';
    resultEl.className = 'import-panel__result is-visible is-error';
    return;
  }

  resultEl.textContent = 'Lendo planilha…';
  resultEl.className = 'import-panel__result is-visible';

  try {
    const rows = await readFileRows(file);
    const { added, notFound } = runPedidoImport(rows);
    renderCart();
    if (added > 0) {
      resultEl.innerHTML = `<b>${added}</b> unidade(s) adicionada(s) ao pedido.` +
        (notFound.length ? `<br>Não encontrados (adicione manualmente): ${notFound.map(escapeHtml).join(', ')}` : '');
      resultEl.className = 'import-panel__result is-visible is-ok';
    } else {
      resultEl.innerHTML = 'Nenhum item reconhecido nesta planilha.' +
        (notFound.length ? `<br>Não encontrados: ${notFound.map(escapeHtml).join(', ')}` : '');
      resultEl.className = 'import-panel__result is-visible is-error';
    }
  } catch (err) {
    resultEl.textContent = `Erro ao ler o arquivo: ${err.message}`;
    resultEl.className = 'import-panel__result is-visible is-error';
  }
});

document.getElementById('btn-run-import').addEventListener('click', async () => {
  const fileInput = document.getElementById('import-file');
  const resultEl = document.getElementById('import-result');
  const linha = document.querySelector('input[name="linha-import"]:checked').value;
  const franquiaOverride = document.getElementById('import-franquia-override').value.trim();
  const files = Array.from(fileInput.files);

  if (files.length === 0) {
    resultEl.textContent = 'Selecione um ou mais arquivos (.csv, .xlsx ou .xls) antes de importar.';
    resultEl.className = 'import-panel__result is-visible is-error';
    return;
  }

  resultEl.textContent = `Lendo ${files.length} arquivo(s)…`;
  resultEl.className = 'import-panel__result is-visible';

  let totalAdded = 0, totalSkipped = 0;
  const perFile = [];
  for (const file of files) {
    try {
      const rows = await readFileRows(file);
      const { added, skipped } = await runImport(rows, linha, franquiaOverride);
      totalAdded += added; totalSkipped += skipped;
      perFile.push(`${file.name}: +${added}${skipped ? ` (${skipped} ignorado)` : ''}`);
    } catch (err) {
      perFile.push(`${file.name}: erro ao importar (${err.message})`);
    }
  }

  resultEl.innerHTML = `Importação concluída: <b>${totalAdded}</b> produto(s) adicionado(s) de ${files.length} arquivo(s), ${totalSkipped} ignorado(s) no total.<br><span style="opacity:.7">${perFile.join(' · ')}</span>`;
  resultEl.className = 'import-panel__result is-visible ' + (totalAdded > 0 ? 'is-ok' : 'is-error');
  renderCatalogAll();
  renderCart();
  renderCatalogoTable();
});

async function imageUrlToBase64(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('não consegui buscar a imagem (CORS ou URL inválida)');
  const blob = await resp.blob();
  const mediaType = blob.type || 'image/jpeg';
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { mediaType, base64 };
}

async function detectColorForProduct(p) {
  const { mediaType, base64 } = await imageUrlToBase64(p.image);
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Qual é a cor predominante deste produto? Responda só com uma palavra ou expressão curta em português, minúscula, sem pontuação (ex: preto, rosa, vinho, nude, lilás, azul marinho).' },
        ],
      }],
    }),
  });
  if (!resp.ok) throw new Error('erro na API (' + resp.status + ')');
  const data = await resp.json();
  const textBlock = (data.content || []).find(c => c.type === 'text');
  return textBlock ? textBlock.text.trim().toLowerCase().replace(/[.,!]$/, '') : null;
}

document.getElementById('btn-detect-colors').addEventListener('click', async () => {
  const btn = document.getElementById('btn-detect-colors');
  const statusEl = document.getElementById('detect-colors-status');
  const targets = PRODUCTS.filter(p => !p.cor && p.image);

  if (targets.length === 0) {
    statusEl.textContent = 'Nenhum item sem cor com imagem pra analisar (itens sem imagem precisam de cor manual).';
    return;
  }

  btn.disabled = true;
  let done = 0, failed = 0;
  for (const p of targets) {
    statusEl.textContent = `Analisando ${done + failed + 1}/${targets.length}: ${p.produto}…`;
    try {
      const cor = await detectColorForProduct(p);
      if (cor) p.cor = cor;
      done++;
    } catch (err) {
      failed++;
    }
    renderCatalogoTable();
  }
  btn.disabled = false;
  statusEl.textContent = `Concluído: ${done} cor(es) detectada(s), ${failed} falha(s) (provavelmente CORS bloqueando a imagem — nesse caso, digite a cor manualmente na tabela).`;
});

// ---------- Autenticação / boot ----------
function hideBootLoading() {
  const bootLoading = document.getElementById("boot-loading");
  if (bootLoading) bootLoading.style.display = "none";
}

function showLoginScreen() {
  const shell = document.getElementById("shell");
  const login = document.getElementById("login-screen");
  if (shell) shell.style.display = "none";
  if (login) login.hidden = false;
  hideBootLoading();
}

function showApp() {
  const shell = document.getElementById("shell");
  const login = document.getElementById("login-screen");
  if (shell) shell.style.display = "";
  if (login) login.hidden = true;
  hideBootLoading();
}

// ---------- Login com Google (redirecionamento OAuth) ----------
// Se a volta do Google trouxer um erro na URL (?google_error=...), mostra na tela de
// login e limpa a URL pra não repetir a mensagem se a pessoa atualizar a página.
function checkGoogleLoginError() {
  const params = new URLSearchParams(location.search);
  const message = params.get("google_error");
  if (!message) return;
  const errEl = document.getElementById("login-error");
  if (errEl) errEl.textContent = message;
  params.delete("google_error");
  const query = params.toString();
  history.replaceState({}, "", location.pathname + (query ? `?${query}` : "") + location.hash);
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("login-error");
    errEl.textContent = "";
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Entrando…";
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      loginForm.reset();
      await boot();
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });
}

document.getElementById("logout-link")?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch (err) {
    // ignora falha de rede no logout — a sessão local será limpa de qualquer forma
  }
  location.reload();
});

document.getElementById("change-password-link")?.addEventListener("click", async () => {
  const nova = prompt("Digite a nova senha (mínimo 6 caracteres):");
  if (nova === null) return;
  if (nova.trim().length < 6) {
    alert("A senha deve ter pelo menos 6 caracteres.");
    return;
  }
  try {
    await api("/api/me", { method: "PATCH", body: JSON.stringify({ password: nova.trim() }) });
    alert("Senha atualizada com sucesso.");
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Sincronização em tempo real ----------
// Não há websockets/Durable Objects nesta stack, então o jeito pragmático de fazer
// qualquer alteração do admin (preço, cor, remover produto, cadastrar empresa etc.)
// aparecer pros outros usuários sem precisar dar F5 é buscar tudo de novo em intervalos
// curtos. isUserEditing() evita interromper alguém no meio de uma digitação ou com um
// modal aberto — a rodada de polling é simplesmente pulada nesse caso e tentada de novo
// no próximo ciclo.
const LIVE_POLL_INTERVAL_MS = 6000;
let livePollTimer = null;

function isUserEditing() {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return true;
  const profileModal = document.getElementById('profile-modal');
  const detailModal = document.getElementById('detail-modal');
  if (profileModal && !profileModal.hidden) return true;
  if (detailModal && !detailModal.hidden) return true;
  return false;
}

async function livePollTick() {
  if (isUserEditing()) return;
  try {
    await loadProducts();
    renderCatalogAll();
    renderCatalogoTable();
    renderCart();
  } catch { /* silencioso: tentaremos de novo no próximo ciclo */ }
  try { await loadCompanies(); } catch { /* idem */ }
  try { await loadOrders(); } catch { /* idem */ }
  try { await loadMyOrders(); } catch { /* idem */ }
  if (state.role === 'admin') {
    try { await loadUsers(); } catch { /* idem */ }
  }
}

function startLivePolling() {
  if (livePollTimer) clearInterval(livePollTimer);
  livePollTimer = setInterval(livePollTick, LIVE_POLL_INTERVAL_MS);
}

async function boot() {
  let me;
  try {
    me = await api("/api/me");
  } catch {
    showLoginScreen();
    return;
  }
  showApp();
  await loadMe(me);
  await loadProducts();
  loadCompanies().then(loadOrders);
  loadMyOrders();
  startLivePolling();
}