# 议论文 · Luyện viết nghị luận tiếng Trung (HSK 7–9)

Công cụ luyện các phương pháp luận chứng (论证方法) trong văn nghị luận tiếng Trung, phục vụ ôn thi HSK 3.0 cấp 7–9. Nội dung và bài làm lưu trên Google Sheet, đăng nhập bằng tài khoản do người quản trị tạo trong Sheet.

## Các phần luyện tập

| Mục | Làm gì |
|---|---|
| **Thư viện** | Định nghĩa, khung câu, đoạn mẫu có gạch chân thành phần (论点 / 论据 / 分析 / 结论) và lưu ý cho 6 phương pháp + mục kết hợp; kho từ nối, mẫu câu, thành ngữ có tìm kiếm. |
| **Nhận diện** | Đọc đoạn văn, chọn phương pháp được dùng (có thể nhiều đáp án), xem giải thích. Ưu tiên câu chưa làm; dùng phím số và Enter. |
| **Điền khung** | Cho sẵn luận điểm và phương pháp, viết một đoạn trên giấy kẻ ô 稿纸, so với bài mẫu, tự chấm theo checklist. |
| **Lập dàn ý** | Dàn ý 总分总: mở bài, luận điểm trung tâm, 2–5 luận điểm phụ (mỗi luận điểm một phương pháp), kết bài; gợi ý từ nối theo vị trí đang soạn. |
| **Viết bài** | Viết bài hoàn chỉnh có đồng hồ đếm ngược, đếm chữ, thống kê từ nối và cảnh báo lặp; mở kèm dàn ý đã lập. |
| **Lịch sử** | Tỉ lệ nhận diện đúng theo từng phương pháp, câu làm sai gần đây, danh sách bài đã lưu. |

Có pinyin bật/tắt, giao diện sáng/tối theo hệ thống, dùng được trên điện thoại. Bản nháp tự lưu trong trình duyệt cho tới khi nộp.

## Dữ liệu mẫu đi kèm

`data/HSK_YiLunWen_Sheet_mau.xlsx`: 7 mục phương pháp, 98 từ nối / mẫu câu / thành ngữ, 30 bài nhận diện, 20 bài điền khung có bài mẫu, 24 đề nghị luận có bản dịch và gợi ý góc lập luận, 17 tiêu chí tự chấm.

## Cấu trúc

```
index.html
css/style.css
js/config.js          ← dán URL Web App vào đây
js/util.js, store.js, api.js, ui.js, app.js
js/modules/           ← mỗi phần luyện tập một file
apps-script/Code.gs   ← mã backend, dán vào Apps Script của Sheet
data/                 ← file Sheet mẫu
docs/HUONG_DAN.md     ← cài đặt từng bước
docs/PROMPTS.md       ← prompt nhờ AI soạn thêm dữ liệu
```

Không cần build: HTML/CSS/JS thuần, chạy được bằng GitHub Pages hoặc mở trực tiếp `index.html`.

## Bắt đầu

Xem [docs/HUONG_DAN.md](docs/HUONG_DAN.md).
