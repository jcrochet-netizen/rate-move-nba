# Note les moves NBA — BasketUSA

Widget interactif (1 seul fichier `index.html`, sans dépendance) : les lecteurs notent
sur 10 chaque **trade** et **prolongation** NBA, valident, puis découvrent un **écran de
résultats** avec leur récap, la **moyenne de la communauté**, des **boutons de partage**
(X, Facebook, WhatsApp, partage natif mobile, copier) et le **téléchargement d'une image**
de leurs notes.

## Fichiers

- `index.html` — le widget complet (logo BasketUSA embarqué en base64, aucune dépendance externe).
- `Code.gs` — backend Google Apps Script pour collecter / agréger les votes dans un Google Sheet.
- `logo-busa.png` — le logo source (déjà inclus dans le HTML, fourni pour référence).

## 1. Brancher les votes de la communauté (Google Sheet)

Même principe que le projet **Mercato-Selector** : POST fire-and-forget pour écrire, GET pour lire.

1. Crée un **Google Sheet** vide.
2. `Extensions` → `Apps Script`, colle le contenu de `Code.gs`, enregistre.
3. `Déployer` → `Nouveau déploiement` → type **Application Web** :
   - **Exécuter en tant que** : Moi
   - **Qui a accès** : Tout le monde
4. Copie l'URL qui se termine par `/exec`.
5. Dans `index.html`, renseigne :
   ```js
   const CONFIG = {
     votesUrl: "https://script.google.com/macros/s/XXXXX/exec"
   };
   ```
   Tant que `votesUrl` est vide (`""`), l'écran communauté reste désactivé (le reste fonctionne).

Le Sheet se remplit tout seul : onglet **Votes** (1 ligne par note) + onglet **Tally** (moyennes agrégées).
Une protection « 1 vote par navigateur » est gérée via `localStorage` (clé `busaRateMoves_voted_v1`).

## 2. Intégrer dans WordPress (bloc HTML personnalisé)

Héberge `index.html` (GitHub Pages, ou le CDN/serveur BasketUSA), puis colle ce bloc dans un
module « HTML personnalisé ». Bonnes pratiques : origine vérifiée, `referrerpolicy`,
`scrolling="no"` + `overflow:hidden` (pas de double-scroll mobile), `min-height` de repli
(anti-CLS), largeur centrée.

```html
<iframe
  id="busa-rate-moves"
  src="https://jcrochet-netizen.github.io/rate-move-nba/"
  title="Note les trades de la semaine en NBA — BasketUSA"
  loading="lazy"
  scrolling="no"
  referrerpolicy="strict-origin-when-cross-origin"
  style="width:100%;max-width:640px;display:block;margin:0 auto;border:0;overflow:hidden;min-height:620px;"></iframe>

<script>
(function () {
  var ORIGIN = 'https://jcrochet-netizen.github.io';   // origine de confiance (l'hébergeur du widget)
  var frame  = document.getElementById('busa-rate-moves');
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return;                   // 1) on n'accepte QUE les messages de notre widget
    var d = e.data; if (!d) return;
    if (d.type === 'busa-rate-height') {               // auto-resize (pas de scroll interne, pas de CLS)
      var h = parseInt(d.height, 10);
      if (h && h > 0) { frame = frame || document.getElementById('busa-rate-moves'); if (frame) frame.style.height = h + 'px'; }
    }
    if (d.type === 'busa-rate-ready' && e.source) {    // donne au widget l'URL réelle (partages précis)
      e.source.postMessage({ type: 'busa-rate-parent-url', url: location.href }, ORIGIN);
    }
  }, false);
})();
</script>
```

> Sécurité : le contrôle `e.origin` empêche tout autre site/script d'agir sur l'iframe ; le
> message de hauteur ne transporte qu'un entier. `referrerpolicy="strict-origin-when-cross-origin"`
> + la réponse `busa-rate-parent-url` permettent au widget d'utiliser l'URL exacte de la page
> WordPress dans les partages (sinon il retombe sur `CONFIG.shareUrl`).

> ⚠️ SEO : le contenu d'une iframe **n'est pas attribué** à la page WordPress par Google (il
> appartient au domaine `github.io`). Encadre toujours l'iframe d'un vrai `H1`/`H2` et de texte
> crawlable (présentation des trades de la semaine) pour que la page ne soit pas « vide » pour le SEO.

## 3. Personnaliser les moves

Tout est en haut de la balise `<script>` dans `index.html`, tableau `MOVES` :

```js
{ id:"giannis-mia", type:"trade", player:"Giannis Antetokounmpo", action:"Tradé au Miami Heat" },
{ id:"reaves-lal",  type:"ext",   player:"Austin Reaves", action:"Prolonge aux Lakers", detail:"185 M$ / 5 ans" },
```

- `id` : identifiant **stable** (sert à agréger les votes côté Sheet — ne le change pas après publication).
- `type` : `"trade"` ou `"ext"` (prolongation) — change l'icône et le libellé.
- `detail` : optionnel (montant / durée).

`CONFIG.shareUrl` (fallback) et `CONFIG.hashtags` se règlent juste au-dessus.

---
*Outil non officiel — BasketUSA.*
