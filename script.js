// chave localStorage
const LS_KEY = "jl_inventario_final";

// --- DADOS BÁSICOS (Toner Models) ---
const tonerModelMap = {
    'Ricoh': [
        { modelo: 'MP 501', tipo: 'Toner' },
        { modelo: 'IM 430', tipo: 'Toner' },
        { modelo: 'SP 3710', tipo: 'Toner' },
        { modelo: 'TK-1200', tipo: 'Cilindro' }
    ],
    'Kyocera': [
        { modelo: 'TK-1175', tipo: 'Toner' },
        { modelo: 'TK-3162', tipo: 'Toner' },
        { modelo: 'TK-1202', tipo: 'Toner' }
    ]
};

// --- SELETORES DOM ---
const formAdd = document.getElementById("formAdd"),
    table = document.getElementById("table"),
    tableBody = table.querySelector("tbody"),
    tableHead = table.querySelector("thead"),
    searchInput = document.getElementById("search"),
    filterStatus = document.getElementById("filterStatus"),
    filterTipo = document.getElementById("filterTipo"),
    dateFrom = document.getElementById("dateFrom"),
    dateTo = document.getElementById("dateTo"),
    clearDates = document.getElementById("clearDates"),
    btnExport = document.getElementById("btnExport"),
    btnBackup = document.getElementById("btnBackup"),
    btnRestore = document.getElementById("btnRestore"),
    btnClear = document.getElementById("btnClear"),
    btnTheme = document.getElementById("btnTheme"),
    modal = document.getElementById("modal"),
    closeModal = document.getElementById("closeModal"),
    formModal = document.getElementById("formModal"),
    modalTitle = document.getElementById("modalTitle"),
    manData = document.getElementById("manData"),
    manObs = document.getElementById("manObs"),
    manStatus = document.getElementById("manStatus"),
    btnModalRemove = document.getElementById("btnModalRemove"),
    tipoInput = document.getElementById("tipo"),
    serieInput = document.getElementById("serie"),
    descInput = document.getElementById("descricao"),
    dataAqInput = document.getElementById("dataAq"),
    statusInput = document.getElementById("status"),
    tonerFields = document.getElementById('tonerFields'),
    tonerMarcaSelect = document.getElementById('tonerMarca'),
    tonerModeloSelect = document.getElementById('tonerModelo'),
    impressoraFields = document.getElementById('impressoraFields'),
    setorInput = document.getElementById('setor'),
    tonerEmUsoSelect = document.getElementById('tonerEmUso'),
    tonerModal = document.getElementById('tonerModal'),
    closeTonerModal = document.getElementById('closeTonerModal'),
    formTonerModal = document.getElementById('formTonerModal'),
    tonerModalTitle = document.getElementById('tonerModalTitle'),
    tonerDataHora = document.getElementById('tonerDataHora'),
    novoTonerSelect = document.getElementById('novoTonerSelect'),
    reportDateFrom = document.getElementById('reportDateFrom'),
    reportDateTo = document.getElementById('reportDateTo'),
    generateActivityReportBtn = document.getElementById('generateActivityReport'),
    formTitle = document.getElementById('formTitle'),
    formSubmitBtn = document.getElementById('formSubmitBtn'),
    cancelEditBtn = document.getElementById('cancelEditBtn'),
    totalItemsEl = document.getElementById('totalItems'),
    totalImpressorasEl = document.getElementById('totalImpressoras'),
    tonerEstoqueEl = document.getElementById('tonerEstoque'),
    totalManutencaoEl = document.getElementById('totalManutencao'),
    confirmModal = document.getElementById('confirmModal'),
    confirmModalTitle = document.getElementById('confirmModalTitle'),
    confirmModalText = document.getElementById('confirmModalText'),
    confirmModalCancel = document.getElementById('confirmModalCancel'),
    confirmModalOk = document.getElementById('confirmModalOk');

// --- DADOS E ESTADO ---
let inventario = [];
let editId = null;
let currentSort = { column: 'tipo', direction: 'asc' };

