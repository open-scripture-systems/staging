/* Study workspace, the Word Study tile. It docks the two open-word-study tools into one panel:
 *   the rings (Greek Word Study): one ring a translation, one slice a way of rendering the word;
 *   the Word Wheel ledger: every occurrence, with what each translation says there.
 * Rings: TAGNT gloss, UST, ULT, BSB from the inside out. The ULT and UST rings come from their own
 * share-alike files. With the "unverified alignment" flag on, a Kougo-yaku ring is added outside, drawn as a
 * draft, with the words that are shown as unlinked (articles, lone particles) as an empty dashed slice.
 */
(function () {
  'use strict';
  var WS = window.WS, esc = WS.esc, state = WS.state, T = WS.T;
  function t(k) { return WS.t(k); }
  var NS = 'http://www.w3.org/2000/svg', JA = '口語訳';

  Object.assign(T, {
    word: { en: 'Word Study', ja: '語句研究' },
    pickWord: { en: 'Click a Greek word to study it.', ja: 'ギリシア語の語をクリックしてください。' },
    pickHebrew: { en: 'In the Old Testament, tap a word in the Hebrew panel: it opens in Hebrew Word Study.', ja: '旧約では、ヘブライ語のパネルで語をタップしてください。ヘブライ語の語句研究で開きます。' },
    inNT: { en: 'in the New Testament', ja: '新約全体' },
    naCount: { en: 'NA28 as tagged by TAGNT', ja: 'TAGNT による NA28 の数' },
    thisForm: { en: 'This form', ja: 'この語形' }, forms: { en: 'Forms', ja: '語形' },
    byBook: { en: 'By book', ja: '書ごとの出現数' },
    rings: { en: 'How it is translated', ja: '訳し方' },
    ringsHint: { en: 'Each ring is one translation. Pick a slice to see where.', ja: '輪は訳ごと。区分を選ぶと該当箇所を表示します。' },
    scopeNT: { en: 'New Testament', ja: '新約全体' },
    every: { en: 'Every occurrence', ja: 'すべての出現箇所' },
    more: { en: 'Show more', ja: 'さらに表示' },
    ref: { en: 'Reference', ja: '箇所' }, greekCol: { en: 'Greek', ja: 'ギリシア語' },
    other: { en: 'other renderings', ja: 'その他の訳し方' }, notAligned: { en: 'not aligned', ja: '対応なし' },
    heldSlice: { en: 'shown unlinked', ja: '未リンク表示' },
    same: { en: 'Other words the BSB renders', ja: 'BSB が同じ語に訳す他の語：' },
    rend: { en: 'How the Kougo-yaku renders it', ja: '口語訳での訳語' },
    rendOff: {
      en: 'Hidden. The Japanese renderings come from a machine alignment that no person has checked. Switch on "Unverified alignment" to see the draft.',
      ja: '非表示です。訳語は人が確認していない機械アラインメントによるものです。「未検証アラインメント」をオンにすると下書きを表示します。'
    },
    draftTag: { en: 'DRAFT, unverified', ja: '下書き・未検証' },
    linkedN: { en: 'links shown', ja: '表示リンク' }, heldN: { en: 'shown unlinked', ja: '未リンク表示' },
    noRend: { en: 'No rendering is shown for this word.', ja: 'この語の訳語は表示しません。' },
    clear: { en: 'Clear', ja: '選択を解除' },
    fallacyH: { en: 'Three mistakes to avoid with any word study', ja: '語句研究で避けたい三つの誤り' },
    fallacy1: { en: 'Meaning from the parts: what a word is built from does not decide what it means in a sentence. Its use does.',
      ja: '成り立ちから意味を決めること：語が何からできているかは、文の中での意味を決めません。決めるのは使われ方です。' },
    fallacy2: { en: 'All meanings at once: the rings and the dictionary list many senses. One verse normally uses one of them; choose by the context.',
      ja: '全部の意味を一度に読み込むこと：輪や辞書には多くの意味が並びます。一つの節で使われるのは、ふつうその一つです。文脈で選びます。' },
    fallacy3: { en: 'Later meanings read back: an English or Japanese word that came from this Greek word, or what it meant centuries later, is not what it meant to the first readers.',
      ja: '後の意味を読み込むこと：このギリシア語から生まれた英語や日本語の語、何百年も後の意味は、最初の読者にとっての意味ではありません。' }
  });

  function formText(code) {
    var f = WS.morph[code] || {};
    return WS.gram(['pos', 'tense', 'voice', 'mood', 'person', 'case', 'number', 'gender'].map(function (k) { return f[k]; }).filter(Boolean));
  }
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function arc(cx, cy, r0, r1, a0, a1) {
    var p = function (r, a) { return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; };
    if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4;
    var lg = a1 - a0 > Math.PI ? 1 : 0, A = p(r1, a0), B = p(r1, a1), C = p(r0, a1), D = p(r0, a0);
    return 'M' + A[0] + ' ' + A[1] + 'A' + r1 + ' ' + r1 + ' 0 ' + lg + ' 1 ' + B[0] + ' ' + B[1] + 'L' + C[0] + ' ' + C[1] +
      'A' + r0 + ' ' + r0 + ' 0 ' + lg + ' 0 ' + D[0] + ' ' + D[1] + 'Z';
  }

  function word(el) {
    el.classList.add('ws');
    var data = null;      /* { s, e: occurrences and free rings, sa: ULT and UST rings, ja: draft ring } */
    var scope = 'NT', sel = null, limit = 60;

    /* the label of occurrence i in ring v, or null (not aligned) or '\0' (shown as unlinked) */
    function labelOf(v, i) {
      if (v === JA) {
        var x = data.ja ? data.ja.x[i] : -1;
        return x === -2 ? '\0' : x < 0 ? null : data.ja.t[x];
      }
      var r = data.rings[v], k = r.x[i];
      return k < 0 ? null : r.l[r.k[k]];
    }
    function textOf(v, i) {
      if (v === JA) return labelOf(v, i);
      var r = data.rings[v], k = r.x[i];
      return k < 0 ? null : r.t[k];
    }
    function ringNames() {
      var names = ['TAGNT'].concat(WS.manifest.rings.sa.slice().reverse()).concat(['BSB']).filter(function (v) { return data.rings[v]; });
      if (state.align && WS.manifest.rings.draft) names.push(JA);
      return names;
    }
    function inScope() {
      var out = [], order = WS.manifest.texts.grc.books || WS.manifest.order;  // Word Study files number books in New Testament order
      data.e.o.forEach(function (o, i) { if (scope === 'NT' || order[o[0]] === scope) out.push(i); });
      return out;
    }
    /* colours: the nine commonest labels over the English rings share a palette; the Japanese ring has its own */
    function colours(ix, names) {
      var count = function (vs) {
        var tot = {};
        vs.forEach(function (v) { ix.forEach(function (i) { var l = labelOf(v, i); if (l && l !== '\0') tot[l] = (tot[l] || 0) + 1; }); });
        var order = Object.keys(tot).sort(function (a, b) { return tot[b] - tot[a] || (a < b ? -1 : 1); }), m = {};
        order.forEach(function (l, n) { m[l] = n < 9 ? 'var(--s' + (n + 1) + ')' : 'var(--s0)'; });
        return { order: order, m: m, tot: tot };
      };
      return { en: count(names.filter(function (v) { return v !== JA; })), ja: count(names.indexOf(JA) >= 0 ? [JA] : []) };
    }
    function isSel(kind, l) { return !!sel && sel.kind === kind && sel.label === l; }

    function drawRings(ix, names, cm) {
      var svg = el.querySelector('svg.rings');
      var inner = 62, gap = 5, band = Math.min(30, (210 - inner - gap * (names.length - 1)) / names.length), cx = 220, cy = 220, N = ix.length;
      names.forEach(function (v, ri) {
        var kind = v === JA ? 'ja' : 'en', c = cm[kind], counts = {}, held = 0, none = 0;
        ix.forEach(function (i) { var l = labelOf(v, i); if (l === '\0') held++; else if (!l) none++; else counts[l] = (counts[l] || 0) + 1; });
        var slices = c.order.filter(function (l) { return counts[l] && c.m[l] !== 'var(--s0)'; }).map(function (l) { return { l: l, n: counts[l], fill: c.m[l] }; });
        var rest = c.order.filter(function (l) { return counts[l] && c.m[l] === 'var(--s0)'; }).reduce(function (a, l) { return a + counts[l]; }, 0);
        if (rest) slices.push({ n: rest, fill: 'var(--s0)', name: t('other') });
        if (held) slices.push({ n: held, na: true, name: t('heldSlice') });
        if (none) slices.push({ n: none, na: true, name: t('notAligned') });
        var r0 = inner + ri * (band + gap), r1 = r0 + band, a = 0;
        slices.forEach(function (s) {
          var a1 = a + s.n / N * Math.PI * 2, pad = Math.min(0.01, (a1 - a) / 4), name = s.l || s.name;
          var p = svgEl('path', {
            d: arc(cx, cy, r0, r1, a + pad, a1 - pad), 'class': 'slice' + (s.l && isSel(kind, s.l) ? ' on' : '') + (v === JA ? ' draftring' : ''),
            fill: s.na ? 'none' : s.fill, stroke: s.na ? 'var(--line)' : v === JA ? 'var(--warn-line)' : 'none', 'stroke-dasharray': s.na ? '3 3' : '',
            tabindex: s.l ? 0 : -1, role: s.l ? 'button' : 'presentation', 'aria-label': v + ': ' + name + ', ' + s.n + ' / ' + N
          }, svg);
          svgEl('title', {}, p).textContent = v + ': ' + name + ' (' + s.n + ')';
          if (s.l) { p.dataset.kind = kind; p.dataset.label = s.l; }
          a = a1;
        });
        svgEl('text', { x: cx, y: cy - r1 + band / 2 + 4, 'text-anchor': 'middle', 'class': 'ringname', 'pointer-events': 'none' }, svg).textContent = v;
      });
      svgEl('text', { x: cx, y: cy + 2, 'text-anchor': 'middle', 'class': 'center-gk', lang: 'grc' }, svg).textContent = WS.lex[data.s].l;
      svgEl('text', { x: cx, y: cy + 22, 'text-anchor': 'middle', 'class': 'center-n' }, svg).textContent = N + '×';
      svg.classList.toggle('dim', !!sel);
    }
    function legendHTML(kind, c, ix, names) {
      var vs = names.filter(function (v) { return (v === JA) === (kind === 'ja'); }).reverse();
      if (!c.order.length) return '';
      var rows = c.order.slice(0, 9).map(function (l) {
        var per = vs.map(function (v) { return (kind === 'ja' ? '' : v + ' ') + ix.filter(function (i) { return labelOf(v, i) === l; }).length; }).join(' · ');
        return '<button class="lgrow' + (isSel(kind, l) ? ' on' : '') + '" data-kind="' + kind + '" data-label="' + esc(l) + '" aria-pressed="' + isSel(kind, l) + '">' +
          '<span class="sw" style="background:' + c.m[l] + '"></span><span' + (kind === 'ja' ? ' lang="ja" class="t-ja"' : '') + '>' + esc(l) + '</span><span class="num">' + esc(per) + '</span></button>';
      }).join('');
      var extra = c.order.length > 9 ? '<div class="lgrow more"><span class="sw" style="background:var(--s0)"></span><span>' + (c.order.length - 9) + ' ' + esc(t('other')) + '</span></div>' : '';
      return '<div class="wlg' + (kind === 'ja' ? ' draft' : '') + '" role="group" aria-label="' + (kind === 'ja' ? JA : 'English') + '">' +
        (kind === 'ja' ? '<span class="tag">' + JA + ' · ' + esc(t('draftTag')) + '</span>' : '') + rows + extra + '</div>';
    }
    function ledgerHTML(ix, names, cm) {
      var vs = names.slice().reverse(), order = WS.manifest.texts.grc.books || WS.manifest.order;
      var rows = !sel ? ix : ix.filter(function (i) {
        return vs.some(function (v) { return ((v === JA) === (sel.kind === 'ja')) && labelOf(v, i) === sel.label; });
      });
      var head = '<tr><th scope="col">' + esc(t('ref')) + '</th><th scope="col">' + esc(t('greekCol')) + '</th>' + vs.map(function (v) { return '<th scope="col">' + v + '</th>'; }).join('') + '</tr>';
      var body = rows.slice(0, limit).map(function (i) {
        var o = data.e.o[i], f = data.e.f[data.e.fx[i]], book = order[o[0]];
        var here = book === state.book && o[1] === state.ch && state.word === o[2] + ':' + o[3];
        return '<tr' + (here ? ' class="here"' : '') + '><td><button class="reflink" data-occ="' + i + '">' + esc(WS.bookName(book, true) + ' ' + o[1] + ':' + o[2]) + '</button></td>' +
          '<td><span class="t-gr" lang="grc">' + esc(f[0]) + '</span><small title="' + esc(formText(f[1])) + '">' + esc(f[1]) + '</small></td>' +
          vs.map(function (v) {
            var kind = v === JA ? 'ja' : 'en', l = labelOf(v, i), txt = textOf(v, i);
            if (l === '\0') return '<td class="na">' + esc(t('heldSlice')) + '</td>';
            if (!l) return '<td class="na">' + esc(t('notAligned')) + '</td>';
            return '<td' + (v === JA ? ' lang="ja" class="t-ja"' : '') + '>' + (isSel(kind, l) ? '<span class="hl" style="--hl:' + cm[kind].m[l] + '">' + esc(txt) + '</span>' : esc(txt)) + '</td>';
          }).join('') + '</tr>';
      }).join('');
      return '<h3>' + esc(t('every')) + ' (' + rows.length + (sel ? ' · “' + esc(sel.label) + '”' : '') + ')</h3>' +
        '<div class="occwrap" tabindex="0" role="region" aria-label="' + esc(t('every')) + '"><table class="occ"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
        (rows.length > limit ? '<button class="btn" data-more="1">' + esc(t('more')) + ' (' + (rows.length - limit) + ')</button>' : '');
    }

    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-occ]');
      if (b) { var o = data.e.o[+b.dataset.occ]; WS.goWord((WS.manifest.texts.grc.books || WS.manifest.order)[o[0]], o[1], o[2], o[3], data.s); return; }
      b = ev.target.closest('[data-label]');
      if (b) { sel = isSel(b.dataset.kind, b.dataset.label) ? null : { kind: b.dataset.kind, label: b.dataset.label }; limit = 60; draw(); return; }
      b = ev.target.closest('[data-scope]');
      if (b) { scope = b.dataset.scope; limit = 60; draw(); return; }
      b = ev.target.closest('[data-strong]');
      if (b) { WS.selectWord(state.v, null, b.dataset.strong); return; }
      if (ev.target.closest('[data-more]')) { limit += 200; draw(); return; }
      if (ev.target.closest('[data-clear]')) { sel = null; draw(); return; }
      if (ev.target.closest('[data-flag-on]')) WS.setAlign(true);
    });
    el.addEventListener('keydown', function (ev) {
      var p = ev.target.closest && ev.target.closest('path.slice[data-label]');
      if (p && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); p.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    });

    function draw() {
      var s = state.strong, e = s && WS.lex[s];
      if (!e || !data || data.s !== s) { el.innerHTML = '<p>' + esc(t(WS.covers('grc') ? 'pickWord' : 'pickHebrew')) + '</p>'; return; }
      if (scope !== 'NT' && !e.bk[scope]) scope = 'NT';
      if (sel && sel.kind === 'ja' && !state.align) sel = null;
      var names = ringNames(), ix = inScope(), cm = colours(ix, names);
      var cur = null;
      if (state.word) {
        var p = state.word.split(':'), gv = WS.verse('grc', +p[0]);
        cur = gv && gv.w.filter(function (w) { return w.i === +p[1] && w.s === s; })[0];
      }
      var html = '<h2 lang="grc">' + esc(e.l) + '</h2>' + (WS.reading ? '<div class="small wsay">' + WS.reading(e.l) + '</div>' : '') + '<div class="meta">' + esc(s) + ' · ' + esc(e.g) + ' · ' + e.n + ' ' + esc(t('inNT')) +
        (e.na !== e.n ? ' (' + esc(t('naCount')) + ': ' + e.na + ')' : '') + '</div>';
      if (cur) {
        var l = state.align && !cur.x ? WS.linkFor(+state.word.split(':')[0], cur.i) : null;
        html += '<section><h3>' + esc(t('thisForm')) + '</h3><span class="t-gr" lang="grc">' + esc(cur.t) + '</span> · ' + esc(cur.g) + ' · <code>' + esc(cur.m) + '</code> ' + esc(formText(cur.m)) +
          (l ? '<div class="here">' + (l.u ? '' : '<span class="t-ja jl st-' + l.st + '" lang="ja">' + esc(l.ja) + '</span> ') + '<span class="state">' + esc(WS.stateText(l)) + '</span></div>' : '') + '</section>';
      }
      var books = WS.manifest.order.filter(function (b) { return e.bk[b]; });
      html += '<section class="ringbox"><h3>' + esc(t('rings')) + '</h3><p class="small">' + esc(t('ringsHint')) + '</p>' +
        '<div class="chips books" role="group" aria-label="' + esc(t('byBook')) + '"><button data-scope="NT" aria-pressed="' + (scope === 'NT') + '">' + esc(t('scopeNT')) + ' <b>' + e.n + '</b></button>' +
        books.map(function (b) { return '<button data-scope="' + b + '" aria-pressed="' + (b === scope) + '">' + esc(WS.bookName(b, true)) + ' <b>' + e.bk[b] + '</b></button>'; }).join('') + '</div>' +
        '<svg class="rings" viewBox="0 0 440 440" role="group" aria-label="' + esc(t('rings')) + '"></svg>' +
        legendHTML('en', cm.en, ix, names) + legendHTML('ja', cm.ja, ix, names) +
        (sel ? '<button class="btn" data-clear="1">' + esc(t('clear')) + '</button>' : '') + '</section>';
      html += '<aside class="wfall" role="note"><h3>' + esc(t('fallacyH')) + '</h3><ul><li>' + esc(t('fallacy1')) + '</li><li>' + esc(t('fallacy2')) + '</li><li>' + esc(t('fallacy3')) + '</li></ul></aside>';
      html += '<section>' + ledgerHTML(ix, names, cm) + '</section>';
      if (data.e.same && data.e.same[1].length) {
        html += '<section><h3>' + esc(t('same')) + ' “' + esc(data.e.same[0]) + '”</h3><div class="chips">' + data.e.same[1].map(function (x) {
          var o = WS.lex[x[0]];
          return o ? '<button data-strong="' + x[0] + '"><span lang="grc">' + esc(o.l) + '</span> ' + x[1] + '</button>' : '';
        }).join('') + '</div></section>';
      }
      html += '<section' + (WS.manifest.alignment.present ? '' : ' hidden') + '><h3>' + esc(t('rend')) + '</h3>';
      var all = WS.lexAlign(), la = state.align && all && all[s];
      if (!state.align) html += '<p>' + esc(t('rendOff')) + '</p><button class="btn" data-flag-on="1">' + esc(t('flag')) + '</button>';
      else if (!la || !la.r.length) html += '<div class="draft"><span class="tag">' + esc(t('draftTag')) + '</span> · ' + esc(t('noRend')) + (la && la.held ? ' ' + esc(t('heldN')) + ' ' + la.held : '') + '</div>';
      else {
        var max = la.r[0].n;
        html += '<div class="draft"><span class="tag">' + esc(t('draftTag')) + '</span> · ' + esc(t('linkedN')) + ' ' + la.linked + (la.held ? ' · ' + esc(t('heldN')) + ' ' + la.held : '') +
          '<div class="rend">' + la.r.map(function (r) {
            return '<span class="ja" lang="ja">' + esc(r.ja) + '</span><span class="n">' + r.n + '</span><span class="bar" style="width:' + Math.max(2, Math.round(100 * r.n / max)) + '%" title="' + esc(r.refs.join(', ')) + '"></span>';
          }).join('') + '</div></div>';
      }
      html += '</section><section><h3>' + esc(t('forms')) + ' (' + e.f.length + ')</h3><div class="chips">' + e.f.map(function (code) { return '<span class="chip" title="' + esc(formText(code)) + '">' + esc(code) + '</span>'; }).join('') + '</div></section>';
      el.innerHTML = html;
      drawRings(ix, names, cm);
    }

    return {
      onWord: true,
      texts: function () { return state.word ? ['grc'] : []; },
      ready: function () {
        var s = state.strong, e = s && WS.lex[s];
        if (!e) { data = null; return Promise.resolve(); }
        var jobs = [WS.getJSON('ws/' + e.w + '.json')];
        jobs.push(WS.manifest.rings.sa.length ? WS.getJSON('ws-sa/' + e.w + '.json') : Promise.resolve(null));
        jobs.push(state.align && WS.manifest.rings.draft ? WS.getJSON('ws-align/' + e.w + '.json').catch(function () { return null; }) : Promise.resolve(null));
        return Promise.all(jobs).then(function (r) {
          var fresh = !data || data.s !== s, rings = {};
          Object.keys(r[0][s].r).forEach(function (v) { rings[v] = r[0][s].r[v]; });
          if (r[1] && r[1].words[s]) Object.keys(r[1].words[s]).forEach(function (v) { rings[v] = r[1].words[s][v]; });
          data = { s: s, e: r[0][s], rings: rings, ja: r[2] && r[2].words[s] || null };
          if (fresh) { sel = null; scope = 'NT'; limit = 60; }
        });
      },
      render: draw
    };
  }

  WS.panel({ id: 'word', component: 'word', title: 'word', group: 'study', build: word });
})();
