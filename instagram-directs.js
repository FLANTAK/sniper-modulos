// ============================================================
//  SNIPER MÓDULO — Instagram Robô Directs V4.0
//  Convertido de TamperMonkey para JS puro (extensão Chrome)
//  O que mudou: removidos headers TM, @grant none = sem GM_*
//  O que NÃO mudou: nenhuma funcionalidade (código era vanilla JS)
// ============================================================

(function() {
    'use strict';

    if (window.__sniper_directs_ativo) return;
    window.__sniper_directs_ativo = true;

    // --- PERMISSÕES ---
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // --- VARIÁVEIS GLOBAIS ---
    let listaGlobalUsers = [];
    let indiceAtual = 0;
    let tamanhoLote = 50;
    let intervaloMinutos = 60;
    let processando = false;
    let pausado = false;

    // --- PAINEL VISUAL ---
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '50px';
    div.style.right = '10px';
    div.style.backgroundColor = 'white';
    div.style.border = '2px solid #0095f6';
    div.style.padding = '15px';
    div.style.zIndex = '9999';
    div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
    div.style.borderRadius = '12px';
    div.style.width = '260px';
    div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    div.style.fontSize = '12px';
    div.style.color = 'black';

    const inputStyle = 'width:100%; background-color:#fff; color:#000; border:1px solid #ccc; padding:5px; border-radius:4px; box-sizing:border-box;';
    const labelStyle = 'display:block; margin-bottom:3px; font-weight:600; color:#000;';
    const btnStyle = 'flex:1; padding:10px; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;';

    div.innerHTML = `
        <h4 style="margin:0 0 10px 0; font-size:14px; font-weight:bold; color:#000;">🤖 Disparador V4 (Pause + Enviar)</h4>
        <label style="${labelStyle}">Lista de @users:</label>
        <textarea id="listaUsers" placeholder="Cole os users aqui..." style="${inputStyle} height:80px; font-size:11px; margin-bottom:10px;"></textarea>
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <div style="flex:1;">
                <label style="${labelStyle}">Lote (Qtd):</label>
                <input type="number" id="tamanhoLote" value="50" style="${inputStyle}">
            </div>
            <div style="flex:1;">
                <label style="${labelStyle}">Pausa (Min):</label>
                <input type="number" id="tempoEntreLotes" value="60" style="${inputStyle}">
            </div>
        </div>
        <label style="${labelStyle}">Delay entre users (segundos):</label>
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <input type="number" id="delayMin" value="5" placeholder="Min" style="${inputStyle}">
            <input type="number" id="delayMax" value="15" placeholder="Max" style="${inputStyle}">
        </div>
        <div id="statusLog" style="background:#f9f9f9; padding:8px; border-radius:5px; margin-bottom:10px; height:90px; overflow-y:auto; border:1px solid #ddd; color:#000; font-size:11px;">Status: Pronto.</div>
        <div style="display:flex; gap:5px;">
            <button id="btnProcessar" style="${btnStyle} background:#0095f6;">▶ INICIAR</button>
            <button id="btnPausar" style="${btnStyle} background:#f5a623; display:none;">⏸ PAUSAR</button>
        </div>
        <div style="margin-top:8px; text-align:center;">
            <a href="https://www.instagram.com/direct/inbox/" target="_blank" style="color:#0095f6; text-decoration:none; font-weight:bold;">🔗 Abrir Minhas DMs</a>
        </div>
    `;

    document.body.appendChild(div);

    // --- FUNÇÕES AUXILIARES ---
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function log(msg, error = false) {
        const logArea = document.getElementById('statusLog');
        if (!logArea) return;
        const time = new Date().toLocaleTimeString();
        const color = error ? 'red' : 'black';
        logArea.innerHTML = `<div style="color:${color}; border-bottom:1px solid #e0e0e0; padding-bottom:2px; margin-bottom:2px;">[${time}] ${msg}</div>` + logArea.innerHTML;
    }

    function notificarNavegador(titulo, corpo) {
        if (Notification.permission === "granted") {
            new Notification(titulo, { body: corpo });
        }
    }

    function getHumanDelay() {
        const minVal = parseInt(document.getElementById('delayMin').value);
        const maxVal = parseInt(document.getElementById('delayMax').value);
        return Math.floor(Math.random() * ((maxVal - minVal + 1) * 1000) + (minVal * 1000));
    }

    async function verificarPausa() {
        if (!pausado) return;
        log("⏸ Sistema PAUSADO pelo usuário.");
        const btn = document.getElementById('btnPausar');
        if (btn) { btn.innerText = "▶ RETOMAR"; btn.style.background = "#3897f0"; }
        while (pausado) { await sleep(1000); }
        log("▶ Sistema RETOMADO.");
        if (btn) { btn.innerText = "⏸ PAUSAR"; btn.style.background = "#f5a623"; }
    }

    function simularClique(elemento) {
        if (!elemento) return;
        ['mousedown', 'mouseup', 'click'].forEach(t => {
            elemento.dispatchEvent(new MouseEvent(t, { bubbles:true, cancelable:true, view:window }));
        });
    }

    async function finalizarLoteComEnvio() {
        log("🏁 Lote preenchido. Procurando botão 'Enviar'...");
        await sleep(2000);
        const botoes = document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] button');
        let clicou = false;
        for (const btn of botoes) {
            const texto = btn.innerText.toLowerCase();
            if (texto.includes("enviar separadamente") || texto.includes("bate-papo") || texto.includes("chat") || texto === "enviar") {
                log(`🖱 Clicando em: "${btn.innerText}"`);
                simularClique(btn);
                clicou = true;
                break;
            }
        }
        if (!clicou) log("⚠️ Botão 'Enviar' não encontrado automaticamente.", true);
        else log("✅ Clique de envio efetuado!");
    }

    async function reabrirModal() {
        log("🔄 Tentando reabrir janela de Nova Mensagem...");
        const svgs = document.querySelectorAll('svg[aria-label="Nova mensagem"], svg[aria-label="New message"]');
        if (svgs.length > 0) {
            let icone = svgs[0].closest('div[role="button"]') || svgs[0].closest('a');
            if (icone) { simularClique(icone); log("✅ Janela reaberta."); await sleep(3000); return true; }
        }
        log("⚠️ Não achei o botão de Nova Mensagem.", true);
        return false;
    }

    async function processarLote() {
        await verificarPausa();
        let campoBusca = document.querySelector('input[name="queryBox"]');
        if (!campoBusca) {
            await reabrirModal();
            campoBusca = document.querySelector('input[name="queryBox"]');
        }
        if (!campoBusca) {
            log("❌ Campo de busca não acessível.", true);
            alert("Não consegui abrir a janela. Abra manualmente e clique em Retomar.");
            pausado = true;
            await verificarPausa();
            return processarLote();
        }
        let fimLote = indiceAtual + tamanhoLote;
        if (fimLote > listaGlobalUsers.length) fimLote = listaGlobalUsers.length;
        log(`🚀 Processando Lote: ${indiceAtual+1} até ${fimLote}`);
        for (let i = indiceAtual; i < fimLote; i++) {
            await verificarPausa();
            const user = listaGlobalUsers[i];
            let lastValue = campoBusca.value;
            campoBusca.value = user;
            let tracker = campoBusca._valueTracker;
            if (tracker) tracker.setValue(lastValue);
            campoBusca.dispatchEvent(new Event('input', { bubbles:true }));
            await sleep(3000);
            let alvo = null;
            let checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
            if (checkboxes.length > 0) alvo = checkboxes[0];
            else {
                let botoes = document.querySelectorAll('div[role="dialog"] div[role="button"]');
                if (botoes.length > 0) alvo = botoes[0];
            }
            if (alvo) { simularClique(alvo); log(`➕ Adicionado: ${user}`); }
            else log(`⚠️ ${user} não encontrado.`, true);
            await sleep(1000);
            campoBusca.value = "";
            campoBusca.dispatchEvent(new Event('input', { bubbles:true }));
            campoBusca.focus();
            let t = getHumanDelay();
            await sleep(t);
        }
        await finalizarLoteComEnvio();
        indiceAtual = fimLote;
        if (indiceAtual >= listaGlobalUsers.length) {
            log("🎉 FINALIZADO! Todos os lotes enviados.");
            notificarNavegador("Robô Insta", "Processo Concluído!");
            resetarBotoes();
        } else {
            log(`⏸ Lote enviado. Aguardando ${intervaloMinutos} min.`);
            notificarNavegador("Lote Concluído", `Próximo lote em ${intervaloMinutos} minutos.`);
            iniciarContagemRegressiva(intervaloMinutos);
        }
    }

    function iniciarContagemRegressiva(minutos) {
        let segundosRestantes = minutos * 60;
        const btn = document.getElementById('btnProcessar');
        const timerInterval = setInterval(async () => {
            if (pausado) { if(btn) btn.innerText = "EM PAUSA"; return; }
            segundosRestantes--;
            let m = Math.floor(segundosRestantes / 60);
            let s = segundosRestantes % 60;
            if (btn) { btn.innerText = `Aguardando: ${m}m ${s}s`; btn.style.background = "#8e8e8e"; btn.disabled = true; }
            if (segundosRestantes <= 0) {
                clearInterval(timerInterval);
                if (btn) { btn.disabled=false; btn.style.background="#0095f6"; btn.innerText="▶ PROCESSANDO..."; }
                processarLote();
            }
        }, 1000);
    }

    function resetarBotoes() {
        processando=false; pausado=false;
        const b1=document.getElementById('btnProcessar');
        const b2=document.getElementById('btnPausar');
        if(b1){ b1.innerText="▶ INICIAR"; b1.style.background="#0095f6"; b1.disabled=false; }
        if(b2) b2.style.display="none";
    }

    document.getElementById('btnProcessar').addEventListener('click', async () => {
        if (processando) return;
        const inputTexto = document.getElementById('listaUsers').value;
        listaGlobalUsers = inputTexto.split('\n').filter(u => u.trim() !== '');
        if (listaGlobalUsers.length === 0) { alert("Cole a lista primeiro!"); return; }
        tamanhoLote = parseInt(document.getElementById('tamanhoLote').value) || 50;
        intervaloMinutos = parseInt(document.getElementById('tempoEntreLotes').value) || 60;
        indiceAtual=0; processando=true; pausado=false;
        const btnPause = document.getElementById('btnPausar');
        if(btnPause){ btnPause.style.display="block"; btnPause.innerText="⏸ PAUSAR"; btnPause.style.background="#f5a623"; }
        log("▶ Iniciando disparos...");
        processarLote();
    });

    document.getElementById('btnPausar').addEventListener('click', () => {
        pausado = !pausado;
        const btn = document.getElementById('btnPausar');
        if(btn){ btn.innerText = pausado ? "▶ RETOMAR" : "⏸ PAUSAR"; btn.style.background = pausado ? "#3897f0" : "#f5a623"; }
    });

})();
