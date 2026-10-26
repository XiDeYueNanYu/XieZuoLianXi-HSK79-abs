/* Danh sách đề dùng chung cho Lập dàn ý và Viết bài. */
const TopicPicker = {
  render(root, { base, title, intro, markKind, allowFree = false }) {
    const topics = Store.content.topics || [];
    const tags = [...new Set(topics.flatMap(t => String(t.tags || '').split(/[,，]/).map(s => s.trim()).filter(Boolean)))];
    const done = Store.marks(markKind);
    let tag = '', q = '';
    root.innerHTML = `
      <header class="page-head"><h1>${U.esc(title)}</h1><p>${U.esc(intro)}</p></header>
      <div class="row" style="margin-bottom:12px">
        <input type="search" id="tp-q" placeholder="Tìm đề" style="max-width:280px">
        <select id="tp-tag" style="width:auto"><option value="">Mọi chủ đề</option>${tags.map(t => `<option>${U.esc(t)}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button type="button" class="btn" id="tp-rand">Chọn ngẫu nhiên đề chưa làm</button>
        ${allowFree ? `<a class="btn" href="#/${base}/tu-chon">Đề tự chọn</a>` : ''}
      </div>
      <ul class="topic-list" id="tp-list"></ul>`;
    const draw = () => {
      const qq = q.trim().toLowerCase();
      const list = topics.filter(t => (!tag || String(t.tags || '').includes(tag)) &&
        (!qq || [t.title, t.prompt_zh, t.prompt_vi, t.tags].some(v => String(v || '').toLowerCase().includes(qq))));
      root.querySelector('#tp-list').innerHTML = list.length ? list.map(t => `
        <li><a href="#/${base}/${U.esc(t.id)}">
          <span class="topic-id">${U.esc(t.id)}</span>
          <span><span class="topic-title">${U.esc(t.title)}</span></span>
          <span class="topic-tags">${done.has(t.id) ? '<span class="done-mark">Đã làm</span>' : ''}${String(t.tags || '').split(/[,，]/).filter(s => s.trim()).map(s => `<span class="tag">${U.esc(s.trim())}</span>`).join('')}</span>
        </a></li>`).join('') : '<li class="empty">Không có đề nào khớp.</li>';
    };
    root.querySelector('#tp-q').addEventListener('input', U.debounce(e => { q = e.target.value; draw(); }, 150));
    root.querySelector('#tp-tag').addEventListener('change', e => { tag = e.target.value; draw(); });
    root.querySelector('#tp-rand').addEventListener('click', () => {
      const pool = topics.filter(t => !done.has(t.id));
      const pick = U.shuffle(pool.length ? pool : topics)[0];
      if (pick) location.hash = `#/${base}/${pick.id}`;
    });
    draw();
  }
};
