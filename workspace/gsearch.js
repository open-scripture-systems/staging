/* Greek search: find verses by lemma (a Greek word in dictionary form, or a Strong's number) and grammar,
 * with two words joined by AND, OR, NOT or NEAR, in the book in view or the whole New Testament.
 * It reads the same Greek chapter files the panels read; matching words are marked in the result. */
(function () {
  var state = WS.state, esc = WS.esc;
  var G = {
    title: { en: 'Greek search', ja: '原語検索' },
    w1: { en: 'Word 1 (Greek lemma or Strong\'s number)', ja: '語1（ギリシア語の見出し語、またはストロング番号）' },
    w2: { en: 'Word 2 (optional)', ja: '語2（なくてもよい）' },
    gram: { en: 'Grammar of word 1', ja: '語1の文法' }, op: { en: 'How to join', ja: 'つなぎ方' },
    and: { en: 'both in the verse (AND)', ja: '両方が同じ節に（かつ）' }, or: { en: 'either (OR)', ja: 'どちらか（または）' },
    not: { en: 'word 1 without word 2 (NOT)', ja: '語1があり、語2がない（除く）' }, near: { en: 'within 3 words (NEAR)', ja: '3語以内に近く（近接）' },
    book: { en: 'This book', ja: 'この書' }, nt: { en: 'New Testament', ja: '新約全体' }, go: { en: 'Search', ja: '検索' },
    hint: { en: 'Examples: ἀγαπάω, or G25. Accents are not needed: αγαπαω works.', ja: '例：ἀγαπάω、または G25。アクセントは不要です（αγαπαω でも探せます）。' },
    unknown: { en: 'Not found as a lemma:', ja: '見出し語として見つかりません：' }, busy: { en: 'Searching', ja: '検索中' },
    verses: { en: 'verses', ja: '節' }, none: { en: 'No verse matches.', ja: '見つかりませんでした。' },
    more: { en: 'Only the first 300 are listed.', ja: '最初の300節だけを表示しています。' },
    save: { en: 'Save the list as a file', ja: '一覧をファイルに保存' }, any: { en: 'any form', ja: 'すべての形' }
  };
  function L(k) { return state.lang === 'en' ? G[k].en : G[k].ja; }
  var GRAM = [['', 'any'], ['tense:aorist', { en: 'aorist', ja: 'アオリスト' }], ['tense:present', { en: 'present', ja: '現在' }],
    ['tense:imperfect', { en: 'imperfect', ja: '未完了過去' }], ['tense:perfect', { en: 'perfect', ja: '現在完了' }], ['tense:future', { en: 'future', ja: '未来' }],
    ['mood:imperative', { en: 'imperative', ja: '命令法' }], ['mood:subjunctive', { en: 'subjunctive', ja: '接続法' }],
    ['mood:participle', { en: 'participle', ja: '分詞' }], ['mood:infinitive', { en: 'infinitive', ja: '不定詞' }],
    ['voice:passive', { en: 'passive', ja: '受動態' }], ['voice:middle', { en: 'middle', ja: '中動態' }]];
  var MAX = 300, S = { w1: '', w2: '', gram: '', op: 'and', scope: 'book', hits: null, total: 0, busy: false, bad: '' }, token = 0;
  function plain(x) { return (x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ').trim(); }
  var byLemma = null;
  function resolve(q) {
    q = (q || '').trim(); if (!q) return null;
    var m = /^[Gg]?0*(\d+)([A-Za-z]?)$/.exec(q);
    var lex = WS.lex || {};
    if (m) { var want = 'G' + ('0000' + m[1]).slice(-4) + (m[2] || '').toUpperCase(); return Object.keys(lex).filter(function (s) { return s === want || s.indexOf(want) === 0 && /[A-Z]$/.test(s); }); }
    if (!byLemma) { byLemma = {}; Object.keys(lex).forEach(function (s) { var k = plain(lex[s].l); (byLemma[k] = byLemma[k] || []).push(s); }); }
    return byLemma[plain(q)] || [];
  }
  function gramOk(code) {
    if (!S.gram) return true;
    var p = S.gram.split(':'), f = (WS.morph || {})[code] || {};
    return (f[p[0]] || '').indexOf(p[1]) === 0;
  }
  function panel(el) {
    el.classList.add('gsr');
    el.addEventListener('submit', function (ev) {
      ev.preventDefault();
      ['w1', 'w2', 'gram', 'op', 'scope'].forEach(function (k) { S[k] = el.querySelector('[data-k="' + k + '"]').value; });
      run();
    });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-to]');
      if (b) { var p = b.dataset.to.split('.'); WS.go(p[0], +p[1], +p[2]); return; }
      if (ev.target.closest('[data-save]')) {
        var out = ['# ' + L('title') + ': ' + S.w1 + (S.w2 ? ' ' + S.op.toUpperCase() + ' ' + S.w2 : ''), ''].concat(S.hits.map(function (h) { return '- ' + WS.bookName(h.b, true) + ' ' + h.c + ':' + h.v + '  ' + h.text; }));
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out.join('\n') + '\n'], { type: 'text/markdown' })); a.download = 'greek-search.md'; a.click();
      }
    });
    function run() {
      var A = resolve(S.w1), B = S.w2.trim() ? resolve(S.w2) : null, mine = ++token, m = WS.manifest;
      S.bad = !A || !A.length ? S.w1 : B && !B.length ? S.w2 : '';
      if (S.bad || !A) { S.hits = null; draw(); return; }
      var books = (S.scope === 'book' ? [state.book] : m.order.slice()).filter(function (b) { return WS.covers('grc', b); });  // Greek: New Testament books only
      S.hits = []; S.total = 0; S.busy = true; draw();
      var next = function () {
        if (mine !== token) return;
        var b = books.shift();
        if (!b) { S.busy = false; draw(); return; }
        var jobs = [];
        for (var c = 1; c <= m.books[b].chapters; c++) jobs.push(WS.getJSON('t/grc/' + b + '/' + c + '.json').catch(function () { return null; }));
        Promise.all(jobs).then(function (chs) {
          if (mine !== token) return;
          chs.forEach(function (d) {
            if (!d) return;
            d.verses.forEach(function (gv) {
              var w = gv.w || [], ia = [], ib = [];
              w.forEach(function (x, n) { if (A.indexOf(x.s) >= 0 && gramOk(x.m)) ia.push(n); if (B && B.indexOf(x.s) >= 0) ib.push(n); });
              var ok = S.op === 'or' ? ia.length || ib.length : !B ? ia.length : S.op === 'and' ? ia.length && ib.length : S.op === 'not' ? ia.length && !ib.length :
                ia.some(function (i) { return ib.some(function (j) { return i !== j && Math.abs(i - j) <= 3; }); });
              if (!ok) return;
              S.total++;
              if (S.hits.length < MAX) {
                var mark = S.op === 'not' ? ia : ia.concat(ib);
                S.hits.push({ b: b, c: d.chapter, v: gv.v, html: w.map(function (x, n) { return mark.indexOf(n) >= 0 ? '<mark>' + esc(x.t) + '</mark>' : esc(x.t); }).join(' '),
                  text: w.map(function (x) { return x.t; }).join(' ') });
              }
            });
          });
          draw(); next();
        });
      };
      next();
    }
    function draw() {
      var opt = function (v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; };
      var gl = function (g) { return typeof g[1] === 'string' ? L(g[1]) : state.lang === 'en' ? g[1].en : g[1].ja; };
      var res = '';
      if (S.bad) res = '<p>' + esc(L('unknown')) + ' <span lang="grc">' + esc(S.bad) + '</span></p>';
      else if (S.hits) res = '<p class="count" role="status">' + (S.busy ? esc(L('busy')) + '… ' : '') + S.total + ' ' + esc(L('verses')) + '</p>' +
        (!S.busy && !S.total ? '<p>' + esc(L('none')) + '</p>' : '') +
        '<ol class="t-gr">' + S.hits.map(function (h) {
          return '<li><button class="sres" data-to="' + h.b + '.' + h.c + '.' + h.v + '"><span class="ref">' + esc(WS.bookName(h.b, true) + ' ' + h.c + ':' + h.v) + '</span><span lang="grc">' + h.html + '</span></button></li>';
        }).join('') + '</ol>' + (S.total > MAX ? '<p class="count">' + esc(L('more')) + '</p>' : '') +
        (S.total && !S.busy ? '<button class="btn" data-save="1">' + esc(L('save')) + '</button>' : '');
      el.innerHTML = '<h2>' + esc(L('title')) + '</h2><form role="search" class="gform">' +
        '<label>' + esc(L('w1')) + '<input data-k="w1" lang="grc" autocomplete="off" value="' + esc(S.w1) + '"></label>' +
        '<label>' + esc(L('gram')) + '<select data-k="gram">' + GRAM.map(function (g) { return opt(g[0], g[0] ? gl(g) : L('any'), S.gram); }).join('') + '</select></label>' +
        '<label>' + esc(L('op')) + '<select data-k="op">' + opt('and', L('and'), S.op) + opt('or', L('or'), S.op) + opt('not', L('not'), S.op) + opt('near', L('near'), S.op) + '</select></label>' +
        '<label>' + esc(L('w2')) + '<input data-k="w2" lang="grc" autocomplete="off" value="' + esc(S.w2) + '"></label>' +
        '<label><select data-k="scope">' + opt('book', L('book'), S.scope) + opt('nt', L('nt'), S.scope) + '</select></label>' +
        '<button type="submit" class="btn">' + esc(L('go')) + '</button></form><p class="small">' + esc(L('hint')) + '</p>' + res;
    }
    return { render: draw };
  }
  WS.panel({ id: 'gsearch', component: 'gsearch', title: { en: 'Greek search', ja: '原語検索' }, group: 'original', build: panel });
})();
