# Bộ prompt hỏi AI để bổ sung dữ liệu

Mỗi prompt dưới đây tạo ra các dòng dữ liệu đúng cột của một tab trên Google Sheet. Dùng được với Claude, ChatGPT, Gemini…

## Cách dùng chung

1. Mở tab cần bổ sung trên Sheet, xem **mã (id) cuối cùng** (ví dụ `N030`) và danh sách nội dung đã có để tránh trùng.
2. Sao chép prompt, thay các chỗ trong `[ngoặc vuông]`.
3. AI trả về một khối mã dạng **TSV** (các cột ngăn bằng phím Tab). Bấm nút sao chép của khối mã.
4. Trên Sheet, bấm vào ô cột A của dòng trống đầu tiên rồi dán (Ctrl+V / Cmd+V). Google Sheet tự tách vào đúng cột.
5. **Đọc lại trước khi dùng**, nhất là dẫn chứng lịch sử, số liệu và danh ngôn (xem prompt số 6). AI có thể nhớ sai.
6. Trong ứng dụng, bấm **Tải lại dữ liệu**.

Quy ước trong ô (đã có sẵn trong các prompt):

- Một ô có nhiều dòng (khung câu, lưu ý, gợi ý…): ngăn các dòng bằng ` || `. Ứng dụng tự tách thành từng dòng.
- Đánh dấu thành phần đoạn văn: `【论点】…【/论点】`, `【论据】…【/论据】`, `【分析】…【/分析】`, `【结论】…【/结论】`. Không lồng nhãn vào nhau.
- Mã phương pháp: `juli` 举例论证, `daoli` 道理论证, `duibi` 对比论证, `biyu` 比喻论证, `yinguo` 因果论证, `jiashe` 假设论证, `zonghe` 综合运用.

Nếu Google Sheet dán cả dòng vào một ô duy nhất: dán lại bằng **Chỉnh sửa → Dán đặc biệt → Chỉ dán giá trị**, hoặc dán vào Notepad trước để chắc chắn ký tự Tab còn nguyên.

---

## 1. Bài nhận diện phương pháp (tab Identify)

```text
Bạn là giáo viên dạy viết nghị luận tiếng Trung (议论文) cho người Việt ôn thi HSK 3.0 cấp 7–9.

Hãy soạn [10] đoạn văn ngắn để luyện NHẬN DIỆN phương pháp luận chứng.

Yêu cầu nội dung:
- Mỗi đoạn 80–160 chữ Hán, văn phong nghị luận chuẩn mực, từ vựng cấp HSK 7–9, có thành ngữ khi phù hợp.
- Mỗi đoạn dùng 1 hoặc 2 phương pháp. Mã phương pháp: juli (举例论证), daoli (道理论证), duibi (对比论证), biyu (比喻论证), yinguo (因果论证), jiashe (假设论证).
- Phân bố đều các phương pháp. Khoảng 1/3 số đoạn dùng 2 phương pháp. Có ít nhất 2 đoạn “bẫy” dễ nhầm, ví dụ “如果说……那么……” dùng để đối chiếu chứ không phải giả định, hoặc “如果把……比作……” là ví von.
- Chủ đề đa dạng: [giáo dục, công nghệ, môi trường, văn hoá, kinh tế, quan hệ xã hội, nghề nghiệp…].
- Dẫn chứng (nhân vật, sự kiện, danh ngôn) phải có thật và chính xác. Không chắc thì dùng ví dụ khái quát, không nêu tên và số liệu cụ thể.
- Không trùng với các đoạn đã có, có luận điểm: [dán danh sách câu luận điểm đã có, hoặc ghi “không có”].

Đánh dấu thành phần trong đoạn bằng các nhãn: 【论点】…【/论点】, 【论据】…【/论据】, 【分析】…【/分析】, 【结论】…【/结论】. Mỗi phần của đoạn nằm trong đúng một nhãn, không lồng nhãn.

Định dạng đầu ra: MỘT khối mã TSV duy nhất, KHÔNG có dòng tiêu đề, mỗi đoạn một dòng, 6 cột ngăn bằng ký tự Tab:
id	passage	answer	explanation	topic	active
- id: tiếp nối từ [N030], tức N031, N032…
- passage: đoạn văn có nhãn đánh dấu, viết liền trên một dòng.
- answer: mã phương pháp; nếu hai thì ngăn bằng dấu phẩy, không có khoảng trắng (ví dụ juli,daoli).
- explanation: giải thích bằng tiếng Việt, 1–2 câu, chỉ ra dấu hiệu nhận biết (từ khoá, cấu trúc).
- topic: chủ đề bằng tiếng Việt, 1–3 từ.
- active: có
Không dùng ký tự Tab hay xuống dòng bên trong một ô. Sau khối mã, liệt kê ngắn gọn những dẫn chứng bạn chưa chắc chắn để tôi kiểm tra.
```

