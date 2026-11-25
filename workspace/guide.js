/* Guided study: a short, numbered way through one passage, with a note box for each step.
 *
 * A study is plain data: a title and steps, each with a heading, why it matters, one panel to open and a question.
 * The studies that come with the workspace are in STUDIES below. A teacher can write a study in the browser
 * (the editor in this panel), save it as a file, or copy a link that carries the whole study; a student who opens
 * the link or the file gets the study on their own device. Nothing is sent anywhere: a shared link carries the study
 * in the part after #, which browsers do not send to the server.
 *
 * Answers are saved on this device only, by study and passage (ws.guide.<study>.<book>.<chapter>). A student can
 * save them as a Markdown file, print them, or save a hand-in file that a teacher opens read only in this panel.
 *
 * The step text is our own wording and is a draft that a pastor or teacher has not checked yet; the panel says so.
 * Nothing here interprets the passage: it says what to look at, not what it means.
 */
(function () {
  var state = WS.state, esc = WS.esc;
  function L(x) { return !x ? '' : typeof x === 'string' ? x : state.lang === 'en' ? (x.en || x.ja || '') : (x.ja || x.en || ''); }
  var S = {
    title: { en: 'Guided study', ja: '学びの手引き' },
    draft: { en: 'Draft: this guide is new and has not yet been checked by a pastor or teacher. It tells you where to look, not what the passage means.',
      ja: '下書き：この手引きは新しく、まだ牧師や先生の確認を受けていません。どこを見るかを示すもので、箇所の意味を教えるものではありません。' },
    mine: { en: 'Written by a teacher or student, not by this site. Check its steps against Scripture and your teachers.',
      ja: 'このサイトではなく、先生や学生が作った学びです。内容は聖書と先生方の教えに照らして確かめてください。' },
    passage: { en: 'Passage', ja: '箇所' }, step: { en: 'Step', ja: '段階' },
    open: { en: 'Open', ja: '開く' }, done: { en: 'Done', ja: '済み' }, undo: { en: 'Not done', ja: '未完了に戻す' },
    prev: { en: 'Back', ja: '前へ' }, next: { en: 'Next', ja: '次へ' }, skip: { en: 'Skip', ja: '飛ばす' },
    note: { en: 'Your notes for this step', ja: 'この段階のメモ' },
    saved: { en: 'Saved on this device only.', ja: 'この端末にだけ保存されます。' },
    export: { en: 'Save answers (Markdown)', ja: '答えを保存（Markdown）' },
    print: { en: 'Print', ja: '印刷' },
    handin: { en: 'Hand-in file', ja: '提出用ファイル' },
    soon: { en: 'A panel for this step is not built yet. Use the link below, or write what you find.', ja: 'この段階のパネルはまだありません。下のリンクを使うか、見つけたことを書いてください。' },
    q: { en: 'Question', ja: '問い' }, why: { en: 'Why', ja: '理由' },
    pick: { en: 'Study', ja: '学び' },
    teach: { en: 'For teachers: write and share studies', ja: '先生向け：学びを作る・共有する' },
    newStudy: { en: 'New study', ja: '新しい学び' }, copyEdit: { en: 'Copy this study and edit', ja: 'この学びを複製して編集' },
    edit: { en: 'Edit', ja: '編集' }, del: { en: 'Delete this study', ja: 'この学びを削除' },
    saveFile: { en: 'Save the study as a file', ja: '学びをファイルに保存' },
    load: { en: 'Open a study or hand-in file', ja: '学び・提出ファイルを開く' },
    link: { en: 'Copy a link to this study', ja: 'この学びのリンクをコピー' },
    linkDone: { en: 'Link copied. Anyone who opens it gets this study and passage on their own device. Nothing is sent to this site.',
      ja: 'リンクをコピーしました。開いた人の端末に、この学びと箇所が入ります。このサイトには何も送られません。' },
    linkShow: { en: 'Copy this link:', ja: 'このリンクをコピーしてください：' },
    tooLong: { en: 'This study is too long for a link. Save it as a file instead.', ja: 'この学びはリンクには長すぎます。ファイルに保存して渡してください。' },
    imported: { en: 'Study added: ', ja: '学びを追加しました：' },
    bad: { en: 'This file or link is not a study this workspace can read.', ja: 'このファイルやリンクは、ここで読める学びではありません。' },
    sure: { en: 'Delete this study and its answers on this device?', ja: 'この学びと、この端末にある答えを削除しますか。' },
    eTitle: { en: 'Title', ja: '題' }, eAuthor: { en: 'Written by (optional)', ja: '作成者（任意）' },
    eH: { en: 'Heading', ja: '見出し' }, eWhy: { en: 'Why this step', ja: 'この段階の理由' }, eQ: { en: 'Question', ja: '問い' },
    eOpen: { en: 'Panel to open', ja: '開くパネル' }, eNone: { en: '(none)', ja: '（なし）' }, eChap: { en: 'Previous and next chapter', ja: '前後の章' },
    eAdd: { en: 'Add a step', ja: '段階を追加' }, eUp: { en: 'Up', ja: '上へ' }, eDown: { en: 'Down', ja: '下へ' }, eRm: { en: 'Remove', ja: '削除' },
    eSave: { en: 'Save', ja: '保存' }, eCancel: { en: 'Cancel', ja: 'やめる' },
    eHint: { en: 'Write in your own words. Say where to look and what to ask, not what the passage means.',
      ja: '自分のことばで書いてください。箇所の意味ではなく、どこを見て何を問うかを書きます。' },
    eEmpty: { en: 'Give the study a title and at least one step with a heading.', ja: '題と、見出しのある段階を一つ以上入れてください。' },
    hTitle: { en: 'Hand-in (read only)', ja: '提出された答え（読むだけ）' }, hFrom: { en: 'From', ja: '提出者' },
    hClose: { en: 'Close', ja: '閉じる' }, hName: { en: 'Your name for the hand-in file (optional):', ja: '提出用ファイルに入れる名前（任意）：' },
    hDate: { en: 'Saved', ja: '保存日' }, by: { en: 'Written by', ja: '作成者' }, empty: { en: '(no answer)', ja: '（答えなし）' }
  };

  /* Panels a step can open. 'ja' is the Japanese text the reader uses (口語訳 unless they chose another). */
  var OPENABLE = ['ja', 'parallel', 'greek', 'word', 'lexicon', 'wordtable', 'xrefs', 'gsearch', 'usage', 'grammar', 'commentary', 'notes', 'bsb'];

  /* Studies that come with the workspace. Our own wording; drafts until a pastor or teacher checks them. */
  var STUDIES = {
    basic: {
      title: { en: 'Basic study of a passage', ja: '聖書箇所の基本的な学び' },
      steps: [
        { h: { en: 'Read it slowly, more than once', ja: '何度もゆっくり読む' },
          why: { en: 'Your own questions come first; they guide every later step.', ja: '最初に必要なのは自分の問いです。それが後のすべての段階の道しるべになります。' },
          q: { en: 'What stands out? What do you not understand yet?', ja: '目にとまった所はどこですか。まだ分からない所はどこですか。' },
          open: 'ja' },
        { h: { en: 'Compare translations', ja: '訳を読み比べる' },
          why: { en: 'Where translations differ, translators made a choice. Those are places to look at the Greek.', ja: '訳が分かれる所は、翻訳者の判断が分かれた所です。そこが原語を確かめる場所です。' },
          q: { en: 'Where do the translations differ?', ja: '訳が違うのはどこですか。' },
          open: 'parallel' },
        { h: { en: 'Context and where the passage begins and ends', ja: '文脈と区切り' },
          why: { en: 'Words mean what they mean in their setting. Read what comes before and after.', ja: 'ことばは文脈の中で意味を持ちます。前後も読みます。' },
          q: { en: 'Where does this passage start and stop? What kind of writing is it?', ja: 'この箇所はどこから始まり、どこで終わりますか。手紙、物語、詩など、どんな文書ですか。' },
          chapterNav: true },
        { h: { en: 'People, places and events', ja: '人物、場所、出来事' },
          why: { en: 'The first readers knew who and where. Check before you read on.', ja: '最初の読者は、誰がどこにいたかを知っていました。先に確かめます。' },
          q: { en: 'Who speaks to whom? Where and when?', ja: '誰が誰に語っていますか。いつ、どこでですか。' },
          tool: 'factbook' },
        { h: { en: 'Words in the original language', ja: '原語のことば' },
          why: { en: 'Click a word in the Greek (or, in the Old Testament, the Hebrew). A word means what its use shows, not what its roots suggest.', ja: 'ギリシア語（旧約ではヘブライ語）の語を押してください。語の意味は、語源ではなく、使われ方で決まります。' },
          q: { en: 'Which words matter most here? How are they used elsewhere?', ja: 'ここで大切な語はどれですか。ほかの箇所ではどう使われていますか。' },
          open: 'greek', also: 'word' },
        { h: { en: 'Other passages', ja: '聖書のほかの箇所' },
          why: { en: 'Scripture sheds light on Scripture. Read each cross reference in its own setting.', ja: '聖書は聖書によって照らされます。関連箇所は、それぞれの文脈で読みます。' },
          q: { en: 'Which other passages help, and why?', ja: 'どの箇所が助けになりますか。なぜですか。' },
          open: 'xrefs' },
        { h: { en: 'Say it in your own words', ja: '自分のことばでまとめる' },
          why: { en: 'If you can say the main point plainly, you have understood it so far.', ja: '要点を短く言えれば、ここまで理解できています。' },
          q: { en: 'What is the main point, in one or two sentences?', ja: '要点を一、二文で書いてください。' } },
        { h: { en: 'Commentaries', ja: '注解書' },
          why: { en: 'Others read it before you. Check your reading against theirs after you have done your own.', ja: '先に読んだ人たちがいます。自分で読んだ後に、照らし合わせます。' },
          q: { en: 'Where do they agree or differ with your reading?', ja: '自分の読み方と、どこが同じで、どこが違いますか。' },
          open: 'commentary' },
        { h: { en: 'What it teaches, and living it', ja: '教えと生き方' },
          why: { en: 'Study ends in obedience and worship, with the church, in prayer.', ja: '学びは、祈りと教会の交わりの中で、従うことと礼拝に向かいます。' },
          q: { en: 'What does it teach about God? What will you do?', ja: '神について何を教えていますか。あなたは何をしますか。' } }
      ]
    },
    wordstudy: {
      title: { en: 'Word study in the original language', ja: '原語の語句研究' },
      steps: [
        { h: { en: 'Choose the word', ja: '語を選ぶ' },
          why: { en: 'Pick a word the passage leans on, or one where the translations differ. Not every word needs a study.', ja: '箇所の中心になる語や、訳が分かれる語を選びます。すべての語を調べる必要はありません。' },
          q: { en: 'Which word, and why this one?', ja: 'どの語を選びましたか。なぜその語ですか。' },
          open: 'parallel' },
        { h: { en: 'Find the dictionary form and the grammar', ja: '見出し語と文法を確かめる' },
          why: { en: 'The form in the verse tells you how the word works in this sentence: tense, voice, case.', ja: '節の中の形は、この文での働き（時制、態、格など）を示します。' },
          q: { en: 'What is the dictionary form? What do the grammar labels say?', ja: '見出し語は何ですか。文法の表示は何と言っていますか。' },
          open: 'greek', also: 'word' },
        { h: { en: 'See every place it is used', ja: '使われている箇所を全部見る' },
          why: { en: 'A word means what its use shows. Read the places, not only the count.', ja: '語の意味は使われ方で決まります。数だけでなく、箇所そのものを読みます。' },
          q: { en: 'In which books and settings does it appear? Does the same author use it differently?', ja: 'どの書の、どんな場面に出てきますか。同じ著者が別の意味で使っていますか。' },
          open: 'gsearch' },
        { h: { en: 'How translations render it', ja: '訳語を比べる' },
          why: { en: 'One Greek word can have several Japanese renderings, and one Japanese word can stand for several Greek words.', ja: '一つのギリシア語に複数の訳語があり、一つの訳語が複数のギリシア語を表すこともあります。' },
          q: { en: 'Which renderings are used, and where?', ja: 'どんな訳語が、どこで使われていますか。' },
          open: 'word' },
        { h: { en: 'What goes with it', ja: '一緒に使われる語' },
          why: { en: 'Subjects, objects and prepositions often show which sense is meant.', ja: '主語、目的語、前置詞が、どの意味かを示すことがよくあります。' },
          q: { en: 'What does it usually go with? Is this verse the same or different?', ja: 'ふつう何と一緒に使われますか。この節は同じですか、違いますか。' },
          open: 'usage' },
        { h: { en: 'Read the dictionary', ja: '辞書を引く' },
          why: { en: 'A dictionary lists senses. Choose the one that fits this sentence; do not load all of them into one verse.', ja: '辞書は意味を並べます。この文に合う一つを選び、全部の意味を一つの節に詰め込みません。' },
          q: { en: 'Which sense fits here, and what in the context shows it?', ja: 'ここに合う意味はどれですか。文脈のどこからそう言えますか。' },
          open: 'lexicon' },
        { h: { en: 'Check for common mistakes', ja: 'よくある誤りを確かめる' },
          why: { en: 'Three to avoid: meaning from the roots of a word, all meanings at once, and later meanings read back into the Bible.', ja: '避けたい三つ：語の成り立ちから意味を決めること、全部の意味を一度に読み込むこと、後の時代の意味を聖書に読み込むこと。' },
          q: { en: 'Did any of these slip into your reading?', ja: 'この三つのどれかが、自分の読み方に入っていませんか。' } },
        { h: { en: 'Back to the passage', ja: '箇所に戻る' },
          why: { en: 'A word study serves the passage. Say what difference it makes to the sentence.', ja: '語句研究は箇所を読むためのものです。文の読み方がどう変わるかを書きます。' },
          q: { en: 'How does this word shape what the verse says?', ja: 'この語は、節の言っていることをどう形づくっていますか。' },
          open: 'ja' }
      ]
    },
    exegesis: {
      title: { en: 'Passage exegesis', ja: '聖書箇所の釈義' },
      steps: [
        { h: { en: 'The setting of the book', ja: '書の背景' },
          why: { en: 'Who wrote, to whom, when and why. The passage answers a situation.', ja: '誰が、誰に、いつ、なぜ書いたか。箇所はある状況に語りかけています。' },
          q: { en: 'What do you know about the author, the readers and their situation?', ja: '著者、読者、その状況について、分かっていることは何ですか。' },
          tool: 'factbook' },
        { h: { en: 'Where the passage begins and ends', ja: '箇所の区切り' },
          why: { en: 'A passage is a unit of thought. Look for changes of topic, speaker, place or time.', ja: '箇所は一つの思想のまとまりです。話題、話し手、場所、時の変わり目を探します。' },
          q: { en: 'Why does the passage begin and end where it does?', ja: 'なぜここから始まり、ここで終わると言えますか。' },
          chapterNav: true },
        { h: { en: 'Your own working translation', ja: '自分の試訳' },
          why: { en: 'Translating, even roughly, makes you see each word and each link between sentences.', ja: '粗くても自分で訳すと、一語一語と、文と文のつながりが見えてきます。' },
          q: { en: 'Write your translation. Where were you unsure?', ja: '試訳を書いてください。迷った所はどこですか。' },
          open: 'greek', also: 'wordtable' },
        { h: { en: 'Differences between editions', ja: '本文の違い' },
          why: { en: 'Greek manuscripts sometimes differ. Note where, and whether it changes the meaning.', ja: 'ギリシア語の写本には違いがある所があります。どこで違い、意味が変わるかを確かめます。' },
          q: { en: 'Are there differences in this passage? Do they matter for the meaning?', ja: 'この箇所に本文の違いはありますか。意味に関わりますか。' },
          open: 'wordtable' },
        { h: { en: 'How the sentences are built', ja: '文の組み立て' },
          why: { en: 'Find the main verbs, then what hangs on them: reasons, purposes, results, contrasts.', ja: '主動詞を見つけ、それにかかる部分（理由、目的、結果、対比）を確かめます。' },
          q: { en: 'What is the main statement? What supports it?', ja: '中心の主張は何ですか。何がそれを支えていますか。' },
          open: 'greek' },
        { h: { en: 'Key words', ja: '鍵になる語' },
          why: { en: 'Study the few words the passage turns on, by their use, not their roots.', ja: '箇所の要になる少数の語を、語源ではなく使われ方から調べます。' },
          q: { en: 'Which words carry the passage, and what do they mean here?', ja: '箇所を支える語はどれですか。ここでの意味は何ですか。' },
          open: 'word', also: 'lexicon' },
        { h: { en: 'The rest of Scripture', ja: '聖書全体との関係' },
          why: { en: 'Read the Old Testament places it quotes or echoes, and passages on the same theme, each in its setting.', ja: '引用や反響のある旧約の箇所と、同じ主題の箇所を、それぞれの文脈で読みます。' },
          q: { en: 'Which passages does it draw on, and how?', ja: 'どの箇所を下敷きにしていますか。どのようにですか。' },
          open: 'xrefs' },
        { h: { en: 'The flow of thought', ja: '思想の流れ' },
          why: { en: 'Put the argument or story in a short outline. If it will not fit, look again.', ja: '論じ方や物語を短い見出しで並べます。うまく並ばなければ、もう一度読みます。' },
          q: { en: 'Write a short outline and the main point in one sentence.', ja: '短い見出しの流れと、一文の要点を書いてください。' } },
        { h: { en: 'Compare with commentaries', ja: '注解書と照らす' },
          why: { en: 'Now read others. Where they differ, weigh their reasons.', ja: 'ここで他の人の読みを開きます。意見が分かれる所は、それぞれの理由を比べます。' },
          q: { en: 'Where did they correct or confirm your reading?', ja: '自分の読みが正された所、確かめられた所はどこですか。' },
          open: 'commentary' },
        { h: { en: 'What it meant, and what it means', ja: '当時の意味と、今の意味' },
          why: { en: 'First what it meant for its first readers; then what it teaches the church, and how to obey.', ja: 'まず最初の読者にとっての意味。それから、今の教会への教えと、どう従うかです。' },
          q: { en: 'What did it mean then? What does it teach about God and call us to now?', ja: '当時、何を意味しましたか。神について何を教え、今わたしたちに何を求めていますか。' } }
      ]
    },
    devotion: {
      title: { en: 'Short reading and prayer', ja: '短いみことばの黙想' },
      steps: [
        { h: { en: 'Pray before you read', ja: '読む前に祈る' },
          why: { en: 'Ask God to open your eyes to what is written.', ja: '書かれていることが分かるよう、神に願います。' },
          q: { en: 'What do you bring to God before reading?', ja: '読む前に、神の前に何を持って来ていますか。' } },
        { h: { en: 'Read the passage twice', ja: '箇所を二度読む' },
          why: { en: 'Once for the whole, once slowly.', ja: '一度は全体を、もう一度はゆっくりと読みます。' },
          q: { en: 'Which words stayed with you?', ja: '心に残ったことばはどれですか。' },
          open: 'ja' },
        { h: { en: 'What it says about God', ja: '神について' },
          why: { en: 'Start with God, not with yourself.', ja: '自分からではなく、神から始めます。' },
          q: { en: 'What does this passage show about God, Christ or the Spirit?', ja: 'この箇所は、神、キリスト、御霊について何を示していますか。' } },
        { h: { en: 'Respond', ja: '応答する' },
          why: { en: 'Hearing ends in doing, in praise, confession or obedience.', ja: '聞くことは、行うこと、賛美、悔い改め、従うことにつながります。' },
          q: { en: 'What will you thank God for, confess, or do today?', ja: '今日、何を感謝し、何を告白し、何を行いますか。' },
          open: 'notes' }
      ]
    }
  };
  var BUILTIN = Object.keys(STUDIES);

  /* ---------- studies a teacher or student wrote, kept on this device ---------- */
  function mine() { return WS.store.get('ws.studies', {}); }
  function setMine(m) { WS.store.set('ws.studies', m); }
  function all() { var m = mine(), o = {}; BUILTIN.forEach(function (k) { o[k] = STUDIES[k]; }); Object.keys(m).forEach(function (k) { o[k] = m[k]; }); return o; }
  function current() { var id = WS.store.get('ws.guide.study', 'basic'); return all()[id] ? id : 'basic'; }
  function isMine(id) { return BUILTIN.indexOf(id) < 0; }

  /* A study from outside (a file or a link) is checked field by field and rebuilt from plain strings only. */
  function clean(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.steps)) return null;
    var str = function (x, n) { return typeof x === 'string' ? x.slice(0, n) : ''; };
    var two = function (x, n) { return typeof x === 'string' ? { ja: str(x, n), en: str(x, n) } : x && typeof x === 'object' ? { ja: str(x.ja, n), en: str(x.en, n) } : { ja: '', en: '' }; };
    var title = two(raw.title, 120);
    if (!title.ja && !title.en) return null;
    var steps = raw.steps.slice(0, 40).map(function (s) {
      if (!s || typeof s !== 'object') return null;
      var o = { h: two(s.h, 160), why: two(s.why, 1200), q: two(s.q, 600) };
      if (OPENABLE.indexOf(s.open) >= 0) o.open = s.open;
      if (OPENABLE.indexOf(s.also) >= 0) o.also = s.also;
      if (s.chapterNav === true) o.chapterNav = true;
      return (o.h.ja || o.h.en) ? o : null;
    }).filter(Boolean);
    if (!steps.length) return null;
    return { title: title, author: str(raw.author, 120), steps: steps };
  }
  function newId() { return 'my-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  /* The same study opened twice (a link clicked again) is kept once. */
  function addStudy(st) {
    var m = mine(), same = JSON.stringify(st), id = Object.keys(m).filter(function (k) { return JSON.stringify(m[k]) === same; })[0];
    if (!id) { id = newId(); m[id] = st; setMine(m); }
    WS.store.set('ws.guide.study', id); return id;
  }

  /* text <-> the part of a link after #study= (UTF-8, base64 with - and _) */
  function pack(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj)), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unpack(s) {
    var bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function shareObj(id) {
    var s = all()[id];
    return { kind: 'ows-study', v: 1, title: s.title, author: s.author || '', steps: s.steps.map(function (x) {
      var o = { h: x.h, why: x.why, q: x.q };
      if (x.open) o.open = x.open; if (x.also) o.also = x.also; if (x.chapterNav) o.chapterNav = true;
      return o;
    }) };
  }

  /* A link that carries a study: read it before the workspace starts, so the guided layout and the passage open. */
  var notice = '';
  (function fromLink() {
    var m = location.hash.match(/(?:^#|&)study=([A-Za-z0-9_-]+)/);
    if (!m) return;
    var st = null;
    try { st = clean(unpack(m[1])); } catch (e) { st = null; }
    WS.store.set('ws.layoutName', 'guided');   /* the guide shows what happened, good link or bad */
    if (!st) { notice = 'bad'; }
    else {
      addStudy(st);
      notice = L(S.imported) + L(st.title);
      var at = location.hash.match(/(?:^#|&)at=([1-3]?[A-Za-z]{2,3})\.(\d{1,3})/);
      if (at) WS.store.set('ws.at', [at[1], +at[2], 1]);
    }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file: page */ }
  })();

  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function slug(id) { return id.replace(/[^a-z0-9-]/gi, '') || 'study'; }

  function key(id) { return 'ws.guide.' + id + '.' + state.book + '.' + state.ch; }

  function guide(el) {
    el.classList.add('guide');
    var mode = 'run', draftEdit = null, handin = null;
    function sid() { return current(); }
    function study() { return all()[sid()]; }
    function load() { return WS.store.get(key(sid()), { at: 0, notes: {}, done: {} }); }
    function save(d) { WS.store.set(key(sid()), d); }

    el.addEventListener('input', function (ev) {
      if (mode === 'run' && ev.target.id === 'gnote') { var d = load(); d.notes[d.at] = ev.target.value; save(d); return; }
      if (mode === 'edit' && ev.target.dataset.f) readForm();
    });
    el.addEventListener('change', function (ev) {
      if (ev.target.id === 'gpick') { WS.store.set('ws.guide.study', ev.target.value); draw(); }
      else if (ev.target.id === 'gfile') { readFile(ev.target.files[0]); ev.target.value = ''; }
      else if (mode === 'edit' && ev.target.dataset.f) readForm();
    });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-g]'); if (!b) return;
      var k = b.dataset.g;
      if (mode === 'edit') return editClick(k, b);
      if (k === 'hclose') { handin = null; draw(); return; }
      var d = load(), n = study().steps.length;
      if (k === 'prev') d.at = Math.max(0, d.at - 1);
      else if (k === 'next' || k === 'skip') d.at = Math.min(n - 1, d.at + 1);
      else if (k === 'go') d.at = +b.dataset.i;
      else if (k === 'done') { d.done[d.at] = !d.done[d.at]; if (d.done[d.at] && d.at < n - 1) d.at += 1; }
      else if (k === 'open') { var p = WS.ensurePanel(b.dataset.p); if (p) p.api.setActive(); return; }
      else if (k === 'chap') { WS.go(state.book, Math.min(WS.manifest.books[state.book].chapters, Math.max(1, state.ch + (+b.dataset.d))), 1); return; }
      else if (k === 'export') { download('study-' + slug(sid()) + '-' + state.book + '-' + state.ch + '.md', markdown(study(), d.notes, WS.bookName() + ' ' + state.ch), 'text/markdown'); return; }
      else if (k === 'print') { printOut(study(), d.notes, WS.bookName() + ' ' + state.ch, isMine(sid())); return; }
      else if (k === 'handin') { handIn(d); return; }
      else if (k === 'new') { draftEdit = { id: null, s: { title: { ja: '', en: '' }, author: '', steps: [blankStep()] } }; mode = 'edit'; drawEdit(); return; }
      else if (k === 'copy') { draftEdit = { id: null, s: JSON.parse(JSON.stringify(shareObj(sid()))) }; draftEdit.s.title.ja += '（複製）'; draftEdit.s.title.en += ' (copy)'; mode = 'edit'; drawEdit(); return; }
      else if (k === 'edit') { draftEdit = { id: sid(), s: JSON.parse(JSON.stringify(shareObj(sid()))) }; mode = 'edit'; drawEdit(); return; }
      else if (k === 'del') { if (window.confirm(L(S.sure))) remove(sid()); return; }
      else if (k === 'file') { download(slug(sid()) + '.study.json', JSON.stringify(shareObj(sid()), null, 1), 'application/json'); return; }
      else if (k === 'link') { copyLink(); return; }
      else if (k === 'loadf') { el.querySelector('#gfile').click(); return; }
      save(d); draw();
    });

    function remove(id) {
      var m = mine(); delete m[id]; setMine(m);
      WS.store.keys().forEach(function (k) { if (k.indexOf('ws.guide.' + id + '.') === 0) WS.store.drop(k); });
      WS.store.set('ws.guide.study', 'basic'); draw();
    }
    function copyLink() {
      var url = location.origin + location.pathname + location.search + '#study=' + pack(shareObj(sid())) + '&at=' + state.book + '.' + state.ch;
      if (url.length > 7000) return say(L(S.tooLong));
      var shown = function () { say(L(S.linkShow)); var box = el.querySelector('#glink'); box.hidden = false; box.value = url; box.select(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say(L(S.linkDone)); }, shown);
      else shown();
    }
    function readFile(f) {
      if (!f) return;
      if (f.size > 500000) return say(L(S.bad));
      f.text().then(function (txt) {
        var raw = JSON.parse(txt);
        if (raw && raw.kind === 'ows-handin') {
          var st = clean(raw.study), nt = {};
          if (!st || !raw.notes || typeof raw.notes !== 'object') throw new Error('bad');
          Object.keys(raw.notes).forEach(function (i) { if (/^\d{1,2}$/.test(i) && typeof raw.notes[i] === 'string') nt[i] = raw.notes[i].slice(0, 20000); });
          handin = { study: st, notes: nt, name: typeof raw.name === 'string' ? raw.name.slice(0, 80) : '', passage: typeof raw.passage === 'string' ? raw.passage.slice(0, 60) : '',
            date: typeof raw.date === 'string' ? raw.date.slice(0, 10) : '' };
          draw(); return;
        }
        var st2 = clean(raw); if (!st2) throw new Error('bad');
        addStudy(st2); draw(); say(L(S.imported) + L(st2.title));
      }).catch(function () { say(L(S.bad)); });
    }
    function handIn(d) {
      var name = window.prompt(L(S.hName), WS.store.get('ws.guide.name', '')) ;
      if (name === null) return;
      WS.store.set('ws.guide.name', name);
      var out = { kind: 'ows-handin', v: 1, name: name, passage: WS.bookName() + ' ' + state.ch, at: state.book + '.' + state.ch,
        date: new Date().toISOString().slice(0, 10), study: shareObj(sid()), notes: d.notes };
      download('handin-' + slug(sid()) + '-' + state.book + '-' + state.ch + '.json', JSON.stringify(out, null, 1), 'application/json');
    }
    function say(msg) { var s = el.querySelector('#gsay'); if (s) s.textContent = msg; }

    /* ---------- running a study ---------- */
    function draw() {
      if (mode === 'edit') return drawEdit();
      if (handin) return drawHandin();
      var id = sid(), st = study(), d = load(), n = st.steps.length;
      if (d.at >= n) d.at = n - 1;
      var s = st.steps[d.at], doneN = Object.keys(d.done).filter(function (i) { return d.done[i] && +i < n; }).length;
      var site = window.WS_SITE, q = state.lang === 'en' ? '?lang=en' : '?lang=ja';
      /* In the Old Testament the original-language steps open the Hebrew; panels that are Greek only are left out. */
      var ot = WS.covers && !WS.covers('grc'), GK = { greek: 'hebrew', wordtable: 'hebrew', grammar: 'hebrew', gsearch: null, usage: null };
      var swap = function (id) { return ot && id in GK ? GK[id] : id; };
      var openId = swap(s.open === 'ja' ? WS.ja() : s.open), alsoId = swap(s.also);
      if (alsoId === openId) alsoId = null;
      var act = openId ? '<button class="btn" data-g="open" data-p="' + esc(openId) + '">' + esc(L(S.open) + '：' + WS.itemName(openId)) + '</button>' +
          (alsoId ? ' <button class="btn" data-g="open" data-p="' + esc(alsoId) + '">' + esc(L(S.open) + '：' + WS.itemName(alsoId)) + '</button>' : '')
        : s.chapterNav ? '<button class="btn" data-g="chap" data-d="-1">‹ ' + esc(L(S.prev)) + '</button> <button class="btn" data-g="chap" data-d="1">' + esc(L(S.next)) + ' ›</button>'
        : s.tool && site ? '<p class="small">' + esc(L(S.soon)) + '</p><a class="btn" href="' + site.home + s.tool + '/' + q + '" target="_blank" rel="noopener">' +
            esc(L(S.open) + '：' + (site.tools.filter(function (x) { return x[0] === s.tool; })[0] || [0, s.tool, s.tool])[state.lang === 'en' ? 1 : 2]) + '</a>' : '';
      var all_ = all();
      el.innerHTML = '<h2>' + esc(L(S.title)) + '</h2>' +
        '<label class="gpick"><span class="small">' + esc(L(S.pick)) + '</span> <select id="gpick">' + Object.keys(all_).map(function (k) {
          return '<option value="' + esc(k) + '"' + (k === id ? ' selected' : '') + '>' + esc(L(all_[k].title) + (isMine(k) ? ' ✎' : '')) + '</option>';
        }).join('') + '</select></label>' +
        '<p class="gdraft" role="note">' + esc(L(isMine(id) ? S.mine : S.draft)) + (st.author ? ' ' + esc(L(S.by) + '：' + st.author) : '') + '</p>' +
        '<p class="small">' + esc(L(S.passage)) + '：' + esc(WS.bookName() + ' ' + state.ch) + ' · ' + esc(L(S.done)) + ' ' + doneN + '/' + n + '</p>' +
        '<ol class="gsteps">' + st.steps.map(function (x, i) {
          return '<li><button data-g="go" data-i="' + i + '" aria-current="' + (i === d.at) + '" class="' + (d.done[i] ? 'gdone' : '') + '" aria-label="' + esc(L(S.step) + ' ' + (i + 1) + '：' + L(x.h)) + '">' + (i + 1) + '</button></li>';
        }).join('') + '</ol>' +
        '<h3>' + esc(L(S.step)) + ' ' + (d.at + 1) + '/' + n + '：' + esc(L(s.h)) + '</h3>' +
        (L(s.why) ? '<p><b>' + esc(L(S.why)) + '：</b>' + esc(L(s.why)) + '</p>' : '') +
        '<div class="gact">' + act + '</div>' +
        (L(s.q) ? '<p><b>' + esc(L(S.q)) + '：</b>' + esc(L(s.q)) + '</p>' : '') +
        '<label class="small" for="gnote">' + esc(L(S.note)) + '</label><textarea id="gnote"></textarea><p class="small">' + esc(L(S.saved)) + '</p>' +
        '<div class="grow"><button class="btn" data-g="prev">' + esc(L(S.prev)) + '</button>' +
        '<button class="btn" data-g="done">' + esc(L(d.done[d.at] ? S.undo : S.done)) + '</button>' +
        '<button class="btn" data-g="skip">' + esc(L(S.skip)) + '</button></div>' +
        '<div class="grow"><button class="btn" data-g="export">' + esc(L(S.export)) + '</button>' +
        '<button class="btn" data-g="print">' + esc(L(S.print)) + '</button>' +
        '<button class="btn" data-g="handin">' + esc(L(S.handin)) + '</button></div>' +
        '<details class="gteach"><summary>' + esc(L(S.teach)) + '</summary><div class="grow">' +
          '<button class="btn" data-g="new">' + esc(L(S.newStudy)) + '</button>' +
          '<button class="btn" data-g="copy">' + esc(L(S.copyEdit)) + '</button>' +
          (isMine(id) ? '<button class="btn" data-g="edit">' + esc(L(S.edit)) + '</button><button class="btn" data-g="del">' + esc(L(S.del)) + '</button>' : '') +
          '<button class="btn" data-g="file">' + esc(L(S.saveFile)) + '</button>' +
          '<button class="btn" data-g="link">' + esc(L(S.link)) + '</button>' +
          '<button class="btn" data-g="loadf">' + esc(L(S.load)) + '</button>' +
          '<input type="file" id="gfile" accept=".json,application/json" hidden>' +
        '</div><textarea id="glink" class="glink" readonly hidden aria-label="' + esc(L(S.link)) + '"></textarea></details>' +
        '<p id="gsay" class="small" role="status" aria-live="polite"></p>';
      el.querySelector('#gnote').value = d.notes[d.at] || '';
      if (notice) { say(notice === 'bad' ? L(S.bad) : notice); notice = ''; }
    }

    /* ---------- a hand-in file, read only ---------- */
    function drawHandin() {
      var h = handin;
      el.innerHTML = '<h2>' + esc(L(S.hTitle)) + '</h2>' +
        '<p class="small">' + esc(L(S.hFrom)) + '：' + esc(h.name || '-') + ' · ' + esc(L(S.passage)) + '：' + esc(h.passage) + ' · ' + esc(L(S.hDate)) + '：' + esc(h.date) + '</p>' +
        '<h3>' + esc(L(h.study.title)) + '</h3>' +
        h.study.steps.map(function (s, i) {
          return '<section class="ghand"><h4>' + (i + 1) + '. ' + esc(L(s.h)) + '</h4>' + (L(s.q) ? '<p class="small"><b>' + esc(L(S.q)) + '：</b>' + esc(L(s.q)) + '</p>' : '') +
            '<p class="gans">' + (h.notes[i] ? esc(h.notes[i]).replace(/\n/g, '<br>') : '<span class="small">' + esc(L(S.empty)) + '</span>') + '</p></section>';
        }).join('') +
        '<div class="grow"><button class="btn" data-g="hclose">' + esc(L(S.hClose)) + '</button></div>';
    }

    /* ---------- the editor ---------- */
    function blankStep() { return { h: { ja: '', en: '' }, why: { ja: '', en: '' }, q: { ja: '', en: '' } }; }
    function lk() { return state.lang === 'en' ? 'en' : 'ja'; }
    function readForm() {
      var s = draftEdit.s, k = lk();
      el.querySelectorAll('[data-f]').forEach(function (f) {
        var i = f.dataset.i, name = f.dataset.f, v = f.value;
        if (name === 'title') s.title[k] = v;
        else if (name === 'author') s.author = v;
        else if (name === 'open') { var st = s.steps[i]; delete st.open; delete st.chapterNav; if (v === '@chap') st.chapterNav = true; else if (v) st.open = v; }
        else s.steps[i][name][k] = v;
      });
    }
    function editClick(k, b) {
      var s = draftEdit.s, i = +b.dataset.i;
      readForm();
      if (k === 'eadd') s.steps.push(blankStep());
      else if (k === 'erm') { s.steps.splice(i, 1); if (!s.steps.length) s.steps.push(blankStep()); }
      else if (k === 'eup' && i > 0) s.steps.splice(i - 1, 0, s.steps.splice(i, 1)[0]);
      else if (k === 'edown' && i < s.steps.length - 1) s.steps.splice(i + 1, 0, s.steps.splice(i, 1)[0]);
      else if (k === 'ecancel') { mode = 'run'; draftEdit = null; draw(); return; }
      else if (k === 'esave') {
        /* the language not being edited falls back to the one written, so a Japanese-only study reads in English mode too */
        var fill = function (o) { if (o) { o.ja = o.ja || o.en; o.en = o.en || o.ja; } };
        fill(s.title); s.steps.forEach(function (x) { fill(x.h); fill(x.why); fill(x.q); });
        var st = clean(s);
        if (!st) { say(L(S.eEmpty)); return; }
        if (draftEdit.id && isMine(draftEdit.id)) { var m = mine(); m[draftEdit.id] = st; setMine(m); WS.store.set('ws.guide.study', draftEdit.id); }
        else addStudy(st);
        mode = 'run'; draftEdit = null; draw(); return;
      }
      drawEdit();
    }
    function drawEdit() {
      var s = draftEdit.s, k = lk();
      var opts = function (st) {
        var cur = st.chapterNav ? '@chap' : st.open || '';
        return '<option value="">' + esc(L(S.eNone)) + '</option><option value="@chap"' + (cur === '@chap' ? ' selected' : '') + '>' + esc(L(S.eChap)) + '</option>' +
          OPENABLE.map(function (p) { return '<option value="' + p + '"' + (cur === p ? ' selected' : '') + '>' + esc(WS.itemName(p === 'ja' ? WS.ja() : p)) + '</option>'; }).join('');
      };
      el.innerHTML = '<h2>' + esc(L(draftEdit.id ? S.edit : S.newStudy)) + '</h2>' +
        '<p class="small">' + esc(L(S.eHint)) + '</p>' +
        '<label class="gfield">' + esc(L(S.eTitle)) + '<input data-f="title" value="' + esc(s.title[k] || '') + '"></label>' +
        '<label class="gfield">' + esc(L(S.eAuthor)) + '<input data-f="author" value="' + esc(s.author || '') + '"></label>' +
        s.steps.map(function (st, i) {
          return '<fieldset class="gstep"><legend>' + esc(L(S.step)) + ' ' + (i + 1) + '</legend>' +
            '<label class="gfield">' + esc(L(S.eH)) + '<input data-f="h" data-i="' + i + '" value="' + esc(st.h[k] || '') + '"></label>' +
            '<label class="gfield">' + esc(L(S.eWhy)) + '<textarea data-f="why" data-i="' + i + '">' + esc(st.why[k] || '') + '</textarea></label>' +
            '<label class="gfield">' + esc(L(S.eQ)) + '<textarea data-f="q" data-i="' + i + '">' + esc(st.q[k] || '') + '</textarea></label>' +
            '<label class="gfield">' + esc(L(S.eOpen)) + '<select data-f="open" data-i="' + i + '">' + opts(st) + '</select></label>' +
            '<div class="grow"><button class="btn" data-g="eup" data-i="' + i + '">' + esc(L(S.eUp)) + '</button>' +
            '<button class="btn" data-g="edown" data-i="' + i + '">' + esc(L(S.eDown)) + '</button>' +
            '<button class="btn" data-g="erm" data-i="' + i + '">' + esc(L(S.eRm)) + '</button></div></fieldset>';
        }).join('') +
        '<div class="grow"><button class="btn" data-g="eadd">' + esc(L(S.eAdd)) + '</button>' +
        '<button class="btn" data-g="esave">' + esc(L(S.eSave)) + '</button>' +
        '<button class="btn" data-g="ecancel">' + esc(L(S.eCancel)) + '</button></div>' +
        '<p id="gsay" class="small" role="status" aria-live="polite"></p>';
    }
    return { render: draw };
  }

  function markdown(st, notes, ref) {
    var out = ['# ' + L(st.title) + ': ' + ref, ''];
    st.steps.forEach(function (s, i) {
      out.push('## ' + (i + 1) + '. ' + L(s.h), '', '*' + L(S.q) + ':* ' + L(s.q), '', (notes[i] || '').trim() || '-', '');
    });
    return out.join('\n');
  }
  /* A clean page for paper: the study, the passage, each question and the answer (or space to write). */
  function printOut(st, notes, ref, byUser) {
    var w = window.open('', '_blank');
    if (!w) return;
    var lang = state.lang === 'en' ? 'en' : 'ja';
    w.document.write('<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><title>' + esc(L(st.title) + ' ' + ref) + '</title>' +
      '<style>body{font:15px/1.7 "Hiragino Mincho ProN","Yu Mincho",serif;max-width:46em;margin:2em auto;padding:0 1em;color:#000;background:#fff}' +
      'h1{font-size:20px}h2{font-size:16px;margin-top:1.4em;break-after:avoid}.q{color:#333}.a{white-space:pre-wrap;border-left:3px solid #999;padding-left:.6em;min-height:4em}' +
      '.why{font-size:13px;color:#444}.foot{margin-top:2em;font-size:12px;color:#555}</style></head><body>' +
      '<h1>' + esc(L(st.title)) + '：' + esc(ref) + '</h1>' +
      st.steps.map(function (s, i) {
        return '<h2>' + (i + 1) + '. ' + esc(L(s.h)) + '</h2>' + (L(s.why) ? '<p class="why">' + esc(L(s.why)) + '</p>' : '') +
          (L(s.q) ? '<p class="q"><b>' + esc(L(S.q)) + '：</b>' + esc(L(s.q)) + '</p>' : '') + '<div class="a">' + esc((notes[i] || '').trim()) + '</div>';
      }).join('') +
      '<p class="foot">' + esc(L(byUser ? S.mine : S.draft)) + '</p></body></html>');
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 300);
  }

  WS.guideStudies = { builtin: BUILTIN, pack: pack, unpack: unpack, clean: clean };  /* for tests */
  WS.panel({ id: 'guide', component: 'guide', title: { en: 'Guided study', ja: '学びの手引き' }, group: 'study', build: guide });
})();
