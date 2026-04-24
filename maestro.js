// maestro.js
(function() {
    if (window.sniperActive) return;
    window.sniperActive = true;

    const sites = {
        "99freelas.com.br": "https://raw.githubusercontent.com/FLANTAK/sniper-modulos/main/modulos/vagas_99.js",
        "instagram.com": "https://raw.githubusercontent.com/FLANTAK/sniper-modulos/main/modulos/insta_dm.js"
    };

    const host = window.location.hostname.replace('www.', '');
    const moduleUrl = sites[host];

    if (moduleUrl) {
        // Como o Maestro foi injetado via barra de endereços pelo AHK,
        // ele já bypassou o primeiro bloqueio. 
        // Para os módulos, se o CSP continuar bloqueando, 
        // o ideal será colocar o código do módulo direto no Maestro
        // ou usar um Loader no AHK que já traga o módulo específico.
        console.log("🚀 Sniper detectado para: " + host);
        
        var s = document.createElement('script');
        s.src = moduleUrl + "?v=" + Date.now();
        document.head.appendChild(s);
    }
})();