---

## 2. Bài điền khung (tab Frames)

```text
Bạn là giáo viên dạy viết nghị luận tiếng Trung (议论文) cho người Việt ôn thi HSK 3.0 cấp 7–9.

Hãy soạn [8] bài tập “điền khung”: cho sẵn một luận điểm và một phương pháp luận chứng, học viên viết một đoạn văn hoàn chỉnh.

Phương pháp cần soạn: [ví dụ: 2 bài juli, 2 bài duibi, 2 bài jiashe, 2 bài zonghe]
Mã phương pháp: juli (举例论证), daoli (道理论证), duibi (对比论证), biyu (比喻论证), yinguo (因果论证), jiashe (假设论证), zonghe (综合运用: kết hợp 2–3 phương pháp).
Không trùng với các luận điểm đã có: [dán danh sách luận điểm đã có].

Mỗi bài gồm:
- thesis: luận điểm bằng tiếng Trung, một câu khẳng định ngắn gọn.
- requirement: yêu cầu bằng tiếng Việt, cụ thể và kiểm tra được (số chữ, số ví dụ, phải có câu phân tích, phải dùng cấu trúc nào…).
- min_chars, max_chars: khoảng số chữ. Đơn phương pháp thường 140–240; zonghe 180–280.
- hint: gợi ý tư liệu bằng tiếng Việt (nhân vật, sự kiện, câu trích dẫn có thể dùng), kèm chữ Hán khi cần.
- sample: đoạn văn mẫu tiếng Trung đạt chuẩn cấp 7–9, độ dài NẰM TRONG khoảng min_chars–max_chars (tính cả dấu câu), có nhãn 【论点】【论据】【分析】【结论】 bao từng phần, không lồng nhãn.
Dẫn chứng và trích dẫn trong bài mẫu phải chính xác; không chắc thì dùng ví dụ khái quát.

Định dạng đầu ra: MỘT khối mã TSV duy nhất, KHÔNG có dòng tiêu đề, mỗi bài một dòng, 9 cột ngăn bằng Tab:
id	method	thesis	requirement	min_chars	max_chars	hint	sample	active
- id: tiếp nối từ [K020], tức K021, K022…
- active: có
Không dùng ký tự Tab hay xuống dòng bên trong một ô. Sau khối mã, ghi số chữ thực tế của từng bài mẫu và liệt kê dẫn chứng bạn chưa chắc chắn.
```

---

## 3. Đề bài nghị luận (tab Topics)

