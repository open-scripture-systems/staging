/* Structure: the Greek of the chapter as a clause outline. Each line is one stretch of a clause in text order; a clause
 * that does a job inside another (when, why, what, which) is set one step in. The lines come from MACULA Greek's syntax
 * trees (CC BY 4.0); the student can move any line in or out to make their own outline, which stays on this device,
 * and save it as a file. Words are the workspace's own SBLGNT words, so a click studies the word as anywhere else.
 * Data: data/struct/<book>/<ch>.json, written by build_workspace.py when the MACULA trees were present. */
(function () {
  var state = WS.state, esc = WS.esc, store = WS.store;
  var S = {
    title: { en: 'Structure', ja: '文の構造' },
    lead: { en: 'The Greek in clause lines, in text order. A clause that does a job inside another is set one step in. Move a line with ‹ › to make your own outline.',
      ja: 'ギリシア語を、節（クローズ）ごとの行に分けて本文の順に並べています。ほかの節の中で働く節は、一段下げてあります。‹ › で行を動かして、自分のアウトラインを作れます。' },
    labels: { en: 'Show clause kinds', ja: '節の種類を表示' }, reset: { en: 'Back to the data', ja: 'データの形に戻す' },
    save: { en: 'Save my outline as a file', ja: '自分のアウトラインをファイルに保存' },
    mine: { en: 'Your changes are kept on this device only.', ja: '動かした形は、この端末にだけ保存されます。' },
    left: { en: 'Move out', ja: '左へ' }, right: { en: 'Move in', ja: '右へ' },
    off: { en: 'This build has no structure data.', ja: 'このビルドには構造のデータが入っていません。' },
    src: { en: 'Clause lines from MACULA Greek Linguistic Datasets (CC BY 4.0), arranged by a program from its syntax trees. They are one reading of the sentence, not the only one.',
      ja: '行の分け方は、MACULA Greek（CC BY 4.0）の構文解析から、プログラムで機械的に作ったものです。文の読み方の一つであって、唯一の正解ではありません。' }
  };
  var KIND = { '': { en: '', ja: '' }, adv: { en: 'adverbial', ja: '副詞的' }, o: { en: 'object', ja: '目的語' }, s: { en: 'subject', ja: '主語' },
    p: { en: 'predicate', ja: '補語' }, io: { en: 'ind. object', ja: '間接目的語' }, mod: { en: 'modifier', ja: '修飾' }, vc: { en: 'verb', ja: '動詞' }, aux: { en: 'aux', ja: '補助' } };
  function L(o) { return state.lang === 'en' ? o.en : o.ja; }
  function key() { return 'ws.struct.' + state.book + '.' + state.ch; }
  function panel(el) {
    el.classList.add('st');
    var lines = null, show = store.get('ws.struct.labels', true);
    function moves() { return store.get(key(), {}); }
    /* a saved move is keyed by the line's first word (verse:word), so a rebuilt outline keeps each move on its own line */
    function lk(n) { var l = lines[n], f = l && l.w.filter(function (x) { return typeof x !== 'string'; })[0]; return f ? f[0] + ':' + f[1] : 'n' + n; }
    el.addEventListener('click', function (ev) {
      var m = ev.target.closest('[data-mv]');
      if (m) {
        var k = lk(+m.dataset.n), o = moves();
        o[k] = Math.max(-6, Math.min(8, (o[k] || 0) + (+m.dataset.mv)));
        if (!o[k]) delete o[k];
        store.set(key(), o); draw(); return;
      }
      if (ev.target.closest('[data-reset]')) { store.set(key(), {}); draw(); return; }
      if (ev.target.closest('[data-save]')) { saveFile(); return; }
      var v = ev.target.closest('[data-goverse]');
      if (v) WS.selectVerse(+v.dataset.goverse);
    });
    el.addEventListener('change', function (ev) { if (ev.target.id === 'stLabels') { show = ev.target.checked; store.set('ws.struct.labels', show); draw(); } });
    function word(x) {
      if (typeof x === 'string') return { t: x };
      var gv = WS.verse('grc', x[0]), w = gv && gv.w ? gv.w.filter(function (y) { return y.i === x[1]; })[0] : null;
      return w ? { t: w.t, v: x[0], i: x[1], s: w.s } : { t: '' };
    }
    function depth(n, l) { return Math.max(0, l.d + (moves()[lk(n)] || 0)); }
    function draw() {
      if (!WS.covers('grc')) { el.innerHTML = '<h2>' + esc(L(S.title)) + '</h2><p class="small">' + esc(WS.t('ntOnly')) + '</p>' + (WS.covers('hbo') ? '<p><button class="btn" data-open-alt="hebrew">' + esc(WS.t('openHebrew')) + '</button></p>' : ''); return; }
      var head = '<h2>' + esc(L(S.title) + ' · ' + WS.bookName() + ' ' + state.ch) + '</h2>';
      if (!lines) { el.innerHTML = head + '<p>' + esc(L(S.off)) + '</p>'; return; }
      var last = 0;
      el.innerHTML = head + '<p class="small">' + esc(L(S.lead)) + '</p>' +
        '<div class="st-bar"><label class="small"><input type="checkbox" id="stLabels"' + (show ? ' checked' : '') + '> ' + esc(L(S.labels)) + '</label>' +
        '<button class="btn" data-reset="1">' + esc(L(S.reset)) + '</button><button class="btn" data-save="1">' + esc(L(S.save)) + '</button></div>' +
        '<ol class="st-lines">' + lines.map(function (l, n) {
          var vn = l.v !== last ? '<button class="st-v" data-goverse="' + l.v + '">' + l.v + '</button>' : '<span class="st-v"></span>';
          last = l.v;
          var kind = KIND[l.r] || KIND[''], tag = show && L(kind) ? '<span class="st-k st-' + esc(l.r) + '">' + esc(L(kind)) + '</span>' : '';
          return '<li class="' + (state.v === l.v ? 'cur' : '') + '">' + vn +
            '<span class="st-mv"><button data-mv="-1" data-n="' + n + '" aria-label="' + esc(L(S.left)) + '">‹</button><button data-mv="1" data-n="' + n + '" aria-label="' + esc(L(S.right)) + '">›</button></span>' +
            '<span class="st-t" style="padding-left:' + (depth(n, l) * 1.5) + 'em">' + tag + '<span lang="grc">' + l.w.map(function (x) {
              var w = word(x);
              return w.s ? '<button class="gw" data-v="' + w.v + '" data-i="' + w.i + '" data-s="' + esc(w.s) + '">' + esc(w.t) + '</button>' : esc(w.t);
            }).join(' ') + '</span></span></li>';
        }).join('') + '</ol><p class="small">' + esc(L(S.mine)) + ' ' + esc(L(S.src)) + '</p>';
    }
    function saveFile() {
      var out = ['# ' + WS.bookName() + ' ' + state.ch, ''];
      lines.forEach(function (l, n) {
        var kind = L(KIND[l.r] || KIND['']);
        out.push(new Array(depth(n, l) + 1).join('    ') + '- ' + l.v + ' ' + l.w.map(function (x) { return word(x).t; }).join(' ') + (kind ? '  (' + kind + ')' : ''));
      });
      out.push('', L(S.src));
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([out.join('\n') + '\n'], { type: 'text/markdown' }));
      a.download = 'structure-' + state.book + '-' + state.ch + '.md'; a.click();
    }
    return {
      texts: function () { return ['grc']; },
      ready: function () {
        if (!WS.covers('grc')) { lines = null; return Promise.resolve(); }  // New Testament only
        return WS.getJSON('struct/' + state.book + '/' + state.ch + '.json').then(function (d) { lines = d; }, function () { lines = null; });
      },
      render: draw,
      paint: function () {
        el.querySelectorAll('.st-lines li').forEach(function (li, n) { li.classList.toggle('cur', lines && lines[n] && lines[n].v === state.v); });
      }
    };
  }
  WS.panel({ id: 'struct', component: 'struct', title: { en: 'Structure', ja: '文の構造' }, group: 'original', build: panel });
})();