// --- FUNÇÕES UTILITÁRIAS ---
function save() { localStorage.setItem(LS_KEY, JSON.stringify(inventario)); }
function load() { inventario = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

function logHistory(itemId, type, details) {
    const item = inventario.find(i => i.id === itemId);
    if (item) {
        if (!item.historico) item.historico = [];
        item.historico.unshift({ type, details, timestamp: new Date().toISOString() });
    }
}

// --- MODAL DE CONFIRMAÇÃO ---
let confirmCallback = null;
function showConfirmModal(title, text, onConfirm) {
    confirmModalTitle.textContent = title;
    confirmModalText.textContent = text;
    confirmModal.classList.remove('hidden');
    confirmCallback = onConfirm;
}
function hideConfirmModal() {
    confirmModal.classList.add('hidden');
    confirmCallback = null;
}
confirmModalOk.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirmModal();
});
confirmModalCancel.addEventListener('click', hideConfirmModal);


// --- LÓGICA DO CABEÇALHO ---
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}
function exportCSV() {
    if (inventario.length === 0) return showNotification("Nenhum dado para exportar.", 'error');
    const headers = ["id", "tipo", "numero_serie", "descricao", "data_aquisicao", "status", "setor", "toner_marca", "toner_modelo", "toner_em_uso_id", "historico"];
    const rows = inventario.map(it => [
        it.id, it.tipo, it.numero_serie, (it.descricao || "").replace(/["\n\r,]+/g, " "),
        it.data_aquisicao || "", it.status || "", it.setor || "", it.toner_marca || "", it.toner_modelo || "", it.tonerId || "",
        (it.historico || []).map(h => `${h.timestamp.slice(0, 10)}:${h.type} (${h.details})`).join(" | ")
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exportação para CSV realizada!');
}
function backupData() {
    if (inventario.length === 0) return showNotification("Nenhum dado para fazer backup.", 'error');
    const data = JSON.stringify(inventario, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup realizado com sucesso!');
}
function restoreData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data) && data.every(item => 'id' in item && 'tipo' in item && 'numero_serie' in item)) {
                    showConfirmModal(
                        'Restaurar Backup?',
                        'Isso substituirá TODOS os dados atuais. Esta ação não pode ser desfeita.',
                        () => {
                            inventario = data;
                            save();
                            render();
                            populateSelects();
                            showNotification('Dados restaurados com sucesso!');
                        }
                    );
                } else { throw new Error("Formato inválido."); }
            } catch (err) { showNotification('Erro: Arquivo inválido ou não corresponde ao formato de backup.', 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}
function clearData() {
    showConfirmModal(
        'Apagar todos os dados?',
        'Esta ação é irreversível e apagará todo o inventário.',
        () => {
            inventario = [];
            save();
            render();
            populateSelects();
            showNotification('Todos os dados foram apagados!', 'error');
        }
    );
}

// --- LÓGICA DO RELATÓRIO DE ATIVIDADES ---
function generatePrintableReport() {
    const fromDateStr = reportDateFrom.value;
    const toDateStr = reportDateTo.value;

    if (!fromDateStr || !toDateStr) {
        return showNotification('Selecione um período completo para o relatório.', 'error');
    }

    const startDate = new Date(fromDateStr + 'T00:00:00'); 
    const endDate = new Date(toDateStr + 'T23:59:59'); 

    let allActivities = [];

    // 1. Coletar todas as atividades de todos os itens
    inventario.forEach(item => {
        (item.historico || []).forEach(activity => {
            const activityDate = new Date(activity.timestamp);
            
            // 2. Filtrar por data
            if (activityDate >= startDate && activityDate <= endDate) {
                allActivities.push({
                    itemId: item.id,
                    itemSerie: item.numero_serie,
                    itemTipo: item.tipo,
                    timestamp: activity.timestamp,
                    type: activity.type,
                    details: activity.details
                });
            }
        });
    });

    if (allActivities.length === 0) {
        return showNotification(`Nenhuma atividade encontrada entre ${fromDateStr} e ${toDateStr}.`, 'warn');
    }

    // 3. Ordenar as atividades pela mais recente
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 4. Gerar o HTML do relatório
    let reportHtml = `
        <html>
        <head>
            <title>Relatório de Atividades ${fromDateStr} a ${toDateStr}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #0b2546; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
                .activity-item { border: 1px solid #eee; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                .activity-header { font-weight: bold; margin-bottom: 5px; color: #333; }
                .activity-header span { font-weight: normal; color: #666; margin-left: 10px; }
                .activity-details { font-style: italic; margin-top: 5px; white-space: pre-wrap; }
                @media print { .activity-item { page-break-inside: avoid; } }
            </style>
        </head>
        <body>
            <h1>Relatório de Atividades (${fromDateStr} a ${toDateStr})</h1>
            <p>Total de Eventos Registrados: ${allActivities.length}</p>
    `;

    allActivities.forEach(activity => {
        const formattedDate = new Date(activity.timestamp).toLocaleString();
        reportHtml += `
            <div class="activity-item">
                <div class="activity-header">
                    [${activity.type.toUpperCase()}] ${activity.itemTipo}: ${activity.itemSerie}
                    <span>— Data: ${formattedDate}</span>
                </div>
                <div class="activity-details">
                    ${activity.details}
                </div>
            </div>
        `;
    });

    reportHtml += `</body></html>`;

    // 5. Abrir em nova janela
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
}


// --- LÓGICA DO DASHBOARD ---
function updateDashboard() {
    totalItemsEl.textContent = inventario.length;
    totalImpressorasEl.textContent = inventario.filter(i => i.tipo === 'Impressora').length;
    tonerEstoqueEl.textContent = inventario.filter(i => i.tipo === 'Toner' && i.status === 'Em uso').length;
    totalManutencaoEl.textContent = inventario.filter(i => i.status === 'Em manutenção').length;
}

// --- LÓGICA DE SELEÇÃO E FORMS ---

/** Preenche o select de Modelos de Toner baseado na Marca selecionada. */
function populateTonerModels() {
    const marca = tonerMarcaSelect.value;
    tonerModeloSelect.innerHTML = '<option value="">-- Selecione o Modelo --</option>';

    if (marca && tonerModelMap[marca]) {
        tonerModelMap[marca].forEach(item => {
            const option = document.createElement('option');
            option.value = item.modelo;
            option.textContent = item.modelo;
            tonerModeloSelect.appendChild(option);
        });
    }
    tonerModeloSelect.disabled = !marca;
}

/** Preenche o select de Toners em Estoque (para impressora e modal de troca). */
function populateTonerSelects(selectedTonerId = '') {
    tonerEmUsoSelect.innerHTML = '<option value="">-- Nenhum --</option>';
    novoTonerSelect.innerHTML = '<option value="">-- Selecione o novo toner --</option>';
    
    // Filtra apenas Toners em status "Em uso" (estoque)
    const tonersEmEstoque = inventario.filter(i => i.tipo === 'Toner' && i.status === 'Em uso');

    tonersEmEstoque.forEach(toner => {
        const option = document.createElement('option');
        option.value = toner.id;
        option.textContent = `${toner.toner_marca} ${toner.toner_modelo} (Série: ${toner.numero_serie})`;
        
        // Para o formulário de Cadastro/Edição de Impressora
        tonerEmUsoSelect.appendChild(option.cloneNode(true));
        
        // Para o Modal de Troca de Toner
        novoTonerSelect.appendChild(option.cloneNode(true));
    });

    // Mantém a opção de toner atualmente instalado se for um item em edição
    if (selectedTonerId) {
        tonerEmUsoSelect.value = selectedTonerId;
    }
}

function populateSelects(selectedTonerId = '') {
    populateTonerModels();
    populateTonerSelects(selectedTonerId);
}

function resetForm() {
    editId = null;
    formTitle.textContent = 'Cadastrar Equipamento';
    formSubmitBtn.textContent = 'Adicionar';
    cancelEditBtn.classList.add('hidden');
    formAdd.reset();
    tonerFields.classList.add('hidden');
    impressoraFields.classList.add('hidden');
    populateSelects(); // Reseta os selects para o estado inicial
    render();
}

/** Lógica de exibição condicional dos campos no formulário principal. */
tipoInput.addEventListener('change', () => {
    const tipo = tipoInput.value;
    tonerFields.classList.add('hidden');
    impressoraFields.classList.add('hidden');
    
    if (tipo === 'Toner') {
        tonerFields.classList.remove('hidden');
        // A validação 'required' é feita no handleFormSubmit
    } else if (tipo === 'Impressora') {
        impressoraFields.classList.remove('hidden');
        populateTonerSelects(); // Garante que a lista de toners esteja atualizada
    }
});

tonerMarcaSelect.addEventListener('change', populateTonerModels);

// --- PROCESSAMENTO DE DADOS E EVENTOS ---

/** Lida com o envio do formulário principal (Adicionar/Atualizar). */
function handleFormSubmit(e) {
    e.preventDefault();

    const tipo = tipoInput.value;
    const numero_serie = serieInput.value.trim();
    const descricao = descInput.value.trim();
    const data_aquisicao = dataAqInput.value || null;
    const status = statusInput.value;

    const isDuplicate = inventario.some(it => it.numero_serie === numero_serie && it.id !== editId);
    if (isDuplicate) return showNotification("Número de série já cadastrado.", 'error');

    let itemData = { tipo, numero_serie, descricao, data_aquisicao, status };

    if (tipo === 'Impressora') {
        itemData.setor = setorInput.value.trim() || null;
        itemData.tonerId = tonerEmUsoSelect.value || null; 
        
        // Se a impressora está sendo cadastrada com um toner NOVO (não em edição),
        // o toner deve ser marcado como 'Instalado'
        if (itemData.tonerId && !editId) {
            const toner = inventario.find(i => i.id === itemData.tonerId);
            if (toner) toner.status = 'Instalado';
        }
    } else if (tipo === 'Toner') {
        itemData.toner_marca = tonerMarcaSelect.value || null;
        itemData.toner_modelo = tonerModeloSelect.value || null;

        if (!itemData.toner_marca || !itemData.toner_modelo) {
             return showNotification("Selecione a marca e o modelo do toner.", 'error');
        }
    } else {
        // Se tipo não for selecionado (embora o HTML tenha required)
        return showNotification("Selecione o Tipo de equipamento.", 'error');
    }

    if (editId) {
        const idx = inventario.findIndex(it => it.id === editId);
        if (idx > -1) {
            inventario[idx] = { ...inventario[idx], ...itemData };
            logHistory(editId, 'Atualização', 'Dados do equipamento atualizados.');
            showNotification(`Equipamento ${tipo} atualizado!`);
        }
    } else {
        const novo = { id: uid(), ...itemData, historico: [] };
        inventario.unshift(novo);
        logHistory(novo.id, 'Cadastro', 'Novo equipamento cadastrado.');
        showNotification(`Novo equipamento ${tipo} adicionado!`);
    }

    save();
    resetForm();
    render();
    populateSelects(); // Atualiza a lista de toners disponíveis
}
// CORREÇÃO: Adicionando o listener de submissão do formulário
formAdd.addEventListener("submit", handleFormSubmit);

/** Lida com o envio do Modal de Manutenção. */
function handleModalSubmit(e) {
    e.preventDefault();
    const id = modal.dataset.id;
    const item = inventario.find(x => x.id === id);
    if (!item) return;

    const manDate = manData.value;
    const obs = manObs.value || "-";
    const newStatus = manStatus.value;

    logHistory(id, 'Manutenção', `${obs} - Novo Status: ${newStatus}`);
    item.ultima_manutencao = manDate;
    item.status = newStatus;
    
    save(); render(); modal.classList.add("hidden");
    showNotification(`Manutenção registrada para ${item.tipo}!`);
}
formModal.addEventListener("submit", handleModalSubmit);

/** Lida com o envio do Modal de Troca de Toner. */
function handleTonerModalSubmit(e) {
    e.preventDefault();
    const impressoraId = tonerModal.dataset.impressoraId;
    const novoTonerId = novoTonerSelect.value;
    const trocaTimestamp = tonerDataHora.value;

    if (!novoTonerId || !trocaTimestamp) return showNotification("Selecione um toner e data/hora.", 'error');

    const impressora = inventario.find(i => i.id === impressoraId);
    const novoToner = inventario.find(i => i.id === novoTonerId);
    if (!impressora || !novoToner) return showNotification("Erro ao encontrar equipamentos.", 'error');

    // 1. Lógica do Toner Antigo (se houver)
    if (impressora.tonerId) {
        const tonerAntigo = inventario.find(i => i.id === impressora.tonerId);
        if (tonerAntigo) {
            tonerAntigo.status = 'Em uso'; // Volta para estoque
            logHistory(tonerAntigo.id, 'Remoção/Troca', `Removido da Impressora ${impressora.numero_serie}.`);
        }
    }

    // 2. Lógica da Impressora
    impressora.tonerId = novoTonerId;
    impressora.ultima_troca_toner = trocaTimestamp.slice(0, 10);
    logHistory(impressoraId, 'Troca de Toner', `Instalado ${novoToner.numero_serie} (${novoToner.toner_modelo})`);

    // 3. Lógica do Novo Toner
    novoToner.status = 'Instalado';
    logHistory(novoTonerId, 'Instalação', `Instalado na Impressora ${impressora.numero_serie}.`);

    save(); render(); tonerModal.classList.add('hidden');
    showNotification(`Troca de Toner registrada com sucesso!`, 'success');
}
formTonerModal.addEventListener("submit", handleTonerModalSubmit);


/** Lida com as ações da tabela (Editar, Manutenção, Histórico, Troca de Toner). */
function handleTableActions(e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const item = inventario.find(i => i.id === id);
    if (!item) return;

    if (action === "edit") {
        editId = id;
        formTitle.textContent = `Editar: ${item.numero_serie}`;
        formSubmitBtn.textContent = 'Atualizar';
        cancelEditBtn.classList.remove('hidden');
        
        tipoInput.value = item.tipo;
        serieInput.value = item.numero_serie;
        descInput.value = item.descricao;
        dataAqInput.value = item.data_aquisicao || "";
        statusInput.value = item.status || "Em uso";

        // Preenche campos condicionais
        if (item.tipo === 'Impressora') {
            impressoraFields.classList.remove('hidden');
            tonerFields.classList.add('hidden');
            setorInput.value = item.setor || '';
            populateTonerSelects(item.tonerId); 
        } else if (item.tipo === 'Toner') {
            tonerFields.classList.remove('hidden');
            impressoraFields.classList.add('hidden');
            tonerMarcaSelect.value = item.toner_marca || '';
            populateTonerModels(); 
            tonerModeloSelect.value = item.toner_modelo || '';
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        
    } else if (action === "man") {
        modal.dataset.id = id;
        modalTitle.textContent = `Manutenção: ${item.numero_serie}`;
        manData.value = new Date().toISOString().slice(0, 10);
        modal.classList.remove("hidden");
        
    } else if (action === "hist") {
        const historyText = (item.historico || []).map(h => `${new Date(h.timestamp).toLocaleString()} [${h.type}]: ${h.details}`).join('\n\n');
        alert(`Histórico de Atividades - ${item.numero_serie}:\n\n${historyText || 'Nenhuma atividade registrada.'}`);

    } else if (action === "trocar_toner") {
        tonerModal.dataset.impressoraId = id;
        tonerModalTitle.textContent = `Trocar Toner em: ${item.numero_serie}`;
        tonerDataHora.value = new Date().toISOString().slice(0, 16); 
        populateTonerSelects(); 
        tonerModal.classList.remove('hidden');
    }
}
tableBody.addEventListener("click", handleTableActions);


// --- RENDERIZAÇÃO E LÓGICA PRINCIPAL ---
function render() {
    updateDashboard();

    const q = searchInput.value.trim().toLowerCase(), statusFilter = filterStatus.value, tipoFilter = filterTipo.value;
    tableBody.innerHTML = "";

    let filteredData = inventario.filter(item => {
        const hay = `${item.tipo} ${item.numero_serie} ${item.descricao} ${item.setor || ''} ${item.toner_marca || ''}`.toLowerCase();
        return (!q || hay.includes(q)) && (!statusFilter || item.status === statusFilter) && (!tipoFilter || item.tipo === tipoFilter);
    });

    filteredData.sort((a, b) => {
        const valA = a[currentSort.column] || '';
        const valB = b[currentSort.column] || '';
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum item encontrado.</td></tr>';
        return;
    }

    filteredData.forEach(item => {
        const tr = document.createElement("tr");
        tr.dataset.id = item.id;

        const statusClass = { "Em uso": 'status-uso', "Instalado": 'status-instalado', "Em manutenção": 'status-manutencao', "Descartado": 'status-descartado' }[item.status] || '';
        
        let detalhes = '-';
        if (item.tipo === "Impressora") detalhes = item.setor || "-";
        if (item.tipo === "Toner") detalhes = `${item.toner_marca || ''} - ${item.toner_modelo || ''}`;

        let tonerName = "-";
        if (item.tipo === "Impressora" && item.tonerId) {
            const toner = inventario.find(t => t.id === item.tonerId);
            tonerName = toner ? toner.numero_serie : 'Toner não encontrado';
        }

        tr.innerHTML = `
            <td>${item.tipo}</td>
            <td>${item.numero_serie}</td>
            <td>${detalhes}</td>
            <td>${tonerName}</td>
            <td>${item.descricao || "-"}</td>
            <td><span class="status-badge ${statusClass}">${item.status}</span></td>
            <td class="actions-btns">
                ${item.tipo === 'Impressora' ? `<button class="btn" data-action="trocar_toner" data-id="${item.id}" title="Trocar Toner">Trocar</button>` : ''}
                <button class="btn" data-action="hist" data-id="${item.id}" title="Ver Histórico">Histórico</button>
                <button class="btn" data-action="edit" data-id="${item.id}" title="Editar">Editar</button>
                <button class="btn btn-red" data-action="man" data-id="${item.id}" title="Manutenção">Manutenção</button>
            </td>`;
        tableBody.appendChild(tr);
    });
}


// --- EVENTOS GERAIS ---
function setupEventListeners() {
    btnTheme.addEventListener('click', toggleTheme);
    btnExport.addEventListener('click', exportCSV);
    btnBackup.addEventListener('click', backupData);
    btnRestore.addEventListener('click', restoreData);
    btnClear.addEventListener('click', clearData);
    cancelEditBtn.addEventListener('click', resetForm);

    tableHead.addEventListener('click', (e) => {
        const th = e.target.closest('th[data-sort]');
        if (!th) return;

        const column = th.dataset.sort;
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }

        tableHead.querySelectorAll('th[data-sort]').forEach(header => {
            header.classList.remove('asc', 'desc');
        });
        th.classList.add(currentSort.direction);

        render();
    });

    closeModal.addEventListener("click", () => modal.classList.add("hidden"));
    closeTonerModal.addEventListener("click", () => tonerModal.classList.add("hidden"));

    [searchInput, filterStatus, filterTipo, dateFrom, dateTo].forEach(el => {
        el.addEventListener("input", render);
        el.addEventListener("change", render);
    });
    clearDates.addEventListener("click", () => {
        dateFrom.value = "";
        dateTo.value = "";
        render();
    });
    
    generateActivityReportBtn.addEventListener('click', generatePrintableReport);
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    load();
    // Adicionar dados de exemplo se o inventário estiver vazio (Opcional, mas útil para testes)
    if (inventario.length === 0) {
        inventario = [
            { id: uid(), tipo: "Impressora", numero_serie: "PRT-001", descricao: "Kyocera ECOSYS P2040dw", data_aquisicao: "2023-01-10", status: "Em uso", setor: "RH", tonerId: null, historico: [] },
            { id: uid(), tipo: "Toner", numero_serie: "TNR-050", descricao: "Toner TK-1175", data_aquisicao: "2024-05-01", status: "Em uso", toner_marca: "Kyocera", toner_modelo: "TK-1175", historico: [] },
            { id: uid(), tipo: "Toner", numero_serie: "TNR-051", descricao: "Toner MP 501", data_aquisicao: "2024-05-05", status: "Em uso", toner_marca: "Ricoh", toner_modelo: "MP 501", historico: [] },
        ];
        // Instala um toner na impressora para demonstrar a troca
        inventario[0].tonerId = inventario[1].id;
        inventario[1].status = 'Instalado';
        logHistory(inventario[0].id, 'Cadastro', 'Impressora cadastrada com Toner instalado.');
        logHistory(inventario[1].id, 'Instalação', 'Toner instalado durante cadastro da impressora.');
        save();
    }
    
    initTheme();
    setupEventListeners();
    populateSelects();
    render();
});