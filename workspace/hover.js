/* Word details: rest the mouse on a Greek word (or move the keyboard focus to it) and this panel shows that word
 * without a click: form, lemma and Strong's number, the parsing spelled out, the gloss, how often the lemma is used
 * in the New Testament and in which books most, its part in the sentence, and the start of the lexicon entry.
 * Clicking still does what it did before (Word Study and the word card). Data: the workspace's own files. */
(function () {
  var state = WS.state, esc = WS.esc;
  var H = {
    title: { en: 'Word details', ja: '語の詳細' },
    pick: { en: 'Rest the mouse on a Greek word, or move the keyboard focus to one. On a phone, tap a word.',
      ja: 'ギリシア語の語にマウスを合わせるか、キーボードで語に移動してください。スマートフォンでは語をタップします。' },
    lemma: { en: 'Lemma', ja: '見出し語' }, parse: { en: 'Parsing', ja: '解析' }, gloss: { en: 'Gloss', ja: '語釈' },
    nt: { en: 'Uses in the NT', ja: '新約での回数' }, books: { en: 'Most in', ja: '多い書' }, part: { en: 'Part in the sentence', ja: '文の成分' },
    lex: { en: 'Lexicon (Abbott-Smith, start of the entry)', ja: '辞書（Abbott-Smith、項目の冒頭）' },
    keep: { en: 'Keep this word', ja: 'この語で止める' }, follow: { en: 'Follow the mouse again', ja: 'マウスに戻す' }
  };
  var PART = { s: { en: 'subject', ja: '主語' }, o: { en: 'object', ja: '目的語' }, io: { en: 'indirect object', ja: '間接目的語' }, p: { en: 'predicate', ja: '補語' }, v: { en: 'verb', ja: '動詞' } };
  function L(o) { return state.lang === 'en' ? o.en : o.ja; }
  function parse(code) {
    var f = (WS.morph || {})[code] || {};
    return WS.gram(['pos', 'tense', 'voice', 'mood', 'person', 'case', 'number', 'gender'].map(function (k) { return f[k]; }).filter(Boolean));
  }
  var views = [], cur = null, roles = {}, lx = {};
  function role(v, i) {
    var k = state.book + '/' + state.ch;
    if (!(k in roles)) { roles[k] = null; WS.getJSON('role/' + k + '.json').then(function (d) { roles[k] = d; draw(); }, function () { roles[k] = {}; }); }
    var d = roles[k]; return d && d[v] && d[v][i];
  }
  function lexStart(s) {
    var b = s && s.slice(0, 3);
    if (!b) return '';
    if (!(b in lx)) { lx[b] = null; WS.getJSON('lx/' + b + '.json').then(function (d) { lx[b] = d; draw(); }, function () { lx[b] = {}; }); }
    var d = lx[b], x = d && d[s];
    if (!x || !x.as) return '';
    var tmp = document.createElement('div'); tmp.innerHTML = x.as;
    var t = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 260 ? t.slice(0, 260) + '…' : t;
  }
  function body() { return cur ? WS.use(cur.s, bodyIn) : bodyIn(); }
  function bodyIn() {
    if (!cur) return '<p>' + esc(L(H.pick)) + '</p>';
    var gv = WS.verse('grc', cur.v), w = gv && gv.w ? gv.w.filter(function (x) { return x.i === cur.i; })[0] : null;
    if (!w) return '<p>' + esc(L(H.pick)) + '</p>';
    var e = (WS.lex || {})[w.s] || {}, r = role(cur.v, cur.i), top = '';
    if (e.bk) top = Object.keys(e.bk).sort(function (a, b) { return e.bk[b] - e.bk[a]; }).slice(0, 4).map(function (b) { return esc(WS.bookName(b, true)) + ' ' + e.bk[b]; }).join('、');
    var ls = lexStart(w.s);
    return '<div class="hv-w"><b lang="grc">' + esc(w.t) + '</b> <span class="small">' + esc(WS.bookName() + ' ' + state.ch + ':' + cur.v) + '</span></div><dl>' +
      '<dt>' + esc(L(H.lemma)) + '</dt><dd><span lang="grc">' + esc(e.l || '') + '</span> · ' + esc(w.s || '') + '</dd>' +
      '<dt>' + esc(L(H.parse)) + '</dt><dd>' + esc(parse(w.m) || w.m || '') + '</dd>' +
      '<dt>' + esc(L(H.gloss)) + '</dt><dd lang="en">' + esc(w.g || e.g || '') + '</dd>' +
      (e.n ? '<dt>' + esc(L(H.nt)) + '</dt><dd>' + e.n + '</dd>' : '') +
      (top ? '<dt>' + esc(L(H.books)) + '</dt><dd>' + top + '</dd>' : '') +
      (r && PART[r] ? '<dt>' + esc(L(H.part)) + '</dt><dd>' + esc(L(PART[r])) + '</dd>' : '') + '</dl>' +
      (ls ? '<h3>' + esc(L(H.lex)) + '</h3><p class="hv-lx" lang="en">' + esc(ls) + '</p>' : '');
  }
  function draw() {
    views.forEach(function (x) {
      x.el.innerHTML = '<h2>' + esc(L(H.title)) + '</h2>' + body() +
        (cur ? '<button class="btn" data-hv="keep">' + esc(L(x.kept ? H.follow : H.keep)) + '</button>' : '');
    });
  }
  function set(el) {
    if (!el || !views.length) return;
    var v = +el.dataset.v, i = +el.dataset.i;
    if (!v || cur && cur.v === v && cur.i === i && cur.s === ((el.closest('.pane[data-set]') || { dataset: {} }).dataset.set || 'A')) return;
    if (views.every(function (x) { return x.kept; })) return;
    cur = { v: v, i: i, s: (el.closest('.pane[data-set]') || { dataset: {} }).dataset.set || 'A' }; draw();
  }
  function word(t) { return t && t.closest && t.closest('.iw[data-s], .gw[data-s]'); }
  var timer = null;
  document.addEventListener('mouseover', function (ev) {
    var el = word(ev.target); if (!el) return;
    clearTimeout(timer); timer = setTimeout(function () { set(el); }, 120);
  });
  document.addEventListener('focusin', function (ev) { set(word(ev.target)); });
  document.addEventListener('click', function (ev) { var el = word(ev.target); if (el) set(el); });
  WS.on(function (kind) { if (kind === 'chapter') { cur = null; draw(); } else if (kind === 'lang') draw(); });
  function panel(el) {
    el.classList.add('hv');
    var me = { el: el, kept: false };
    views.push(me);
    el.addEventListener('click', function (ev) { if (ev.target.closest('[data-hv]')) { me.kept = !me.kept; draw(); } });
    return {
      texts: function () { return ['grc']; },
      render: draw,
      dispose: function () { views.splice(views.indexOf(me), 1); }
    };
  }
  WS.panel({ id: 'hover', component: 'hover', title: { en: 'Word details', ja: '語の詳細' }, group: 'original', build: panel });
})();
