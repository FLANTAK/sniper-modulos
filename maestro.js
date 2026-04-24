(async function() {
    if (window.sniperActive) return console.log("Sniper já está ativo nesta aba.");
    window.sniperActive = true;

    const repoBase = "https://raw.githubusercontent.com/FLANTAK/sniper-modulos/main/modulos/";
    const sites = {
        "99freelas.com.br": "vagas_99.js",
        "instagram.com": "insta_dm.js",
        "producthunt.com": "ph_leads.js"
    };

    const host = window.location.hostname.replace('www.', '');
    const moduleFile = sites[host];

    if (moduleFile) {
        console.log(`[Sniper] Carregando módulo: ${moduleFile}`);
        try {
            // Bypass de CSP e Cache
            const response = await fetch(`${repoBase}${moduleFile}?v=${Date.now()}`);
            const code = await response.text();
            const script = document.createElement('script');
            script.textContent = code;
            document.head.appendChild(script);
        } catch (e) {
            console.error("[Sniper] Erro ao carregar módulo:", e);
            window.sniperActive = false;
        }
    } else {
        console.warn("[Sniper] Nenhum módulo configurado para este domínio.");
        window.sniperActive = false;
    }
})();
