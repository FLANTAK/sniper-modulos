(async function() {
    // 1. Evita execução duplicada
    if (window.sniperActive) {
        console.log("⚠️ [Sniper] Já está ativo nesta aba.");
        return;
    }
    window.sniperActive = true;

    // Configuração de Módulos (Nomes exatos dos arquivos na pasta /modulos)
    const repoBase = "https://raw.githubusercontent.com/FLANTAK/sniper-modulos/main/modulos/";
    const sites = {
        "99freelas.com.br": "vagas_99.js",
        "instagram.com": "insta_dm.js",
        "producthunt.com": "ph_leads.js"
    };

    const host = window.location.hostname.replace('www.', '');
    const moduleFile = sites[host];

    if (moduleFile) {
        console.log(`🚀 [Sniper] Carregando módulo: ${moduleFile}`);
        try {
            // Fetch com Cache Busting (?v=) para garantir a versão mais nova
            const response = await fetch(`${repoBase}${moduleFile}?v=${Date.now()}`);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            
            const code = await response.text();
            
            // Injeção Inline para bypassar restrições de CSP (Segurança do Chrome)
            const script = document.createElement('script');
            script.textContent = code;
            document.head.appendChild(script);
            
            console.log("✅ [Sniper] Módulo injetado com sucesso.");
        } catch (e) {
            console.error("❌ [Sniper] Falha ao baixar módulo:", e);
            window.sniperActive = false;
        }
    } else {
        console.warn("ℹ️ [Sniper] Nenhum módulo configurado para este site.");
        window.sniperActive = false;
    }
})();
