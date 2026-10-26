/* Hàm tiện ích dùng chung: chữ Hán, đánh dấu thành phần, đếm chữ, từ nối. */
const U = (() => {
  const MARK_RE = /【(\/?)(论点|论据|分析|结论)】/g;
  const MARK_CLASS = { 论点: 'ld', 论据: 'lj', 分析: 'fx', 结论: 'jl' };
  const MARK_VI = { 论点: 'luận điểm', 论据: 'luận cứ', 分析: 'phân tích', 结论: 'kết luận' };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stripMarks = t => String(t ?? '').replace(MARK_RE, '');
  // Một ô nhiều dòng: xuống dòng thật hoặc ngăn bằng “ || ” (tiện khi dán dữ liệu từ AI)
  const lines = t => String(t ?? '').split(/\r?\n|\s*\|\|\s*/).map(s => s.trim()).filter(Boolean);
  const hasPinyin = () => typeof window.pinyinPro !== 'undefined' && typeof window.pinyinPro.html === 'function';

  function textHtml(seg, pinyin) {
    return String(seg).split(/\r?\n/).map(line => {
      if (pinyin && hasPinyin() && /[一-鿿]/.test(line)) {
        try { return window.pinyinPro.html(esc(line)); } catch (e) { return esc(line); }
      }
      return esc(line);
    }).join('<br>');
  }

  /** Chuyển văn bản có 【论点】…【/论点】 thành HTML có gạch chân theo màu. */
  function rich(text, { marks = true, pinyin = Store.prefs.pinyin } = {}) {
    const src = String(text ?? '');
    let out = '', last = 0, open = null, m;
    MARK_RE.lastIndex = 0;
    while ((m = MARK_RE.exec(src))) {
      out += textHtml(src.slice(last, m.index), pinyin);
      last = MARK_RE.lastIndex;
      if (!marks) continue;
      if (m[1]) { if (open) { out += '</span>'; open = null; } }
      else { if (open) out += '</span>'; open = m[2]; out += `<span class="mk mk-${MARK_CLASS[m[2]]}" title="${MARK_VI[m[2]]}">`; }
    }
    out += textHtml(src.slice(last), pinyin);
    if (open) out += '</span>';
    return out;
  }
  function richClass(extra = '') { return `rich${Store.prefs.pinyin && hasPinyin() ? ' pinyin' : ''} ${extra}`.trim(); }

  function legend() {
    return `<div class="legend" aria-label="Chú giải">${Object.keys(MARK_CLASS).map(k =>
      `<span><i class="mk mk-${MARK_CLASS[k]}">${k}</i>${MARK_VI[k]}</span>`).join('')}</div>`;
  }

  function pinyinOf(text) {
    if (!hasPinyin()) return '';
    try { return window.pinyinPro.pinyin(String(text).replace(/[…]+/g, ' … '), { nonZh: 'consecutive' }); } catch (e) { return ''; }
  }

  /** Đếm chữ: total = mọi ký tự trừ khoảng trắng (kể cả khoảng trắng toàn góc), han = số chữ Hán. */
  function count(text) {
    const t = String(text ?? '');
    return {
      total: t.replace(/[\s　]/g, '').length,
      han: (t.match(/[㐀-鿿豈-﫿]/g) || []).length,
      paras: lines(t.replace(/　/g, ' ')).length
    };
  }

  /**
   * Lấy các từ khoá dùng để đếm một từ nối trong bài viết.
   * Vế đầu dài từ 2 chữ trở lên thì dùng luôn vế đó (随着……的发展 → 随着).
   * Vế đầu chỉ 1 chữ thì ghép hai vế đầu thành mẫu có khoảng trống (就……而言 → 就…而言),
   * để không bắt nhầm “而言” trong “总而言之”.
   */
  function phraseKeys(p) {
    if (p.match && String(p.match).trim()) return String(p.match).split(/[,，、]/).map(s => s.trim().replace(/…+/g, '…')).filter(Boolean);
    return String(p.zh || '').split('/').map(alt => {
      const segs = alt.split(/……|…|，|,|：|“|”|、|。|！|？|；|\s+/).map(s => s.trim()).filter(Boolean);
      if (!segs.length) return '';
      if (segs[0].length >= 2) return segs[0];
      return segs.length >= 2 ? segs[0] + '…' + segs[1] : '';
    }).filter(Boolean);
  }

  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function countOcc(text, key) {
    if (!key) return 0;
    if (key.includes('…')) {
      // Hai vế phải nằm trong cùng một câu, cách nhau tối đa 20 ký tự
      const re = new RegExp(key.split('…').map(reEsc).join('[^。！？\\n]{1,20}?'), 'g');
      return (text.match(re) || []).length;
    }
    let n = 0, i = 0;
    while ((i = text.indexOf(key, i)) !== -1) { n++; i += key.length; }
    return n;
  }

  /** Phân tích từ nối đã dùng trong bài, nhóm theo category. */
  function analyzeConnectives(text, phrases, repeatWarn = 3) {
    const t = String(text ?? '');
    const seen = new Set();
    const byCat = new Map();
    const repeated = [];
    let total = 0;
    (phrases || []).forEach(p => {
      phraseKeys(p).forEach(key => {
        if (seen.has(key)) return;
        seen.add(key);
        const n = countOcc(t, key);
        if (!n) return;
        total += n;
        const cat = String(p.category || 'Khác');
        if (!byCat.has(cat)) byCat.set(cat, []);
        byCat.get(cat).push({ key, n });
        if (n >= repeatWarn) repeated.push({ key, n });
      });
    });
    return { byCat, repeated, total };
  }

  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = sec => { const s = Math.max(0, Math.round(Math.abs(sec))); const h = Math.floor(s / 3600); return (h ? h + ':' + pad(Math.floor(s / 60) % 60) : Math.floor(s / 60)) + ':' + pad(s % 60); };
  const fmtDate = iso => { const d = new Date(iso); if (isNaN(d)) return ''; return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const num = (v, d = 0) => { const n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : d; };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  const ZH_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  return { MARK_RE, esc, stripMarks, lines, rich, richClass, legend, pinyinOf, hasPinyin, count, phraseKeys, analyzeConnectives, shuffle, fmtTime, fmtDate, num, debounce, el, ZH_NUM };
})();