```text
Bạn là người ra đề viết nghị luận tiếng Trung (议论文) theo định hướng HSK 3.0 cấp 7–9.

Hãy soạn [10] đề bài mới.

Yêu cầu:
- Đề có tính tranh luận, gắn với xã hội đương đại, cho phép nhiều lập trường. Nhóm chủ đề ưu tiên: [công nghệ, giáo dục, môi trường, văn hoá truyền thống, nghề nghiệp, quan hệ gia đình, tiêu dùng, đô thị hoá…].
- prompt_zh: phần dẫn liệu 2–4 câu (hiện tượng, hai luồng ý kiến, câu danh ngôn hoặc một câu chuyện ngắn), sau đó là câu lệnh viết (请以“……”为题 / 请谈谈你的看法…). Kết thúc bằng: 要求：观点明确，论证充分，结构完整，[600]字左右。
- prompt_vi: dịch prompt_zh sang tiếng Việt (bỏ câu 要求).
- title: nhan đề ngắn bằng tiếng Trung (2–10 chữ).
- tags: 1–2 chủ đề bằng tiếng Việt, ngăn bằng dấu phẩy.
- hints: 3 gợi ý góc lập luận bằng tiếng Việt, mỗi gợi ý ghi rõ phương pháp luận chứng phù hợp (ví dụ: “(举例)”), có 1 gợi ý về nhượng bộ hoặc phản đề. Ngăn các gợi ý bằng “ || ”.
- Không trùng với các đề đã có: [dán danh sách nhan đề đã có].

Định dạng đầu ra: MỘT khối mã TSV duy nhất, KHÔNG có dòng tiêu đề, mỗi đề một dòng, 9 cột ngăn bằng Tab:
id	title	prompt_zh	prompt_vi	tags	min_chars	time_min	hints	active
- id: tiếp nối từ [D024], tức D025, D026…
- min_chars: [600]
- time_min: [40]
- active: có
Không dùng ký tự Tab hay xuống dòng bên trong một ô.
```

---

## 4. Từ nối, mẫu câu, thành ngữ (tab Phrases)

```text
Bạn là giáo viên tiếng Trung, chuyên dạy văn nghị luận (议论文) cấp HSK 7–9 cho người Việt.

Hãy bổ sung [20] mục vào kho từ nối, mẫu câu và thành ngữ dùng trong văn nghị luận.

Nhóm cần bổ sung: [ví dụ: 10 mục “让步转折 (Nhượng bộ – chuyển ý)”, 10 mục “成语 (Thành ngữ hay dùng)”]
Tên nhóm phải viết y hệt một trong các tên sau (hoặc tên nhóm mới nếu tôi yêu cầu):
开头引题 (Mở bài) | 提出论点 (Nêu luận điểm) | 举例 (Dẫn ví dụ) | 引用 (Trích dẫn) | 对比 (Đối chiếu) | 比喻 (Ví von) | 因果 (Nhân quả) | 假设 (Giả định) | 让步转折 (Nhượng bộ – chuyển ý) | 递进 (Tăng tiến) | 过渡列举 (Chuyển ý – liệt kê) | 结尾 (Kết bài) | 成语 (Thành ngữ hay dùng)

Yêu cầu:
- Ưu tiên cách diễn đạt mang màu sắc văn viết, phù hợp cấp 7–9, tránh khẩu ngữ.
- zh: mẫu câu, dùng “……” cho chỗ trống (ví dụ: 与其……，不如……). Nhiều biến thể tương đương thì ngăn bằng “/” (ví dụ: 假如/倘若).
- vi: nghĩa và cách dùng bằng tiếng Việt, ngắn gọn; ghi chú sắc thái nếu có (trang trọng, kết quả tiêu cực…).
- example: một câu ví dụ tiếng Trung tự nhiên, đúng ngữ cảnh nghị luận.
- method: mã phương pháp liên quan nếu có (juli, daoli, duibi, biyu, yinguo, jiashe), để trống nếu dùng chung.
- match: để trống.
- Không trùng các mục đã có: [dán cột zh của tab Phrases].

Định dạng đầu ra: MỘT khối mã TSV duy nhất, KHÔNG có dòng tiêu đề, mỗi mục một dòng, 8 cột ngăn bằng Tab (cột trống vẫn phải giữ ký tự Tab):
id	category	zh	vi	example	method	match	active
- id: tiếp nối từ [P098], tức P099, P100…
- active: có
```

---

## 5. Thêm hoặc làm giàu một phương pháp (tab Methods)

Dùng khi muốn viết lại phần giải thích của một phương pháp, hoặc thêm một mục học mới (ví dụ 归谬法, 引申论证…).

