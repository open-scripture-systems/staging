/* Hebrew: the Old Testament chapter in view as an interlinear, right to left: each word with its transliteration, the
 * English gloss, its Strong's number and morphology code, from STEPBible TAHOT (CC BY 4.0). Verse numbers follow the
 * English Bibles (a Psalm title is verse 0). A click on a word opens it in Hebrew Word Study (hword.js). */
(function () {
  var state = WS.state, esc = WS.esc;
  var H = {
    title: { en: 'Hebrew (TAHOT)', ja: 'ヘブライ語（TAHOT）' },
    ot: { en: 'The Hebrew is the Old Testament only. For the New Testament, use the Greek panel.', ja: 'ヘブライ語本文は旧約だけです。新約はギリシア語のパネルで読めます。' },
    title0: { en: 'title', ja: '表題' },
    note: { en: 'Hebrew text, glosses and tags: STEPBible TAHOT (Tyndale House, CC BY 4.0). Glosses are short English labels, not a translation. Verse numbers follow the English Bibles.',
      ja: 'ヘブライ語本文、語釈、タグ：STEPBible TAHOT（Tyndale House、CC BY 4.0）。語釈は短い英語のラベルで、訳ではありません。節番号は英語・日本語の聖書に合わせています。' }
  };
  function L(o) { return state.lang === 'en' ? o.en : o.ja; }
  function panel(el) {
    el.classList.add('hb');
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-hs]'); if (!b) return;
      ev.stopPropagation();
      WS.hsel = b.dataset.hs;
      el.querySelectorAll('.hw').forEach(function (x) { x.classList.toggle('same', x.dataset.hs === WS.hsel); });
      WS.selectVerse(+b.dataset.hv || 1);
      var p = WS.ensurePanel('hword'); if (p) p.api.setActive();
      window.dispatchEvent(new Event('ows-hword'));  // only Hebrew Word Study listens; other panels keep their place
    });
    return {
      paint: function () { el.querySelectorAll('.hw').forEach(function (b) { b.classList.toggle('same', b.dataset.hs === WS.hsel); }); },
      texts: function () { return ['hbo']; },
      render: function () {
        var head = '<h2>' + esc(L(H.title) + ' · ' + WS.bookName() + ' ' + state.ch) + '</h2>';
        if (!WS.covers('hbo')) { el.innerHTML = head + '<p class="small">' + esc(L(H.ot)) + '</p>'; return; }
        var d = WS.text('hbo');
        el.innerHTML = head + (d ? d.verses.map(function (x) {
          return '<div class="hb-v" data-verse="' + (x.v || 1) + '"><span class="vn">' + (x.v === 0 ? esc(L(H.title0)) : x.v) + '</span>' +
            '<div class="hb-ws" dir="rtl">' + x.w.map(function (w) {
              return '<button class="hw' + (WS.hsel === w.s ? ' same' : '') + '" data-hs="' + esc(w.s) + '" data-hv="' + x.v + '" data-hn="' + w.n + '" title="' + esc(w.s + ' ' + w.m) + '"><span class="h" lang="hbo">' + esc(w.t) + '</span>' +
                '<span class="x" lang="en" dir="ltr">' + esc(w.x) + '</span><span class="g" lang="en" dir="ltr">' + esc(w.g) + '</span>' +
                '<span class="m" dir="ltr">' + esc(w.s) + '</span></button>';
            }).join('') + '</div></div>';
        }).join('') : '') + '<p class="small">' + esc(L(H.note)) + '</p>';
      }
    };
  }
  WS.panel({ id: 'hebrew', component: 'hebrew', title: { en: 'Hebrew', ja: 'ヘブライ語' }, group: 'original', build: panel });
})();
