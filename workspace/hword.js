/* Hebrew Word Study: the Hebrew word picked in the Hebrew panel, with its lemma, transliteration, gloss, the
 * STEPBible brief lexicon entry (TBESH, from the abridged BDB), how often it is used and where, and every place it
 * occurs in the Old Testament (a click opens the verse). Data: data/hx/ and data/hw/, one file per hundred numbers. */
(function () {
  var state = WS.state, esc = WS.esc;
  var W = {
    title: { en: 'Hebrew Word Study', ja: 'ヘブライ語の語句研究' },
    pick: { en: 'Click a word in the Hebrew panel.', ja: 'ヘブライ語のパネルで語を押してください。' },
    uses: { en: 'uses in the Old Testament', ja: '回（旧約全体）' }, books: { en: 'Where it is used most', ja: '多く使われている書' },
    lex: { en: 'Brief lexicon', ja: '辞書（簡易）' }, all: { en: 'Every place it occurs', ja: '出てくる箇所すべて' },
    more: { en: 'Only the first 400 are listed.', ja: '最初の400か所だけを表示しています。' },
    src: { en: 'Lexicon: STEPBible TBESH, based on the abridged BDB (CC BY 4.0). Counts and places: STEPBible TAHOT (CC BY 4.0). English only for now.',
      ja: '辞書：STEPBible TBESH（簡約 BDB にもとづく、CC BY 4.0）。回数と箇所：STEPBible TAHOT（CC BY 4.0）。今は英語のみです。' }
  };
  function L(o) { return state.lang === 'en' ? o.en : o.ja; }
  var cache = {};
  function bucket(kind, s) {
    var k = kind + '/' + s.slice(0, 3);
    if (!cache[k]) cache[k] = WS.getJSON(k + '.json').catch(function () { return {}; });
    return cache[k];
  }
  function panel(el) {
    el.classList.add('hwd');
    var e = null, occ = null, shown = null;
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-hgo], .lx-ref[data-ref]'); if (!b) return;
      var p = (b.dataset.hgo || b.dataset.ref).split('.');
      if (WS.manifest.books[p[0]]) WS.go(p[0], +p[1], +p[2]);
    });
    function load() {
      var s = WS.hsel; shown = s;
      if (!s) { e = occ = null; return Promise.resolve(); }
      return Promise.all([bucket('hx', s), bucket('hw', s)]).then(function (r) { if (shown === s) { e = r[0][s] || null; occ = r[1][s] || []; } });
    }
    function draw() {
      var head = '<h2>' + esc(L(W.title)) + '</h2>';
      if (!WS.hsel) { el.innerHTML = head + '<p>' + esc(L(W.pick)) + '</p>'; return; }
      if (!e) { el.innerHTML = head + '<p class="small">' + esc(WS.hsel) + '</p>'; return; }
      var bk = Object.keys(e.bk || {}).sort(function (a, b) { return e.bk[b] - e.bk[a]; }), top = e.bk[bk[0]] || 1;
      el.innerHTML = head +
        '<div class="hwd-h"><b lang="hbo" dir="rtl">' + esc(e.l) + '</b> <span class="small"><i>' + esc(e.x) + '</i> · ' + esc(WS.hsel) + '</span></div>' +
        '<p lang="en"><b>' + esc(e.g) + '</b></p><p class="small">' + e.n + ' ' + esc(L(W.uses)) + '</p>' +
        '<h3>' + esc(L(W.books)) + '</h3><ul class="hwd-bars">' + bk.slice(0, 10).map(function (b) {
          return '<li><span class="n">' + esc(WS.bookName(b, true)) + '</span><span class="bar" style="width:' + Math.max(4, Math.round(e.bk[b] / top * 100)) + '%"></span><span class="c">' + e.bk[b] + '</span></li>';
        }).join('') + '</ul>' +
        (e.d ? '<h3>' + esc(L(W.lex)) + '</h3><div class="hwd-lx" lang="en">' + e.d + '</div>' : '') +
        '<h3>' + esc(L(W.all)) + '</h3><p class="hwd-occ">' + (occ || []).slice(0, 400).map(function (o) {
          return '<button data-hgo="' + o[0] + '.' + o[1] + '.' + o[2] + '">' + esc(WS.bookName(o[0], true) + ' ' + o[1] + ':' + o[2]) + '</button>';
        }).join('') + '</p>' + ((occ || []).length > 400 ? '<p class="small">' + esc(L(W.more)) + '</p>' : '') +
        '<p class="small">' + esc(L(W.src)) + '</p>';
    }
    var on = function () { load().then(draw); };
    window.addEventListener('ows-hword', on);
    return { ready: load, render: draw, dispose: function () { window.removeEventListener('ows-hword', on); } };
  }
  WS.panel({ id: 'hword', component: 'hword', title: { en: 'Hebrew Word Study', ja: 'ヘブライ語の語句研究' }, group: 'original', build: panel });
})();
