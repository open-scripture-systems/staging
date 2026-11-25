/* Grammar terms: the Greek grammar labels the workspace shows (未完了過去, 中動態 ...), each with a one-line plain
 * explanation in Japanese and English and the places in the chapter in view where a word carries that label.
 * Clicking an example selects that word, so Word Study and the word card follow.
 *
 * The explanations are our own short wording of what any beginning Greek grammar teaches. They are a draft that a
 * teacher has not checked yet, and the panel says so. They describe forms, not what a verse means: a tense label
 * alone does not settle how an action is to be read; the context does.
 * Data: the workspace's SBLGNT words with TAGNT tags (already loaded for the Greek panel). Nothing new is fetched. */
(function () {
  var state = WS.state, esc = WS.esc;
  function L(x) { return state.lang === 'en' ? x.en : x.ja; }
  var S = {
    title: { en: 'Grammar terms', ja: '文法用語' },
    draft: { en: 'Draft: these short explanations have not yet been checked by a teacher. A label describes the form of a word; the context decides how it is read.',
      ja: '下書き：この短い説明は、まだ先生の確認を受けていません。文法の表示は語の形を示すもので、どう読むかは文脈が決めます。' },
    here: { en: 'In this chapter', ja: 'この章' }, none: { en: 'not in this chapter', ja: 'この章にはありません' },
    filter: { en: 'Find a term', ja: '用語を探す' }, v: { en: 'v.', ja: '節' }, more: { en: 'more', ja: 'ほか' }
  };
  /* field in the morph data, value, and the plain explanation */
  var GROUPS = [
    { h: { en: 'Tense', ja: '時制' }, f: 'tense', terms: [
      ['present', { ja: '動作を続いているもの、くり返されるものとして示すことが多い形。時は文脈で決まります。', en: 'Often presents an action as ongoing or repeated; the time is set by the context.' }],
      ['imperfect', { ja: '過去の動作を、続いていた、くり返されていたものとして描く形。', en: 'Pictures a past action as ongoing or repeated.' }],
      ['aorist', { ja: '動作を一つのまとまりとして、全体を外から見るように示す形。直説法ではふつう過去を表します。「一回だけ」という意味ではありません。', en: 'Presents an action as a whole, seen from outside. In the indicative it usually refers to the past. It does not mean "once only".' }],
      ['future', { ja: 'これから起こる動作を示す形。', en: 'Refers to an action still to come.' }],
      ['perfect', { ja: '過去に終わった動作と、その結果が今も続いていることを示す形。', en: 'A completed action whose result still stands.' }],
      ['pluperfect', { ja: '過去のある時点で、すでに終わっていた動作とその結果を示す形。', en: 'An action completed before a past point, with its result at that point.' }]
    ] },
    { h: { en: 'Voice', ja: '態' }, f: 'voice', terms: [
      ['active', { ja: '主語が動作をする形。', en: 'The subject does the action.' }],
      ['middle', { ja: '主語が自分のために、または自分に関わるように動作する形。日本語にそのまま当たる形はありません。', en: 'The subject acts for itself or is involved in the action. Japanese has no exact match.' }],
      ['passive', { ja: '主語が動作を受ける形。動作する者が書かれていないこともあります。', en: 'The subject receives the action; the one acting may not be named.' }],
      ['middle or passive', { ja: '中動態と受動態が同じ形で、どちらかは文脈で決まります。', en: 'Middle and passive share this form; the context decides which.' }],
      ['middle deponent', { ja: '中動態の形で、意味は能動の動詞（異態動詞）。', en: 'Middle in form, active in meaning (a deponent verb).' }],
      ['passive deponent', { ja: '受動態の形で、意味は能動の動詞（異態動詞）。', en: 'Passive in form, active in meaning (a deponent verb).' }],
      ['middle or passive deponent', { ja: '中動態または受動態の形で、意味は能動の動詞（異態動詞）。', en: 'Middle or passive in form, active in meaning (a deponent verb).' }]
    ] },
    { h: { en: 'Mood', ja: '法' }, f: 'mood', terms: [
      ['indicative', { ja: '事実として述べる形。問いにも使います。', en: 'States something as a fact; also used in questions.' }],
      ['subjunctive', { ja: '起こりうること、願い、目的、勧めを示す形。', en: 'What may happen: purpose, wish, exhortation, some conditions.' }],
      ['optative', { ja: '願いや、より遠い可能性を示す形。新約ではまれです。', en: 'A wish or a more remote possibility; rare in the New Testament.' }],
      ['imperative', { ja: '命令や願いを示す形。', en: 'A command or a request.' }],
      ['infinitive', { ja: '動詞の名詞のような形（〜すること）。', en: 'A verbal noun ("to do").' }],
      ['participle', { ja: '動詞の形容詞のような形（〜している、〜した）。修飾にも、時や理由を表すのにも使います。', en: 'A verbal adjective ("doing", "having done"); it can describe or tell when, why or how.' }]
    ] },
    { h: { en: 'Case', ja: '格' }, f: 'case', terms: [
      ['nominative', { ja: '主語や、主語を説明する語の形（〜が、〜は）。', en: 'The subject, or a word that renames the subject.' }],
      ['genitive', { ja: '所有、出どころ、関係などを示す形（〜の）。', en: 'Possession, source, relationship ("of").' }],
      ['dative', { ja: '相手、手段、場所などを示す形（〜に、〜で）。', en: 'The one to or for whom, the means, the place ("to", "by", "in").' }],
      ['accusative', { ja: '直接目的語などの形（〜を）。', en: 'The direct object, and some other uses.' }],
      ['vocative', { ja: '呼びかけの形（〜よ）。', en: 'Direct address.' }]
    ] },
    { h: { en: 'Person and number', ja: '人称と数' }, f: null, terms: [
      ['first', { ja: '話し手（わたし、わたしたち）。', en: 'The speaker (I, we).' }, 'person'],
      ['second', { ja: '聞き手（あなた、あなたがた）。', en: 'The one addressed (you).' }, 'person'],
      ['third', { ja: 'それ以外の人や物（彼、それ、彼ら）。', en: 'Anyone or anything else (he, she, it, they).' }, 'person'],
      ['singular', { ja: '一つ、一人。', en: 'One.' }, 'number'],
      ['plural', { ja: '二つ以上、二人以上。', en: 'More than one.' }, 'number']
    ] },
    { h: { en: 'Gender', ja: '性' }, f: 'gender', terms: [
      ['masculine', { ja: '文法上の男性。語の形の分類で、生き物の性とは限りません。', en: 'Grammatical masculine: a class of word forms, not always biological sex.' }],
      ['feminine', { ja: '文法上の女性。', en: 'Grammatical feminine.' }],
      ['neuter', { ja: '文法上の中性。', en: 'Grammatical neuter.' }]
    ] }
  ];
  var JA = { present: '現在', imperfect: '未完了過去', aorist: 'アオリスト', future: '未来', perfect: '現在完了', pluperfect: '過去完了',
    active: '能動態', middle: '中動態', passive: '受動態', 'middle or passive': '中動態または受動態', 'middle deponent': '中動態（異態）', 'passive deponent': '受動態（異態）', 'middle or passive deponent': '中動態または受動態（異態）',
    indicative: '直説法', subjunctive: '接続法', optative: '希求法', imperative: '命令法', infinitive: '不定詞', participle: '分詞',
    nominative: '主格', genitive: '属格', dative: '与格', accusative: '対格', vocative: '呼格',
    first: '一人称', second: '二人称', third: '三人称', singular: '単数', plural: '複数', masculine: '男性', feminine: '女性', neuter: '中性' };

  function grammar(el) {
    el.classList.add('gram');
    var find = '';
    el.addEventListener('input', function (ev) { if (ev.target.id === 'gmf') { find = ev.target.value.trim().toLowerCase(); draw(true); } });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-gv]'); if (!b) return;
      WS.selectWord(+b.dataset.gv, +b.dataset.gi, b.dataset.gs);
    });
    function hits() {
      var out = {}, morph = WS.morph || {}, last = WS.lastVerse();
      for (var v = 1; v <= last; v++) {
        var gv = WS.verse('grc', v);
        if (!gv || !gv.w) continue;
        gv.w.forEach(function (w) {
          var f = morph[w.m]; if (!f) return;
          ['tense', 'voice', 'mood', 'case', 'person', 'number', 'gender'].forEach(function (k) {
            if (!f[k]) return;
            var key = k + ':' + f[k]; (out[key] = out[key] || []).push([v, w]);
          });
        });
      }
      return out;
    }
    function draw(keepFocus) {
      var nt = !WS.covers || WS.covers('grc'), h = nt ? hits() : {};
      var body = GROUPS.map(function (g) {
        var rows = g.terms.filter(function (t) {
          return !find || t[0].indexOf(find) >= 0 || JA[t[0]].indexOf(find) >= 0 || t[1].ja.indexOf(find) >= 0;
        }).map(function (t) {
          var list = h[(t[2] || g.f) + ':' + t[0]] || [];
          var ex = list.slice(0, 4).map(function (r) {
            return '<button class="gex" data-gv="' + r[0] + '" data-gi="' + r[1].i + '" data-gs="' + esc(r[1].s || '') + '"><span lang="grc">' + esc(r[1].t) + '</span> <span class="small">' +
              r[0] + (state.lang === 'en' ? '' : S.v.ja) + '</span></button>';
          }).join('');
          return '<div class="gterm"><dt><b>' + esc(JA[t[0]]) + '</b> <span lang="en" class="small">' + esc(t[0]) + '</span></dt><dd>' + esc(L(t[1])) +
            (!nt ? '' : '<div class="small">' + esc(L(S.here)) + '：' + (list.length ? list.length + ' ' + ex + (list.length > 4 ? ' ' + esc(L(S.more)) : '') : esc(L(S.none))) + '</div>') + '</dd></div>';
        }).join('');
        return rows ? '<h3>' + esc(L(g.h)) + '</h3><dl>' + rows + '</dl>' : '';
      }).join('');
      el.innerHTML = '<h2>' + esc(L(S.title) + ' · ' + WS.bookName() + ' ' + state.ch) + '</h2>' +
        '<p class="gdraft" role="note">' + esc(L(S.draft)) + '</p>' +
        (nt ? '' : '<p class="small">' + esc(WS.t('ntOnly')) + '</p>' + (WS.covers('hbo') ? '<p><button class="btn" data-open-alt="hebrew">' + esc(WS.t('openHebrew')) + '</button></p>' : '')) +
        '<label class="small">' + esc(L(S.filter)) + ' <input id="gmf" type="search" value="' + esc(find) + '"></label>' + body;
      if (keepFocus) { var i = el.querySelector('#gmf'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    }
    return { texts: function () { return ['grc']; }, render: function () { draw(false); } };
  }
  WS.panel({ id: 'grammar', component: 'grammar', title: { en: 'Grammar terms', ja: '文法用語' }, group: 'original', build: grammar });
})();
