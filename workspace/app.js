/* Study workspace, core: tiles of tabs (dockview-core), a left rail, one command box, Japanese and English
 * side by side. Every panel reads the same data layer (data/, built by scripts/build_workspace.py) and follows
 * one link set: the shared `state` below. A panel names the texts it shows and the core loads only those.
 *
 * The Kougo-yaku alignment is a machine draft that no person has checked, so its files are fetched only after
 * the reader switches the "unverified alignment" flag on. The flag is off on every page load and is never saved
 * (a build whose manifest says alignment.default "on" starts with it on: scripts/pack_preview.py --draft).
 *
 * Panels live in panels.js and the files after it; they register themselves with WS.panel(). boot.js starts it.
 */
window.WS = (function () {
  'use strict';
  var DV = window['dockview-core'];
  var $ = function (id) { return document.getElementById(id); };

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private window */ } },
    keys: function () { try { return Object.keys(localStorage); } catch (e) { return []; } },
    drop: function (k) { try { localStorage.removeItem(k); } catch (e) { /* private window */ } }
  };
  var narrowQ = window.matchMedia('(max-width: 900px)');
  function narrow() { return narrowQ.matches; }

  /* ---------- words on the page, in both languages ---------- */
  var T = {
    cmd: { en: 'John 3:16, ロマ 8:28, G3056, or a word to search', ja: 'ヨハネ 3:16、ロマ8章28節、G3056、恵み（本文検索）' },
    a_rail: { en: 'Menu', ja: 'メニュー' }, a_cmd: { en: 'Go to a reference, a Strong\'s number, or search a word', ja: '聖書箇所へ移動、ストロング番号、または語を検索' },
    a_prev: { en: 'Previous chapter', ja: '前の章' }, a_next: { en: 'Next chapter', ja: '次の章' }, a_lang: { en: 'Language', ja: '表示言語' },
    a_notices: { en: 'Notices', ja: 'お知らせ' }, a_nav: { en: 'Library and layouts', ja: 'ライブラリとレイアウト' },
    display: { en: 'Display', ja: '表示' }, ruby: { en: 'Furigana', ja: 'ふりがな' }, rubyOn: { en: 'shown', ja: '表示' }, rubyOff: { en: 'hidden', ja: '非表示' },
    layout: { en: 'Layout', ja: 'レイアウト' },
    flag: { en: 'Unverified alignment', ja: '未検証アラインメント' },
    big: { en: 'Larger text', ja: '文字を大きく' }, bigOff: { en: 'Normal text', ja: '標準の文字' },
    banner: {
      en: 'Draft: an unverified machine alignment of the Kougo-yaku to the Greek is showing. No person has checked it. Do not quote or share it.',
      ja: '下書き：口語訳とギリシア語の機械アラインメント（未検証）を表示中です。人による確認はまだです。引用や共有はしないでください。'
    },
    bannerSite: {
      en: 'Draft: the links from Japanese words to Greek words are machine work. A person has checked only a small sample. Do not rely on them or quote them; check the Greek text yourself.',
      ja: '下書き：日本語の語とギリシア語の語の対応は、機械による作業です。人が確認したのは一部の抜き取りだけです。この対応を根拠にしたり引用したりせず、必ずギリシア語本文で確かめてください。'
    },
    library: { en: 'Library', ja: 'ライブラリ' }, guides: { en: 'Guides', ja: 'ガイド' },
    notes: { en: 'Notes', ja: 'ノート' }, layouts: { en: 'Layouts', ja: 'レイアウト' },
    book: { en: 'Book', ja: '書' }, chapters: { en: 'Chapter', ja: '章' },
    guidesSoon: { en: 'Not built yet.', ja: '未実装です。' },
    siteTools: { en: 'Single tools', ja: '単体ツール' }, siteHome: { en: 'Home', ja: 'ホーム' },
    L_passage: { en: 'Passage study', ja: '聖書箇所の研究' }, L_word: { en: 'Word study', ja: '語句研究' },
    L_nichiei: { en: 'Japanese and English', ja: '日英対照' }, L_guided: { en: 'Guided study', ja: '学びの手引き' }, reset: { en: 'Reset this layout', ja: 'このレイアウトを初期化' },
    notFound: { en: 'Nothing found for', ja: '見つかりません：' },
    notBuilt: { en: 'This build does not hold', ja: 'このビルドに含まれていない書です：' },
    found: { en: 'matches; showing', ja: '件。表示中：' },
    noVerse: { en: 'not in this text', ja: 'この本文にはありません' },
    seeVerse: { en: 'in', ja: '→' },
    notInText: { en: 'This text does not include this book. The Denmo Bible draft has Matthew to Acts and Hebrews to Jude only.', ja: 'この本文には、この書は入っていません。電網聖書の草稿にあるのは、マタイから使徒行伝までと、ヘブル書からユダ書までです。' },
    notInBook: { en: 'This text does not include this book.', ja: 'この本文には、この書は入っていません。' },
    kougoOT: { en: 'The Kougo-yaku Old Testament is not on this site yet. You can read the Bungo-yaku (Meiji translation) instead.', ja: '口語訳の旧約は、まだこのサイトに載せていません。文語訳（明治元訳）で読めます。' },
    ntOnly: { en: 'The Greek is the New Testament only. For the Old Testament, open the Hebrew.', ja: 'ギリシア語本文は新約だけです。旧約は、ヘブライ語のパネルで読めます。' },
    openBungo: { en: 'Open the Bungo-yaku', ja: '文語訳を開く' }, openHebrew: { en: 'Open the Hebrew', ja: 'ヘブライ語を開く' },
    loadFail: { en: 'Could not load', ja: '読み込めません：' },
    /* review state of one alignment link, and why a word is shown as unlinked */
    st_m: { en: 'machine draft, not checked', ja: '機械の下書き（未確認）' },
    st_q: { en: 'in the hand-check queue', ja: '要確認の一覧にあり' },
    st_ok: { en: 'checked by a person', ja: '人が確認済み' },
    st_un: { en: 'a reviewer was unsure', ja: '確認者が保留' },
    u_a: { en: 'unlinked: the article is not guessed at', ja: '未リンク：冠詞は推測しません' },
    u_p: { en: 'unlinked: a particle alone is not guessed at', ja: '未リンク：助詞だけの対応は推測しません' },
    u_w: { en: 'unlinked: a reviewer marked the draft link wrong', ja: '未リンク：確認者が下書きを誤りと判定' },
    unlinked: { en: 'unlinked', ja: '未リンク' },
    setHint: { en: 'Link set: panels with the same letter move together. Click for the next set (A, B, C).', ja: 'リンクセット：同じ文字のパネルは一緒に動きます。押すと次のセット（A、B、C）に替わります。' },
    setNow: { en: '{p} now follows link set {s}.', ja: '{p}はリンクセット{s}に従います。' },
    setNone: { en: 'Pick a Bible text or the Greek panel first, then type: set B', ja: 'まず聖書本文かギリシア語のパネルを選んでから、「set B」と入力してください。' },
    inVerse: { en: 'the Japanese is in verse', ja: '訳語のある節：' },
    legend: { en: 'This chapter', ja: 'この章' },
    lg_m: { en: 'machine draft', ja: '機械の下書き' }, lg_q: { en: 'to check', ja: '要確認' },
    lg_ok: { en: 'checked', ja: '確認済み' }, lg_un: { en: 'unsure', ja: '保留' },
    lg_u: { en: 'draft links withheld (articles, particles)', ja: '下書きを保留（冠詞・助詞）' }
  };
  var GRAM = {
    noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞', article: '冠詞', conjunction: '接続詞', interjection: '間投詞',
    particle: '小辞', preposition: '前置詞', pronoun: '代名詞',
    nominative: '主格', genitive: '属格', dative: '与格', accusative: '対格', vocative: '呼格',
    singular: '単数', plural: '複数', masculine: '男性', feminine: '女性', neuter: '中性',
    present: '現在', imperfect: '未完了過去', future: '未来', aorist: 'アオリスト', perfect: '現在完了', pluperfect: '過去完了',
    active: '能動態', middle: '中動態', passive: '受動態', 'middle or passive': '中動態または受動態',
    'middle deponent': '中動態（異態）', 'passive deponent': '受動態（異態）', 'middle or passive deponent': '中動態または受動態（異態）',
    indicative: '直説法', subjunctive: '接続法', optative: '希求法', imperative: '命令法', infinitive: '不定詞', participle: '分詞',
    first: '一人称', second: '二人称', third: '三人称'
  };
  /* A list of grammar terms (English, from the data) in the language in view. */
  function gram(terms) {
    var en = terms.join(', '), ja = terms.map(function (x) { return GRAM[x] || x; }).join('・');
    return state.lang === 'en' ? en : state.lang === 'ja' ? ja : ja + ' · ' + en;
  }
  function t(key) {
    var e = T[key];
    if (!e) return key;
    if (state.lang === 'en') return e.en;
    if (state.lang === 'ja') return e.ja;
    return e.ja === e.en ? e.ja : e.ja + ' · ' + e.en;
  }

  /* ---------- shared state (link set A) ---------- */
  var state = { book: 'Jhn', ch: 1, v: 1, strong: null, word: null, lang: window.WS_LANG_FORCE || store.get('ws.lang', window.WS_LANG || 'ja'), align: false };
  var subs = [];
  function on(fn) { subs.push(fn); return function () { subs.splice(subs.indexOf(fn), 1); }; }
  /* Link sets: a Bible text or the Greek panel can follow set B or C instead of A, so two passages stay open side by
   * side. `state` always holds the set being worked on; use(id, fn) swaps that set's place in for the length of fn.
   * The word picked for study (strong) is shared, since it is a word, not a place. Every panel starts in A. */
  var SETS = { A: null, B: null, C: null }, KEYS = ['book', 'ch', 'v', 'word'], view = 'A', active = 'A', routeSet = 'A';
  function snap() { var o = {}; KEYS.forEach(function (k) { o[k] = state[k]; }); return o; }
  function put(o) { KEYS.forEach(function (k) { state[k] = o[k]; }); }
  function use(id, fn) {
    id = SETS.hasOwnProperty(id) ? id : 'A';
    if (id === view) return fn();
    var prev = view;
    SETS[prev] = snap(); put(SETS[id] || SETS[prev]); view = id;
    try { return fn(); } finally { SETS[id] = snap(); put(SETS[prev]); view = prev; }
  }
  /* A move made from inside a pane (or from the top bar) goes to that pane's set; anything else moves A. */
  function route(fn, args) { var s = view !== 'A' ? view : routeSet; return use(s, function () { return fn.apply(null, args); }); }
  function setOf(id) { var d = ITEM[id]; return d && d.sets && store.get('ws.psets', {})[id] || 'A'; }
  function setAt() { if (view !== 'A') store.set('ws.set.' + view, snap()); }
  function emit(kind, origin) { var from = view; subs.slice().forEach(function (fn) { fn(kind, origin, from); }); }
  function here() { return state.book + '/' + state.ch; }

  /* ---------- data layer ---------- */
  var manifest = null, lex = {}, morph = {}, lexAlign = null, cache = {}, pending = {};
  /* A host that limits the number of files can be given the data as a few packs: window.WS_PACK maps a path
   * prefix to one JSON file holding { path: content }. A path that is not in its pack fails like a missing file. */
  var packs = {};
  function fromPack(path) {
    var map = window.WS_PACK || {}, prefix = Object.keys(map).filter(function (k) { return path.indexOf(k) === 0; }).sort(function (a, b) { return b.length - a.length; })[0];
    if (prefix === undefined) return null;
    var file = map[prefix];
    if (!packs[file]) packs[file] = fetch(file).then(function (r) { if (!r.ok) throw new Error(file + ' ' + r.status); return r.json(); });
    return packs[file].then(function (d) { if (!(path in d)) throw new Error(path + ' 404'); return d[path]; });
  }
  function getJSON(path) {
    if (cache[path]) return Promise.resolve(cache[path]);
    var packed = !pending[path] && fromPack(path);
    if (packed) pending[path] = packed.then(function (d) { cache[path] = d; delete pending[path]; return d; }, function (e) { delete pending[path]; throw e; });
    if (!pending[path]) {
      pending[path] = fetch('data/' + path).then(function (r) {
        if (!r.ok) throw new Error(path + ' ' + r.status);
        return r.json();
      }).then(function (d) { cache[path] = d; delete pending[path]; return d; }, function (e) { delete pending[path]; throw e; });
    }
    return pending[path];
  }
  /* The Japanese text the layouts, search and the draft alignment start from. The build names it (manifest.ja), so a
   * site can be published with one Japanese translation or another without a change to the page. */
  function J() { return (manifest && manifest.ja) || 'kougo'; }
  /* The Japanese text a new layout opens with: the Freedom Bible when the build has it (Kentaro, 2026-11-25:
   * "フリーダム訳を最初に"), else J(). J() stays one tab behind it and keeps the draft alignment and search.
   * A layout the reader already has (saved in this browser) is kept as it is. */
  function JD() { return manifest && manifest.texts && manifest.texts.jpnm ? 'jpnm' : J(); }
  function addJa(position) {
    add(JD(), position);
    if (JD() !== J()) add(J(), { referencePanel: JD(), direction: 'within' });
    dock.getPanel(JD()).api.setActive();
  }
  function textPath(id, key) { return 't/' + id + '/' + (key || here()) + '.json'; }
  /* Load the named texts for the chapter in view, and the draft alignment only while the flag is on. */
  /* Does this text have the book? A text that lists its books has only those (Greek: the NT; Hebrew: the OT). */
  function covers(id, book) {
    var x = manifest && manifest.texts[id], b = x && x.books;
    return !!x && (!b || b.indexOf(book || state.book) >= 0);
  }
  function load(ids) {
    var jobs = (ids || []).filter(function (id) { return covers(id); }).map(function (id) { return getJSON(textPath(id)); });
    if (state.align && covers('grc')) {  /* the draft alignment is New Testament only */
      jobs.push(getJSON('align/' + here() + '.json'));
      jobs.push(getJSON(textPath(J())));
      if (!lexAlign) jobs.push(getJSON('lex.align.json').then(function (d) { lexAlign = d.strongs; }));
    }
    return Promise.all(jobs);
  }
  function text(id) { return cache[textPath(id)] || null; }
  /* One verse of one text: Greek {v, w: [...]}, Japanese [[text, reading]...], English a string; or null. */
  function verse(id, v) {
    var d = text(id);
    if (!d) return null;
    if (d.verses) {
      if (!d.byV) { d.byV = {}; d.verses.forEach(function (x) { d.byV[x.v] = x; }); }
      return d.byV[v] || null;
    }
    return d.v[v] == null ? null : d.v[v];
  }
  function label(id, v) { var d = text(id); return (d && d.lab && d.lab[v]) || ''; }
  function pointer(id, v) { var n = manifest.notes[state.book + '.' + state.ch + '.' + v]; return (n && n[id]) || ''; }
  function lastVerse() { return manifest.books[state.book].verses[state.ch]; }
  function links(v) {
    if (!state.align) return [];
    var a = cache['align/' + here() + '.json'];
    return (a && a.verses[v]) || [];
  }
  function unlinked(v) {
    var a = state.align && cache['align/' + here() + '.json'];
    return (a && a.u && a.u[v]) || {};
  }
  /* What the draft says about Greek word i of verse v: { ja, st, by } for a link shown, { u: 'a' | 'p' | 'w' }
   * for a word shown as unlinked on purpose, or null when the draft has nothing. */
  function linkFor(v, i) {
    var ls = links(v), str = plainJa(v);
    for (var k = 0; k < ls.length; k++) {
      /* a link whose Japanese stands in a neighbouring verse carries its text and says where it is */
      if (ls[k].g.indexOf(i) >= 0) return { ja: ls[k]['in'] ? ls[k].t : ls[k].sp.map(function (p) { return str.slice(p[0], p[1]); }).join('…'), where: ls[k]['in'] || '', st: ls[k].st || 'm', by: ls[k].by || '' };
    }
    var u = unlinked(v)[i];
    if (u) return { u: u };
    /* every article reads the same, whether or not the draft had guessed at it */
    var gv = verse('grc', v), w = gv && gv.w.filter(function (x) { return x.i === i; })[0];
    return w && w.s === 'G3588' ? { u: 'a' } : null;
  }
  function stateText(l) { return l.u ? t('u_' + l.u) : t('st_' + l.st) + (l.by ? ' · ' + l.by : '') + (l.where ? ' · ' + t('inVerse') + ' ' + l.where : ''); }
  function plainJa(v) { var ja = verse(J(), v) || []; return ja.map(function (s) { return s[0]; }).join(''); }
  function jaFor(v, i) {
    var ls = links(v), str = plainJa(v);
    for (var k = 0; k < ls.length; k++) if (ls[k].g.indexOf(i) >= 0) return ls[k].sp.map(function (p) { return str.slice(p[0], p[1]); }).join('…');
    return '';
  }
  function refs(book) { return getJSON('refs/' + book + '.json'); }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bookName(code, short) {
    var b = manifest.books[code || state.book];
    if (short) return state.lang === 'en' ? b.en : b.short;
    return state.lang === 'en' ? b.en : state.lang === 'ja' ? b.ja : b.ja + ' / ' + b.en;
  }
  function say(msg) { $('status').textContent = msg || ''; }
  function fail(e) { say(t('loadFail') + ' ' + (e && e.message || e)); }

  function go() { return route(goIn, arguments); }
  function goIn(book, ch, v, origin) {
    if (!manifest.books[book]) return say(t('notBuilt') + ' ' + book);
    var changed = book !== state.book || ch !== state.ch;
    state.book = book; state.ch = ch; state.v = v || 1;
    if (changed) { state.word = null; en = null; }
    if (view === 'A') store.set('ws.at', [state.book, state.ch, state.v]); else setAt();
    emit(changed ? 'chapter' : 'verse', origin);
    if (changed) originalFront();
    syncChrome();
  }
  function step() { return route(stepIn, arguments); }
  function stepIn(d) {
    var order = manifest.order, n = order.indexOf(state.book), ch = state.ch + d;
    if (ch < 1) { if (n === 0) return; n--; ch = manifest.books[order[n]].chapters; }
    else if (ch > manifest.books[state.book].chapters) { if (n === order.length - 1) return; n++; ch = 1; }
    go(order[n], ch, 1);
  }
  /* Go to one occurrence of a word, in any book, and select it there. */
  function goWord() { return route(goWordIn, arguments); }
  function goWordIn(book, ch, v, i, strong, origin) {
    if (!manifest.books[book]) return say(t('notBuilt') + ' ' + book);
    var changed = book !== state.book || ch !== state.ch;
    state.book = book; state.ch = ch; state.v = v; state.word = v + ':' + i; state.strong = strong;
    if (view === 'A') store.set('ws.at', [book, ch, v]); else setAt();
    emit(changed ? 'chapter' : 'word', origin);
    if (changed) originalFront();
    syncChrome();
    findEnglish();
  }
  function selectVerse() { return route(selectVerseIn, arguments); }
  function selectVerseIn(v, origin) { if (state.v !== v) { state.v = v; if (view === 'A') store.set('ws.at', [state.book, state.ch, v]); else setAt(); emit('verse', origin); } }
  function selectWord() { return route(selectWordIn, arguments); }
  function selectWordIn(v, i, strong, origin) {
    state.v = v; state.word = i ? v + ':' + i : null; state.strong = strong;
    ensurePanel('word');
    emit('word', origin);
    findEnglish();
  }

  /* ---------- verse rendering shared by panels ---------- */
  function rubyHTML(segs) { return segs.map(function (s) { return s[1] ? '<ruby>' + esc(s[0]) + '<rt>' + esc(s[1]) + '</rt></ruby>' : esc(s[0]); }).join(''); }
  function jaHTML(v, segs) {
    var ls = links(v);
    if (!ls.length) return rubyHTML(segs);
    var owner = [];
    ls.forEach(function (l, n) { l.sp.forEach(function (p) { for (var c = p[0]; c < p[1]; c++) owner[c] = n; }); });
    var at = 0, out = '';
    segs.forEach(function (seg) {
      var str = seg[0], inner = '', start = 0;
      for (var c = 1; c <= str.length; c++) {
        if (c === str.length || owner[at + c] !== owner[at + start]) {
          var n = owner[at + start], piece = esc(str.slice(start, c));
          if (n === undefined) inner += piece;
          else {
            var l = ls[n];
            inner += '<span class="jl st-' + (l.st || 'm') + '" title="' + esc(stateText({ st: l.st || 'm', by: l.by })) + '" data-v="' + v + '" data-i="' + l.g[0] + '" data-s="' + esc(l.s[0]) + '" data-g="' +
              l.g.map(function (i) { return v + ':' + i; }).join(' ') + '">' + piece + '</span>';
          }
          start = c;
        }
      }
      out += seg[1] ? '<ruby>' + inner + '<rt>' + esc(seg[1]) + '</rt></ruby>' : inner;
      at += str.length;
    });
    return out;
  }
  /* A verse the SBLGNT does not print is shown from TAGNT, marked, with the editions that carry it. */
  function notSbl(gv) {
    return gv.src === 'tagnt' ? '<span class="ns" title="' + esc(gv.ed) + '">' + (state.lang === 'en' ? 'not in SBLGNT' : 'SBLGNTにない節') + ' · TAGNT</span> ' : '';
  }
  function grHTML(gv) {
    return notSbl(gv) + gv.w.map(function (w) {
      if (!w.i) return esc(w.t);
      return '<span class="gw" data-v="' + gv.v + '" data-i="' + w.i + '" data-s="' + esc(w.s) + '" data-g="' + gv.v + ':' + w.i + '">' + esc(w.t) + '</span>';
    }).join(' ');
  }
  /* The inside of one verse of one text, or a pointer to where its words are, or '' when it has none. */
  function verseHTML(id, v) {
    var info = textInfo(id), x = verse(id, v), lab = label(id, v);
    if (x == null) {
      var p = pointer(id, v);
      return p ? '<span class="vp">' + esc(t('seeVerse') + ' ' + p) + '</span>' : '';
    }
    var body = info.kind === 'greek' ? grHTML(x) : info.kind === 'ruby' ? jaHTML(v, x) : esc(x);
    return (lab ? '<span class="vl">' + esc(lab) + '</span> ' : '') + body;
  }
  function textInfo(id) { return manifest.texts[id]; }
  function textName(id) {
    var i = textInfo(id);
    return state.lang === 'en' ? i.en : state.lang === 'ja' ? i.ja : (i.ja === i.en ? i.ja : i.ja + ' · ' + i.en);
  }
  function textClass(id) { var i = textInfo(id); return i.lang === 'ja' ? 't-ja' : i.lang === 'grc' ? 't-gr' : 't-en'; }

  /* The BSB words that render the Greek word in view, from the Berean translation tables (the Word Study data).
   * Marked in the BSB verse only when the phrase stands there exactly once and inside one run of text; otherwise
   * nothing is marked, since a wrong mark is worse than none. */
  var en = null;
  function findEnglish() {
    en = null;
    var s = state.strong, e = s && lex[s], w = state.word;
    if (!w || !e || !e.w) return;
    var want = here() + '|' + w;
    getJSON('ws/' + e.w + '.json').then(function (d) {
      if (want !== here() + '|' + state.word || !d[s]) return;
      var p = w.split(':'), b = (manifest.texts.grc.books || manifest.order).indexOf(state.book), o = d[s].o, r = d[s].r.BSB;  /* Word Study files count books in New Testament order */
      for (var k = 0; k < o.length; k++) {
        if (o[k][0] === b && o[k][1] === state.ch && o[k][2] === +p[0] && o[k][3] === +p[1]) {
          if (r.x[k] >= 0) { en = { v: +p[0], text: r.t[r.x[k]].replace(/[\[\]{}]/g, '').replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, '') }; emit('en'); }
          return;
        }
      }
    }).catch(function () { /* no Word Study data in this build: no mark */ });
  }
  function markEnglish(root) {
    root.querySelectorAll('mark.enhit').forEach(function (m) { var par = m.parentNode; par.replaceChild(document.createTextNode(m.textContent), m); par.normalize(); });
    if (!en || !en.text) return;
    var rx = new RegExp('(^|[^A-Za-z])(' + en.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![A-Za-z])', 'i');
    root.querySelectorAll('[data-text="bsb"][data-verse="' + en.v + '"]').forEach(function (el) {
      var all = el.textContent, first = rx.exec(all);
      if (!first || rx.test(all.slice(first.index + first[0].length))) return;   /* absent, or there twice */
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), node;
      while ((node = walker.nextNode())) {
        var m = rx.exec(node.nodeValue);
        if (!m || (node.parentNode.closest && node.parentNode.closest('.vn,.tl,.vl'))) continue;
        var hit = node.splitText(m.index + m[1].length);
        hit.splitText(m[2].length);
        var mark = document.createElement('mark');
        mark.className = 'enhit';
        hit.parentNode.replaceChild(mark, hit);
        mark.appendChild(hit);
        return;
      }
    });
  }
  function paint(root) {
    root.querySelectorAll('.hit,.same').forEach(function (n) { n.classList.remove('hit', 'same'); });
    if (state.strong) root.querySelectorAll('.gw[data-s="' + state.strong + '"],.iw[data-s="' + state.strong + '"]').forEach(function (n) { n.classList.add('same'); });
    if (state.word) root.querySelectorAll('[data-g~="' + state.word + '"]').forEach(function (n) { n.classList.add('hit'); });
    root.querySelectorAll('.cur').forEach(function (n) { n.classList.remove('cur'); });
    root.querySelectorAll('[data-verse="' + state.v + '"]').forEach(function (n) { n.classList.add('cur'); });
    markEnglish(root);
  }
  function reveal(root) {
    var n = root.querySelector('[data-verse="' + state.v + '"]') || root.querySelector('.cur');
    if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
  }
  function wireClicks(root, self) {
    root.addEventListener('click', function (ev) {
      var w = ev.target.closest('[data-i]');
      if (w) { selectWord(+w.dataset.v, +w.dataset.i, w.dataset.s, self); return; }
      var v = ev.target.closest('[data-verse]');
      if (v) selectVerse(+v.dataset.verse, self);
    });
  }

  /* ---------- panels ----------
   * build(el, params, self) returns { texts(): ids to load, render(), onWord: redraw on a word pick,
   * ready(): an extra promise to wait for, paint(): extra marking after the verse in view changes }. The core loads, then calls render, and drops a load that
   * finishes after the reader has already moved on. */
  var COMPONENTS = {}, ITEMS = [], ITEM = {};
  function makePanel(build) {
    return function () {
      var el = document.createElement('div');
      el.className = 'pane';
      el.tabIndex = 0;  /* a scrolling region must be reachable by keyboard */
      var self = {}, off = null, api = null, pid = null;
      function mine() { return setOf(pid); }
      function refresh(origin, quiet) {
        var s = mine();
        use(s, function () {
          el.dataset.set = s;
          var want = here() + '|' + state.align;
          var jobs = [load(api.texts ? api.texts() : [])];
          if (api.ready) jobs.push(api.ready());
          Promise.all(jobs).then(function () {
            use(s, function () {
              if (want !== here() + '|' + state.align || s !== mine()) return;
              api.render();
              paint(el);
              if (api.paint) api.paint();
              if (!quiet && origin !== self) reveal(el);
            });
          }).catch(fail);
        });
      }
      return {
        element: el,
        init: function (p) {
          pid = p.api.id;
          api = build(el, p.params || {}, self);
          wireClicks(el, self);
          refresh(null, true);
          off = on(function (kind, origin, from) {
            var s = mine();
            if (kind === 'set') { if (origin === pid) refresh(null, true); return; }
            if ((kind === 'chapter' || kind === 'verse') && (from || 'A') !== s) return;  /* another link set moved */
            use(s, function () {
              if (kind === 'chapter' || kind === 'align' || (api.onWord && kind === 'word')) refresh(origin);
              else if (kind === 'lang') refresh(origin, true);
              else { paint(el); if (api.paint) api.paint(); if (origin !== self) reveal(el); }
            });
          });
        },
        dispose: function () { if (off) off(); if (api && api.dispose) api.dispose(); }
      };
    };
  }
  /* Register a library item. def: { id, component, params, title (a T key or {en, ja}), build, group } */
  function panel(def) {
    if (def.build) COMPONENTS[def.component] = makePanel(def.build);
    if (def.component === 'bible' || def.component === 'greek' || def.component === 'hebrew') def.sets = true;  /* these can follow link set B or C */
    ITEMS.push(def); ITEM[def.id] = def;
  }
  function itemName(id) {
    var d = ITEM[id];
    if (d.text) return textName(d.text);
    if (typeof d.title === 'string') return t(d.title);
    return state.lang === 'en' ? d.title.en : state.lang === 'ja' ? d.title.ja : d.title.ja + ' · ' + d.title.en;
  }
  function title(id) {
    var d = ITEM[id], one = narrow() && state.lang === 'both';  /* a phone tab has room for one language */
    var name = !one ? itemName(id) : d.text ? textInfo(d.text).ja : typeof d.title === 'string' ? T[d.title].ja : d.title.ja;
    return d.sets ? name : name + ' · A';  /* a panel that can change set shows its letter on a button in the tab */
  }

  /* The tab: a title and a mouse-only x. Dockview's own tab nests a focusable button inside role=tab, which
   * screen readers cannot reach reliably, so the close control here is not focusable and Delete does the same. */
  function makeTab() {
    var el = document.createElement('div'), off = null;
    el.className = 'tab';
    return {
      element: el,
      init: function (p) {
        el.dataset.panel = p.api.id;
        var name = document.createElement('span'), x = document.createElement('span');
        name.textContent = p.title || p.api.title || '';
        x.className = 'tabx'; x.textContent = '×'; x.setAttribute('aria-hidden', 'true');
        x.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
        x.addEventListener('click', function (ev) { ev.stopPropagation(); p.api.close(); });
        el.appendChild(name);
        var id = p.api.id;
        if (ITEM[id] && ITEM[id].sets) {
          /* the link set letter: a click moves the panel to the next set (A, B, C). Not focusable, like the x; the
           * command box does the same by keyboard ("set B"). */
          var b = document.createElement('span');
          /* the letter is drawn by CSS (.tabset::after), so the tab's visible text is its title, the same as the name
           * dockview gives it (aria-label); a letter in the text made the two differ for screen readers */
          b.className = 'tabset'; b.dataset.set = setOf(id);
          b.title = t('setHint');
          b.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
          b.addEventListener('click', function (ev) { ev.stopPropagation(); cycleSet(id); b.dataset.set = setOf(id); });
          el.appendChild(b);
        }
        el.appendChild(x);
        off = p.api.onDidTitleChange(function (e) { name.textContent = e.title; });
      },
      dispose: function () { if (off) off.dispose(); }
    };
  }

  function setPanelSet(id, s) {
    if (!ITEM[id] || !ITEM[id].sets || !SETS.hasOwnProperty(s)) return;
    if (s !== 'A' && !SETS[s]) SETS[s] = view === 'A' ? snap() : SETS.A;  /* a new set starts where A is */
    var m = store.get('ws.psets', {}); if (s === 'A') delete m[id]; else m[id] = s; store.set('ws.psets', m);
    active = s; emit('set', id); syncChrome();
    document.querySelectorAll('.tab[data-panel="' + id + '"] .tabset').forEach(function (b) { b.dataset.set = s; });
    say(t('setNow').replace('{p}', itemName(id)).replace('{s}', s));
  }
  function cycleSet(id) { var s = setOf(id); setPanelSet(id, s === 'A' ? 'B' : s === 'B' ? 'C' : 'A'); }

  /* ---------- layouts ---------- */
  var LAYOUT_VERSION = 3;  /* raise when panel ids or components change, so an old saved layout is not loaded */
  var dock = null, applying = false, currentLayout = store.get('ws.layoutName', 'nichiei');
  function add(id, position) {
    var it = ITEM[id];
    return dock.addPanel({ id: id, component: it.component, params: it.params || {}, title: title(id), position: position });
  }
  function ensurePanel(id) {
    var p = dock.getPanel(id);
    if (p) { if (!p.api.isActive && id !== 'word') p.api.setActive(); else if (id === 'word' && !p.api.isVisible) p.api.setActive(); return p; }
    var g = dock.activeGroup;
    return add(id, id === 'word' && dock.panels.length ? { referencePanel: dock.panels[dock.panels.length - 1].id, direction: narrow() ? 'below' : 'right' } : (g ? { referenceGroup: g.id } : undefined));
  }
  /* The original language follows the book. In an Old Testament chapter the Hebrew stands in front where the Greek
   * would, so a reader never lands on the "New Testament only" note first (on a phone the Greek is a tab of the top
   * tile); back in the New Testament the Greek comes to the front again. A layout with a Greek panel and no Hebrew
   * gets a Hebrew tab beside the Greek once. Only the tab in front of that group changes; the panel the reader was
   * in keeps the focus. */
  function originalFront() {
    if (!dock || !ITEM.hebrew || !manifest) return;
    var g = dock.getPanel('greek'), h = dock.getPanel('hebrew'), ot = !covers('grc') && covers('hbo');
    if (!g) return;
    var was = dock.activePanel, front = g.group.activePanel;
    if (ot && !h) {
      h = dock.addPanel({ id: 'hebrew', component: 'hebrew', params: {}, title: title('hebrew'),
        position: { referencePanel: 'greek', direction: 'within' }, inactive: true });
      var at = g.group.panels.indexOf(g);   /* just before the Greek tab, so on a phone it is not left in the overflow */
      if (h.group === g.group && at >= 0 && h.api.moveTo) h.api.moveTo({ group: g.group, index: at });
    }
    var want = !h || h.group !== g.group ? front : ot && front === g ? h : !ot && front === h ? g : front;
    if (want && dock.getPanel(want.id) && want.group.activePanel !== want) want.api.setActive();
    if (was && was !== want && dock.getPanel(was.id) && dock.activePanel !== was) was.api.setActive();
  }
  var DEFAULTS = {
    nichiei: function () {
      addJa(); add('greek', { referencePanel: JD(), direction: 'right' });
      add('bsb', { referencePanel: 'greek', direction: 'right' }); add('word', { referencePanel: 'bsb', direction: 'below' });
    },
    /* Passage study: Bible, commentary, details */
    passage: function () {
      add('bsb'); addJa({ referencePanel: 'bsb', direction: 'within' });
      add('parallel', { referencePanel: 'bsb', direction: 'within' });
      add('commentary', { referencePanel: 'bsb', direction: 'right' });
      add('word', { referencePanel: 'commentary', direction: 'right' });
      add('notes', { referencePanel: 'word', direction: 'below' });
      dock.getPanel('bsb').api.setActive();
    },
    /* Guided study: the guide beside the text, the Greek, cross references and notes */
    guided: function () {
      add('guide'); addJa({ referencePanel: 'guide', direction: 'right' });
      add('greek', { referencePanel: JD(), direction: 'within' });
      add('xrefs', { referencePanel: JD(), direction: 'below' }); add('notes', { referencePanel: 'xrefs', direction: 'within' });
      dock.getPanel(JD()).api.setActive(); dock.getPanel('xrefs').api.setActive();
    },
    /* Word study: Bible, Word Study, lexicon */
    word: function () {
      add('greek'); add('word', { referencePanel: 'greek', direction: 'right' });
      add('lexicon', { referencePanel: 'word', direction: 'right' });
      addJa({ referencePanel: 'greek', direction: 'below' }); add('notes', { referencePanel: JD(), direction: 'within' });
      dock.getPanel(JD()).api.setActive();
    }
  };
  /* Phone: the same panels as tabs in two stacked tiles (texts above, study below), as Logos and AndBible do.
   * A phone layout is saved under its own key so it never overwrites the desktop arrangement. */
  var PHONE_ = {
    nichiei: [['@ja', 'greek', 'bsb'], ['word', 'notes']],
    passage: [['bsb', '@ja', 'parallel'], ['commentary', 'word', 'notes']],
    word: [['greek', '@ja'], ['word', 'lexicon', 'notes']],
    guided: [['guide', '@ja', 'greek'], ['xrefs', 'notes', 'word']]
  };
  var PHONE = {};
  function phoneRows(name) {
    return PHONE_[name].map(function (ids) {
      var row = [];
      ids.forEach(function (id) { if (id !== '@ja') row.push(id); else { row.push(JD()); if (JD() !== J()) row.push(J()); } });
      return row;
    });
  }
  function layoutKey(name) { return 'ws.layout.' + name + (narrow() ? '.phone' : ''); }
  function phoneLayout(name) {
    PHONE[name] = phoneRows(name);
    PHONE[name].forEach(function (ids, row) {
      ids.forEach(function (id, n) {
        add(id, n ? { referencePanel: ids[0], direction: 'within' } : (row ? { referencePanel: PHONE[name][0][0], direction: 'below' } : undefined));
      });
      dock.getPanel(ids[0]).api.setActive();
    });
  }
  function applyLayout(name, fresh) {
    applying = true;
    currentLayout = name; store.set('ws.layoutName', name);
    var saved = fresh ? null : store.get(layoutKey(name), null);
    dock.clear();
    var ok = false;
    if (saved) { try { dock.fromJSON(saved); ok = dock.panels.length > 0 && dock.panels.every(function (p) { return ITEM[p.id] && (!ITEM[p.id].text || manifest.texts[ITEM[p.id].text]); }); } catch (e) { ok = false; } }
    if (!ok) { dock.clear(); (narrow() ? phoneLayout : DEFAULTS[name])(name); }
    originalFront();
    applying = false;
    retitle();
    if (!ok) store.set(layoutKey(name), dock.toJSON());
  }
  function retitle() { dock.panels.forEach(function (p) { if (ITEM[p.id]) p.api.setTitle(title(p.id)); }); }

  /* ---------- chrome ---------- */
  var GROUPS = [['texts', { en: 'Bibles', ja: '聖書' }], ['original', { en: 'Original language', ja: '原語' }],
    ['study', { en: 'Study', ja: '研究' }], ['about', { en: 'About', ja: 'このページ' }]];
  function syncChrome() { return use(active, syncChromeIn); }
  function syncChromeIn() {
    var bn = document.getElementById('brandName'); if (bn) bn.textContent = state.lang === 'en' ? 'Word of God Workshop' : 'みことば工房';
    var bs = document.getElementById('brandSub'); if (bs) bs.textContent = state.lang === 'en' ? 'Study Workspace (prototype)' : 'ワークスペース（試作）';
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'ja';
    $('cmdBox').placeholder = t('cmd');
    [['railToggle', 'a_rail'], ['cmdBox', 'a_cmd'], ['prevCh', 'a_prev'], ['nextCh', 'a_next'], ['langSeg', 'a_lang'], ['layoutPick', 'layout'],
      ['notices', 'a_notices'], ['rail', 'a_nav']].forEach(function (x) { $(x[0]).setAttribute('aria-label', t(x[1])); });
    document.documentElement.classList.toggle('noruby', !store.get('ws.ruby', true));
    $('chLabel').textContent = bookName(null, narrow()) + ' ' + state.ch + ':' + state.v + (active !== 'A' ? ' · ' + active : '');
    $('layLabel').textContent = t('layout');
    $('flagLabel').textContent = t('flag');
    var big = document.documentElement.classList.contains('owsbig');
    $('bigText').querySelector('.lbl').textContent = t(big ? 'bigOff' : 'big');
    $('bigText').setAttribute('aria-label', t(big ? 'bigOff' : 'big')); $('bigText').setAttribute('aria-pressed', String(big));
    $('draftBanner').hidden = !state.align || !covers('grc');  /* the draft alignment is New Testament only: no banner on an Old Testament chapter */ $('draftBanner').textContent = t(window.WS_SITE ? 'bannerSite' : 'banner');
    document.querySelectorAll('#langSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)); });
    var pick = $('layoutPick');
    pick.innerHTML = ['nichiei', 'passage', 'word', 'guided'].map(function (n) { return '<option value="' + n + '">' + esc(t('L_' + n)) + '</option>'; }).join('');
    pick.value = currentLayout;
    var b = manifest.books[state.book], grid = '';
    for (var c = 1; c <= b.chapters; c++) grid += '<button data-ch="' + c + '"' + (c === state.ch ? ' aria-current="true"' : '') + ' aria-label="' + esc(b.en + ' ' + c) + '">' + c + '</button>';
    var lib = GROUPS.map(function (g) {
      var items = ITEMS.filter(function (i) { return i.group === g[0] && (!i.text || manifest.texts[i.text]); });  // a text left out of this build has no entry
      if (!items.length) return '';
      return '<div class="small">' + esc(state.lang === 'en' ? g[1].en : state.lang === 'ja' ? g[1].ja : g[1].ja + ' · ' + g[1].en) + '</div>' +
        items.map(function (i) { return '<button class="item" data-open="' + i.id + '">' + esc(itemName(i.id)) + '</button>'; }).join('');
    }).join('');
    /* On the website the rail also lists the single tools, so the workspace and the tools share one navigation. */
    var site = window.WS_SITE, q = state.lang === 'en' ? '?lang=en' : '?lang=ja';
    var homeBtn = !site ? '' : '<a class="item homebtn" href="' + site.home + q + '">' + (site.house || '') + '<span>' + esc(t('siteHome')) + '</span></a>';
    var tools = !site ? '' : '<h2>' + esc(t('siteTools')) + '</h2>' + site.tools.map(function (x) {
        return '<a class="item" href="' + site.home + x[0] + '/' + q + '">' + esc(state.lang === 'en' ? x[1] : state.lang === 'ja' ? x[2] : x[2] + ' · ' + x[1]) + '</a>';
      }).join('');
    $('rail').innerHTML = homeBtn + '<h2>' + esc(t('library')) + '</h2>' + lib +
      '<h2>' + esc(t('book')) + '</h2><select id="bookPick" aria-label="' + esc(t('book')) + '">' + manifest.order.map(function (code) {
        return '<option value="' + code + '"' + (code === state.book ? ' selected' : '') + '>' + esc(bookName(code)) + '</option>';
      }).join('') + '</select><div class="chgrid" role="group" aria-label="' + esc(t('chapters')) + '">' + grid + '</div>' +
      '<h2>' + esc(t('display')) + '</h2><button class="item" data-ruby="1" aria-pressed="' + !!store.get('ws.ruby', true) + '">' +
        esc(t('ruby') + '：' + t(store.get('ws.ruby', true) ? 'rubyOn' : 'rubyOff')) + '</button>' +
      '<h2>' + esc(t('guides')) + '</h2><div class="small">' + esc(t('guidesSoon')) + '</div>' +
      '<h2>' + esc(t('notes')) + '</h2><button class="item" data-open="notes">' + esc(t('notes')) + '</button>' +
      '<h2>' + esc(t('layouts')) + '</h2>' + ['nichiei', 'passage', 'word', 'guided'].map(function (n) { return '<button class="item" data-layout="' + n + '">' + esc(t('L_' + n)) + '</button>'; }).join('') +
      '<button class="item" data-reset="1">' + esc(t('reset')) + '</button>' + tools;
  }
  /* The review states of the chapter in view, counted, so the reader sees how much of it a person has checked. */
  function legend() {
    var box = $('alignLegend'), a = state.align && cache['align/' + here() + '.json'];
    box.hidden = !a;
    if (!a) return;
    var c = a.count || {}, held = (c.a || 0) + (c.p || 0) + (c.w || 0);
    var part = function (cls, key, n) { return '<span class="lg ' + cls + '"><span class="jl st-' + cls + '">' + esc(t(key)) + '</span> ' + n + '</span>'; };
    box.innerHTML = '<b>' + esc(t('legend')) + '</b> ' + part('m', 'lg_m', c.m || 0) + part('q', 'lg_q', c.q || 0) +
      part('ok', 'lg_ok', c.ok || 0) + (c.un ? part('un', 'lg_un', c.un) : '') + '<span class="lg">' + esc(t('lg_u')) + ' ' + held + '</span>';
  }
  function setAlign(onNow) {
    state.align = onNow;
    $('alignFlag').checked = onNow;
    syncChrome(); emit('align');
    load([]).then(legend).catch(fail);
  }

  /* ---------- command box ---------- */
  function nameKey(s) { return s.normalize('NFKC').toLowerCase().replace(/[\s.。・の]/g, ''); }
  function bare(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ'); }
  /* "John 3:16", "ヨハネ 3:16", "1コリント13章4節", "第一コリント 13:4", "3:16", "16" (a chapter), "Jude 5" (a verse) */
  function parseRef(q) {
    var m = q.normalize('NFKC').match(/^(.*?)(\d+)(?:\s*[:.章,、]\s*(\d+))?\s*節?$/);
    if (!m) return null;
    var name = nameKey(m[1]), book = name ? manifest.alias[name] : state.book;
    if (!book) return name ? { unknown: m[1].trim() } : null;
    var b = manifest.books[book], ch = +m[2], v = +m[3] || 0;
    if (b.chapters === 1 && !m[3]) { v = ch; ch = 1; }
    if (ch < 1 || ch > b.chapters) return { unknown: q };
    return { book: book, ch: ch, v: Math.max(1, Math.min(v || 1, b.verses[ch])) };
  }
  function command(raw) {
    var q = raw.trim();
    if (!q) return;
    say('');
    var ls = q.normalize('NFKC').match(/^(?:set|セット)\s*([ABCabc])$/);
    if (ls) {
      var ap = dock && dock.activePanel;
      if (!ap || !ITEM[ap.id] || !ITEM[ap.id].sets) return say(t('setNone'));
      return setPanelSet(ap.id, ls[1].toUpperCase());
    }
    var m = q.normalize('NFKC').match(/^[Gg]\s?(\d{1,4})([A-Za-z]?)$/);
    if (m) {
      var base = 'G' + ('0000' + m[1]).slice(-4), key = lex[base + m[2].toUpperCase()] ? base + m[2].toUpperCase() : Object.keys(lex).filter(function (k) { return k.indexOf(base) === 0; })[0];
      if (!key) return say(t('notFound') + ' ' + q);
      return selectWord(state.v, null, key);
    }
    var r = parseRef(q);
    if (r && r.book) return go(r.book, r.ch, r.v);
    if (r && r.unknown && /\d/.test(q)) return say(t('notFound') + ' ' + r.unknown);
    var bookOnly = manifest.alias[nameKey(q)];
    if (bookOnly) return go(bookOnly, 1, 1);
    var nq = bare(q), hits = Object.keys(lex).filter(function (k) {
      var e = lex[k];
      return bare(e.l) === nq || e.g.toLowerCase().split(/[\/,; ]+/).indexOf(nq) >= 0 ||
        (state.align && lexAlign && lexAlign[k] && lexAlign[k].r.some(function (x) { return x.ja === q; }));
    }).sort(function (a, b) { return lex[b].n - lex[a].n; });
    if (!hits.length) {
      /* not a place, a number or a Greek word: look for it in the text, Japanese in the 口語訳, anything else in the BSB */
      if (api.search) return api.search(q, /[\u3040-\u30ff\u3400-\u9fff]/.test(q) ? J() : 'bsb');
      return say(t('notFound') + ' ' + q);
    }
    selectWord(state.v, null, hits[0]);
    if (hits.length > 1) say(hits.length + ' ' + t('found') + ' ' + lex[hits[0]].l + ' (' + hits.slice(0, 8).join(', ') + ')');
  }

  /* ---------- start ---------- */
  function begin() {
    if (store.get('ws.v', 0) !== LAYOUT_VERSION) {
      store.keys().forEach(function (k) { if (k.indexOf('ws.layout.') === 0) store.drop(k); });
      store.set('ws.v', LAYOUT_VERSION);
    }
    currentLayout = store.get('ws.layoutName', currentLayout);   /* a shared study link may have chosen one */
    var at = store.get('ws.at', null);
    if (at && manifest.books[at[0]] && at[1] <= manifest.books[at[0]].chapters) { state.book = at[0]; state.ch = at[1]; state.v = at[2] || 1; }
    ['B', 'C'].forEach(function (k) {
      var o = store.get('ws.set.' + k, null);
      if (o && manifest.books[o.book] && o.ch <= manifest.books[o.book].chapters) SETS[k] = { book: o.book, ch: o.ch, v: o.v || 1, word: null };
    });
    /* Which set an action belongs to: the pane it happens in, or for the top bar the set of the pane used last. */
    var setFrom = function (tg) {
      var pane = tg && tg.closest && tg.closest('.pane[data-set]');
      if (pane) return pane.dataset.set;
      return tg && tg.closest && tg.closest('#cmd, #prevCh, #nextCh, #rail') ? active : 'A';
    };
    ['click', 'keydown', 'change', 'submit', 'input'].forEach(function (type) {
      document.addEventListener(type, function (ev) { routeSet = setFrom(ev.target); setTimeout(function () { routeSet = 'A'; }, 0); }, true);
    });
    ['pointerdown', 'focusin'].forEach(function (type) {
      document.addEventListener(type, function (ev) {
        var pane = ev.target.closest && ev.target.closest('.pane[data-set]');
        if (pane && pane.dataset.set !== active) { active = pane.dataset.set; syncChrome(); }
      }, true);
    });
    $('flagWrap').hidden = !manifest.alignment.present;   /* a build without the draft has no switch for it */
    /* A build may ask for the draft to be showing from the start (a private preview for its reviewers). The banner,
     * the legend and the review state of every link still show; the choice is never saved. */
    if (manifest.alignment.present && manifest.alignment.default === 'on') { state.align = true; $('alignFlag').checked = true; }
    var theme = document.documentElement.getAttribute('data-theme');   /* a host may set the theme itself */
    var dark = theme ? theme === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    dock = DV.createDockview($('dock'), {
      theme: dark ? DV.themeDark : DV.themeLight,
      createComponent: function (o) { return COMPONENTS[o.name](); },
      defaultTabComponent: 'tab',
      createTabComponent: function () { return makeTab(); }
    });
    api.dock = dock;
    /* Delete on a focused tab closes it (the x in the tab is for the mouse; the rail reopens anything). */
    $('dock').addEventListener('keydown', function (ev) {
      if (ev.key !== 'Delete') return;
      var tab = ev.target.closest && ev.target.closest('.dv-tab'), mine = tab && tab.querySelector('[data-panel]');
      var p = mine && dock.getPanel(mine.dataset.panel);
      if (p) p.api.close();
    });
    var setRail = function () { $('rail').hidden = narrow(); $('railToggle').setAttribute('aria-expanded', String(!narrow())); };
    setRail();
    narrowQ.addEventListener('change', function () { setRail(); applyLayout(currentLayout); syncChrome(); });
    dock.onDidLayoutChange(function () { if (!applying) store.set(layoutKey(currentLayout), dock.toJSON()); });
    syncChrome();
    applyLayout(currentLayout);

    $('cmd').addEventListener('submit', function (ev) { ev.preventDefault(); command($('cmdBox').value); });
    $('prevCh').addEventListener('click', function () { step(-1); });
    $('nextCh').addEventListener('click', function () { step(1); });
    $('langSeg').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-lang]'); if (!b) return;
      state.lang = b.dataset.lang; store.set('ws.lang', state.lang);
      // the other site pages read this key, so the language carries over between them and the workspace
      try { if (state.lang !== 'both') localStorage.setItem('ows-lang', state.lang); } catch (e) {}
      syncChrome(); retitle(); emit('lang');
    });
    $('layoutPick').addEventListener('change', function (ev) { applyLayout(ev.target.value); });
    $('alignFlag').addEventListener('change', function (ev) { setAlign(ev.target.checked); });
    // the same key and class as the Larger text button on the other site pages, so the choice carries over
    $('bigText').addEventListener('click', function () {
      var on = document.documentElement.classList.toggle('owsbig');
      try { localStorage.setItem('ows-text', on ? 'large' : 'normal'); } catch (e) { /* private window */ }
      syncChrome(); if (dock) dock.layout(dock.width, dock.height);
    });
    $('railToggle').addEventListener('click', function () {
      var r = $('rail'); r.hidden = !r.hidden; $('railToggle').setAttribute('aria-expanded', String(!r.hidden));
    });
    $('rail').addEventListener('change', function (ev) { if (ev.target.id === 'bookPick') go(ev.target.value, 1, 1); });
    $('rail').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.open) { var p = ensurePanel(b.dataset.open); if (p) p.api.setActive(); }
      else if (b.dataset.ch) go(state.book, +b.dataset.ch, 1);
      else if (b.dataset.layout) { applyLayout(b.dataset.layout); syncChrome(); }
      else if (b.dataset.reset) applyLayout(currentLayout, true);
      else if (b.dataset.ruby) { store.set('ws.ruby', !store.get('ws.ruby', true)); syncChrome(); return; }
      if (narrow() && !b.dataset.ch) { $('rail').hidden = true; $('railToggle').setAttribute('aria-expanded', 'false'); }
    });
    on(function (kind, o, from) { if ((kind === 'chapter' && (from || 'A') === 'A') || kind === 'lang') use('A', function () { load([]).then(legend).catch(fail); }); });
    on(function (kind, o, from) { if ((kind === 'verse' || kind === 'word') && (from || 'A') === active) syncChrome(); });
    if (state.align) load([]).then(legend).catch(fail);
  }
  function start() {
    $('alignFlag').checked = false;
    Promise.all([getJSON('manifest.json'), getJSON('lex.json'), getJSON('morph.json')]).then(function (r) {
      manifest = r[0]; lex = r[1]; morph = r[2];
      api.manifest = manifest; api.lex = lex; api.morph = morph;
      begin();
    }).catch(function (e) {
      say('Data not found. Run: python3 scripts/build_workspace.py (' + (e.message || e) + ')');
    });
  }

  var api = {
    ja: J, state: state, store: store, T: T, t: t, on: on, emit: emit, esc: esc, $: $, narrow: narrow,
    getJSON: getJSON, load: load, text: text, verse: verse, label: label, pointer: pointer, lastVerse: lastVerse,
    covers: covers, use: use, setOf: setOf, setPanelSet: setPanelSet, links: links, plainJa: plainJa, jaFor: jaFor, linkFor: linkFor, stateText: stateText, refs: refs, lexAlign: function () { return lexAlign; },
    bookName: bookName, textName: textName, textInfo: textInfo, textClass: textClass, verseHTML: verseHTML, notSbl: notSbl,
    go: go, goWord: goWord, selectVerse: selectVerse, selectWord: selectWord, setAlign: setAlign, command: command, parseRef: parseRef,
    panel: panel, ensurePanel: ensurePanel, itemName: itemName, say: say, start: start, gram: gram
  };
  window.workspace = api;  /* for tests and the console */
  return api;
})();
