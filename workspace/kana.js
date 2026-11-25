/* Reading aid: a Greek word in katakana and in Latin letters, the way many Japanese seminaries teach beginners to
 * read Greek aloud (the Erasmian pronunciation: η and ω long, ου as ウー, θ as t, φ as f, χ as k, rough breathing
 * as h). It is a guide for reading aloud, not the only right way: teachers differ, and Modern Greek sounds different.
 * The word card and Word Study say so next to it. WS.kana(word) returns { ja: 'ロゴス', en: 'logos' }.
 */
(function () {
  var ROW = {   /* consonant: [a, i, u, e, o] and the kana for the consonant with no vowel after it */
    '': ['ア', 'イ', 'ウ', 'エ', 'オ'], k: ['カ', 'キ', 'ク', 'ケ', 'コ', 'ク'], g: ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ', 'グ'],
    s: ['サ', 'シ', 'ス', 'セ', 'ソ', 'ス'], z: ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ', 'ズ'], t: ['タ', 'ティ', 'トゥ', 'テ', 'ト', 'ト'],
    d: ['ダ', 'ディ', 'ドゥ', 'デ', 'ド', 'ド'], n: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ン'], h: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'フ'],
    f: ['ファ', 'フィ', 'フ', 'フェ', 'フォ', 'フ'], b: ['バ', 'ビ', 'ブ', 'ベ', 'ボ', 'ブ'], p: ['パ', 'ピ', 'プ', 'ペ', 'ポ', 'プ'],
    m: ['マ', 'ミ', 'ム', 'メ', 'モ', 'ム'], r: ['ラ', 'リ', 'ル', 'レ', 'ロ', 'ル']
  };
  var YU = { '': 'ユ', k: 'キュ', g: 'ギュ', s: 'シュ', z: 'ジュ', t: 'テュ', d: 'デュ', n: 'ニュ', h: 'ヒュ', f: 'フュ', b: 'ビュ', p: 'ピュ', m: 'ミュ', r: 'リュ' };
  var CONS = { β: 'b', γ: 'g', δ: 'd', ζ: 'z', θ: 't', κ: 'k', λ: 'r', μ: 'm', ν: 'n', π: 'p', ρ: 'r', σ: 's', τ: 't', φ: 'f', χ: 'k' };
  var LAT = { β: 'b', γ: 'g', δ: 'd', ζ: 'z', θ: 'th', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', π: 'p', ρ: 'r', σ: 's', τ: 't', φ: 'ph', χ: 'ch', ψ: 'ps',
    α: 'a', ε: 'e', η: 'ē', ι: 'i', ο: 'o', υ: 'y', ω: 'ō' };
  /* vowel sounds, longest first: [greek, kana after a consonant row index or a fixed string, latin] */
  var VOW = [['ου', 'u:'], ['αι', 'a+イ'], ['ει', 'e+イ'], ['οι', 'o+イ'], ['υι', 'y+イ'], ['αυ', 'a+ウ'], ['ευ', 'e+ウ'], ['ηυ', 'e:+ウ'],
    ['α', 'a'], ['ε', 'e'], ['η', 'e:'], ['ι', 'i'], ['ο', 'o'], ['υ', 'y'], ['ω', 'o:']];
  var IDX = { a: 0, i: 1, u: 2, e: 3, o: 4 };

  function plain(w) {
    var d = String(w || '').normalize('NFD').toLowerCase(), rough = /^[αεηιουω]+̔|^ῥ/.test(d.replace(/[̀-̓̕-ͯ]/g, ''));
    d = d.replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').replace(/[^α-ω]/g, '');
    return { s: d, rough: rough && !/^ρ/.test(d) };
  }
  function kana(word) {
    var p = plain(word), s = p.s, out = '', lat = p.rough ? 'h' : '', pend = p.rough ? 'h' : '';
    var i = 0;
    function flush() { if (pend) { out += ROW[pend][5]; pend = ''; } }
    while (i < s.length) {
      var c = s[i], nx = s[i + 1];
      var v = VOW.filter(function (x) { return s.substr(i, x[0].length) === x[0]; })[0];
      if (v) {
        var parts = v[1].split('+'), base = parts[0], long = /:$/.test(base), b = base.replace(':', '');
        out += b === 'y' ? YU[pend] : ROW[pend][IDX[b]];
        if (long) out += 'ー';
        if (parts[1]) out += parts[1];
        pend = '';
        lat += v[0].length === 2 ? v[0].replace('υ', 'u').split('').map(function (ch) { return LAT[ch] || ch; }).join('') : LAT[v[0]];
        i += v[0].length; continue;
      }
      if (c === 'γ' && /[γκξχ]/.test(nx || '')) { flush(); out += 'ン'; lat += 'n'; i++; continue; }   /* γγ, γκ: ng, nk */
      if (c === nx && /[κτπλμσρβδφθχ]/.test(c)) { flush(); out += c === 'μ' ? 'ン' : 'ッ'; lat += LAT[c]; i++; continue; }   /* doubled: small tsu */
      if (c === 'ξ' || c === 'ψ') { flush(); out += c === 'ξ' ? 'ク' : 'プ'; pend = 's'; lat += LAT[c]; i++; continue; }
      if (CONS[c]) { flush(); pend = CONS[c]; lat += LAT[c]; i++; continue; }
      i++;
    }
    flush();
    return { ja: out, en: lat };
  }
  WS.kana = kana;
})();