```text
Bạn là giáo viên dạy viết nghị luận tiếng Trung cho người Việt ôn HSK 3.0 cấp 7–9.

Hãy soạn nội dung thư viện cho phương pháp: [ví dụ: 归谬法 – phép quy mậu / hoặc: viết lại 对比论证 sâu hơn].

Định dạng đầu ra: MỘT khối mã TSV một dòng, KHÔNG có dòng tiêu đề, 9 cột ngăn bằng Tab:
id	name_zh	name_vi	quiz	definition	frames	example	tips	active
- id: mã bằng chữ thường không dấu, ví dụ guimiu.
- quiz: “không” (phương pháp mới chưa có bài nhận diện), hoặc “có” nếu tôi sẽ thêm bài nhận diện cho nó.
- definition: 2–3 câu tiếng Việt, nêu bản chất và khi nào nên dùng.
- frames: 4 khung câu tiếng Trung, dùng “……” cho chỗ trống, ngăn bằng “ || ”.
- example: một đoạn mẫu 150–220 chữ, có nhãn 【论点】【论据】【分析】【结论】, không lồng nhãn.
- tips: 4 lưu ý bằng tiếng Việt, ngăn bằng “ || ”.
- active: có
Không dùng ký tự Tab hay xuống dòng bên trong một ô.
```

---

## 6. Soát lỗi dữ liệu trước khi dùng

Nên chạy prompt này với một AI **khác** với AI đã soạn dữ liệu, để nó không tự chấm bài của chính mình.

```text
Bạn là biên tập viên tiếng Trung, kiêm giáo viên luyện thi HSK 7–9. Hãy soát các dòng dữ liệu dưới đây (định dạng TSV, cột: [ghi tên các cột]).

Kiểm tra từng dòng:
1. Chữ Hán: lỗi chính tả, dùng từ sai, câu không tự nhiên hoặc không đúng văn phong nghị luận.
2. Sự thật: nhân vật, niên đại, sự kiện, số liệu có chính xác không. Danh ngôn có đúng nguyên văn và đúng người nói không.
3. Đáp án (nếu có cột answer hoặc method): phương pháp luận chứng ghi trong đáp án có thực sự là phương pháp chính của đoạn không; có phương pháp nào bị sót không.
4. Nhãn 【论点】【论据】【分析】【结论】: có đóng mở đúng cặp, không lồng nhau, bao đúng phần nội dung không.
5. Số chữ (nếu có min_chars/max_chars): bài mẫu có nằm trong khoảng không.

Chỉ liệt kê các dòng có vấn đề, theo dạng: id | vấn đề | đề xuất sửa. Nếu không chắc một dẫn chứng là đúng, nói rõ là không chắc thay vì đoán. Cuối cùng, đưa lại các dòng đã sửa dưới dạng một khối TSV (giữ nguyên id và số cột).

Dữ liệu:
[dán các dòng]
```

---

## 7. Nhận xét bài viết đã nộp (ngoài phần dữ liệu)

Ứng dụng chỉ có tự chấm theo checklist. Muốn có nhận xét chi tiết, mở bài trong trang **Lịch sử** (hoặc cột `content` của tab Submissions), sao chép rồi dùng prompt sau.

```text
Bạn là giám khảo chấm viết HSK 3.0 cấp 7–9 và là giáo viên dạy nghị luận tiếng Trung cho người Việt.

Đề bài: [dán đề]
Yêu cầu: [600] chữ, [40] phút. Thời gian thực tế của tôi: [..] phút.
Bài viết:
[dán bài]

Hãy nhận xét bằng tiếng Việt theo thứ tự:
1. Luận điểm trung tâm: có rõ ràng, bám đề không.
2. Bố cục 总分总 và quan hệ giữa các luận điểm phụ.
3. Từng đoạn thân bài: dùng phương pháp luận chứng nào, luận cứ có thuyết phục không, có “kể mà không bàn” không.
4. Ngôn ngữ: liệt kê tối đa 10 lỗi (câu gốc → câu sửa → lý do); từ nối bị lặp; chỗ có thể nâng cấp bằng cách nói văn viết hoặc thành ngữ phù hợp.
5. Ước lượng mức độ so với yêu cầu cấp 7–9 và 3 việc cần ưu tiên cải thiện.
Cuối cùng, viết lại MỘT đoạn yếu nhất thành phiên bản tốt hơn, giữ nguyên ý của tôi.
```
