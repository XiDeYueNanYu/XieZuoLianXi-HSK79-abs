/* Module 4: Điền khung (viết một đoạn luận chứng theo phương pháp chỉ định). #/khung  hoặc  #/khung/K001 */
window.Modules = window.Modules || {};
Modules.khung = {
  render(root, arg) {
    const frames = Store.content.frames || [];
    if (arg) {
      const f = frames.find(x => x.id === arg);
      if (f) return this.workspace(root, f);
    }
    this.list(root, frames);
  },

  list(root, frames) {
    const done = Store.marks('frame');
    const methods = (Store.content.methods || []).filter(m => frames.some(f => f.method === m.id));
    root.innerHTML = `
      <header class="page-head"><h1>Điền khung</h1>
        <p>Mỗi bài cho sẵn một luận điểm và một phương pháp. Bạn viết một đoạn luận chứng hoàn chỉnh, sau đó so với bài mẫu và tự chấm.</p></header>
      ${frames.length ? methods.map(m => `
        <section class="section">
          <h2><span class="zh">${U.esc(m.name_zh)}</span> <span class="muted" style="font-weight:400;font-size:14px">${U.esc(m.name_vi)}</span></h2>
          <ul class="topic-list">${frames.filter(f => f.method === m.id).map(f => `
            <li><a href="#/khung/${U.esc(f.id)}">
              <span class="topic-id">${U.esc(f.id)}</span>
              <span class="topic-title">${U.esc(f.thesis)}</span>
              <span class="topic-tags">${done.has(f.id) ? '<span class="done-mark">Đã làm</span>' : ''}<span class="tag">${U.num(f.min_chars)}–${U.num(f.max_chars)} chữ</span></span>
            </a></li>`).join('')}</ul>
        </section>`).join('') : '<div class="empty">Tab Frames trên Sheet chưa có bài nào.</div>'}`;
  },

  workspace(root, f) {
    const m = Store.method(f.method) || {};
    const min = U.num(f.min_chars, 0), max = U.num(f.max_chars, 0);
    const draftKey = 'frame.' + f.id;
    const draft = Store.draft(draftKey) || {};
    const started = draft.started || Date.now();
    const related = UI.phrasesBy(p => p.method === f.method);

    root.innerHTML = `
      <a class="back" href="#/khung">Danh sách bài điền khung</a>
      <div class="row" style="margin-bottom:10px">${UI.methodChip(f.method)}<span class="muted small">${U.esc(f.id)}</span></div>
      <p class="thesis ${Store.prefs.pinyin && U.hasPinyin() ? 'rich pinyin' : ''}">${U.rich(f.thesis, { marks: false })}</p>
      <p class="req">${U.esc(f.requirement)}</p>
      <div class="ws" style="margin-top:22px">
        <div class="stack">
          <div id="editor"></div>
          <div class="row">${UI.indentToggle()}<span class="spacer"></span>
            <button type="button" class="btn" id="btn-sample">So với bài mẫu</button>
            <button type="button" class="btn btn-primary" id="btn-save">Tự chấm và lưu</button></div>
          <div id="compare" hidden></div>
        </div>
        <aside class="ws-side">
          <div class="side-block meter">
            <h3>Số chữ</h3>
            <div class="meter-num" id="m-num">0 <small>/ ${min}–${max}</small></div>
            <div class="meter-bar" id="m-bar"><i style="width:0"></i></div>
            <p class="small muted" id="m-sub"></p>
          </div>
          <details class="fold" open><summary>Khung câu của ${U.esc(m.name_zh || f.method)}</summary>
            <div class="fold-body"><ul class="frames">${U.lines(m.frames).map(x => `<li style="font-size:15px">${U.esc(x)}</li>`).join('')}</ul></div></details>
          ${related.length ? `<details class="fold"><summary>Từ nối gợi ý</summary><div class="fold-body">${UI.phraseButtons(related)}<p class="small muted" style="margin-top:8px">Bấm để chèn vào bài; phần “……” được chọn sẵn để gõ đè.</p></div></details>` : ''}
          ${f.hint ? `<details class="fold"><summary>Gợi ý tư liệu</summary><div class="fold-body small">${U.esc(f.hint)}</div></details>` : ''}
        </aside>
      </div>`;

    const meter = text => {
      if (!root.querySelector('#m-num')) return;
      const c = U.count(text);
      root.querySelector('#m-num').innerHTML = `${c.total} <small>/ ${min}–${max}</small>`;
      const bar = root.querySelector('#m-bar');
      bar.querySelector('i').style.width = Math.min(100, max ? c.total / max * 100 : 0) + '%';
      bar.classList.toggle('over', max && c.total > max);
      root.querySelector('#m-sub').textContent = `${c.han} chữ Hán. ` + (c.total < min ? `Còn thiếu ${min - c.total} chữ.` : c.total > max ? `Vượt ${c.total - max} chữ.` : 'Đạt yêu cầu.');
    };
    let closed = false;
    const save = U.debounce(v => { if (!closed) Store.saveDraft(draftKey, { text: v, started }); }, 400);
    const ed = UI.gaozhi({
      value: draft.text || '', rows: 8,
      placeholder: 'Viết đoạn văn ở đây. Câu đầu nêu luận điểm, sau đó luận cứ và phân tích.',
      onInput: v => { meter(v); save(v); }
    });
    root.querySelector('#editor').appendChild(ed.el);
    meter(ed.value);

    root.querySelector('.ws-side').addEventListener('click', e => {
      const b = e.target.closest('[data-insert]'); if (b) ed.insert(b.dataset.insert);
    });
    root.querySelector('#btn-sample').addEventListener('click', e => {
      const box = root.querySelector('#compare');
      box.hidden = !box.hidden;
      e.currentTarget.textContent = box.hidden ? 'So với bài mẫu' : 'Ẩn bài mẫu';
      if (!box.hidden) {
        box.innerHTML = `<div class="section" style="padding-top:8px"><div class="sample-tools"><h2>Bài mẫu tham khảo</h2>${U.legend()}</div>
          <div class="sample-box"><p class="${U.richClass()}">${U.rich(f.sample)}</p></div>
          <p class="small muted" style="margin-top:10px">Bài mẫu có ${U.count(U.stripMarks(f.sample)).total} chữ. Thử tự gạch chân bài của bạn theo bốn thành phần trên: thành phần nào còn thiếu?</p></div>`;
      }
    });
    root.querySelector('#btn-save').addEventListener('click', async e => {
      const btn = e.currentTarget;
      const text = ed.value.trim();
      const c = U.count(text);
      if (!c.han) { UI.toast('Bài viết đang trống.', 'bad'); return; }
      const res = await UI.checklist('frame', { intro: `Bài có ${c.total} chữ (yêu cầu ${min}–${max}).` });
      if (!res) return;
      btn.disabled = true; btn.textContent = 'Đang lưu…';
      try {
        const here = location.hash;
        await Api.call('submit', {
          type: 'frame', refId: f.id, title: f.thesis, content: text, charCount: c.total,
          durationSec: Math.round((Date.now() - started) / 1000),
          checklistDone: res.done, checklistTotal: res.total, checklistMissed: res.missed, selfScore: res.selfScore, note: res.note,
          data: { method: f.method }
        });
        closed = true;
        Store.clearDraft(draftKey);
        Store.addMark('frame', f.id);
        Store.setHistory(null);
        UI.toast('Đã lưu bài lên Sheet.');
        if (location.hash === here) location.hash = '#/khung';
      } catch (err) {
        UI.toast('Chưa lưu được: ' + err.message + ' Bản nháp vẫn được giữ trên máy.', 'bad');
        btn.disabled = false; btn.textContent = 'Tự chấm và lưu';
      }
    });
  }
};
