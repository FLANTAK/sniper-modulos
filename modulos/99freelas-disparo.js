// ============================================================
//  SNIPER MÓDULO — 99Freelas Disparo Automático v2
//  CORREÇÃO: chrome.storage → localStorage (injeção via javascript:)
// ============================================================

(function () {
    'use strict';

    if (window.__sniper_disparo_ativo) return;
    window.__sniper_disparo_ativo = true;

    // =========================================================
    //  STORAGE — localStorage (sem dependência de chrome.storage)
    // =========================================================

    const _store = {};

    function GM_setValue(chave, valor) {
        _store[chave] = valor;
        try { localStorage.setItem('sniper_' + chave, JSON.stringify(valor)); } catch(e) {}
    }

    function GM_getValue(chave, padrao) {
        if (_store[chave] !== undefined) return _store[chave];
        try {
            const raw = localStorage.getItem('sniper_' + chave);
            if (raw !== null) { const v = JSON.parse(raw); _store[chave] = v; return v; }
        } catch(e) {}
        return padrao;
    }

    // Carrega todas as chaves do localStorage para o _store em memória
    function carregarStorage() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sniper_')) {
                    const chave = key.replace('sniper_', '');
                    try { _store[chave] = JSON.parse(localStorage.getItem(key)); } catch(e) {}
                }
            }
        } catch(e) {}
    }

    function GM_notification({ title, text, timeout }) {
        if (Notification.permission === 'granted') {
            const n = new Notification(title, { body: text });
            if (timeout) setTimeout(() => n.close(), timeout);
        }
    }

    function GM_addStyle(css) {
        const el = document.createElement('style');
        el.textContent = css;
        document.head.appendChild(el);
    }

    // =========================================================
    //  CONFIGURAÇÃO
    // =========================================================

    const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwGHLGz15vghY48KKP9wT8vTokBwgVxhpdO6QtzGI5DCzSDx0xYlhZLhUSRPJ8RVEwS_A/exec';

    const SCRIPT_PADRAO =
        'Opa, tudo bem?\n\n' +
        'Precisa pra quando? Dá pra te entregar essa demanda em 4-5 dias (ou menos), ' +
        'dependendo do escopo do projeto\n\n' +
        'Me chama no WhatsApp se tiver interesse: +5519988107330';

    const DELAY_PADRAO = 2500;

    const FRASES_SEM_CREDITO = [
        'não há conexões disponíveis suficientes','créditos insuficientes','sem créditos',
        'você não possui créditos','saldo insuficiente','não possui saldo'
    ];

    const K_SCRIPT  = 'd99_script';
    const K_FILA    = 'd99_fila';
    const K_INDICE  = 'd99_indice';
    const K_RODANDO = 'd99_rodando';
    const K_LOG     = 'd99_log';
    const K_DELAY   = 'd99_delay';

    // =========================================================
    //  UTILITÁRIOS
    // =========================================================

    const sleep    = ms => new Promise(r => setTimeout(r, ms));
    const log99    = msg => console.log(`[🚀 Disparo99] ${msg}`);

    function estaNaPaginaDeVaga() {
        return /\/(project|job|vaga)\//i.test(window.location.pathname);
    }

    function temAvisoSemCredito() {
        const txt = (document.body?.innerText || '').toLowerCase();
        return FRASES_SEM_CREDITO.some(f => txt.includes(f.toLowerCase()));
    }

    function aguardarElemento(seletor, ms = 8000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(seletor);
            if (el) { resolve(el); return; }
            const obs = new MutationObserver(() => {
                const found = document.querySelector(seletor);
                if (found) { obs.disconnect(); resolve(found); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { obs.disconnect(); reject(new Error('Timeout: ' + seletor)); }, ms);
        });
    }

    async function destacar(el) {
        const orig = el.style.outline;
        el.style.outline = '3px solid #e94560';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(400);
        el.style.outline = orig;
    }

    function encontrarTextarea() {
        return (
            document.querySelector('textarea') ||
            document.querySelector('#mensagem') ||
            document.querySelector('textarea[name*="mensagem"]') ||
            document.querySelector('textarea[name*="proposta"]') ||
            document.querySelector('textarea[name*="pergunta"]') ||
            document.querySelector('.form-control textarea') ||
            document.querySelector('form textarea')
        );
    }

    function encontrarBotaoEnviar() {
        return Array.from(document.querySelectorAll('button, input[type="submit"], .btn')).find(b => {
            const txt = (b.innerText || b.value || b.getAttribute('aria-label') || '').toLowerCase();
            return txt.includes('enviar') || txt.includes('perguntar') || txt.includes('send') || txt.includes('responder');
        });
    }

    async function preencherCampo(campo, texto) {
        campo.focus();
        campo.value = texto;
        ['input','change'].forEach(ev => campo.dispatchEvent(new Event(ev, { bubbles: true })));
        ['keydown','keypress','keyup'].forEach(ev => campo.dispatchEvent(new KeyboardEvent(ev, { bubbles: true, key: 'a' })));
    }

    // =========================================================
    //  ESTADO
    // =========================================================

    let estado = { rodando:false, pausado:false, fila:[], indice:0, logItens:[], delay:DELAY_PADRAO };

    function salvar() {
        GM_setValue(K_FILA,    JSON.stringify(estado.fila));
        GM_setValue(K_INDICE,  estado.indice);
        GM_setValue(K_RODANDO, estado.rodando ? '1' : '0');
        GM_setValue(K_LOG,     JSON.stringify(estado.logItens));
        GM_setValue(K_DELAY,   estado.delay);
    }

    function carregar() {
        try {
            estado.fila     = JSON.parse(GM_getValue(K_FILA,    '[]'));
            estado.indice   = parseInt(GM_getValue(K_INDICE,  0)) || 0;
            estado.rodando  = GM_getValue(K_RODANDO, '0') === '1';
            estado.logItens = JSON.parse(GM_getValue(K_LOG,     '[]'));
            estado.delay    = parseInt(GM_getValue(K_DELAY, DELAY_PADRAO)) || DELAY_PADRAO;
        } catch(e) { limparEstado(); }
    }

    function limparEstado() {
        GM_setValue(K_FILA, '[]'); GM_setValue(K_INDICE, 0); GM_setValue(K_RODANDO, '0');
        estado.fila=[]; estado.indice=0; estado.rodando=false; estado.pausado=false;
    }

    // =========================================================
    //  COMUNICAÇÃO COM GOOGLE SHEETS
    // =========================================================

    async function requisicaoFetch(method, url, dados) {
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: dados ? JSON.stringify(dados) : undefined
        });
        try { return await resp.json(); } catch(e) { return {}; }
    }

    async function buscarVagasDaPlanilha() {
        adicionarLog('📡 Buscando vagas da Etapa 4...');
        const dados = await requisicaoFetch('GET', WEBAPP_URL);
        if (dados.status !== 'ok') throw new Error('Resposta inválida: ' + JSON.stringify(dados));
        return dados.vagas || [];
    }

    async function marcarNegritoNaPlanilha(numLinha) {
        try {
            await requisicaoFetch('POST', WEBAPP_URL, { action: 'marcarNegrito', linha: numLinha });
            adicionarLog(`✅ Linha ${numLinha} marcada em negrito.`);
        } catch(e) {
            adicionarLog(`⚠️ Falha ao marcar negrito: ` + e.message);
        }
    }

    // =========================================================
    //  LÓGICA DE EXECUÇÃO
    // =========================================================

    async function executarNaPaginaAtual(scriptTexto) {
        if (temAvisoSemCredito()) return { sucesso:false, semCredito:true, motivo:'🛑 Créditos insuficientes' };
        let campo;
        try { await aguardarElemento('textarea', 8000); campo = encontrarTextarea(); }
        catch(e) { return { sucesso:false, semCredito:false, motivo:'Timeout: textarea não apareceu' }; }
        if (!campo) return { sucesso:false, semCredito:false, motivo:'Textarea não encontrada' };
        await destacar(campo);
        await preencherCampo(campo, scriptTexto);
        await sleep(800);
        if (temAvisoSemCredito()) return { sucesso:false, semCredito:true, motivo:'🛑 Créditos insuficientes' };
        const btn = encontrarBotaoEnviar();
        if (!btn) return { sucesso:false, semCredito:false, motivo:'⚠️ Botão enviar não encontrado' };
        await destacar(btn);
        btn.click();
        return { sucesso:true, semCredito:false, motivo:'✅ Enviado com sucesso' };
    }

    async function retomarAutomacao() {
        if (!estado.rodando || estado.pausado) return;
        if (estado.indice >= estado.fila.length) {
            adicionarLog(`🏁 Concluído! ${estado.fila.length} vaga(s) processada(s).`);
            atualizarStatus('Concluído!', 'ok'); limparEstado(); atualizarBotoes(false); atualizarBarra(0,0); return;
        }
        const vagaAtual = estado.fila[estado.indice];
        atualizarStatus(`Enviando ${estado.indice+1}/${estado.fila.length}: ${vagaAtual.nome}`, 'ativo');
        atualizarBotoes(true);
        const scriptTexto = GM_getValue(K_SCRIPT, SCRIPT_PADRAO);
        adicionarLog(`🔄 [${estado.indice+1}/${estado.fila.length}] ${vagaAtual.nome}`);
        await sleep(estado.delay);
        if (!estado.rodando || estado.pausado) return;
        const resultado = await executarNaPaginaAtual(scriptTexto);
        adicionarLog(`${resultado.motivo} — ${vagaAtual.link}`);
        if (resultado.semCredito) {
            adicionarLog('🛑 CRÉDITOS INSUFICIENTES — parando.');
            atualizarStatus('🛑 Sem créditos — Parado', 'erro');
            const indiceUltimaSucesso = estado.indice - 1;
            if (indiceUltimaSucesso >= 0) {
                const vagaAnterior = estado.fila[indiceUltimaSucesso];
                await marcarNegritoNaPlanilha(vagaAnterior.linha);
            }
            limparEstado(); atualizarBotoes(false);
            GM_notification({ title:'🛑 Disparo Parado', text:'Créditos insuficientes.', timeout:5000 }); return;
        }
        estado.indice++;
        atualizarBarra(estado.indice, estado.fila.length);
        if (estado.pausado) { atualizarStatus('⏸ Pausado','pausado'); salvar(); return; }
        await sleep(estado.delay);
        salvar();
        if (estado.indice < estado.fila.length) {
            adicionarLog(`➡ Navegando para [${estado.indice+1}/${estado.fila.length}]: ${estado.fila[estado.indice].nome}`);
            window.location.href = estado.fila[estado.indice].link;
        } else {
            adicionarLog(`🏁 Concluído!`); atualizarStatus('Concluído!','ok');
            limparEstado(); atualizarBotoes(false); atualizarBarra(0,0);
        }
    }

    async function iniciarDisparo() {
        const scriptEl = document.getElementById('d99-script-texto');
        const delayEl  = document.getElementById('d99-delay-input');
        const scriptTexto = (scriptEl?.value || '').trim();
        if (!scriptTexto) { adicionarLog('❌ Script/proposta vazio.'); return; }
        atualizarStatus('⏳ Buscando vagas da planilha...','ativo'); atualizarBotoes(true);
        let todasVagas;
        try { todasVagas = await buscarVagasDaPlanilha(); }
        catch(e) { adicionarLog('❌ Erro: '+e.message); atualizarStatus('Erro','erro'); atualizarBotoes(false); return; }
        if (!todasVagas.length) { adicionarLog('⚠️ Etapa 4 vazia.'); atualizarStatus('Vazio','erro'); atualizarBotoes(false); return; }
        let ultimoNegrito = -1;
        for (let i=0;i<todasVagas.length;i++) { if (todasVagas[i].negrito) ultimoNegrito=i; }
        const inicioIdx = ultimoNegrito === -1 ? 0 : ultimoNegrito+1;
        const fila = todasVagas.slice(inicioIdx);
        if (!fila.length) { adicionarLog('✅ Todas já processadas.'); atualizarStatus('Nada a enviar','ok'); atualizarBotoes(false); return; }
        adicionarLog(`📋 ${todasVagas.length} vagas. Iniciando da linha ${fila[0].linha} (${fila.length} restante(s)).`);
        estado.delay   = parseInt(delayEl?.value || DELAY_PADRAO) || DELAY_PADRAO;
        estado.fila    = fila; estado.indice=0; estado.rodando=true; estado.pausado=false;
        GM_setValue(K_SCRIPT, scriptTexto);
        salvar(); atualizarBarra(0,fila.length);
        adicionarLog(`➡ Navegando para [1/${fila.length}]: ${fila[0].nome}`);
        window.location.href = fila[0].link;
    }

    // =========================================================
    //  UI
    // =========================================================

    function adicionarLog(msg) {
        const agora = new Date().toLocaleTimeString('pt-BR');
        const entrada = `[${agora}] ${msg}`;
        estado.logItens.push(entrada);
        if (estado.logItens.length > 200) estado.logItens.shift();
        const area = document.getElementById('d99-log-area');
        if (area) { area.value = estado.logItens.join('\n'); area.scrollTop = area.scrollHeight; }
    }

    function atualizarStatus(msg, cls='') {
        const el = document.getElementById('d99-status');
        if (el) { el.textContent=msg; el.className=cls; }
    }

    function atualizarBarra(atual, total) {
        const container = document.getElementById('d99-barra-container');
        const barra     = document.getElementById('d99-barra');
        if (!container||!barra) return;
        if (total>0) { container.style.display='block'; barra.style.width=Math.round((atual/total)*100)+'%'; }
        else container.style.display='none';
    }

    function atualizarBotoes(rodando) {
        const btnIniciar = document.getElementById('d99-btn-iniciar');
        const btnPausar  = document.getElementById('d99-btn-pausar');
        const btnParar   = document.getElementById('d99-btn-parar');
        if (!btnIniciar) return;
        btnIniciar.disabled=rodando; btnPausar.disabled=!rodando; btnParar.disabled=!rodando;
    }

    function escapeHtml(str) {
        return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // =========================================================
    //  CSS + PAINEL
    // =========================================================

    GM_addStyle(`
        #d99-painel { position:fixed;bottom:20px;right:20px;width:370px;background:#1a1a2e;color:#eee;border:1px solid #e94560;border-radius:10px;box-shadow:0 4px 24px rgba(233,69,96,0.25);z-index:999999;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;user-select:none; }
        #d99-header { background:linear-gradient(135deg,#16213e,#0f3460);padding:10px 14px;border-radius:9px 9px 0 0;display:flex;align-items:center;justify-content:space-between;cursor:grab;border-bottom:1px solid #e94560; }
        #d99-header:active { cursor:grabbing; }
        #d99-titulo { font-weight:bold;font-size:14px;color:#e94560; }
        #d99-header button { background:#16213e;border:1px solid #444;color:#aaa;padding:2px 7px;border-radius:4px;cursor:pointer;font-size:13px;margin-left:4px;transition:all 0.15s; }
        #d99-header button:hover { background:#e94560;border-color:#e94560;color:white; }
        #d99-corpo { padding:12px 14px;display:flex;flex-direction:column;gap:10px;max-height:70vh;overflow-y:auto; }
        .d99-secao { display:flex;flex-direction:column;gap:5px;border-bottom:1px solid #2a2a4a;padding-bottom:10px; }
        .d99-secao:last-child { border-bottom:none;padding-bottom:0; }
        .d99-label { font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#e94560;font-weight:bold; }
        .d99-ta { width:100%;background:#0f0f23;border:1px solid #333;border-radius:5px;color:#ddd;font-size:12px;padding:7px;resize:vertical;box-sizing:border-box;font-family:'Consolas',monospace; }
        .d99-ta:focus { outline:none;border-color:#e94560; }
        #d99-script-texto { height:110px; }
        #d99-log-area { height:100px;font-size:11px;resize:none; }
        .d99-row { display:flex;gap:6px;align-items:center;flex-wrap:wrap; }
        .d99-btn { background:#16213e;border:1px solid #444;color:#ccc;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;transition:all 0.15s;white-space:nowrap; }
        .d99-btn:hover:not(:disabled) { background:#1f2f5e;border-color:#777;color:white; }
        .d99-btn:disabled { opacity:0.4;cursor:not-allowed; }
        .d99-btn-acao { background:#e94560;border-color:#e94560;color:white;font-weight:bold; }
        .d99-btn-acao:hover:not(:disabled) { background:#c73652; }
        .d99-badge { font-size:11px;color:#888; }
        .d99-badge.ok { color:#4caf50; }
        .d99-badge.erro { color:#e94560; }
        #d99-delay-input { width:70px;background:#0f0f23;border:1px solid #333;border-radius:4px;color:#ddd;font-size:12px;padding:4px 7px;text-align:center; }
        #d99-barra-container { background:#0f0f23;border-radius:4px;height:6px;overflow:hidden;display:none; }
        #d99-barra { height:100%;background:linear-gradient(90deg,#e94560,#f4845f);width:0%;transition:width 0.4s ease;border-radius:4px; }
        #d99-status { font-size:11px;color:#888;text-align:center;min-height:16px; }
        #d99-status.ativo { color:#4caf50; }
        #d99-status.pausado { color:#ffc107; }
        #d99-status.erro { color:#e94560; }
        #d99-badge-mini { position:fixed;bottom:20px;right:20px;background:#e94560;color:white;padding:10px 14px;border-radius:30px;font-size:13px;font-weight:bold;cursor:pointer;z-index:999999;box-shadow:0 4px 16px rgba(233,69,96,0.4);display:none; }
    `);

    function init() {
        if (!estaNaPaginaDeVaga()) {
            carregar();
            if (estado.rodando && estado.fila.length>0 && estado.indice<estado.fila.length) {
                setTimeout(() => { window.location.href = estado.fila[estado.indice].link; }, 1000);
            }
            return;
        }

        if (document.getElementById('d99-painel')) return;

        const scriptSalvo = GM_getValue(K_SCRIPT, SCRIPT_PADRAO);
        const delaySalvo  = GM_getValue(K_DELAY,  DELAY_PADRAO);

        const painel = document.createElement('div');
        painel.id = 'd99-painel';
        painel.innerHTML = `
            <div id="d99-header">
                <span id="d99-titulo">🚀 Disparo 99Freelas</span>
                <div>
                    <button id="d99-btn-min">_</button>
                    <button id="d99-btn-fechar">✕</button>
                </div>
            </div>
            <div id="d99-corpo">
                <div class="d99-secao">
                    <span class="d99-label">📝 Script / Proposta</span>
                    <textarea id="d99-script-texto" class="d99-ta">${escapeHtml(scriptSalvo)}</textarea>
                    <div class="d99-row">
                        <button id="d99-btn-salvar" class="d99-btn">💾 Salvar</button>
                        <button id="d99-btn-restaurar" class="d99-btn">↩ Padrão</button>
                        <span id="d99-badge-salvo" class="d99-badge ok">✓ Salvo</span>
                    </div>
                </div>
                <div class="d99-secao">
                    <div class="d99-row">
                        <span class="d99-label">⏱ Delay:</span>
                        <input type="number" id="d99-delay-input" value="${delaySalvo}" min="1000" max="30000" step="500">
                        <span class="d99-badge">ms</span>
                    </div>
                </div>
                <div class="d99-secao">
                    <div class="d99-row">
                        <button id="d99-btn-iniciar" class="d99-btn d99-btn-acao">▶ Iniciar</button>
                        <button id="d99-btn-pausar" class="d99-btn" disabled>⏸ Pausar</button>
                        <button id="d99-btn-parar"  class="d99-btn" disabled>⏹ Parar</button>
                    </div>
                    <div id="d99-barra-container"><div id="d99-barra"></div></div>
                    <div id="d99-status">Pronto</div>
                </div>
                <div class="d99-secao">
                    <div class="d99-row">
                        <span class="d99-label">📊 Log</span>
                        <button id="d99-btn-limpar-log" class="d99-btn" style="margin-left:auto">🗑 Limpar</button>
                    </div>
                    <textarea id="d99-log-area" class="d99-ta" readonly></textarea>
                </div>
            </div>`;

        const badge = document.createElement('div');
        badge.id = 'd99-badge-mini';
        badge.textContent = '🚀';
        document.body.appendChild(painel);
        document.body.appendChild(badge);

        // Arrastar
        let drag=false,sx,sy,ir,ib;
        const header = document.getElementById('d99-header');
        header.addEventListener('mousedown',e=>{ if(e.target.tagName==='BUTTON')return; drag=true;sx=e.clientX;sy=e.clientY; const r=painel.getBoundingClientRect();ir=window.innerWidth-r.right;ib=window.innerHeight-r.bottom; document.body.style.userSelect='none'; });
        document.addEventListener('mousemove',e=>{ if(!drag)return; painel.style.right=Math.max(0,ir-(e.clientX-sx))+'px'; painel.style.bottom=Math.max(0,ib+(e.clientY-sy))+'px'; });
        document.addEventListener('mouseup',()=>{ drag=false; document.body.style.userSelect=''; });

        document.getElementById('d99-btn-min').addEventListener('click',()=>{ document.getElementById('d99-corpo').style.display='none'; painel.style.display='none'; badge.style.display='block'; });
        document.getElementById('d99-btn-fechar').addEventListener('click',()=>{ painel.remove(); badge.remove(); });
        badge.addEventListener('click',()=>{ painel.style.display='block'; badge.style.display='none'; document.getElementById('d99-corpo').style.display='flex'; });

        const scriptEl=document.getElementById('d99-script-texto');
        const badgeSalvo=document.getElementById('d99-badge-salvo');
        document.getElementById('d99-btn-salvar').addEventListener('click',()=>{ GM_setValue(K_SCRIPT,scriptEl.value); badgeSalvo.textContent='✓ Salvo!'; badgeSalvo.className='d99-badge ok'; setTimeout(()=>badgeSalvo.textContent='✓ Salvo',2000); });
        scriptEl.addEventListener('input',()=>{ badgeSalvo.textContent='● Não salvo'; badgeSalvo.className='d99-badge erro'; });
        document.getElementById('d99-btn-restaurar').addEventListener('click',()=>{ if(confirm('Restaurar padrão?')){ scriptEl.value=SCRIPT_PADRAO; GM_setValue(K_SCRIPT,SCRIPT_PADRAO); } });

        document.getElementById('d99-btn-iniciar').addEventListener('click',()=>iniciarDisparo());
        document.getElementById('d99-btn-pausar').addEventListener('click',()=>{
            estado.pausado=!estado.pausado;
            const btn=document.getElementById('d99-btn-pausar');
            if(estado.pausado){ btn.textContent='▶ Retomar'; atualizarStatus('⏸ Pausado','pausado'); }
            else { btn.textContent='⏸ Pausar'; if(estado.indice<estado.fila.length){ salvar(); window.location.href=estado.fila[estado.indice].link; } }
        });
        document.getElementById('d99-btn-parar').addEventListener('click',()=>{ if(confirm('Parar automação?')){ limparEstado(); atualizarBotoes(false); atualizarStatus('Parado',''); atualizarBarra(0,0); } });
        document.getElementById('d99-btn-limpar-log').addEventListener('click',()=>{ estado.logItens=[]; const a=document.getElementById('d99-log-area'); if(a) a.value=''; });

        carregar();
        if(estado.logItens.length){ const a=document.getElementById('d99-log-area'); if(a){ a.value=estado.logItens.join('\n'); a.scrollTop=a.scrollHeight; } }
        if(estado.rodando && estado.fila.length>0 && estado.indice<estado.fila.length){ retomarAutomacao(); }
    }

    // Inicializa direto — sem chrome.storage.local.get
    carregarStorage();
    init();

})();
