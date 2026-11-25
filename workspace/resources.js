/* Study workspace, the reference panels. Both are built from public-domain works (see Sources and licences):
 *   Lexicon     follows the word in view: the Abbott-Smith (1922) entry, or the brief STEPBible entry where
 *               Abbott-Smith has none under that Strong's number.
 *   Commentary  follows the verse in view: Jamieson-Fausset-Brown (1871) or Adam Clarke (1810 to 1826).
 * The works are in English; the panel says so in Japanese. Entry HTML is made at build time from escaped text.
 */
(function () {
  'use strict';
  var WS = window.WS, esc = WS.esc, state = WS.state, T = WS.T;
  function t(k) { return WS.t(k); }
  function name(info) { return state.lang === 'en' ? info.en : state.lang === 'ja' ? info.ja : info.ja + ' · ' + info.en; }

  Object.assign(T, {
    lexicon: { en: 'Lexicon', ja: '辞書' }, commentary: { en: 'Commentary', ja: '注解' },
    lexPick: { en: 'Click a Greek word to see its lexicon entry.', ja: 'ギリシア語の語をクリックすると辞書の項目を表示します。' },
    lexNone: { en: 'No entry for this word.', ja: 'この語の項目はありません。' },
    lexOff: { en: 'The lexicon is not in this build.', ja: 'このビルドには辞書が入っていません。' },
    comOff: { en: 'No commentary is in this build. Run scripts/fetch_commentary.py, then build again.', ja: 'このビルドには注解が入っていません。scripts/fetch_commentary.py を実行してから再ビルドしてください。' },
    comSite: { en: 'The commentaries are not on the website yet. Their text is public domain by age, but the printing it was keyed from has not been traced, so it stays off until that is done.', ja: '注解はまだウェブサイトに入っていません。本文は年代によりパブリックドメインですが、もとになった版をまだ確認できていないため、確認が済むまで載せません。' },
    comNone: { en: 'This commentary has nothing on this chapter.', ja: 'この注解にはこの章の記述がありません。' },
    comIntro: { en: 'On the chapter', ja: '章の概要' },
    comWork: { en: 'Commentary shown', ja: '表示する注解' },
    source: { en: 'Source', ja: '出典' }, publicDomain: { en: 'public domain', ja: '公有（パブリックドメイン）' }
  });

  function sourceLine(id) {
    var s = WS.manifest.sources.filter(function (x) { return x.id === id; })[0];
    if (!s) return '';
    return '<p class="srcline">' + esc(t('source')) + ': <a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.name) + '</a> · ' + esc(s.license) + '</p>';
  }

  /* ---------- Lexicon ---------- */
  function lexicon(el) {
    el.classList.add('lexi');
    var shown = null;
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('.lx-ref');
      if (!b) return;
      var p = b.dataset.ref.split('.');
      if (WS.manifest.books[p[0]]) WS.go(p[0], +p[1], +p[2]);
    });
    return {
      onWord: true,
      ready: function () {
        var s = state.strong;
        if (!s || !WS.lex[s] || !Object.keys(WS.manifest.lexicons).length) { shown = null; return Promise.resolve(); }
        return WS.getJSON('lx/' + s.slice(0, 3) + '.json').then(function (d) { shown = { s: s, e: d[s] || null }; });
      },
      render: function () {
        var s = state.strong, e = s && WS.lex[s];
        if (!Object.keys(WS.manifest.lexicons).length) { el.innerHTML = '<h2>' + esc(t('lexicon')) + '</h2><p>' + esc(t('lexOff')) + '</p>'; return; }
        if (!e || !shown || shown.s !== s) { el.innerHTML = '<h2>' + esc(t('lexicon')) + '</h2><p>' + esc(t('lexPick')) + '</p>'; return; }
        var kind = shown.e && (shown.e.as ? 'as' : 'tb'), info = kind && WS.manifest.lexicons[kind];
        el.innerHTML = '<h2><span lang="grc" class="lemma">' + esc(e.l) + '</span> <span class="meta">' + esc(s) + ' · ' + esc(e.g) + '</span></h2>' +
          (kind ? '<p class="small">' + esc(name(info)) + '</p><div class="lx" lang="en">' + shown.e[kind] + '</div>' + sourceLine(info.source)
            : '<p>' + esc(t('lexNone')) + '</p>');
      }
    };
  }

  /* ---------- Commentary ---------- */
  function commentary(el) {
    el.classList.add('comm');
    function works() { return Object.keys(WS.manifest.commentaries); }
    function work() { var w = WS.store.get('ws.com.work', null); return works().indexOf(w) >= 0 ? w : works()[0]; }
    function path() { return 'c/' + work() + '/' + state.book + '/' + state.ch + '.json'; }
    var data = null;
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-work]');
      if (b) { WS.store.set('ws.com.work', b.dataset.work); WS.emit('lang', null); }
    });
    return {
      ready: function () {
        if (!works().length) { data = null; return Promise.resolve(); }
        var p = path();
        return WS.getJSON(p).then(function (d) { data = { p: p, d: d }; });
      },
      render: function () {
        var head = '<h2>' + esc(t('commentary') + ' · ' + WS.bookName() + ' ' + state.ch) + '</h2>';
        if (!works().length) { el.innerHTML = head + '<p>' + esc(t(window.WS_SITE ? 'comSite' : 'comOff')) + '</p>'; return; }
        if (!data || data.p !== path()) return;
        var info = WS.manifest.commentaries[work()], d = data.d;
        var html = head + '<div class="chips" role="group" aria-label="' + esc(t('comWork')) + '">' + works().map(function (w) {
          return '<button data-work="' + w + '" aria-pressed="' + (w === work()) + '" title="' + esc(WS.manifest.commentaries[w].en) + '">' + esc(WS.manifest.commentaries[w].short) + '</button>';
        }).join('') + '</div><p class="small">' + esc(name(info)) + '</p>';
        if (!d.v.length && !d.intro.length) html += '<p>' + esc(t('comNone')) + '</p>';
        if (d.intro.length) html += '<details class="cintro"><summary>' + esc(t('comIntro')) + '</summary><div lang="en">' + d.intro.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></details>';
        html += d.v.map(function (x) {
          return '<section class="cm" data-verse="' + x[0] + '" lang="en"><h3>' + esc(WS.bookName(null, true) + ' ' + state.ch + ':' + x[0]) + '</h3>' +
            x[1].map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</section>';
        }).join('');
        el.innerHTML = html + sourceLine(info.source);
      },
      /* a note often covers the verses after it: with no note on the verse in view, mark the last one before it */
      paint: function () {
        if (el.querySelector('.cm.cur')) return;
        var best = null;
        el.querySelectorAll('.cm').forEach(function (n) { if (+n.dataset.verse <= state.v) best = n; });
        if (best) best.classList.add('cur');
      }
    };
  }

  WS.panel({ id: 'lexicon', component: 'lexicon', title: 'lexicon', group: 'study', build: lexicon });
  WS.panel({ id: 'commentary', component: 'commentary', title: 'commentary', group: 'study', build: commentary });
})();
