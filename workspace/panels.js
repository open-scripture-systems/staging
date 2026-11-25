/* Study workspace, the panels: one Bible panel per text, the Greek interlinear, the parallel view, Word Study,
 * Notes, and Sources. Each registers itself with WS.panel(); the core loads the texts a panel names.
 */
(function () {
  'use strict';
  var WS = window.WS, esc = WS.esc, state = WS.state, T = WS.T;
  function t(k) { return WS.t(k); }

  Object.assign(T, {
    greek: { en: 'Greek interlinear', ja: 'ギリシア語 逐語' },
    parallel: { en: 'Parallel versions', ja: '対照聖書' },
    parCols: { en: 'Versions shown', ja: '表示する訳' }, parDiff: { en: 'Mark differences', ja: '違いに印を付ける' },
    parBase: { en: 'Marked against:', ja: '基準：' },
    sources: { en: 'Sources and licences', ja: '出典とライセンス' },
    srcName: { en: 'Source', ja: '出典' }, srcUsed: { en: 'Used for', ja: '用途' }, srcLicence: { en: 'Licence', ja: 'ライセンス' },
    srcCredit: { en: 'Credit', ja: 'クレジット' }, srcChanges: { en: 'Changes', ja: '変更点' },
    pickWord: { en: 'Click a Greek word to study it.', ja: 'ギリシア語の語をクリックしてください。' },
    inNT: { en: 'in the New Testament', ja: '新約全体' },
    naCount: { en: 'NA28 as tagged by TAGNT', ja: 'TAGNT による NA28 の数' },
    thisForm: { en: 'This form', ja: 'この語形' }, forms: { en: 'Forms', ja: '語形' },
    byBook: { en: 'By book', ja: '書ごとの出現数' },
    occ: { en: 'Where it occurs in', ja: '出現箇所：' },
    rend: { en: 'How the Kougo-yaku renders it', ja: '口語訳での訳語' },
    rendOff: {
      en: 'Hidden. The Japanese renderings come from a machine alignment that no person has checked. Switch on "Unverified alignment" to see the draft.',
      ja: '非表示です。訳語は人が確認していない機械アラインメントによるものです。「未検証アラインメント」をオンにすると下書きを表示します。'
    },
    draftTag: { en: 'DRAFT, unverified', ja: '下書き・未検証' },
    linkedN: { en: 'links shown', ja: '表示リンク' }, heldN: { en: 'shown unlinked', ja: '未リンク表示' },
    noRend: { en: 'No rendering is shown for this word.', ja: 'この語の訳語は表示しません。' },
    export: { en: 'Export notes', ja: 'ノートを書き出す' },
    notesHint: { en: 'Saved in this browser only. No account.', ja: 'このブラウザにのみ保存されます。アカウント不要。' }
  });

  function verseNumbers() { var out = []; for (var v = 1; v <= WS.lastVerse(); v++) out.push(v); return out; }
  function heading(extra) { return '<h2>' + esc((extra ? extra + ' · ' : '') + WS.bookName() + ' ' + state.ch) + '</h2>'; }

  /* ---------- Bible panel: any one text ---------- */
  function bible(el, params) {
    var id = params.text;
    return {
      texts: function () { return [id]; },
      render: function () {
        var info = WS.textInfo(id);
        if (!WS.covers(id)) {  // a text without this book: say so rather than show nothing, and offer one that has it
          var ot = WS.manifest.books[state.book].ot, msg = id === 'denmo' ? 'notInText' : id === 'kougo' && ot ? 'kougoOT' : id === 'grc' ? 'ntOnly' : 'notInBook';
          var alt = ot ? (id === 'grc' ? 'hebrew' : 'bungo') : '';
          el.innerHTML = heading(WS.textName(id)) + '<p class="small">' + esc(t(msg)) + '</p>' +
            (alt && WS.covers(alt === 'hebrew' ? 'hbo' : 'bungo') ? '<p><button class="btn" data-open-alt="' + alt + '">' + esc(t(alt === 'hebrew' ? 'openHebrew' : 'openBungo')) + '</button></p>' : '');
          return;
        }
        /* a text can carry a one-line note shown above its verses (the Freedom Bible: a draft, with no word alignment) */
        var note = info.note ? '<p class="small tnote">' + esc(state.lang === 'en' ? info.note.en : state.lang === 'ja' ? info.note.ja : info.note.ja + ' ' + info.note.en) + '</p>' : '';
        el.innerHTML = heading(WS.textName(id)) + note + verseNumbers().map(function (v) {
          var html = WS.verseHTML(id, v);
          if (!html) return '';
          var vn = WS.vnote && WS.vnote(state.book, state.ch, v);
          return '<p class="vs ' + WS.textClass(id) + (vn && vn.c ? ' hl-' + vn.c : '') + '" lang="' + info.lang + '" data-text="' + id + '" data-verse="' + v + '"><span class="vn">' + v + (vn && vn.text ? '<span class="nmark" title="' + esc(vn.text.slice(0, 80)) + '">✎</span>' : '') + '</span>' + html + '</p>';
        }).join('');
      }
    };
  }

  /* ---------- Greek interlinear ---------- */
  /* Sentence parts (MACULA Greek, CC BY 4.0): the head words of subject, object and so on, marked under the word */
  var PART = { s: { en: 'subj', ja: '主語' }, o: { en: 'obj', ja: '目的語' }, io: { en: 'ind obj', ja: '間接目的語' }, p: { en: 'pred', ja: '補語' }, v: { en: 'verb', ja: '動詞' } };
  var PT = { on: { en: 'Show sentence parts', ja: '文の成分を表示' }, off: { en: 'Hide sentence parts', ja: '文の成分を隠す' },
    note: { en: 'Sentence parts: the head word of each part, from MACULA Greek (CC BY 4.0).', ja: '文の成分：各成分の中心となる語に、MACULA Greek（CC BY 4.0）の構文データから付けています。' } };
  /* The reading of each Greek word in katakana, with the Latin letters in parentheses: Japanese screens only, on by
   * default (a seminary professor asked for katakana in the interlinear, 2026-11-18). WS.kana (kana.js) follows the
   * Erasmian reading many Japanese seminaries teach beginners; it is a reading aid, not the authority on pronunciation. */
  var KN = { on: { en: 'Show readings', ja: '読み（カタカナ）を表示' }, off: { en: 'Hide readings', ja: '読み（カタカナ）を隠す' },
    note: { en: '', ja: '読み：エラスムス式（日本の神学校で初めに教えることの多い読み方）による読み上げの助けです。正しい発音を決めるものではありません。η と ω は長音（ー）、υ はユ、ου はウーで示しています。先生によって読み方は違います。' } };
  function kanaOn() { return state.lang !== 'en' && !!WS.kana && WS.store.get('ws.kana', true); }
  function PL(x) { return state.lang === 'en' ? x.en : x.ja; }
  function greek(el) {
    var parts = null;
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-kana]')) { WS.store.set('ws.kana', !WS.store.get('ws.kana', true)); WS.emit('lang', null); return; }
      if (!ev.target.closest('[data-parts]')) return;
      WS.store.set('ws.parts', !WS.store.get('ws.parts', false)); WS.emit('lang', null);
    });
    return {
      texts: function () { return ['grc']; },
      ready: function () {
        parts = null;
        if (!WS.store.get('ws.parts', false) || !WS.covers('grc')) return Promise.resolve();
        return WS.getJSON('role/' + state.book + '/' + state.ch + '.json').then(function (d) { parts = d; }, function () { parts = {}; });
      },
      render: function () {
        if (!WS.covers('grc')) {
          el.innerHTML = heading('SBLGNT') + '<p class="small">' + esc(t('ntOnly')) + '</p>' +
            (WS.covers('hbo') ? '<p><button class="btn" data-open-alt="hebrew">' + esc(t('openHebrew')) + '</button></p>' : '');
          return;
        }
        var on = WS.store.get('ws.parts', false);
        var kn = kanaOn();
        el.innerHTML = heading('SBLGNT') + '<p class="small"><button class="btn" data-parts="1" aria-pressed="' + on + '">' + esc(PL(on ? PT.off : PT.on)) + '</button>' +
          (state.lang !== 'en' && WS.kana ? ' <button class="btn" data-kana="1" aria-pressed="' + kn + '">' + esc(PL(kn ? KN.off : KN.on)) + '</button>' : '') +
          (on ? ' ' + esc(PL(PT.note)) : '') + '</p>' + (kn ? '<details class="small kn-note"><summary>読みについて（読み上げの助け）</summary><p>' + esc(KN.note.ja) + '</p></details>' : '') + verseNumbers().map(function (v) {
          var gv = WS.verse('grc', v);
          if (!gv) {
            var p = WS.pointer('grc', v);
            return p ? '<div class="il" data-verse="' + v + '"><span class="vn">' + v + '</span><span class="vp">' + esc(t('seeVerse') + ' ' + p) + '</span></div>' : '';
          }
          return '<div class="il" data-verse="' + v + '"><span class="vn">' + v + '</span>' + WS.notSbl(gv) + gv.w.map(function (w) {
            if (!w.i) return '<span class="iw"><span class="s" lang="grc">' + esc(w.t) + '</span></span>';
            var l = state.align && !w.x ? WS.linkFor(v, w.i) : null;
            return '<button class="iw" data-v="' + v + '" data-i="' + w.i + '" data-s="' + esc(w.s) + '" data-g="' + v + ':' + w.i + '">' +
              '<span class="s" lang="grc">' + esc(w.t) + '</span>' + (kn ? (function (r) { return '<span class="k" lang="ja">' + esc(r.ja) + ' <span lang="en">(' + esc(r.en) + ')</span></span>'; })(WS.kana(w.t)) : '') +
              '<span class="g">' + esc(w.g) + '</span>' +
              '<span class="m">' + esc(w.s) + ' ' + esc(w.m) + '</span>' +
              (parts && parts[v] && parts[v][w.i] ? '<span class="pt pt-' + parts[v][w.i] + '">' + esc(PL(PART[parts[v][w.i]])) + '</span>' : '') +
              (!state.align ? '' : !l ? '<span class="j">&nbsp;</span>' :
                l.u ? '<span class="j un" title="' + esc(WS.stateText(l)) + '">' + (state.lang === 'en' ? 'unlinked' : '未リンク') + '</span>' :
                  '<span class="j st-' + l.st + '" lang="ja" title="' + esc(WS.stateText(l)) + '">' + esc(l.ja) + (l.where ? ' <small>→' + esc(l.where) + '</small>' : '') + '</span>') + '</button>';
          }).join('') + '</div>';
        }).join('');
      }
    };
  }

  /* ---------- parallel: versions side by side, one row a verse, differences marked ----------
   * Differences are marked inside one language only, against the first version of that language in view:
   * English word by word (case and punctuation ignored), Japanese character by character (punctuation ignored;
   * an old character form counts as a different character). Greek is never marked. */
  var ORDER = ['kougo', 'denmo', 'jpnm', 'bungo', 'grc', 'bsb', 'web', 'kjv'];
  var PUNCT = /[\s、。，．・「」『』（）()\[\]―…！？!?,.;:'"“”‘’\-]/;
  /* which items of b are not part of the longest common subsequence with a */
  function differs(a, b) {
    var n = a.length, m = b.length, w = m + 1, dp = new Uint16Array((n + 1) * w), i, j;
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    var out = [];
    for (j = 0; j < m; j++) out.push(true);
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { out[j] = false; i++; j++; }
      else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++;
      else j++;
    }
    return out;
  }
  function enWords(str) { return str.split(/\s+/).filter(Boolean); }
  function enKey(w) { return w.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function enMarked(base, str) {
    var words = enWords(str), keys = words.map(enKey), real = [], at = [];
    keys.forEach(function (k, n) { if (k) { real.push(k); at.push(n); } });
    var d = differs(enWords(base).map(enKey).filter(Boolean), real), mark = {};
    d.forEach(function (x, n) { if (x) mark[at[n]] = true; });
    var out = '', open = false;
    words.forEach(function (wd, n) {
      var on = !!mark[n], sp = n ? ' ' : '';
      if (on && !open) out += sp + '<mark class="df">' + esc(wd);
      else if (!on && open) out += '</mark>' + sp + esc(wd);
      else out += sp + esc(wd);
      open = on;
    });
    return out + (open ? '</mark>' : '');
  }
  function jaChars(segs) { return segs.map(function (x) { return x[0]; }).join('').split('').filter(function (c) { return !PUNCT.test(c); }); }
  function jaMarked(baseSegs, segs) {
    var d = differs(jaChars(baseSegs), jaChars(segs)), k = 0;
    /* one flag a character; punctuation takes a mark only when the characters on both sides of it are marked */
    var flags = segs.map(function (seg) { return seg[0].split('').map(function (c) { return PUNCT.test(c) ? null : d[k++]; }); });
    var flat = [].concat.apply([], flags), real = function (n, step) { while (n >= 0 && n < flat.length && flat[n] === null) n += step; return !!flat[n]; };
    var n = 0;
    return segs.map(function (seg, si) {
      var mine = flags[si].map(function (f) { var on = f === null ? real(n, -1) && real(n, 1) : f; n++; return on; });
      if (seg[1]) {
        var r = '<ruby>' + esc(seg[0]) + '<rt>' + esc(seg[1]) + '</rt></ruby>';
        return mine.some(function (f) { return f; }) ? '<mark class="df">' + r + '</mark>' : r;
      }
      var out = '', open = false;
      seg[0].split('').forEach(function (c, i) {
        if (mine[i] && !open) out += '<mark class="df">';
        if (!mine[i] && open) out += '</mark>';
        open = mine[i];
        out += esc(c);
      });
      return out + (open ? '</mark>' : '');
    }).join('');
  }
  function parallel(el) {
    function cols() {
      var saved = WS.store.get('ws.par.cols', null);
      var c = saved || (state.lang === 'en' ? ['grc', 'bsb', 'web', 'kjv'] : state.lang === 'ja' ? [WS.ja(), 'kougo', 'bungo', 'grc'] : [WS.ja(), 'kougo', 'bungo', 'bsb', 'web', 'kjv']);
      c = ORDER.filter(function (id) { return c.indexOf(id) >= 0 && WS.textInfo(id); });
      return c.length ? c : [WS.ja()];
    }
    function diffOn() { return WS.store.get('ws.par.diff', true); }
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-col]');
      if (!b) return;
      var c = cols(), id = b.dataset.col, n = c.indexOf(id);
      if (n >= 0) { if (c.length > 1) c.splice(n, 1); } else c.push(id);
      WS.store.set('ws.par.cols', c);
      WS.emit('lang', null);   /* redraw every parallel panel with the new columns, loading what is new */
    });
    el.addEventListener('change', function (ev) {
      if (ev.target.name === 'pardiff') { WS.store.set('ws.par.diff', ev.target.checked); WS.emit('lang', null); }
    });
    return {
      texts: cols,
      render: function () {
        var c = cols(), mark = diffOn(), base = {};
        c.forEach(function (id) { var lang = WS.textInfo(id).lang; if (lang !== 'grc' && !base[lang]) base[lang] = id; });
        var marked = c.filter(function (id) { var lang = WS.textInfo(id).lang; return mark && base[lang] && base[lang] !== id; });
        var html = '<div class="parbar"><span class="chips" role="group" aria-label="' + esc(t('parCols')) + '">' + ORDER.filter(WS.textInfo).map(function (id) {
          return '<button data-col="' + id + '" aria-pressed="' + (c.indexOf(id) >= 0) + '" title="' + esc(WS.textName(id)) + '">' + esc(WS.textInfo(id).short) + '</button>';
        }).join('') + '</span><label class="pardiff"><input type="checkbox" name="pardiff"' + (mark ? ' checked' : '') + '> ' + esc(t('parDiff')) + '</label>' +
          (marked.length ? '<span class="small">' + esc(t('parBase')) + ' ' + Object.keys(base).filter(function (l) { return marked.some(function (id) { return WS.textInfo(id).lang === l; }); })
            .map(function (l) { return esc(WS.textInfo(base[l]).short); }).join(', ') + '</span>' : '') + '</div>';
        html += '<div class="par" style="--cols:' + c.length + '">' + c.map(function (id) { return '<div class="hd">' + esc(WS.textName(id)) + '</div>'; }).join('');
        for (var v = 1; v <= WS.lastVerse(); v++) {
          for (var k = 0; k < c.length; k++) {
            var id = c[k], info = WS.textInfo(id), x = WS.verse(id, v), body;
            var b = marked.indexOf(id) >= 0 ? WS.verse(base[info.lang], v) : null;
            if (x != null && b != null) body = (WS.label(id, v) ? '<span class="vl">' + esc(WS.label(id, v)) + '</span> ' : '') + (info.kind === 'ruby' ? jaMarked(b, x) : enMarked(b, x));
            else body = WS.verseHTML(id, v) || '<span class="vp">' + esc(t('noVerse')) + '</span>';
            html += '<div class="' + WS.textClass(id) + (k ? '' : ' first') + '" data-text="' + id + '" lang="' + info.lang + '" data-verse="' + v + '"><span class="vn">' + v + '</span><span class="tl">' + esc(info.short || info.en) + '</span>' + body + '</div>';
          }
        }
        el.innerHTML = heading() + html + '</div>';
      }
    };
  }

  /* ---------- Notes: plain text in this browser, one note a chapter, exportable ---------- */
  /* ---------- Notes: one note per verse, with an optional highlight colour ----------
   * Stored on this device in ws.vnotes: { "Jhn.3.16": { text, c, t } }. A chapter note from the older box
   * (ws.notes.<book>.<ch>) is moved in as verse 0 of that chapter the first time; the old key is kept as it was. */
  var COLORS = ['y', 'g', 'b', 'p', 'o'];
  var NS = {
    verse: { en: 'Note on', ja: 'メモ：' }, chapterNote: { en: 'Chapter note', ja: '章のメモ' },
    color: { en: 'Highlight', ja: '色' }, none: { en: 'No colour', ja: '色なし' },
    here: { en: 'This chapter', ja: 'この章' }, all: { en: 'All notes', ja: 'すべてのメモ' },
    empty: { en: 'No notes yet. Click a verse, then write here.', ja: 'まだメモはありません。節を押してから、ここに書いてください。' },
    md: { en: 'Save as a file (Markdown)', ja: 'ファイルに保存（Markdown）' }, backup: { en: 'Back up (JSON)', ja: 'バックアップ（JSON）' },
    load: { en: 'Load a backup', ja: 'バックアップを読み込む' }, loaded: { en: 'Loaded. Notes already here were kept.', ja: '読み込みました。今あるメモはそのまま残しています。' },
    device: { en: 'Saved on this device only.', ja: 'この端末にだけ保存されます。' }
  };
  function NL(k) { return state.lang === 'en' ? NS[k].en : NS[k].ja; }
  function allNotes() {
    var n = WS.store.get('ws.vnotes', null);
    if (!n) {  // first run: bring in the older chapter notes, losing nothing
      n = {};
      WS.store.keys().forEach(function (k) {
        var m = /^ws\.notes\.([^.]+)\.(\d+)$/.exec(k);
        if (m) { var txt = WS.store.get(k, ''); if (txt) n[m[1] + '.' + m[2] + '.0'] = { text: txt, c: '', t: Date.now() }; }
      });
      WS.store.set('ws.vnotes', n);
    }
    return n;
  }
  WS.vnote = function (book, ch, v) { return allNotes()[book + '.' + ch + '.' + v] || null; };
  function refName(key) {
    var p = key.split('.'), b = WS.manifest.books[p[0]];
    if (!b) return key;
    var name = state.lang === 'en' ? b.en : b.short || b.ja;
    return name + ' ' + p[1] + (p[2] !== '0' ? ':' + p[2] : '');
  }
  function sortKey(k) { var p = k.split('.'); return [WS.manifest.order.indexOf(p[0]), +p[1], +p[2]]; }
  function cmp(a, b) { var x = sortKey(a), y = sortKey(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; }
  function notes(el) {
    el.classList.add('notes');
    var scope = 'here';
    function here() { return state.book + '.' + state.ch + '.' + (state.v || 0); }
    function put(key, patch) {
      var n = allNotes(), cur = n[key] || { text: '', c: '', t: 0 };
      Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
      cur.t = Date.now();
      if (!cur.text && !cur.c) delete n[key]; else n[key] = cur;
      WS.store.set('ws.vnotes', n);
    }
    function download(name, type, body) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([body], { type: type })); a.download = name; a.click();
    }
    el.addEventListener('input', function (ev) {
      if (ev.target.id === 'vnote') { put(here(), { text: ev.target.value }); list(); }
    });
    el.addEventListener('change', function (ev) {
      if (ev.target.id !== 'vload' || !ev.target.files[0]) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var inc = JSON.parse(r.result).notes || {}, n = allNotes();
          Object.keys(inc).forEach(function (k) { if (!n[k] && inc[k] && typeof inc[k].text === 'string') n[k] = inc[k]; });
          WS.store.set('ws.vnotes', n); el.querySelector('.vmsg').textContent = NL('loaded'); list(); WS.emit('lang', null);
        } catch (e) { el.querySelector('.vmsg').textContent = String(e); }
      };
      r.readAsText(ev.target.files[0]);
    });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-c],[data-go],[data-scope],[data-md],[data-backup]'); if (!b) return;
      if (b.dataset.c !== undefined) { put(here(), { c: b.dataset.c }); draw(); WS.emit('lang', null); return; }
      if (b.dataset.scope) { scope = b.dataset.scope; list(); return; }
      if (b.dataset.go) { var p = b.dataset.go.split('.'); WS.go(p[0], +p[1], +p[2] || 1); return; }
      var n = allNotes(), keys = Object.keys(n).sort(cmp);
      if (b.dataset.md !== undefined) {
        download('study-notes.md', 'text/markdown', keys.map(function (k) { return '## ' + refName(k) + (n[k].c ? ' (' + n[k].c + ')' : '') + '\n\n' + (n[k].text || '-'); }).join('\n\n') + '\n');
      } else {
        download('study-notes-backup.json', 'application/json', JSON.stringify({ app: 'mikotoba-kobo', version: 1, notes: n }, null, 1));
      }
    });
    function list() {
      var n = allNotes(), pre = state.book + '.' + state.ch + '.', keys = Object.keys(n).filter(function (k) { return scope === 'all' || k.indexOf(pre) === 0; }).sort(cmp);
      var box = el.querySelector('.vlist'); if (!box) return;
      box.innerHTML = keys.length ? keys.map(function (k) {
        return '<li><button data-go="' + esc(k) + '" class="' + (n[k].c ? 'hl-' + esc(n[k].c) : '') + '"><b>' + esc(refName(k)) + '</b> ' + esc((n[k].text || '').slice(0, 80)) + '</button></li>';
      }).join('') : '<li class="small">' + esc(NL('empty')) + '</li>';
    }
    function draw() {
      var cur = WS.vnote(state.book, state.ch, state.v || 0) || { text: '', c: '' };
      el.innerHTML = heading(t('notes')) +
        '<label class="small" for="vnote">' + esc(state.v ? NL('verse') + ' ' + refName(here()) : NL('chapterNote')) + '</label>' +
        '<textarea id="vnote">' + esc(cur.text) + '</textarea>' +
        '<div class="vcol" role="group" aria-label="' + esc(NL('color')) + '">' + COLORS.map(function (c) {
          return '<button data-c="' + c + '" class="sw hl-' + c + '" aria-pressed="' + (cur.c === c) + '" aria-label="' + esc(NL('color') + ' ' + c) + '"></button>';
        }).join('') + '<button data-c="" class="sw" aria-pressed="' + (!cur.c) + '">' + esc(NL('none')) + '</button></div>' +
        '<p class="small">' + esc(NL('device')) + '</p>' +
        '<div class="seg"><button data-scope="here" aria-pressed="' + (scope === 'here') + '">' + esc(NL('here')) + '</button><button data-scope="all" aria-pressed="' + (scope === 'all') + '">' + esc(NL('all')) + '</button></div>' +
        '<ul class="vlist"></ul>' +
        '<div class="grow"><button class="btn" data-md="1">' + esc(NL('md')) + '</button><button class="btn" data-backup="1">' + esc(NL('backup')) + '</button>' +
        '<label class="btn">' + esc(NL('load')) + '<input id="vload" type="file" accept="application/json,.json" hidden></label></div><p class="small vmsg" role="status"></p>';
      list();
      shownFor = here();
    }
    var shownFor = null;
    // a verse picked in the same chapter does not reload the panel, so the note box follows it here
    return { render: draw, paint: function () { if (shownFor !== here() && document.activeElement !== el.querySelector('#vnote')) draw(); } };
  }

  /* ---------- Sources and licences, straight from the manifest ---------- */
  function sources(el) {
    return {
      render: function () {
        el.innerHTML = '<h2>' + esc(t('sources')) + '</h2><table class="src"><thead><tr><th>' + esc(t('srcName')) + '</th><th>' + esc(t('srcUsed')) + '</th><th>' + esc(t('srcLicence')) + '</th><th>' + esc(t('srcCredit')) + '</th></tr></thead><tbody>' +
          WS.manifest.sources.map(function (s) {
            return '<tr class="' + (s.unverified ? 'unv' : '') + '"><td>' + (s.url ? '<a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.name) + '</a>' : esc(s.name)) +
              '</td><td>' + esc(s.used) + '</td><td>' + (s.license_url ? '<a href="' + esc(s.license_url) + '" rel="noopener" target="_blank">' + esc(s.license) + '</a>' : esc(s.license)) +
              '</td><td>' + esc(s.credit) + (s.changes ? '<br>' + esc(t('srcChanges')) + ': ' + esc(s.changes) : '') + '</td></tr>';
          }).join('') + '</tbody></table>';
      }
    };
  }

  WS.panel({ id: 'kougo', component: 'bible', params: { text: 'kougo' }, text: 'kougo', group: 'texts', build: bible });
  WS.panel({ id: 'bungo', component: 'bible', params: { text: 'bungo' }, text: 'bungo', group: 'texts' });
  WS.panel({ id: 'denmo', component: 'bible', params: { text: 'denmo' }, text: 'denmo', group: 'texts' });
  WS.panel({ id: 'jpnm', component: 'bible', params: { text: 'jpnm' }, text: 'jpnm', group: 'texts' });
  WS.panel({ id: 'bsb', component: 'bible', params: { text: 'bsb' }, text: 'bsb', group: 'texts' });
  WS.panel({ id: 'web', component: 'bible', params: { text: 'web' }, text: 'web', group: 'texts' });
  WS.panel({ id: 'kjv', component: 'bible', params: { text: 'kjv' }, text: 'kjv', group: 'texts' });
  WS.panel({ id: 'sblgnt', component: 'bible', params: { text: 'grc' }, text: 'grc', group: 'original' });
  WS.panel({ id: 'greek', component: 'greek', title: 'greek', group: 'original', build: greek });
  WS.panel({ id: 'parallel', component: 'parallel', title: 'parallel', group: 'study', build: parallel });
  WS.panel({ id: 'notes', component: 'notes', title: 'notes', build: notes });
  WS.panel({ id: 'sources', component: 'sources', title: 'sources', group: 'about', build: sources });
})();

/* A button that opens the panel with the text the reader needs (the Hebrew or the Bungo-yaku for an Old Testament book). */
document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-open-alt]');
  if (!b) return;
  var p = WS.ensurePanel(b.dataset.openAlt); if (p) p.api.setActive();
});
