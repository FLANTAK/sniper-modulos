// maestro.js — Sniper Loader v2
// Bypass CSP: usa fetch() + new Function() em vez de <script src>
// Suporte a múltiplos módulos por site via path matching

(function () {
    if (window.sniperActive) return;
    window.sniperActive = true;

    const BASE = 'https://raw.githubusercontent.com/FLANTAK/sniper-modulos/refs/heads/main/modulos/';

    // Regras avaliadas em ordem — primeira match vence
    const REGRAS = [
        {
            matcher: (h, p) => h === '99freelas.com.br' && /\/profile(\/edit)?$/.test(p),
            modulo: BASE + '99freelas-perfis.js'
        },
        {
            matcher: (h, p) => h === '99freelas.com.br' && /\/(project|job|vaga)\//.test(p),
            modulo: BASE + '99freelas-disparo.js'
        },
        {
            matcher: (h) => h === '99freelas.com.br',
            modulo: BASE + '99freelas-scraping.js'
        },
        {
            matcher: (h, p) => h === 'instagram.com' && p.includes('/direct'),
            modulo: BASE + 'instagram-directs.js'
        },
        {
            matcher: (h) => h === 'instagram.com',
            modulo: BASE + 'instagram-marcacao.js'
        }
    ];

    const host     = window.location.hostname.replace('www.', '');
    const pathname = window.location.pathname;
    const regra    = REGRAS.find(r => r.matcher(host, pathname));

    if (!regra) {
        console.warn('[Sniper] Site/página não mapeado:', host + pathname);
        return;
    }

    const moduleUrl = regra.modulo + '?v=' + Date.now();
    console.log('[Sniper] Carregando:', moduleUrl);

    fetch(moduleUrl, { cache: 'no-store', headers: { 'Accept': 'text/plain' } })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function (code) {
            try {
                (new Function(code))();
                console.log('[Sniper] ✅ Módulo OK');
            } catch (e) {
                console.error('[Sniper] ❌ Erro execução:', e);
            }
        })
        .catch(function (err) {
            console.error('[Sniper] ❌ Erro fetch:', err.message);
        });
})();
