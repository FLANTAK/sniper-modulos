// ============================================================
//  SNIPER MÓDULO — 99Freelas Scraping + Sheets
//  Convertido de TamperMonkey para JS puro (extensão Chrome)
//  O que mudou: GM_* → equivalentes nativos (fetch, storage, Notification)
//  O que NÃO mudou: nenhuma funcionalidade
// ============================================================

(function () {
    'use strict';

    // Evita reinjeção dupla na mesma página
    if (window.__sniper_scraping_ativo) return;
    window.__sniper_scraping_ativo = true;

    // =========================================================
    //  SUBSTITUTOS DOS GM_* (sem dependência do TamperMonkey)
    // =========================================================

    // GM_setValue / GM_getValue → chrome.storage.local
    // Usamos wrapper síncrono com cache em memória para manter
    // compatibilidade com o código original que chama sync
    const _store = {};

    function GM_setValue(chave, valor) {
        _store[chave] = valor;
        chrome.storage.local.set({ [chave]: valor });
    }

    function GM_getValue(chave, padrao) {
        return (_store[chave] !== undefined) ? _store[chave] : padrao;
    }

    // Carrega o storage no início para popular o cache
    chrome.storage.local.get(null, (items) => {
        Object.assign(_store, items);
        inicializarPainelScraping(); // Inicia após carregar storage
    });

    // GM_addStyle → cria <style> no DOM
    function GM_addStyle(css) {
        const el = document.createElement('style');
        el.textContent = css;
        document.head.appendChild(el);
    }

    // GM_notification → Notification API nativa
    function GM_notification({ title, text, timeout }) {
        if (Notification.permission === 'granted') {
            const n = new Notification(title, { body: text });
            if (timeout) setTimeout(() => n.close(), timeout);
        } else {
            Notification.requestPermission().then(p => {
                if (p === 'granted') GM_notification({ title, text, timeout });
            });
        }
    }

    // GM_xmlhttpRequest → fetch nativo
    function GM_xmlhttpRequest({ method, url, headers, data, onload, onerror }) {
        fetch(url, {
            method: method || 'GET',
            headers: headers || {},
            body: data || undefined
        })
        .then(async r => {
            const responseText = await r.text();
            onload && onload({ responseText, status: r.status });
        })
        .catch(err => onerror && onerror(err));
    }

    // GM_setClipboard → clipboard API (não usado ativamente mas mantém compatibilidade)
    function GM_setClipboard(text) {
        navigator.clipboard?.writeText(text).catch(() => {});
    }

    // =========================================================
    //  MÓDULO 1 — SCRAPING (original mantido integralmente)
    // =========================================================

    const LISTAS = {
        1: { urls: Array.from({length: 14}, (_, i) => i === 0 ? 'https://www.99freelas.com.br/projects?order=numero-de-propostas-menor&data-da-publicacao=menos-de-3-dias-atras' : `https://www.99freelas.com.br/projects?order=numero-de-propostas-menor&data-da-publicacao=menos-de-3-dias-atras&page=${i+1}`) },
        2: { urls: Array.from({ length: 30 }, (_, i) => `https://www.99freelas.com.br/projects?order=mais-recentes&page=${47 + i}`) },
        3: { urls: Array.from({ length: 21 }, (_, i) => `https://www.99freelas.com.br/projects?order=mais-recentes&data-da-publicacao=menos-de-3-dias-atras&page=${12 + i}`) }
    };

    const PALAVRAS_PROIBIDAS_CATEGORIA    = ['advogados', 'leis', 'advogado', 'engenharia', 'arquitetura', 'administração', 'contabilidade'];
    const PALAVRAS_PROIBIDAS_SUBCATEGORIA = ['contabilidade', 'engenharia', 'arquitetura'];
    const PALAVRAS_PROIBIDAS_TITULO       = ['videomaker', 'filmmaker', 'presencial', 'sb', 'nópolis', 'porto alegre'];
    const MAX_PROPOSTAS = 20;

    function contemPalavra(texto, lista) { return lista.some(p => texto.toLowerCase().includes(p)); }

    function deveExcluir(vaga) {
        if (!vaga.txtDuvidasHref || vaga.txtDuvidasHref.trim() === '') return true;
        const p = parseInt(vaga.propostas);
        if (!isNaN(p) && p > MAX_PROPOSTAS) return true;
        if (contemPalavra(vaga.categoria, PALAVRAS_PROIBIDAS_CATEGORIA)) return true;
        if (contemPalavra(vaga.subcategoria, PALAVRAS_PROIBIDAS_SUBCATEGORIA)) return true;
        if (contemPalavra(vaga.titulo, PALAVRAS_PROIBIDAS_TITULO)) return true;
        return false;
    }

    function fetchPagina(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({ method: 'GET', url, onload: (res) => resolve(res.responseText), onerror: reject });
        });
    }

    function extrairLinksDeListagem(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return Array.from(doc.querySelectorAll('a[href*="/project/"], a[href*="/projeto/"]'))
            .map(a => a.href).filter(href => href.includes('/project/') || href.includes('/projeto/'));
    }

    function extrairDadosVaga(html, urlVaga) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const titulo = doc.querySelector('span.nomeProjeto')?.textContent.trim() || '';
        const linkPergEl = doc.querySelector('p.txt-duvidas a');
        const txtDuvidasHref = linkPergEl ? 'https://www.99freelas.com.br' + linkPergEl.getAttribute('href') : '';
        const txtDuvidas = linkPergEl ? linkPergEl.textContent.trim() : '';
        let propostas = '', categoria = '', subcategoria = '';
        doc.querySelectorAll('tr').forEach(tr => {
            const label = tr.querySelector('th')?.textContent.trim().toLowerCase();
            const val = tr.querySelector('td')?.textContent.trim();
            if (label === 'propostas:') propostas = val;
            if (label === 'categoria:') categoria = val;
            if (label === 'subcategoria:') subcategoria = val;
        });
        return { url: urlVaga, titulo, txtDuvidas, txtDuvidasHref, propostas, categoria, subcategoria };
    }

    async function processarComConcorrencia(lista, fn, concorrencia, onProgresso) {
        const resultados = []; let indice = 0, concluidos = 0;
        async function worker() {
            while (indice < lista.length) {
                const atual = indice++;
                try { resultados[atual] = await fn(lista[atual]); } catch(e) {}
                concluidos++; if(onProgresso) onProgresso(concluidos, lista.length);
            }
        }
        await Promise.all(Array.from({length: concorrencia}, worker));
        return resultados.filter(Boolean);
    }

    async function executarLista(numLista, automatico = false) {
        const lista = LISTAS[numLista];
        setStatusScrap(`⏳ Buscando páginas (Lista ${numLista})...`);

        let todasUrls = [];
        for (const url of lista.urls) {
            try { const html = await fetchPagina(url); todasUrls = todasUrls.concat(extrairLinksDeListagem(html)); } catch(e) {}
        }
        const urlsUnicas = [...new Set(todasUrls)];
        setStatusScrap(`✅ ${urlsUnicas.length} vagas. Iniciando scraping...`);

        const vagas = await processarComConcorrencia(urlsUnicas, async (url) => {
            const html = await fetchPagina(url); return extrairDadosVaga(html, url);
        }, 5, (feitos, total) => setStatusScrap(`🔍 Scraping: ${feitos}/${total}...`));

        const vagasFiltradas = vagas.filter(v => !deveExcluir(v));
        setStatusScrap(`✅ Pronto! ${vagasFiltradas.length} vagas filtradas.`);

        const cabecalho = 'URLS\tnomeProjeto\ttxt-duvidas\ttxt-duvidas href\tpropostas\tcategorias\tsubcategorias';
        const linhas = vagasFiltradas.map(v => [v.url, v.titulo, v.txtDuvidas, v.txtDuvidasHref, v.propostas, v.categoria, v.subcategoria].join('\t'));
        const TSV = [cabecalho, ...linhas].join('\n');

        const ta = document.getElementById('f99-textarea');
        const res = document.getElementById('f99-resultado');
        if (ta) ta.value = TSV;
        if (res) res.style.display = 'block';

        if (automatico) enviarParaGoogleSheets(TSV);
    }

    function setStatusScrap(msg) {
        const el = document.getElementById('f99-status');
        if (el) el.textContent = msg;
    }

    // =========================================================
    //  INTEGRAÇÃO SHEETS
    // =========================================================

    function enviarParaGoogleSheets(tsvData) {
        const webhookUrl = GM_getValue('robo99_webhook_url', '');
        if (!webhookUrl) { setStatusScrap('❌ Falha: URL do Webhook não configurada.'); return; }
        setStatusScrap('🚀 Enviando para o Google Sheets...');
        GM_xmlhttpRequest({
            method: 'POST', url: webhookUrl,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ vagas: tsvData }),
            onload: () => {
                setStatusScrap('✅ Salvo no Google Sheets com sucesso!');
                GM_notification({ title: '🤖 Robô 99Freelas', text: 'Vagas salvas no Sheets!', timeout: 5000 });
            },
            onerror: () => setStatusScrap('❌ Erro ao enviar para o Sheets.')
        });
    }

    // Loop agendado (1 minuto)
    setInterval(() => {
        const horaAgendada     = GM_getValue('robo99_hora_agendada', '');
        const listaAgendada    = GM_getValue('robo99_lista_agendada', '1');
        const dataHoje         = new Date().toLocaleDateString('pt-BR');
        const ultimaDataRodou  = GM_getValue('robo99_ultima_data_rodou', '');
        if (!horaAgendada) return;
        const agora = new Date();
        const horaAtual = String(agora.getHours()).padStart(2,'0') + ':' + String(agora.getMinutes()).padStart(2,'0');
        if (horaAtual === horaAgendada && ultimaDataRodou !== dataHoje) {
            GM_setValue('robo99_ultima_data_rodou', dataHoje);
            executarLista(listaAgendada, true);
        }
    }, 60000);

    // =========================================================
    //  INJEÇÃO DA INTERFACE
    // =========================================================

    GM_addStyle(`
        #f99-container { position:fixed; bottom:20px; left:20px; z-index:999999; width:320px; background:#1a1a2e; border:1px solid #333; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5); font-family:'Segoe UI',sans-serif; font-size:13px; color:#f0f0f0; overflow:hidden; }
        #f99-header { background:#16213e; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; border-bottom:1px solid #333; }
        #f99-header span { font-weight:bold; font-size:14px; }
        #f99-body { padding:12px; max-height:80vh; overflow-y:auto; }
        .f99-btn-lista { display:block; width:100%; padding:9px 12px; margin-bottom:8px; border:none; border-radius:8px; color:white; font-weight:bold; font-size:12px; cursor:pointer; text-align:left; }
        .f99-btn-lista:hover { opacity:0.85; }
        #f99-status { margin-top:8px; padding:8px 10px; background:#0f3460; border-radius:6px; font-size:11px; color:#ccc; }
        #f99-resultado { display:none; margin-top:10px; }
        #f99-textarea { width:100%; height:80px; background:#0d1117; border:1px solid #333; color:#a8ff78; font-size:10px; padding:6px; }
        .box-auto { background:#0f0f23; border:1px solid #4caf50; padding:10px; border-radius:8px; margin-top:10px; }
        .box-auto input, .box-auto select { width:100%; background:#1a1a2e; color:#fff; border:1px solid #555; padding:5px; margin-top:4px; margin-bottom:8px; border-radius:4px; }
        .box-auto button { width:100%; background:#4caf50; color:white; border:none; padding:6px; border-radius:4px; cursor:pointer; font-weight:bold; }
    `);

    function inicializarPainelScraping() {
        if (document.getElementById('f99-container')) return; // já existe

        const container = document.createElement('div');
        container.id = 'f99-container';
        container.innerHTML = `
            <div id="f99-header"><span>⚡ 99F Scraping & Sheets</span><button id="f99-minimizar" style="background:none;border:none;color:#aaa;cursor:pointer;">−</button></div>
            <div id="f99-body">
                <button class="f99-btn-lista" id="f99-btn-1" style="background:#e53935">🔴 Lista 01 — Menor prop + Urgente</button>
                <button class="f99-btn-lista" id="f99-btn-2" style="background:#1565C0">🔵 Lista 02 — Mais recentes (p.47–76)</button>
                <button class="f99-btn-lista" id="f99-btn-3" style="background:#2e7d32">🟢 Lista 03 — Recentes + até 3 dias</button>
                <div id="f99-status">Escolha uma lista ou aguarde agendamento.</div>
                <div id="f99-resultado">
                    <textarea id="f99-textarea" readonly></textarea>
                    <button id="f99-btn-enviar-sheets" style="width:100%;padding:8px;background:#00b894;border:none;color:white;border-radius:5px;margin-top:5px;cursor:pointer;">📤 Enviar para Sheets Agora</button>
                </div>
                <div class="box-auto">
                    <span style="color:#4caf50;font-weight:bold;font-size:11px;">⏰ AUTOMAÇÃO DIÁRIA</span><br>
                    <label style="font-size:10px;">URL Webhook (App Script):</label>
                    <input type="text" id="auto-webhook" placeholder="https://script.google.com/macros/s/..." value="${GM_getValue('robo99_webhook_url', '')}">
                    <div style="display:flex;gap:10px;">
                        <div style="flex:1;">
                            <label style="font-size:10px;">Hora (HH:MM):</label>
                            <input type="time" id="auto-hora" value="${GM_getValue('robo99_hora_agendada', '')}">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:10px;">Lista:</label>
                            <select id="auto-lista">
                                <option value="1" ${GM_getValue('robo99_lista_agendada','1')==='1'?'selected':''}>Lista 01</option>
                                <option value="2" ${GM_getValue('robo99_lista_agendada','1')==='2'?'selected':''}>Lista 02</option>
                                <option value="3" ${GM_getValue('robo99_lista_agendada','1')==='3'?'selected':''}>Lista 03</option>
                            </select>
                        </div>
                    </div>
                    <button id="auto-salvar">Salvar Agendamento</button>
                </div>
            </div>`;
        document.body.appendChild(container);

        document.getElementById('f99-btn-1').addEventListener('click', () => executarLista(1, false));
        document.getElementById('f99-btn-2').addEventListener('click', () => executarLista(2, false));
        document.getElementById('f99-btn-3').addEventListener('click', () => executarLista(3, false));
        document.getElementById('f99-btn-enviar-sheets').addEventListener('click', () => {
            enviarParaGoogleSheets(document.getElementById('f99-textarea').value);
        });
        document.getElementById('auto-salvar').addEventListener('click', () => {
            GM_setValue('robo99_webhook_url', document.getElementById('auto-webhook').value);
            GM_setValue('robo99_hora_agendada', document.getElementById('auto-hora').value);
            GM_setValue('robo99_lista_agendada', document.getElementById('auto-lista').value);
            GM_setValue('robo99_ultima_data_rodou', '');
            const btn = document.getElementById('auto-salvar');
            btn.textContent = '✅ Salvo!';
            setTimeout(() => btn.textContent = 'Salvar Agendamento', 2000);
        });

        let minimizado = false;
        document.getElementById('f99-minimizar').addEventListener('click', () => {
            minimizado = !minimizado;
            document.getElementById('f99-body').style.display = minimizado ? 'none' : 'block';
            document.getElementById('f99-minimizar').textContent = minimizado ? '+' : '−';
        });
    }

})();
