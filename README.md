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

Héberge `index.html` (GitHub Pages, ou le CDN/serveur BasketUSA), puis :

```html
<iframe id="busa-rate" src="https://URL-DU-WIDGET/" style="width:100%;border:0;min-height:900px"
        loading="lazy" title="Note les moves NBA"></iframe>
<script>
window.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'busa-rate-height') {
    document.getElementById('busa-rate').style.height = e.data.height + 'px';
  }
});
</script>
```

Le widget envoie sa hauteur au parent via `postMessage` (auto-resize de l'iframe) et récupère
l'URL de la page hôte pour les partages.

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
