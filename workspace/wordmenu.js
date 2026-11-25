/* Word menu: clicking a Greek word still opens Word Study, and a small card now shows next to the word with its
 * form, lemma, Strong's number and the parsing spelled out, plus a few actions. Right-click (or a long press on a
 * phone) shows the card without moving Word Study. Escape, the close button or a click elsewhere closes it.
 * All data comes from the workspace's own files (SBLGNT with TAGNT); nothing new is fetched. */
(function () {
  var state = WS.state, esc = WS.esc, card = null;
  var M = {
    lemma: { en: 'Lemma', ja: '見出し語' }, parse: { en: 'Parsing', ja: '解析' }, gloss: { en: 'Gloss', ja: '語釈' },
    study: { en: 'Word Study', ja: '語句研究' }, lex: { en: 'Lexicon', ja: '辞書' }, note: { en: 'Note on this verse', ja: 'この節にメモ' }, use: { en: 'Word use', ja: '使われ方' },
    say: { en: 'Read aloud', ja: '読み' }, sayNote: { en: 'Erasmian, a guide only', ja: 'エラスムス式の目安' },
    copy: { en: 'Copy', ja: 'コピー' }, copied: { en: 'Copied.', ja: 'コピーしました。' }, close: { en: 'Close', ja: '閉じる' }
  };
  function L(k) { return state.lang === 'en' ? M[k].en : M[k].ja; }
  function find(v, i) {
    var gv = WS.verse('grc', v);
    return gv && gv.w ? gv.w.filter(function (w) { return w.i === i; })[0] : null;
  }
  function parse(code) {
    var f = (WS.morph || {})[code] || {};
    return WS.gram(['pos', 'tense', 'voice', 'mood', 'person', 'case', 'number', 'gender'].map(function (k) { return f[k]; }).filter(Boolean));
  }
  /* katakana and Latin letters for reading aloud, with a note that it is one way of many */
  function reading(t) {
    if (!WS.kana) return '';
    var k = WS.kana(t), note = ' <span class="small">(' + esc(L('sayNote')) + ')</span>';
    return state.lang === 'en' ? '<span lang="en">' + esc(k.en) + '</span>' + note : esc(k.ja) + ' · <span lang="en">' + esc(k.en) + '</span>' + note;
  }
  WS.reading = reading;
  function close() { if (card) { card.remove(); card = null; } }
  function open(el) { var s = (el.closest('.pane[data-set]') || { dataset: {} }).dataset.set || 'A'; WS.use(s, function () { openIn(el, s); }); }
  function openIn(el, set) {
    close();
    var v = +el.dataset.v, i = +el.dataset.i, w = find(v, i);
    if (!w || !w.s) return;
    var lx = (WS.lex || {})[w.s] || {}, ref = WS.bookName() + ' ' + state.ch + ':' + v;
    card = document.createElement('div');
    card.className = 'wmenu'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', w.t);
    card.innerHTML = '<div class="wm-h"><b lang="grc">' + esc(w.t) + '</b> <span class="small">' + esc(ref) + '</span>' +
      '<button class="wm-x" data-m="x" aria-label="' + esc(L('close')) + '">×</button></div>' +
      '<dl><dt>' + esc(L('say')) + '</dt><dd>' + reading(w.t) + '</dd>' +
      '<dt>' + esc(L('lemma')) + '</dt><dd><span lang="grc">' + esc(lx.l || '') + '</span> · ' + esc(w.s) + '</dd>' +
      '<dt>' + esc(L('parse')) + '</dt><dd>' + esc(parse(w.m) || w.m) + ' <span class="small">(' + esc(w.m) + ')</span></dd>' +
      '<dt>' + esc(L('gloss')) + '</dt><dd lang="en">' + esc(w.g || lx.g || '') + '</dd></dl>' +
      '<div class="wm-a"><button class="btn" data-m="study">' + esc(L('study')) + '</button><button class="btn" data-m="lex">' + esc(L('lex')) + '</button>' +
      '<button class="btn" data-m="use">' + esc(L('use')) + '</button>' + (set === 'A' ? '<button class="btn" data-m="note">' + esc(L('note')) + '</button>' : '') + '<button class="btn" data-m="copy">' + esc(L('copy')) + '</button></div>' +
      '<p class="small wm-msg" role="status"></p>';
    document.body.appendChild(card);
    var r = el.getBoundingClientRect(), cw = Math.min(320, window.innerWidth - 16);
    card.style.width = cw + 'px';
    card.style.left = Math.max(8, Math.min(window.innerWidth - cw - 8, r.left)) + 'px';
    var top = r.bottom + 6;
    if (top + card.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - card.offsetHeight - 6);
    card.style.top = top + 'px';
    card.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-m]'); if (!b) return;
      var k = b.dataset.m;
      if (k === 'x') return close();
      WS.use(set, function () { act(k); });
    });
    function act(k) {
      if (k === 'study') { WS.selectWord(v, i, w.s); var p = WS.ensurePanel('word'); if (p) p.api.setActive(); return close(); }
      if (k === 'lex') { WS.selectWord(v, i, w.s); var q = WS.ensurePanel('lexicon'); if (q) q.api.setActive(); return close(); }
      if (k === 'use') { WS.selectWord(v, i, w.s); var u = WS.ensurePanel('usage'); if (u) u.api.setActive(); return close(); }
      if (k === 'note') { WS.selectVerse(v); var n = WS.ensurePanel('notes'); if (n) n.api.setActive(); return close(); }
      if (k === 'copy') {
        var txt = w.t + ' (' + (lx.l || '') + ', ' + w.s + ', ' + (parse(w.m) || w.m) + ') ' + ref;
        var done = function () { card.querySelector('.wm-msg').textContent = L('copied'); };
        try { navigator.clipboard.writeText(txt).then(done, function () { prompt('', txt); }); } catch (e) { done(); }
      }
    }
  }
  function word(t) { return t && t.closest && t.closest('.iw[data-s], .gw[data-s]'); }
  // after the workspace's own click handler has selected the word
  document.addEventListener('click', function (ev) {
    if (card && !card.contains(ev.target)) close();
    var el = word(ev.target); if (el) setTimeout(function () { open(el); }, 0);
  });
  document.addEventListener('contextmenu', function (ev) { var el = word(ev.target); if (el) { ev.preventDefault(); open(el); } });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') close(); });
  window.addEventListener('resize', close);
  WS.on(function (kind) { if (kind === 'chapter' || kind === 'lang') close(); });
})();
