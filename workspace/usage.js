/* Word use: for the verb picked in Word Study, the words that are most often its subject and its object across the
 * New Testament, counted from MACULA Greek's syntax data (CC BY 4.0). A click on a word studies that word.
 * Data: data/mac/<bucket>.json, the same buckets as Word Study; only written when the MACULA file was present. */
(function () {
  var state = WS.state, esc = WS.esc;
  var U = {
    title: { en: 'Word use', ja: '語の使われ方' },
    pick: { en: 'Pick a Greek verb (click a word, or use Word Study).', ja: 'ギリシア語の動詞を選んでください（語を押すか、語句研究から）。' },
    notVerb: { en: 'This word is not used as a verb with a subject or object in the data, or it has none listed.', ja: 'この語は、主語や目的語をもつ動詞としてのデータがありません。' },
    subj: { en: 'Most often its subject', ja: '主語になることが多い語' }, obj: { en: 'Most often its object', ja: '目的語になることが多い語' },
    uses: { en: 'uses as a verb with its parts marked', ja: '回（文の成分が付いた動詞としての用例）' },
    src: { en: 'From MACULA Greek Linguistic Datasets (CC BY 4.0), counted over the New Testament. Pronouns are counted too.',
      ja: 'MACULA Greek（CC BY 4.0）の構文データを、新約全体で数えたものです。代名詞も数えています。' },
    off: { en: 'This build has no MACULA data.', ja: 'このビルドには MACULA のデータが入っていません。' }
  };
  function L(k) { return state.lang === 'en' ? U[k].en : U[k].ja; }
  var cache = {};
  function bucket(s) { var e = (WS.lex || {})[s]; return e && e.w; }
  function panel(el) {
    el.classList.add('use');
    var data = null;
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-us]'); if (b) WS.selectWord(state.v, null, b.dataset.us);
    });
    return {
      onWord: true,
      ready: function () {
        var s = state.strong, b = s && bucket(s);
        if (!b) { data = null; return Promise.resolve(); }
        if (!cache[b]) cache[b] = WS.getJSON('mac/' + b + '.json').catch(function () { return false; });
        return cache[b].then(function (d) { data = d; });
      },
      render: function () {
        var s = state.strong, lex = WS.lex || {};
        var head = '<h2>' + esc(L('title')) + (s && lex[s] ? ' · <span lang="grc">' + esc(lex[s].l) + '</span>' : '') + '</h2>';
        if (!s) { el.innerHTML = head + '<p>' + esc(L('pick')) + '</p>'; return; }
        if (data === false) { el.innerHTML = head + '<p>' + esc(L('off')) + '</p>'; return; }
        var r = data && data[s];
        if (!r) { el.innerHTML = head + '<p>' + esc(L('notVerb')) + '</p>'; return; }
        var item = function (x) {
          var k = x[0], e = lex[k];
          return e ? '<li><button data-us="' + esc(k) + '"><span lang="grc">' + esc(e.l) + '</span> <span class="small">' + esc(e.g || '') + '</span> ×' + x[1] + '</button></li>'
            : '<li><span lang="grc">' + esc(k) + '</span> ×' + x[1] + '</li>';
        };
        // one row per lemma: forms the data keeps apart (for example ἐγώ and με) are added together
        var merge = function (list) {
          var by = {}, order = [];
          list.forEach(function (x) {
            var e = lex[x[0]], name = e ? e.l : x[0];
            if (!by[name]) { by[name] = [e ? x[0] : name, 0]; order.push(name); }
            by[name][1] += x[1];
            if (e && !lex[by[name][0]]) by[name][0] = x[0];
          });
          return order.map(function (n) { return by[n]; }).sort(function (a, b) { return b[1] - a[1]; });
        };
        r = { n: r.n, s: merge(r.s), o: merge(r.o) };
        el.innerHTML = head + '<p class="small">' + r.n + ' ' + esc(L('uses')) + '</p>' +
          '<h3>' + esc(L('subj')) + '</h3><ul class="ulist">' + (r.s.length ? r.s.map(item).join('') : '<li>-</li>') + '</ul>' +
          '<h3>' + esc(L('obj')) + '</h3><ul class="ulist">' + (r.o.length ? r.o.map(item).join('') : '<li>-</li>') + '</ul>' +
          '<p class="small">' + esc(L('src')) + '</p>';
      }
    };
  }
  WS.panel({ id: 'usage', component: 'usage', title: { en: 'Word use', ja: '語の使われ方' }, group: 'original', build: panel });
})();
