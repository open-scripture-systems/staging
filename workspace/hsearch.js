/* Hebrew search: find an Old Testament word by its Hebrew (vowel points not needed), its transliteration, an English
 * gloss, or its Strong's number. Each result shows how often the word is used; a click opens it in Hebrew Word Study,
 * which lists every place it occurs. Data: data/hidx.json (STEPBible TAHOT and TBESH, CC BY 4.0). */
(function () {
  var state = WS.state, esc = WS.esc;
  var Q = {
    title: { en: 'Hebrew search', ja: 'ヘブライ語検索' },
    label: { en: 'Hebrew, transliteration, English meaning or Strong\'s number', ja: 'ヘブライ語、読み（ローマ字）、英語の意味、またはストロング番号' },
    hint: { en: 'Examples: אהב, ahav, love, H0157. Vowel points are not needed.', ja: '例：אהב、ahav、love、H0157。母音記号は不要です。' },
    go: { en: 'Search', ja: '検索' }, none: { en: 'No word found.', ja: '見つかりませんでした。' },
    uses: { en: 'uses', ja: '回' }, many: { en: 'Only the 60 most used are listed.', ja: 'よく使われる順に60語だけ表示しています。' }
  };
  function L(o) { return state.lang === 'en' ? o.en : o.ja; }
  function bare(t) { return (t || '').normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[ךםןףץ]/g, function (c) { return { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }[c]; }); }
  function latin(t) { return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, ''); }
  var idx = null, q = '';
  function panel(el) {
    el.classList.add('hsr');
    el.addEventListener('submit', function (ev) { ev.preventDefault(); q = el.querySelector('input').value.trim(); find(); });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-hpick]'); if (!b) return;
      WS.hsel = b.dataset.hpick;
      var p = WS.ensurePanel('hword'); if (p) p.api.setActive();
      window.dispatchEvent(new Event('ows-hword'));
    });
    function find() {
      (idx ? Promise.resolve(idx) : WS.getJSON('hidx.json').then(function (d) { idx = d; return d; }, function () { idx = []; return idx; })).then(draw);
    }
    function hits() {
      if (!q || !idx) return null;
      var num = /^[Hh]?0*(\d{1,4})([A-Za-z]?)$/.exec(q), heb = /[א-ת]/.test(q), b = bare(q), l = latin(q), low = q.toLowerCase();
      return idx.filter(function (r) {
        if (num) return r[0].indexOf('H' + ('0000' + num[1]).slice(-4) + (num[2] || '').toUpperCase()) === 0;
        if (heb) return bare(r[1]).indexOf(b) >= 0;
        return latin(r[2]) === l || latin(r[2]).indexOf(l) === 0 && l.length > 2 || (r[3] || '').toLowerCase().indexOf(low) >= 0;
      });
    }
    function draw() {
      var h = hits();
      el.innerHTML = '<h2>' + esc(L(Q.title)) + '</h2><form role="search"><label>' + esc(L(Q.label)) +
        '<input autocomplete="off" value="' + esc(q) + '"></label> <button class="btn" type="submit">' + esc(L(Q.go)) + '</button></form>' +
        '<p class="small">' + esc(L(Q.hint)) + '</p>' +
        (h ? (h.length ? '<ul class="hsr-list">' + h.slice(0, 60).map(function (r) {
          return '<li><button data-hpick="' + esc(r[0]) + '"><b lang="hbo" dir="rtl">' + esc(r[1]) + '</b> <i>' + esc(r[2]) + '</i> <span lang="en">' + esc(r[3]) + '</span> <span class="small">' + esc(r[0]) + ' · ' + r[4] + ' ' + esc(L(Q.uses)) + '</span></button></li>';
        }).join('') + '</ul>' + (h.length > 60 ? '<p class="small">' + esc(L(Q.many)) + '</p>' : '') : '<p>' + esc(L(Q.none)) + '</p>') : '');
    }
    return { render: draw };
  }
  WS.panel({ id: 'hsearch', component: 'hsearch', title: { en: 'Hebrew search', ja: 'ヘブライ語検索' }, group: 'original', build: panel });
})();
