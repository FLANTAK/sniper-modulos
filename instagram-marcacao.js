// ============================================================
//  SNIPER MÓDULO — Instagram Robô Marcação V1.0
//  Convertido de TamperMonkey para JS puro (extensão Chrome)
//  O que mudou: removidos headers TM, localStorage mantido
//  (localStorage é válido em content scripts no contexto da página)
//  O que NÃO mudou: nenhuma funcionalidade
// ============================================================

(function () {
    'use strict';

    if (window.__sniper_marcacao_ativo) return;
    window.__sniper_marcacao_ativo = true;

    if (Notification.permission !== "granted") Notification.requestPermission();

    // --- ESTADO GLOBAL ---
    let listaURLs = [];
    let listaUsers = [];
    let indiceURL = 0;
    let tamanhoPorPost = 10;
    let processando = false;
    let pausado = false;
    let timerAgendamentoInterval = null;

    // ============================================================
    // INTERFACE VISUAL (idêntica ao original)
    // ============================================================

    const painel = document.createElement('div');
    painel.id = 'robo-marcacao-painel';

    Object.assign(painel.style, {
        position:'fixed', top:'50px', right:'10px', backgroundColor:'white',
        border:'2px solid #0095f6', padding:'0', zIndex:'99999',
        boxShadow:'0 4px 20px rgba(0,0,0,0.25)', borderRadius:'12px', width:'270px',
        fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize:'12px', color:'#000', resize:'both', overflow:'hidden', minWidth:'220px', minHeight:'80px',
    });

    const inputStyle = 'width:100%; background-color:#fff; color:#000; border:1px solid #ccc; padding:5px; border-radius:4px; box-sizing:border-box;';
    const labelStyle = 'display:block; margin-bottom:3px; font-weight:600; color:#000;';
    const btnStyle = 'flex:1; padding:9px; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;';

    painel.innerHTML = `
        <div id="robo-header" style="background:#0095f6; color:white; padding:8px 12px; border-radius:10px 10px 0 0; display:flex; align-items:center; justify-content:space-between; cursor:grab; user-select:none;">
            <span style="font-weight:bold; font-size:13px;">🤖 Marcação V1.0</span>
            <div style="display:flex; gap:6px; align-items:center;">
                <span id="btnReduzir" style="cursor:pointer; font-size:14px; padding:0 4px;">−</span>
                <span id="btnAumentar" style="cursor:pointer; font-size:14px; padding:0 4px;">+</span>
                <span id="btnMinimizar" style="cursor:pointer; font-size:16px; padding:0 4px; line-height:1;">▲</span>
            </div>
        </div>
        <div id="robo-corpo" style="max-height:520px; overflow-y:auto; padding:12px;">
            <details open>
                <summary style="font-weight:bold; color:#0095f6; cursor:pointer; margin-bottom:8px; font-size:12px;">📋 Posts (URLs)</summary>
                <textarea id="listaURLs" placeholder="https://www.instagram.com/p/ABC123/" style="${inputStyle} height:70px; font-size:10px; margin-bottom:10px;"></textarea>
            </details>
            <details open>
                <summary style="font-weight:bold; color:#0095f6; cursor:pointer; margin-bottom:8px; font-size:12px;">👥 Usernames</summary>
                <textarea id="listaUsers" placeholder="@usuario1&#10;@usuario2" style="${inputStyle} height:80px; font-size:10px; margin-bottom:10px;"></textarea>
            </details>
            <details open>
                <summary style="font-weight:bold; color:#0095f6; cursor:pointer; margin-bottom:8px; font-size:12px;">⚙️ Configurações</summary>
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <div style="flex:1;"><label style="${labelStyle}">Tags/Post (1–25):</label><input type="number" id="tamanhoPorPost" value="10" min="1" max="25" style="${inputStyle}"></div>
                    <div style="flex:1;"><label style="${labelStyle}">Pausa (min):</label><input type="number" id="pausaEntreURLs" value="5" min="1" style="${inputStyle}"></div>
                </div>
                <label style="${labelStyle}">Delay entre tags (segundos):</label>
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <input type="number" id="delayMin" value="4" placeholder="Min" style="${inputStyle}">
                    <input type="number" id="delayMax" value="10" placeholder="Max" style="${inputStyle}">
                </div>
            </details>
            <details>
                <summary style="font-weight:bold; color:#0055aa; cursor:pointer; margin-bottom:8px; font-size:12px;">📅 Agendamento (Brasília)</summary>
                <div style="background:#f0f8ff; border:1px solid #b3d7ff; border-radius:6px; padding:8px; margin-bottom:10px;">
                    <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                        <input type="checkbox" id="ativarAgendamento" style="width:16px; height:16px; cursor:pointer;">
                        <span style="color:#000; font-size:11px;">Ativar agendamento</span>
                    </div>
                    <div id="camposAgendamento" style="display:none;">
                        <div style="display:flex; gap:6px; margin-bottom:4px;">
                            <div style="flex:1;"><label style="${labelStyle} font-size:10px;">Data:</label><input type="date" id="dataAgendada" style="${inputStyle} font-size:11px;"></div>
                            <div style="flex:1;"><label style="${labelStyle} font-size:10px;">Hora:</label><input type="time" id="horaAgendada" style="${inputStyle} font-size:11px;"></div>
                        </div>
                        <div id="statusAgendamento" style="font-size:10px; color:#0055aa; min-height:14px; text-align:center;"></div>
                    </div>
                </div>
            </details>
            <div id="statusLog" style="background:#f9f9f9; padding:8px; border-radius:5px; margin-bottom:10px; height:80px; overflow-y:auto; border:1px solid #ddd; color:#000; font-size:10px; line-height:1.4;">Status: Pronto.</div>
            <div id="progressoInfo" style="font-size:10px; color:#555; margin-bottom:8px; text-align:center;">Posts: — | Users: —</div>
            <div style="display:flex; gap:5px; margin-bottom:6px;">
                <button id="btnIniciar" style="${btnStyle} background:#0095f6;">▶ INICIAR</button>
                <button id="btnPausar" style="${btnStyle} background:#f5a623; display:none;">⏸ PAUSAR</button>
            </div>
            <div style="display:flex; gap:5px;">
                <button id="btnReset" style="${btnStyle} background:#ed4956; flex:0.5;">🔄 Reset</button>
                <a href="https://www.instagram.com/" target="_blank" style="${btnStyle} background:#833ab4; text-decoration:none; color:white; text-align:center; display:flex; align-items:center; justify-content:center;">🔗 Abrir Insta</a>
            </div>
        </div>
    `;

    document.body.appendChild(painel);

    // Drag
    const header = document.getElementById('robo-header');
    let isDragging=false, dragX=0, dragY=0;
    header.addEventListener('mousedown', (e) => {
        if (['btnMinimizar','btnReduzir','btnAumentar'].includes(e.target.id)) return;
        isDragging=true; dragX=e.clientX-painel.getBoundingClientRect().left; dragY=e.clientY-painel.getBoundingClientRect().top; header.style.cursor='grabbing';
    });
    document.addEventListener('mousemove', (e) => { if(!isDragging)return; painel.style.left=(e.clientX-dragX)+'px'; painel.style.top=(e.clientY-dragY)+'px'; painel.style.right='auto'; });
    document.addEventListener('mouseup', () => { isDragging=false; header.style.cursor='grab'; });

    let minimizado=false;
    document.getElementById('btnMinimizar').addEventListener('click', () => {
        minimizado=!minimizado;
        document.getElementById('robo-corpo').style.display=minimizado?'none':'block';
        document.getElementById('btnMinimizar').innerText=minimizado?'▼':'▲';
    });
    document.getElementById('btnReduzir').addEventListener('click', () => { const w=parseInt(painel.style.width||'270'); painel.style.width=Math.max(200,w-20)+'px'; });
    document.getElementById('btnAumentar').addEventListener('click', () => { const w=parseInt(painel.style.width||'270'); painel.style.width=Math.min(500,w+20)+'px'; });

    document.getElementById('ativarAgendamento').addEventListener('change', function() {
        document.getElementById('camposAgendamento').style.display=this.checked?'block':'none';
        if (this.checked) {
            const agora=new Date(new Date().toLocaleString("en-US",{timeZone:"America/Sao_Paulo"}));
            document.getElementById('dataAgendada').value=agora.toISOString().split('T')[0];
            document.getElementById('horaAgendada').value=`${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}`;
        }
    });

    function msAteAgendamento() {
        const data=document.getElementById('dataAgendada').value;
        const hora=document.getElementById('horaAgendada').value;
        if(!data||!hora) return null;
        const [ano,mes,dia]=data.split('-').map(Number);
        const [hh,mi]=hora.split(':').map(Number);
        return Date.UTC(ano,mes-1,dia,hh+3,mi,0)-Date.now();
    }

    // Utilitários idênticos ao original
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function log(msg, erro=false) {
        const el=document.getElementById('statusLog');
        if(!el) return;
        const t=new Date().toLocaleTimeString('pt-BR');
        el.innerHTML=`<div style="color:${erro?'red':'#000'}; border-bottom:1px solid #eee; padding-bottom:2px; margin-bottom:2px;">[${t}] ${msg}</div>`+el.innerHTML;
    }

    function notificar(titulo,corpo) { if(Notification.permission==="granted") new Notification(titulo,{body:corpo}); }

    function atualizarProgresso() {
        const el=document.getElementById('progressoInfo');
        if(el) el.textContent=`Posts: ${indiceURL+1}/${listaURLs.length} | Users restantes: ${listaUsers.length}`;
    }

    function getDelay() {
        const mn=parseInt(document.getElementById('delayMin').value)*1000;
        const mx=parseInt(document.getElementById('delayMax').value)*1000;
        return Math.floor(Math.random()*(mx-mn+1)+mn);
    }

    function simularClique(el) {
        if(!el) return;
        ['mousedown','mouseup','click'].forEach(t => el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})));
    }

    function clicarNaCoordenada(x,y) {
        const el=document.elementFromPoint(x,y);
        if(!el) return;
        ['mousedown','mouseup','click'].forEach(t => el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,view:window})));
    }

    async function verificarPausa() {
        if(!pausado) return;
        log("⏸ PAUSADO.");
        const btn=document.getElementById('btnPausar');
        if(btn){btn.innerText="▶ RETOMAR";btn.style.background="#3897f0";}
        while(pausado) await sleep(800);
        log("▶ Retomado.");
        if(btn){btn.innerText="⏸ PAUSAR";btn.style.background="#f5a623";}
    }

    function aguardarElemento(seletor,timeoutMs=8000,intervalo=300) {
        return new Promise((resolve,reject)=>{
            const ini=Date.now();
            const timer=setInterval(()=>{
                const el=document.querySelector(seletor);
                if(el){clearInterval(timer);resolve(el);return;}
                if(Date.now()-ini>timeoutMs){clearInterval(timer);reject(new Error(`Timeout: ${seletor}`));}
            },intervalo);
        });
    }

    function aguardarElementoPorTexto(seletor,texto,timeoutMs=8000) {
        return new Promise((resolve,reject)=>{
            const ini=Date.now();
            const timer=setInterval(()=>{
                const els=[...document.querySelectorAll(seletor)];
                const el=els.find(e=>e.innerText.trim().toLowerCase().includes(texto.toLowerCase()));
                if(el){clearInterval(timer);resolve(el);return;}
                if(Date.now()-ini>timeoutMs){clearInterval(timer);reject(new Error(`Timeout texto: ${texto}`));}
            },300);
        });
    }

    async function digitarNoCampo(campo,texto) {
        campo.focus();
        const nativeInputValueSetter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
        nativeInputValueSetter.call(campo,texto);
        campo.dispatchEvent(new Event('input',{bubbles:true}));
        campo.dispatchEvent(new Event('change',{bubbles:true}));
    }

    function encontrarImagemPost() {
        const candidatos=[...document.querySelectorAll('div[role="button"][tabindex="0"]')];
        for(const el of candidatos){ const rect=el.getBoundingClientRect(); if(rect.width>200&&rect.height>200) return el; }
        return null;
    }

    function coordenadaAleatoria(rect) {
        const margemX=rect.width*0.2, margemY=rect.height*0.2;
        return { x:Math.floor(rect.left+margemX+Math.random()*(rect.width-margemX*2)), y:Math.floor(rect.top+margemY+Math.random()*(rect.height-margemY*2)) };
    }

    async function abrirEdicao() {
        log("🔍 Procurando botão '...'...");
        let svgOpcoes=null;
        try { svgOpcoes=await aguardarElemento('svg[aria-label="Mais opções"]',10000); } catch { log("❌ Botão '...' não encontrado.",true); return false; }
        const btnOpcoes=svgOpcoes.closest('div[role="button"],button,a')||svgOpcoes.parentElement;
        simularClique(btnOpcoes);
        log("✅ Menu aberto.");
        await sleep(1500);
        let btnEditar=null;
        try { btnEditar=await aguardarElementoPorTexto('button,div[role="button"]','Editar',6000); }
        catch { btnEditar=document.querySelector('button._a9--._ap36._a9_1,button[class*="_a9_1"]'); }
        if(!btnEditar){log("❌ Botão 'Editar' não encontrado.",true);return false;}
        simularClique(btnEditar);
        log("✅ Clicou em Editar.");
        await sleep(2500);
        return true;
    }

    async function marcarUmUsuario(username) {
        await verificarPausa();
        const imgContainer=encontrarImagemPost();
        if(!imgContainer){log("❌ Container da imagem não encontrado.",true);return false;}
        const rect=imgContainer.getBoundingClientRect();
        const coord=coordenadaAleatoria(rect);
        log(`🖱 Clicando em (${coord.x}, ${coord.y})...`);
        clicarNaCoordenada(coord.x,coord.y);
        await sleep(2000);
        let campoBusca=null;
        try { campoBusca=await aguardarElemento('input[name="userSearchInput"]',5000); }
        catch {
            const coord2=coordenadaAleatoria(rect);
            clicarNaCoordenada(coord2.x,coord2.y);
            await sleep(2000);
            try { campoBusca=await aguardarElemento('input[name="userSearchInput"]',5000); }
            catch { log(`❌ Pulando ${username}.`,true); return false; }
        }
        const userSemArroba=username.replace('@','');
        await digitarNoCampo(campoBusca,userSemArroba);
        log(`🔎 Buscando: ${userSemArroba}`);
        await sleep(2500);
        let primeiroResultado=null;
        try {
            primeiroResultado=await aguardarElemento('div._acmu',6000);
            primeiroResultado=primeiroResultado.closest('div[class*="x7a106z"],div[class*="_acmu"]')?.parentElement||primeiroResultado.parentElement?.parentElement||primeiroResultado.parentElement;
        } catch { log(`⚠️ Nenhum resultado para ${userSemArroba}.`,true); campoBusca.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); return false; }
        simularClique(primeiroResultado);
        log(`✅ Marcado: @${userSemArroba}`);
        await sleep(1500);
        return true;
    }

    async function clicarConcluido() {
        log("🏁 Procurando 'Concluído'...");
        let btn=null;
        try { btn=await aguardarElementoPorTexto('div[role="button"]','Concluído',6000); }
        catch { log("⚠️ 'Concluído' não encontrado.",true); return false; }
        simularClique(btn); log("✅ Concluído."); await sleep(2000); return true;
    }

    async function processarPost(url) {
        log(`🌐 Navegando para: ${url.split('/p/')[1]||url}`);
        if(window.location.href!==url){ window.location.href=url; salvarEstado(); return; }
        await sleep(3000);
        const editouOk=await abrirEdicao();
        if(!editouOk){log(`❌ Não consegui editar: ${url}`,true);return;}
        const qtd=Math.min(tamanhoPorPost,listaUsers.length);
        let marcados=0;
        for(let i=0;i<qtd;i++){
            await verificarPausa();
            const username=listaUsers[0];
            const ok=await marcarUmUsuario(username);
            if(ok){listaUsers.shift();marcados++;atualizarProgresso();log(`📊 ${marcados}/${qtd} marcados.`);}
            if(i<qtd-1&&listaUsers.length>0){const d=getDelay();log(`⏱ Aguardando ${(d/1000).toFixed(1)}s...`);await sleep(d);}
        }
        await clicarConcluido();
        await sleep(2000);
        try { const btnSalvar=await aguardarElementoPorTexto('div[role="button"],button','ok',4000); simularClique(btnSalvar); await sleep(1500); } catch {}
        log(`✅ Post concluído! ${marcados} usuários marcados.`);
        notificar("Marcação concluída",`${marcados} marcados`);
    }

    async function executarFluxo() {
        log("▶ Iniciando fluxo de marcação...");
        while(indiceURL<listaURLs.length&&listaUsers.length>0){
            await verificarPausa();
            await processarPost(listaURLs[indiceURL]);
            indiceURL++; atualizarProgresso(); salvarEstado();
            if(indiceURL<listaURLs.length&&listaUsers.length>0){
                const pausaMs=parseInt(document.getElementById('pausaEntreURLs').value)*60*1000;
                await contarRegressivo(pausaMs);
            }
        }
        if(listaUsers.length===0){log("🎉 TODOS OS USUÁRIOS FORAM MARCADOS!");notificar("Robô Marcação","Concluído!");}
        else if(indiceURL>=listaURLs.length) log("⚠️ Acabaram as URLs mas ainda há usuários.");
        resetarBotoes(); limparEstado();
    }

    function contarRegressivo(ms) {
        return new Promise((resolve)=>{
            const btnIniciar=document.getElementById('btnIniciar');
            let restante=Math.floor(ms/1000);
            const timer=setInterval(async()=>{
                if(pausado){if(btnIniciar)btnIniciar.innerText="⏸ PAUSADO";return;}
                restante--;
                const m=Math.floor(restante/60),s=restante%60;
                if(btnIniciar){btnIniciar.innerText=`Próximo: ${m}m ${s}s`;btnIniciar.style.background="#8e8e8e";}
                if(restante<=0){clearInterval(timer);if(btnIniciar)btnIniciar.style.background="#0095f6";resolve();}
            },1000);
        });
    }

    const CHAVE_ESTADO='robo_marcacao_estado_v1';
    function salvarEstado() { localStorage.setItem(CHAVE_ESTADO,JSON.stringify({listaURLs,listaUsers,indiceURL,tamanhoPorPost,pausaEntreURLs:parseInt(document.getElementById('pausaEntreURLs').value),delayMin:parseInt(document.getElementById('delayMin').value),delayMax:parseInt(document.getElementById('delayMax').value),ativo:true})); }
    function limparEstado() { localStorage.removeItem(CHAVE_ESTADO); }
    function recuperarEstado() { try { const raw=localStorage.getItem(CHAVE_ESTADO); return raw?JSON.parse(raw):null; } catch { return null; } }

    function resetarBotoes() {
        processando=false;pausado=false;
        const btnI=document.getElementById('btnIniciar');
        if(btnI){btnI.innerText="▶ INICIAR";btnI.style.background="#0095f6";btnI.disabled=false;}
        const btnP=document.getElementById('btnPausar');
        if(btnP) btnP.style.display="none";
    }

    // Retomar após reload
    window.addEventListener('load', async()=>{
        await sleep(2000);
        const estado=recuperarEstado();
        if(!estado||!estado.ativo) return;
        log("🔄 Retomando sessão anterior...");
        listaURLs=estado.listaURLs; listaUsers=estado.listaUsers; indiceURL=estado.indiceURL; tamanhoPorPost=estado.tamanhoPorPost;
        document.getElementById('listaURLs').value=listaURLs.join('\n');
        document.getElementById('listaUsers').value=listaUsers.join('\n');
        document.getElementById('tamanhoPorPost').value=tamanhoPorPost;
        document.getElementById('pausaEntreURLs').value=estado.pausaEntreURLs;
        document.getElementById('delayMin').value=estado.delayMin;
        document.getElementById('delayMax').value=estado.delayMax;
        processando=true;
        const btnP=document.getElementById('btnPausar');
        if(btnP) btnP.style.display="block";
        atualizarProgresso();
        const urlEsperada=listaURLs[indiceURL];
        if(urlEsperada&&window.location.href.includes(urlEsperada.split('instagram.com')[1])){ await sleep(1500); await processarPost(urlEsperada); indiceURL++; await executarFluxo(); }
        else { window.location.href=urlEsperada; salvarEstado(); }
    });

    document.getElementById('btnIniciar').addEventListener('click', async()=>{
        if(processando) return;
        const urlsRaw=document.getElementById('listaURLs').value.trim();
        const usersRaw=document.getElementById('listaUsers').value.trim();
        if(!urlsRaw){alert("Cole pelo menos uma URL!");return;}
        if(!usersRaw){alert("Cole a lista de usernames!");return;}
        listaURLs=urlsRaw.split('\n').map(u=>u.trim()).filter(u=>u.includes('instagram.com/p/'));
        listaUsers=usersRaw.split('\n').map(u=>u.trim().replace(/^@/,'')).filter(Boolean).map(u=>'@'+u);
        if(listaURLs.length===0){alert("Nenhuma URL válida!");return;}
        tamanhoPorPost=Math.min(Math.max(parseInt(document.getElementById('tamanhoPorPost').value)||10,1),25);
        indiceURL=0; processando=true; pausado=false;
        const btnPause=document.getElementById('btnPausar');
        if(btnPause){btnPause.style.display="block";btnPause.innerText="⏸ PAUSAR";btnPause.style.background="#f5a623";}
        atualizarProgresso();
        if(document.getElementById('ativarAgendamento').checked){
            const ms=msAteAgendamento();
            if(!ms){alert("Preencha data e hora!");resetarBotoes();return;}
            if(ms<=0){alert("⚠️ Horário já passou!");resetarBotoes();return;}
            log(`📅 Agendado!`);
            // contagem regressiva
            const statusEl=document.getElementById('statusAgendamento');
            const btnI=document.getElementById('btnIniciar');
            if(btnI){btnI.innerText="⏳ AGUARDANDO...";btnI.style.background="#8e8e8e";btnI.disabled=true;}
            let msR=ms;
            timerAgendamentoInterval=setInterval(()=>{
                msR-=1000;
                if(msR<=0){clearInterval(timerAgendamentoInterval);if(statusEl)statusEl.textContent="🚀 Iniciando!";if(btnI){btnI.disabled=false;btnI.style.background="#0095f6";btnI.innerText="▶ PROCESSANDO...";}salvarEstado();executarFluxo();return;}
                const t=Math.floor(msR/1000),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;
                if(statusEl) statusEl.textContent=`⏳ ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
            },1000);
            return;
        }
        salvarEstado(); executarFluxo();
    });

    document.getElementById('btnPausar').addEventListener('click', ()=>{
        pausado=!pausado;
        const btn=document.getElementById('btnPausar');
        if(btn){btn.innerText=pausado?"▶ RETOMAR":"⏸ PAUSAR";btn.style.background=pausado?"#3897f0":"#f5a623";}
    });

    document.getElementById('btnReset').addEventListener('click', ()=>{
        if(!confirm("Resetar tudo?")) return;
        limparEstado(); resetarBotoes();
        listaURLs=[];listaUsers=[];indiceURL=0;
        ['listaURLs','listaUsers'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
        const el=document.getElementById('progressoInfo');if(el)el.textContent='Posts: — | Users: —';
        const log2=document.getElementById('statusLog');if(log2)log2.innerHTML='Status: Resetado.';
        log("🔄 Reset completo.");
    });

})();
