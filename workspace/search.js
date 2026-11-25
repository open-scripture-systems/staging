/* Study workspace, text search. Looks for a word in one Bible text, in the book in view or the whole New Testament,
 * by reading the same chapter files the Bible panels read (no separate index).
 * Japanese is matched as written and also by reading: めぐみ finds 恵み, from the furigana the text carries.
 * The command box sends here whatever is not a reference, a Strong's number or a Greek word.
 */
(function () {
  'use strict';
  var WS = window.WS, esc = WS.esc, state = WS.state, T = WS.T;
  function t(k) { return WS.t(k); }

  Object.assign(T, {
    search: { en: 'Search the text', ja: '本文検索' }, s_go: { en: 'Search', ja: '検索' },
    s_word: { en: 'Word or phrase', ja: '語句' }, s_text: { en: 'Bible', ja: '聖書' }, s_scope: { en: 'Where', ja: '範囲' },
    s_book: { en: 'This book', ja: 'この書' }, s_nt: { en: 'All books this text has', ja: 'この本文のすべての書' },
    s_hint: { en: 'Type a word. Japanese can be typed as it is read: めぐみ finds 恵み.', ja: '語を入力してください。読みでも探せます（「めぐみ」で「恵み」）。' },
    s_busy: { en: 'Searching', ja: '検索中' }, s_verses: { en: 'verses', ja: '節' }, s_none: { en: 'No verse has it.', ja: '見つかりませんでした。' },
    s_more: { en: 'Only the first 300 are listed.', ja: '最初の300節だけを表示しています。' }
  });

  var S = { q: '', text: 'kougo', scope: 'book', hits: null, total: 0, busy: false, where: '' }, run = null, token = 0;
  var MAX = 300;
  function fold(x) { return x.normalize('NFKC').toLowerCase(); }
  function hira(x) { return x.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }
  function texts() { return Object.keys(WS.manifest.texts).filter(function (id) { return WS.manifest.texts[id].kind !== 'greek'; }); }

  /* One verse against the query: null, or the verse as HTML with the match marked (unmarked when only the reading matches). */
  function match(v, q, qh) {
    var plain = typeof v === 'string' ? v : v.map(function (x) { return x[0]; }).join('');
    var low = fold(plain), i = low.indexOf(q);
    if (i >= 0 && low.length === plain.length) return esc(plain.slice(0, i)) + '<mark>' + esc(plain.slice(i, i + q.length)) + '</mark>' + esc(plain.slice(i + q.length));
    if (i >= 0) return esc(plain);
    if (typeof v === 'string' || !qh) return null;
    /* by reading: mark the runs of text the matched reading covers (a run with furigana is marked whole) */
    var at = [], reading = '';
    v.forEach(function (x) { at.push(reading.length); reading += hira(fold(x[1] || x[0])); });
    var j = reading.indexOf(qh);
    if (j < 0) return null;
    var end = j + qh.length, out = '', open = false;
    v.forEach(function (x, n) {
      var a0 = at[n], a1 = n + 1 < at.length ? at[n + 1] : reading.length, inside = a0 < end && a1 > j;
      if (inside && !open) { out += '<mark>'; open = true; }
      if (!inside && open) { out += '</mark>'; open = false; }
      if (inside && !x[1] && a1 - a0 === x[0].length) {   /* plain kana: mark only the letters matched */
        var from = Math.max(j, a0) - a0, to = Math.min(end, a1) - a0;
        if (a0 < j) { out = out.replace(/<mark>$/, ''); out += esc(x[0].slice(0, from)) + '<mark>'; }
        out += esc(x[0].slice(from, to));
        if (a1 > end) { out += '</mark>' + esc(x[0].slice(to)); open = false; }
      } else out += esc(x[0]);
    });
    return out + (open ? '</mark>' : '');
  }

  function search(el) {
    el.classList.add('srch');
    function draw() {
      var m = WS.manifest, list = '';
      if (!m.texts[S.text]) S.text = WS.ja();
      if (S.hits) {
        list = '<p class="count" role="status">「' + esc(S.q) + '」 ' + esc(WS.textInfo(S.text).short) + ' · ' + esc(S.where) + ' · ' +
          (S.busy ? esc(t('s_busy')) + '… ' : '') + S.total + ' ' + esc(t('s_verses')) + '</p>' +
          (!S.busy && !S.total ? '<p>' + esc(t('s_none')) + '</p>' : '') +
          '<ol class="' + WS.textClass(S.text) + '">' + S.hits.map(function (h) {
            return '<li><button class="sres" data-to="' + h.b + '.' + h.c + '.' + h.v + '"><span class="ref">' + esc(WS.bookName(h.b, true) + ' ' + h.c + ':' + h.v) +
              '</span><span lang="' + WS.textInfo(S.text).lang + '">' + h.html + '</span></button></li>';
          }).join('') + '</ol>' + (S.total > MAX ? '<p class="count">' + esc(t('s_more')) + '</p>' : '');
      }
      var box = el.querySelector('input'), had = box && document.activeElement === box, typed = box ? box.value : S.q;
      el.innerHTML = '<h2>' + esc(t('search')) + '</h2><form role="search"><input type="search" autocomplete="off" aria-label="' + esc(t('s_word')) + '">' +
        '<select data-k="text" aria-label="' + esc(t('s_text')) + '">' + texts().map(function (id) {
          return '<option value="' + id + '"' + (id === S.text ? ' selected' : '') + '>' + esc(m.texts[id].short) + '</option>'; }).join('') + '</select>' +
        '<select data-k="scope" aria-label="' + esc(t('s_scope')) + '"><option value="book"' + (S.scope === 'book' ? ' selected' : '') + '>' + esc(t('s_book')) +
        '</option><option value="nt"' + (S.scope === 'nt' ? ' selected' : '') + '>' + esc(t('s_nt')) + '</option></select>' +
        '<button type="submit">' + esc(t('s_go')) + '</button></form>' + (S.hits ? list : '<p class="small">' + esc(t('s_hint')) + '</p>');
      box = el.querySelector('input'); box.value = typed;
      if (had) box.focus();
    }
    run = function () {
      var q = fold(S.q.trim()), mine = ++token;
      if (!q) { S.hits = null; draw(); return; }
      var qh = /[぀-ヿ]/.test(q) ? hira(q) : '', m = WS.manifest, books = (S.scope === 'book' ? [state.book] : m.order.slice()).filter(function (b) { return WS.covers(S.text, b); });
      S.hits = []; S.total = 0; S.busy = true;
      S.where = S.scope === 'book' ? WS.bookName(state.book, true) : t('s_nt');
      draw();
      var next = function () {
        if (mine !== token) return;
        var b = books.shift();
        if (!b) { S.busy = false; draw(); return; }
        var jobs = [];
        for (var c = 1; c <= m.books[b].chapters; c++) jobs.push(WS.getJSON('t/' + S.text + '/' + b + '/' + c + '.json').catch(function () { return null; }));
        Promise.all(jobs).then(function (chs) {
          if (mine !== token) return;
          chs.forEach(function (d) {
            if (!d) return;
            Object.keys(d.v).map(Number).sort(function (x, y) { return x - y; }).forEach(function (v) {
              var html = match(d.v[v], q, qh);
              if (html == null) return;
              S.total++;
              if (S.hits.length < MAX) S.hits.push({ b: b, c: d.chapter, v: v, html: html });
            });
          });
          draw(); next();
        });
      };
      next();
    };
    el.addEventListener('submit', function (ev) { ev.preventDefault(); S.q = el.querySelector('input').value; run(); });
    el.addEventListener('change', function (ev) {
      var k = ev.target.dataset && ev.target.dataset.k;
      if (!k) return;
      S[k] = ev.target.value; S.q = el.querySelector('input').value;
      if (S.q.trim()) run();
    });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('.sres');
      if (!b) return;
      var p = b.dataset.to.split('.');
      WS.go(p[0], +p[1], +p[2]);
    });
    return { render: draw };
  }

  WS.search = function (q, text) {
    S.q = q;
    if (text && WS.manifest.texts[text]) S.text = text;
    if (!WS.manifest.texts[S.text]) S.text = WS.ja();
    var p = WS.ensurePanel('search');
    if (p) p.api.setActive();
    var box = p && document.querySelector('.srch input');
    if (box) box.value = q;
    if (run) run();
  };
  WS.panel({ id: 'search', component: 'search', title: 'search', group: 'study', build: search });
})();
