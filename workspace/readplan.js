/* Reading plan for a class: a teacher lists chapters (with dates if wanted), shares the plan as a file or a link,
 * and each student ticks off what they have read. Clicking a reading opens that chapter.
 *
 * A plan is plain data: a title and readings ({ d: optional date text, b: book code, c: chapter }). Plans and ticks
 * are kept on this device only (ws.plans, ws.plan.done.<id>). A shared link carries the plan after #plan=, which
 * browsers do not send to the server. Nothing is collected; a teacher does not see who read what.
 */
(function () {
  var state = WS.state, esc = WS.esc;
  function L(x) { return !x ? '' : typeof x === 'string' ? x : state.lang === 'en' ? (x.en || x.ja) : (x.ja || x.en); }
  var S = {
    title: { en: 'Reading plan', ja: '通読計画' },
    none: { en: 'No plan yet. A teacher can write one below, or open a plan file or link.', ja: 'まだ計画がありません。下で作るか、計画のファイルやリンクを開いてください。' },
    pick: { en: 'Plan', ja: '計画' }, read: { en: 'read', ja: '読了' }, of: { en: 'of', ja: '／' },
    next: { en: 'Next reading', ja: '次に読む箇所' }, all: { en: 'All read. Well done.', ja: 'すべて読み終えました。' },
    teach: { en: 'For teachers: write and share a plan', ja: '先生向け：計画を作る・共有する' },
    newPlan: { en: 'New plan', ja: '新しい計画' }, edit: { en: 'Edit', ja: '編集' }, del: { en: 'Delete this plan', ja: 'この計画を削除' },
    saveFile: { en: 'Save as a file', ja: 'ファイルに保存' }, link: { en: 'Copy a link to this plan', ja: 'この計画のリンクをコピー' },
    load: { en: 'Open a plan file', ja: '計画のファイルを開く' },
    pTitle: { en: 'Title', ja: '題' },
    pLines: { en: 'One reading per line: an optional date, then a book and chapter. A range like "John 1-3" becomes three readings.',
      ja: '一行に一つ：日付（任意）、書名と章。「ヨハネ 1-3」のような範囲は三つに分かれます。' },
    pEx: { en: '2026-12-01 John 1\n2026-12-02 John 2-3\nRomans 8', ja: '2026-12-01 ヨハネ 1\n2026-12-02 ヨハネ 2-3\nローマ 8' },
    save: { en: 'Save', ja: '保存' }, cancel: { en: 'Cancel', ja: 'やめる' },
    bad: { en: 'Not understood:', ja: '読み取れない行：' }, empty: { en: 'Give the plan a title and at least one reading.', ja: '題と、一つ以上の箇所を入れてください。' },
    added: { en: 'Plan added: ', ja: '計画を追加しました：' }, badLink: { en: 'This file or link is not a reading plan this workspace can read.', ja: 'このファイルやリンクは、ここで読める通読計画ではありません。' },
    linkDone: { en: 'Link copied. Anyone who opens it gets this plan on their own device. Nothing is sent to this site.', ja: 'リンクをコピーしました。開いた人の端末に、この計画が入ります。このサイトには何も送られません。' },
    linkShow: { en: 'Copy this link:', ja: 'このリンクをコピーしてください：' }, tooLong: { en: 'This plan is too long for a link. Save it as a file instead.', ja: 'この計画はリンクには長すぎます。ファイルに保存して渡してください。' },
    sure: { en: 'Delete this plan and its ticks on this device?', ja: 'この計画と、この端末の読了の印を削除しますか。' },
    tick: { en: 'Mark as read', ja: '読了にする' }
  };

  function plans() { return WS.store.get('ws.plans', {}); }
  function setPlans(m) { WS.store.set('ws.plans', m); }
  function cur() { var id = WS.store.get('ws.plan.cur', ''), p = plans(); return p[id] ? id : Object.keys(p)[0] || ''; }
  function done(id) { return WS.store.get('ws.plan.done.' + id, {}); }

  /* A plan from outside is rebuilt from checked fields only. Books must exist in this build's manifest. */
  function clean(raw) {
    var books = (WS.manifest || {}).books || {};
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
    var title = typeof raw.title === 'string' ? raw.title.slice(0, 120) : '';
    var items = raw.items.slice(0, 1500).map(function (x) {
      if (!x || typeof x.b !== 'string' || !books[x.b]) return null;
      var c = +x.c; if (!(c >= 1 && c <= books[x.b].chapters)) return null;
      return { d: typeof x.d === 'string' ? x.d.slice(0, 20) : '', b: x.b, c: c };
    }).filter(Boolean);
    return title && items.length ? { title: title, items: items } : null;
  }
  function add(p) {
    var m = plans(), same = JSON.stringify(p), id = Object.keys(m).filter(function (k) { return JSON.stringify(m[k]) === same; })[0];
    if (!id) { id = 'plan-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); m[id] = p; setPlans(m); }
    WS.store.set('ws.plan.cur', id); return id;
  }
  /* Lines like "2026-12-01 ヨハネ 2-3" into readings; returns { items, bad } */
  function parseLines(text) {
    var items = [], bad = [];
    text.split(/\n/).forEach(function (raw) {
      var line = raw.normalize('NFKC').trim(); if (!line) return;
      var dm = line.match(/^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2})\s+(.*)$/), d = dm ? dm[1] : '', rest = dm ? dm[2] : line;
      var rm = rest.match(/^(.*?\D)\s*(\d+)\s*[-~〜–ー]\s*(\d+)\s*章?$/), first = rm ? rm[1] + rm[2] : rest;
      if (!/^\D/.test(first)) { bad.push(raw); return; }
      var r = WS.parseRef(first);
      if (!r || !r.book) { bad.push(raw); return; }
      var to = rm ? Math.min(+rm[3], WS.manifest.books[r.book].chapters) : r.ch;
      if (to < r.ch) { bad.push(raw); return; }
      for (var c = r.ch; c <= to; c++) items.push({ d: c === r.ch ? d : '', b: r.book, c: c });
    });
    return { items: items, bad: bad };
  }
  function toLines(p) { return p.items.map(function (x) { return (x.d ? x.d + ' ' : '') + WS.bookName(x.b, true) + ' ' + x.c; }).join('\n'); }

  /* A link that carries a plan: kept until the workspace has started, then the panel opens. */
  var fromLink = null;
  (function () {
    var m = location.hash.match(/(?:^#|&)plan=([A-Za-z0-9_-]+)/);
    if (!m) return;
    fromLink = m[1];
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file: page */ }
    var wait = setInterval(function () {
      if (!WS.dock || !WS.manifest) return;
      clearInterval(wait);
      var p = WS.ensurePanel('readplan'); if (p) p.api.setActive();
    }, 100);
    setTimeout(function () { clearInterval(wait); }, 15000);
  })();

  function plan(el) {
    el.classList.add('rplan');
    var mode = 'run', editId = null, notice = '';
    if (fromLink) {
      var p0 = null;
      try { p0 = clean(WS.guideStudies.unpack(fromLink)); } catch (e) { p0 = null; }
      notice = p0 ? L(S.added) + p0.title : L(S.badLink);
      if (p0) add(p0);
      fromLink = null;
    }
    function say(msg) { var s = el.querySelector('#rsay'); if (s) s.textContent = msg; }
    function download(name, text) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = name; document.body.appendChild(a); a.click(); a.remove();
    }
    el.addEventListener('change', function (ev) {
      if (ev.target.id === 'rpick') { WS.store.set('ws.plan.cur', ev.target.value); draw(); }
      else if (ev.target.id === 'rfile') {
        var f = ev.target.files[0]; ev.target.value = '';
        if (!f || f.size > 500000) return say(L(S.badLink));
        f.text().then(function (t) { var p = clean(JSON.parse(t)); if (!p) throw new Error('bad'); add(p); draw(); say(L(S.added) + p.title); })
          .catch(function () { say(L(S.badLink)); });
      } else if (ev.target.dataset.tick) {
        var id = cur(), d = done(id); d[ev.target.dataset.tick] = ev.target.checked; WS.store.set('ws.plan.done.' + id, d); draw();
      }
    });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-r]'); if (!b) return;
      var k = b.dataset.r, id = cur(), p = plans()[id];
      if (k === 'go') { WS.go(b.dataset.b, +b.dataset.c, 1); return; }
      if (k === 'new') { mode = 'edit'; editId = null; drawEdit({ title: '', items: [] }); return; }
      if (k === 'edit') { mode = 'edit'; editId = id; drawEdit(p); return; }
      if (k === 'cancel') { mode = 'run'; draw(); return; }
      if (k === 'save') {
        var title = el.querySelector('#rtitle').value.trim().slice(0, 120), parsed = parseLines(el.querySelector('#rlines').value);
        if (parsed.bad.length) return say(L(S.bad) + ' ' + parsed.bad.slice(0, 3).join(' / '));
        if (!title || !parsed.items.length) return say(L(S.empty));
        var np = { title: title, items: parsed.items };
        if (editId) { var m = plans(); m[editId] = np; setPlans(m); WS.store.set('ws.plan.cur', editId); } else add(np);
        mode = 'run'; draw(); return;
      }
      if (k === 'del') { if (!window.confirm(L(S.sure))) return; var m2 = plans(); delete m2[id]; setPlans(m2); WS.store.drop('ws.plan.done.' + id); WS.store.drop('ws.plan.cur'); draw(); return; }
      if (k === 'file') { download('reading-plan.json', JSON.stringify({ kind: 'ows-plan', v: 1, title: p.title, items: p.items }, null, 1)); return; }
      if (k === 'loadf') { el.querySelector('#rfile').click(); return; }
      if (k === 'link') {
        var url = location.origin + location.pathname + location.search + '#plan=' + WS.guideStudies.pack({ kind: 'ows-plan', v: 1, title: p.title, items: p.items });
        if (url.length > 7000) return say(L(S.tooLong));
        var shown = function () { say(L(S.linkShow)); var box = el.querySelector('#rlink'); box.hidden = false; box.value = url; box.select(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say(L(S.linkDone)); }, shown); else shown();
      }
    });
    function teach(id) {
      return '<details class="gteach"><summary>' + esc(L(S.teach)) + '</summary><div class="grow">' +
        '<button class="btn" data-r="new">' + esc(L(S.newPlan)) + '</button>' +
        (id ? '<button class="btn" data-r="edit">' + esc(L(S.edit)) + '</button><button class="btn" data-r="file">' + esc(L(S.saveFile)) + '</button>' +
          '<button class="btn" data-r="link">' + esc(L(S.link)) + '</button><button class="btn" data-r="del">' + esc(L(S.del)) + '</button>' : '') +
        '<button class="btn" data-r="loadf">' + esc(L(S.load)) + '</button><input type="file" id="rfile" accept=".json,application/json" hidden></div>' +
        '<textarea id="rlink" class="glink" readonly hidden aria-label="' + esc(L(S.link)) + '"></textarea></details>';
    }
    function draw() {
      if (mode === 'edit') return;
      var id = cur(), all = plans(), p = all[id];
      if (!p) { el.innerHTML = '<h2>' + esc(L(S.title)) + '</h2><p class="small">' + esc(L(S.none)) + '</p>' + teach('') + '<p id="rsay" class="small" role="status" aria-live="polite"></p>'; if (notice) { say(notice); notice = ''; } return; }
      var d = done(id), n = p.items.filter(function (x, i) { return d[i]; }).length, nextI = p.items.findIndex(function (x, i) { return !d[i]; });
      el.innerHTML = '<h2>' + esc(L(S.title)) + '</h2>' +
        '<label class="gpick"><span class="small">' + esc(L(S.pick)) + '</span> <select id="rpick">' + Object.keys(all).map(function (k) {
          return '<option value="' + esc(k) + '"' + (k === id ? ' selected' : '') + '>' + esc(all[k].title) + '</option>'; }).join('') + '</select></label>' +
        '<p class="small">' + n + ' ' + esc(L(S.of)) + ' ' + p.items.length + ' ' + esc(L(S.read)) + '</p>' +
        '<progress max="' + p.items.length + '" value="' + n + '"></progress>' +
        (nextI < 0 ? '<p>' + esc(L(S.all)) + '</p>' : '<p><b>' + esc(L(S.next)) + '：</b><button class="btn" data-r="go" data-b="' + esc(p.items[nextI].b) + '" data-c="' + p.items[nextI].c + '">' +
          esc(WS.bookName(p.items[nextI].b) + ' ' + p.items[nextI].c) + '</button></p>') +
        '<ol class="rlist">' + p.items.map(function (x, i) {
          return '<li' + (d[i] ? ' class="rdone"' : '') + '><input type="checkbox" data-tick="' + i + '"' + (d[i] ? ' checked' : '') + ' aria-label="' + esc(L(S.tick) + '：' + WS.bookName(x.b) + ' ' + x.c) + '">' +
            (x.d ? '<span class="small">' + esc(x.d) + '</span> ' : '') +
            '<button class="rgo" data-r="go" data-b="' + esc(x.b) + '" data-c="' + x.c + '">' + esc(WS.bookName(x.b) + ' ' + x.c) + '</button></li>';
        }).join('') + '</ol>' + teach(id) + '<p id="rsay" class="small" role="status" aria-live="polite"></p>';
      if (notice) { say(notice); notice = ''; }
    }
    function drawEdit(p) {
      el.innerHTML = '<h2>' + esc(L(editId ? S.edit : S.newPlan)) + '</h2>' +
        '<label class="gfield">' + esc(L(S.pTitle)) + '<input id="rtitle" value="' + esc(p.title) + '"></label>' +
        '<label class="gfield">' + esc(L(S.pLines)) + '<textarea id="rlines" rows="10" placeholder="' + esc(L(S.pEx)) + '">' + esc(p.items.length ? toLines(p) : '') + '</textarea></label>' +
        '<div class="grow"><button class="btn" data-r="save">' + esc(L(S.save)) + '</button><button class="btn" data-r="cancel">' + esc(L(S.cancel)) + '</button></div>' +
        '<p id="rsay" class="small" role="status" aria-live="polite"></p>';
    }
    return { render: draw };
  }
  WS.panel({ id: 'readplan', component: 'readplan', title: { en: 'Reading plan', ja: '通読計画' }, group: 'study', build: plan });
})();
