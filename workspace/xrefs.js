/* Cross references for the verse in view, from the same files the site's Passage Companion uses
 * (../companion/data/<Book>.<chapter>.json): OpenBible.info cross references ranked by readers' votes (CC BY 4.0),
 * shown with the BSB text of each reference. A New Testament reference opens in the workspace; an Old Testament one
 * opens in the Interlinear Reader. Only on the website, where those files sit next to the workspace. */
(function () {
  var state = WS.state, esc = WS.esc;
  var X = {
    title: { en: 'Cross references', ja: '関連箇所' },
    lead: { en: 'Other passages readers linked to this verse, most votes first. A list to think with, not a commentary.',
      ja: 'この節につながる箇所を、読者の投票の多い順に並べています。注解ではなく、考えるための一覧です。' },
    votes: { en: 'votes', ja: '票' }, none: { en: 'No cross references for this verse.', ja: 'この節の関連箇所はありません。' },
    off: { en: 'Cross references are on the website only.', ja: '関連箇所は、ウェブサイトでのみ表示できます。' },
    pick: { en: 'Click a verse to see its cross references.', ja: '節を押すと、その節の関連箇所が出ます。' },
    open: { en: 'Open', ja: '開く' }, reader: { en: 'Open in the Interlinear Reader', ja: '逐語対訳リーダーで開く' },
    src: { en: 'Cross references: OpenBible.info (CC BY 4.0). Text: Berean Standard Bible (public domain), in English.',
      ja: '関連箇所：OpenBible.info（CC BY 4.0）。本文：Berean Standard Bible（パブリックドメイン、英語）。' }
  };
  function L(k) { return state.lang === 'en' ? X[k].en : X[k].ja; }
  var NT = { Matt: 'Mat', Mark: 'Mrk', Luke: 'Luk', John: 'Jhn', Acts: 'Act', Rom: 'Rom', '1Cor': '1Co', '2Cor': '2Co', Gal: 'Gal', Eph: 'Eph',
    Phil: 'Php', Col: 'Col', '1Thess': '1Th', '2Thess': '2Th', '1Tim': '1Ti', '2Tim': '2Ti', Titus: 'Tit', Phlm: 'Phm', Heb: 'Heb', Jas: 'Jas',
    '1Pet': '1Pe', '2Pet': '2Pe', '1John': '1Jn', '2John': '2Jn', '3John': '3Jn', Jude: 'Jud', Rev: 'Rev' };
  var cache = {}, byOsis = null;
  /* an Old Testament reference opens in the workspace too, now that it has the Old Testament */
  function osisCode(o) {
    if (!byOsis) { byOsis = {}; var b = (WS.manifest || {}).books || {}; Object.keys(b).forEach(function (c) { if (b[c].osis) byOsis[b[c].osis] = c; }); }
    return byOsis[o];
  }
  function load() {
    var k = state.book + '.' + state.ch;
    if (!cache[k]) cache[k] = fetch('../companion/data/' + k + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[k];
  }
  function panel(el) {
    el.classList.add('xr');
    var data = null;
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-x]'); if (!b) return;
      var p = b.dataset.x.split('.'); WS.go(p[0], +p[1], +p[2]);
    });
    return {
      ready: function () {
        if (!window.WS_SITE) { data = null; return Promise.resolve(); }
        return load().then(function (d) { data = d; }, function () { data = null; });
      },
      paint: function () { if (this._v !== state.v) this.render(); },
      render: function () {
        this._v = state.v;
        var head = '<h2>' + esc(L('title') + ' · ' + WS.bookName() + ' ' + state.ch + (state.v ? ':' + state.v : '')) + '</h2>';
        if (!window.WS_SITE || !data) { el.innerHTML = head + '<p>' + esc(L('off')) + '</p>'; return; }
        if (!state.v) { el.innerHTML = head + '<p>' + esc(L('pick')) + '</p>'; return; }
        var v = data.verses.filter(function (x) { return x.ref && new RegExp(':' + state.v + '$').test(x.ref); })[0];
        var list = v && v.xrefs || [];
        var q = state.lang === 'en' ? '?lang=en' : '?lang=ja';
        el.innerHTML = head + '<p class="small">' + esc(L('lead')) + '</p>' + (list.length ? '<ol class="xlist">' + list.map(function (x) {
          var m = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)/.exec(x.osis || ''), code = m && (NT[m[1]] || osisCode(m[1]));
          var go = code ? '<button class="btn" data-x="' + code + '.' + m[2] + '.' + m[3] + '">' + esc(L('open')) + '</button>'
            : '<a class="btn" href="' + WS_SITE.home + 'reader/' + q + '#' + esc((x.osis || '').split('-')[0]) + '" target="_blank" rel="noopener">' + esc(L('reader')) + '</a>';
          return '<li><div><b>' + esc(x.ref) + '</b> <span class="small">' + (x.votes || 0) + ' ' + esc(L('votes')) + '</span></div>' +
            '<p lang="en">' + esc(x.text || '') + '</p>' + go + '</li>';
        }).join('') + '</ol>' : '<p>' + esc(L('none')) + '</p>') + '<p class="small">' + esc(L('src')) + '</p>';
      }
    };
  }
  WS.panel({ id: 'xrefs', component: 'xrefs', title: { en: 'Cross references', ja: '関連箇所' }, group: 'study', build: panel });
})();
