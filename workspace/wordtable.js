/* Word by word: every Greek word of the chapter in view as one table row: the word, its lemma and Strong's number,
 * the parsing spelled out, the TAGNT gloss, and how often the lemma occurs in the New Testament. A summary above
 * lists the words this chapter repeats and the rare ones (five uses or fewer in the New Testament).
 * Data: the workspace's SBLGNT words with TAGNT tags and its lemma counts. Nothing new is fetched. */
(function () {
  var state = WS.state, esc = WS.esc;
  var W = {
    title: { en: 'Word by word', ja: '語ごとの表' },
    v: { en: 'Verse', ja: '節' }, word: { en: 'Word', ja: '語' }, lemma: { en: 'Lemma', ja: '見出し語' },
    parse: { en: 'Parsing', ja: '解析' }, gloss: { en: 'Gloss', ja: '語釈' }, nt: { en: 'Uses in NT', ja: '新約での回数' },
    rep: { en: 'Repeated in this chapter', ja: 'この章でくり返される語' }, rare: { en: 'Rare (5 uses or fewer in the NT)', ja: 'まれな語（新約で5回以下）' },
    none: { en: 'none', ja: 'なし' }, only: { en: 'Show verse', ja: '表示する節' }, allv: { en: 'All', ja: 'すべて' },
    note: { en: 'Glosses are short English labels from STEPBible TAGNT, not translations. Articles, conjunctions, particles, prepositions, pronouns and adverbs are left out of the summary.',
      ja: '語釈は STEPBible TAGNT の短い英語のラベルで、訳ではありません。冠詞、接続詞、小辞、前置詞、代名詞、副詞は、上の一覧から外しています。' }
  };
  function L(k) { return state.lang === 'en' ? W[k].en : W[k].ja; }
  var SKIP = /^(T-|CONJ|PRT|PREP|P-|R-|D-|ADV)/;  // article, conjunctions, particles, prepositions, pronouns, adverbs: left out of the summary lists
  function parse(code) {
    var f = (WS.morph || {})[code] || {};
    return WS.gram(['pos', 'tense', 'voice', 'mood', 'person', 'case', 'number', 'gender'].map(function (k) { return f[k]; }).filter(Boolean));
  }
  function table(el) {
    el.classList.add('wtab');
    var only = 0;
    el.addEventListener('change', function (ev) { if (ev.target.id === 'wtv') { only = +ev.target.value; draw(); } });
    el.addEventListener('click', function (ev) {
      var r = ev.target.closest('[data-wv]'); if (!r) return;
      WS.selectWord(+r.dataset.wv, +r.dataset.wi, r.dataset.ws);
    });
    function draw() {
      if (!WS.covers('grc')) { el.innerHTML = '<h2>' + esc(L('title')) + '</h2><p class="small">' + esc(WS.t('ntOnly')) + '</p>' + (WS.covers('hbo') ? '<p><button class="btn" data-open-alt="hebrew">' + esc(WS.t('openHebrew')) + '</button></p>' : ''); return; }
      var last = WS.lastVerse(), rows = [], count = {}, lex = WS.lex || {};
      for (var v = 1; v <= last; v++) {
        var gv = WS.verse('grc', v);
        if (!gv || !gv.w) continue;
        gv.w.forEach(function (w) {
          if (!w.s) return;
          if (!SKIP.test(w.m)) count[w.s] = (count[w.s] || 0) + 1;
          if (!only || only === v) rows.push([v, w]);
        });
      }
      var name = function (s) { return '<span lang="grc">' + esc((lex[s] || {}).l || s) + '</span>'; };
      var rep = Object.keys(count).filter(function (s) { return count[s] > 1; }).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 12);
      var rare = Object.keys(count).filter(function (s) { return (lex[s] || {}).n <= 5; });
      var opts = '<option value="0">' + esc(L('allv')) + '</option>';
      for (var k = 1; k <= last; k++) opts += '<option value="' + k + '"' + (k === only ? ' selected' : '') + '>' + k + '</option>';
      el.innerHTML = '<h2>' + esc(L('title') + ' · ' + WS.bookName() + ' ' + state.ch) + '</h2>' +
        '<p class="small"><b>' + esc(L('rep')) + '：</b>' + (rep.length ? rep.map(function (s) { return name(s) + ' ×' + count[s]; }).join('、') : esc(L('none'))) + '</p>' +
        '<p class="small"><b>' + esc(L('rare')) + '：</b>' + (rare.length ? rare.map(function (s) { return name(s) + ' (' + lex[s].n + ')'; }).join('、') : esc(L('none'))) + '</p>' +
        '<label class="small">' + esc(L('only')) + ' <select id="wtv">' + opts + '</select></label>' +
        '<div class="wtab-scroll"><table><thead><tr><th>' + esc(L('v')) + '</th><th>' + esc(L('word')) + '</th><th>' + esc(L('lemma')) + '</th><th>' + esc(L('parse')) +
        '</th><th>' + esc(L('gloss')) + '</th><th>' + esc(L('nt')) + '</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var w = r[1], lx = lex[w.s] || {};
          return '<tr data-wv="' + r[0] + '" data-wi="' + w.i + '" data-ws="' + esc(w.s) + '"' + (state.strong === w.s ? ' class="same"' : '') + '><td>' + r[0] + '</td><td lang="grc">' + esc(w.t) +
            '</td><td><span lang="grc">' + esc(lx.l || '') + '</span> <span class="small">' + esc(w.s) + '</span></td><td>' + esc(parse(w.m) || w.m) +
            '</td><td lang="en">' + esc(w.g || '') + '</td><td>' + (lx.n || '') + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="small">' + esc(L('note')) + '</p>';
    }
    return { texts: function () { return ['grc']; }, render: draw, onWord: draw };
  }
  WS.panel({ id: 'wordtable', component: 'wordtable', title: { en: 'Word by word', ja: '語ごとの表' }, group: 'original', build: table });
})();
