// ============================================================
//  SNIPER MÓDULO — 99Freelas Troca de Perfis
//  Convertido de Console DevTools para JS puro (extensão Chrome)
//  Aparece apenas em: /profile/edit e /profile
//  O que mudou: removida dependência de console, adicionado auto-init
//  O que NÃO mudou: nenhuma funcionalidade
// ============================================================

(function () {
    'use strict';

    if (window.__sniper_perfis_ativo) return;
    window.__sniper_perfis_ativo = true;

    // =========================================================
    //  PERFIS (dados originais mantidos integralmente)
    // =========================================================

    const PERFIS = {
        1: {
            nome: 'Felipe',
            titulo: 'Ghostwriter e Engenharia Social',
            sobre: `Escrevo para Especialistas que desejam se comunicar com MQLs que pagam bem e pagam rápido [em 24hrs ou menos]

Provavelmente você é um profissional incrível;

Poderia estar entre os melhores na sua especialidade.

Mas sua comunicação não consegue causar impacto e evidenciar o quão bom você é.

E então!?

Poucos enxergam o seu valor.

E então!?

Você recebe menos do que os demais, que nem são tão bons quanto você.

Com certeza você já passou por isso.

Tem um serviço, mentoria ou oferta valiosa e precisa:

- Elaborar e Otimizar sua Proposta;
- Escrever seus Ads e Conteúdos
- Apresentar para seus clientes;

Mas ao digitar...

Parece uma porcaria!

Outro profissional escreve a mesma coisa, presta o mesmo serviço...E soa brilhante.

Então você se sente uma fraude.

Você precisar de uma camisa de força que vai aprisionar os seus piores instintos e os maus hábitos na sua comunicação.

Vamos limpar e organizar a ideias.

E se expressar com potência.

Sua comunicação não será mais confusa.

Será atraente e lucrativa.

Você transmitirá ser um especialista muito mais inteligente e competente, a melhor opção do seu mercado. Pago pela sua expertise e não pelo seu tempo

Seja bem-vindo!`,
            experiencia: `Está é uma carta exclusiva pra Especialistas que desejam cobrar R$5.000 + 10% (ou bem mais) por consultorias que levam só 2h30 para serem entregues.

Sempre te disseram que pra vender seu Conhecimento como Especialista, Mentor ou Infoprodutor você precisa...

- Acumular "experiência" (não passa de um falso perfeccionismo)
- fechar com clientes que pagam 500,00 (são os piores);
- trabalhar muito;

Mentiram para você...

Indo direto ao ponto:

Existem 3 tipos de clientes.

01/ os que tem mais TEMPO que DINHEIRO contam moedas pra te pagar e ainda acham que sabem mais que você, sempre com uma "correção"

02/ Grandes Players — eles têm $$$ pra te pagar, só não querem.

03/ os que têm mais $$$ que tempo — eles têm problemas urgentes e caros de manter. Querem fechar negócio o mais rápido possível.

Há uma forma pouco falada nos Bastidores das vendas de mentorias e consultorias que te permite vender o mesmo direcionamento que você já dá, sem vender mais uma "mentoria"

Minha proposta ousada:

Em 2h vamos implementar à 4 mãos a estrutura exata de Aquisição, pra que você feche Projetos e Direcionamentos de 5k-10k + % (ou mais) todos os meses.

Envie "2" na DM e te mostrarei os detalhes finos`,
            areasInteresse: ['chk154', 'chk125', 'chk33', 'chk42', 'chk41'],
            habilidadesValues: ['1501', '1237', '1497', '1564', '929']
        },
        2: {
            nome: 'Henrique Rangel',
            titulo: 'Consultor de Automações',
            sobre: `Trabalho com Negócios que precisam escalar operações sem aumentar custos [projetos a partir de 3k com ROI em semanas]

Provavelmente você já perdeu oportunidades por processos lentos.

Poderia estar faturando o dobro com a mesma equipe.

Mas hoje, suas operações dependem de trabalho manual repetitivo que consome tempo e gera erros.

E então!?

Seu time fica sobrecarregado com tarefas operacionais.

E então!?

Você cresce devagar enquanto concorrentes escalam rapidamente com menos recursos.

Com certeza você já passou por isso.

Meu trabalho é como uma engenharia invisível que vai eliminar gargalos e multiplicar a capacidade produtiva do seu negócio.

Vou arquitetar fluxos inteligentes que trabalham 24/7 por você.

Sua operação não será mais um limitador de crescimento. Será uma máquina eficiente e lucrativa.

Te espero do outro lado.`,
            experiencia: `Esta é uma carta exclusiva pra Negócios que desejam investir R$8.000 + mensalidade em automações que eliminam gargalos e multiplicam capacidade em 3-5 dias.

Existem 3 tipos de "automatizadores":

01/ Os que cobram BARATO — Fazem fluxo simples, some quando dá problema.

02/ Software Houses Grandes — cobram 50k+, querem te vender sistema proprietário.

03/ Os que dominam Arquitetura de Processos + Execução Rápida — Mapeiam gargalos reais, implementam automações robustas e deixam tudo documentado.

Minha proposta ousada:

Trabalho com projetos pontuais ou recorrentes aplicando a estrutura exata de Mapeamento + Automação Inteligente, pra que você escale 3x-5x a capacidade operacional sem contratar mais gente.

Envie "AUTO" na DM e te mostrarei como funciona na prática.`,
            areasInteresse: ['chk17', 'chk21', 'chk57', 'chk56', 'chk36'],
            habilidadesValues: ['1501', '1265', '7', '1564', '11']
        },
        3: {
            nome: 'Rangel',
            titulo: 'Dev/Osint/Crypto',
            sobre: `Trabalho com Empresas que não podem se dar ao luxo de vulnerabilidades [projetos a partir de 5k com análises profundas e soluções robustas]

Provavelmente você já se preocupou com a segurança dos seus sistemas.

Poderia estar com brechas críticas neste momento.

Mas na correria do dia a dia, segurança fica em segundo plano até que algo grave aconteça.

E então!? Dados sensíveis ficam expostos, sistemas vulneráveis.

E então!? Um incidente pode custar sua reputação, seus clientes, processos legais.

Meu trabalho é como uma blindagem inteligente que vai identificar cada ponto fraco e fortalecer a integridade dos seus ativos digitais.

Você terá tranquilidade para crescer sabendo que sua infraestrutura é sólida e seus clientes estão protegidos.

Te espero do outro lado.`,
            experiencia: `Esta é uma carta exclusiva pra Empresas que desejam investir R$10.000 + retainer em sistemas blindados e arquitetura robusta entregues em 5-7 dias.

Existem 3 tipos de desenvolvedores:

01/ Os que cobram BARATO — Código funciona "mais ou menos", sem testes, sem segurança.

02/ Consultorias Corporativas — cobram 100k+, burocracia infinita, você paga por hora, não por resultado.

03/ Os que dominam Arquitetura Defensiva + Entrega Objetiva — Pensam como atacante, constroem como engenheiro.

Minha proposta ousada:

Trabalho com projetos pontuais ou recorrentes aplicando Análise Ofensiva + Engenharia Defensiva, pra que você tenha sistemas protegidos contra ameaças reais.

Envie "DEV" e te mostrarei como funciona na prática.`,
            areasInteresse: ['chk17', 'chk21', 'chk57', 'chk56', 'chk36'],
            habilidadesValues: ['1501', '1159', '7', '1564', '11']
        },
        4: {
            nome: 'Henrique',
            titulo: 'Growth Hacker e Engenharia de Prompt',
            sobre: `Trabalho com Negócios que precisam crescer de forma sistêmica e previsível [projetos a partir de 4k com frameworks customizados]

Provavelmente você já tentou várias táticas de crescimento.

Poderia estar crescendo exponencialmente.

Mas hoje, seu crescimento é irregular, imprevisível, dependente de "tentativa e erro".

E então!? Você investe em ações isoladas sem visão sistêmica.

Meu trabalho é como a arquitetura de uma máquina de crescimento que vai transformar esforços dispersos em sistema coordenado de escala.

Você terá frameworks customizados que transformam crescimento em processo replicável.

Te espero do outro lado.`,
            experiencia: `Esta é uma carta exclusiva pra Negócios que desejam investir R$7.000 + % sobre resultado em crescimento sistêmico e IA aplicada entregues em 3-4 dias.

Existem 3 tipos de profissionais de crescimento:

01/ Os que cobram BARATO — Fazem relatório bonito, somem quando os números não sobem.

02/ Agências Grandes — cobram 30k+, fazem campanha genérica. Você é mais um cliente na fila.

03/ Os que dominam Growth Engineering + IA Aplicada — Constroem sistemas de crescimento personalizados.

Minha proposta ousada:

Trabalho com projetos pontuais ou recorrentes aplicando Growth Engineering + Prompt Engineering Avançado, pra que você escale com método e previsibilidade.

Envie "GROWTH" e te mostrarei como funciona na prática.`,
            areasInteresse: ['chk154', 'chk125', 'chk33', 'chk42', 'chk41'],
            habilidadesValues: ['1501', '1497', '1564', '929', '1237']
        }
    };

    // =========================================================
    //  UTILITÁRIOS (idênticos ao original)
    // =========================================================

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function log(msg) {
        const el = document.getElementById('cad99-status');
        if (el) el.textContent = msg;
        console.log('%c[🎯 Perfil99] ' + msg, 'color:#4caf50;font-weight:bold;');
    }

    async function preencherCampo(seletor, valor) {
        const el = document.querySelector(seletor);
        if (!el) { log('⚠️ Campo não encontrado: ' + seletor); return false; }
        el.style.outline = '3px solid #4caf50';
        el.scrollIntoView({ behavior:'smooth', block:'center' });
        await sleep(200);
        el.focus(); el.value = valor;
        el.dispatchEvent(new Event('input',  { bubbles:true }));
        el.dispatchEvent(new Event('change', { bubbles:true }));
        await sleep(200);
        el.style.outline = '';
        return true;
    }

    async function preencherAreasInteresse(idsDesejados) {
        document.querySelectorAll('#areas-interesse input[type="checkbox"]:checked').forEach(cb => cb.click());
        await sleep(500);
        for (const id of idsDesejados) {
            const cb = document.getElementById(id);
            if (!cb) { log('⚠️ Checkbox não encontrado: '+id); continue; }
            const li = cb.closest('li.item-category');
            if (li) {
                const itemsDiv = li.querySelector('.items');
                if (itemsDiv && getComputedStyle(itemsDiv).display === 'none') {
                    const titulo = li.querySelector('.item-title');
                    if (titulo) { titulo.click(); await sleep(400); }
                }
            }
            if (!cb.checked) { cb.style.outline='3px solid #4caf50'; await sleep(150); cb.click(); await sleep(250); cb.style.outline=''; }
        }
        log('✅ Áreas marcadas: '+idsDesejados.join(', '));
    }

    async function preencherHabilidades(values) {
        const select = document.getElementById('habilidades');
        if (!select) { log('⚠️ Select habilidades não encontrado'); return; }
        Array.from(select.options).forEach(o => { o.selected=false; });
        values.forEach(val => {
            const opt = select.querySelector(`option[value="${val}"]`);
            if (opt) { opt.selected=true; log('   + '+opt.text); }
        });
        select.dispatchEvent(new Event('change', { bubbles:true }));
        await sleep(200);
        if (window.jQuery) {
            try {
                if (jQuery('#habilidades').data('select2')) { jQuery('#habilidades').val(values).trigger('change'); }
                else { jQuery('#habilidades').trigger('change'); }
                await sleep(300);
            } catch(e) {}
        }
        log('✅ Habilidades definidas');
    }

    async function aplicarPerfil(numPerfil) {
        const perfil = PERFIS[numPerfil];
        if (!perfil) { log('❌ Perfil '+numPerfil+' não existe'); return; }
        log('▶ Aplicando Perfil '+numPerfil+': '+perfil.nome);
        await preencherCampo('#nome', perfil.nome);
        await preencherCampo('#titulo-profissional', perfil.titulo);
        await preencherCampo('#descricao', perfil.sobre);
        await preencherCampo('#resumo-experiencia-profissional', perfil.experiencia);
        await preencherAreasInteresse(perfil.areasInteresse);
        await preencherHabilidades(perfil.habilidadesValues);
        log('🎉 PERFIL '+numPerfil+' APLICADO! Clique em "Salvar Alterações".');
        const btnSalvar = document.getElementById('btnSalvar');
        if (btnSalvar) { btnSalvar.style.outline='4px solid #4caf50'; btnSalvar.style.boxShadow='0 0 20px #4caf50'; btnSalvar.scrollIntoView({ behavior:'smooth', block:'center' }); }
    }

    // =========================================================
    //  PAINEL FLUTUANTE
    // =========================================================

    if (document.getElementById('cad99-painel')) return;

    const style = document.createElement('style');
    style.textContent = `
        #cad99-painel { position:fixed;bottom:20px;right:20px;width:270px;background:#1a1a2e;color:#eee;border:2px solid #4caf50;border-radius:10px;box-shadow:0 4px 24px rgba(76,175,80,0.4);z-index:999999;font-family:'Segoe UI',Arial,sans-serif;font-size:13px; }
        #cad99-header { background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:10px 14px;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #4caf50;font-weight:bold;color:#a5d6a7; }
        #cad99-min { background:#1b5e20;border:1px solid #4caf50;color:#ccc;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:13px; }
        #cad99-corpo { padding:12px 14px;display:flex;flex-direction:column;gap:8px; }
        #cad99-select { width:100%;background:#0f0f23;border:1px solid #2a2a4a;border-radius:5px;color:#ddd;font-size:12px;padding:7px; }
        .cad99-row { display:flex;gap:6px; }
        #cad99-btn-aplicar { flex:2;background:#2e7d32;border:1px solid #4caf50;color:white;font-weight:bold;padding:7px 10px;border-radius:5px;cursor:pointer;font-size:12px; }
        #cad99-btn-aplicar:hover:not(:disabled) { background:#1b5e20; }
        #cad99-btn-aplicar:disabled { opacity:0.5;cursor:not-allowed; }
        #cad99-btn-salvar { flex:1;background:#16213e;border:1px solid #333;color:#ccc;padding:7px 10px;border-radius:5px;cursor:pointer;font-size:12px; }
        #cad99-btn-salvar:hover { background:#1f3e1f;border-color:#4caf50; }
        #cad99-status { font-size:11px;color:#aaa;word-break:break-word;min-height:16px; }
    `;
    document.head.appendChild(style);

    const painel = document.createElement('div');
    painel.id = 'cad99-painel';
    painel.innerHTML = `
        <div id="cad99-header">
            <span>🎯 Perfis 99Freelas</span>
            <button id="cad99-min">_</button>
        </div>
        <div id="cad99-corpo">
            <select id="cad99-select">
                <option value="">— Selecione o perfil —</option>
                <option value="1">Perfil 1 — Ghostwriter</option>
                <option value="2">Perfil 2 — Automações</option>
                <option value="3">Perfil 3 — Dev/Osint/Crypto</option>
                <option value="4">Perfil 4 — Growth Hacker</option>
            </select>
            <div class="cad99-row">
                <button id="cad99-btn-aplicar" disabled>✅ Aplicar Perfil</button>
                <button id="cad99-btn-salvar">💾 Salvar</button>
            </div>
            <div id="cad99-status">Selecione um perfil acima.</div>
        </div>`;
    document.body.appendChild(painel);

    const sel        = document.getElementById('cad99-select');
    const btnAplicar = document.getElementById('cad99-btn-aplicar');

    sel.addEventListener('change', () => {
        btnAplicar.disabled = !sel.value;
        if (sel.value) {
            const p = PERFIS[sel.value];
            document.getElementById('cad99-status').textContent = 'Selecionado: '+p.nome+' | '+p.titulo;
        }
    });

    btnAplicar.addEventListener('click', async () => {
        const v = sel.value; if (!v) return;
        btnAplicar.disabled=true; btnAplicar.textContent='⏳ Preenchendo...';
        await aplicarPerfil(parseInt(v));
        btnAplicar.disabled=false; btnAplicar.textContent='✅ Aplicar Perfil';
    });

    document.getElementById('cad99-btn-salvar').addEventListener('click', () => {
        const btn = document.getElementById('btnSalvar');
        if (btn) btn.click(); else alert('Botão Salvar não encontrado.');
    });

    let minimizado = false;
    document.getElementById('cad99-min').addEventListener('click', () => {
        minimizado=!minimizado;
        document.getElementById('cad99-corpo').style.display = minimizado ? 'none' : 'flex';
        document.getElementById('cad99-min').textContent = minimizado ? '+' : '_';
    });

    log('✅ Painel de Perfis carregado.');

})();
