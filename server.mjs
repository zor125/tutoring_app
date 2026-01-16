import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import PDFDocument from "pdfkit";

dotenv.config();

const app = express();
app.use(express.json());

// 정적 파일 제공
app.use(express.static("public"));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/summarize", async (req, res) => {
  try {
    const script = (req.body?.script || "").trim();
    if (!script) return res.status(400).send("script가 비어있음");

    // ✅ 너가 말한 "프롬프팅된 과외기록지 형식"으로 강제
    const prompt = `
너는 과외 선생님의 수업 녹취를 과외 기록지로 정리하는 비서야.
사용자가 준 전사에는 한국어 설명 중 영어 단어/표현이 한국어 발음으로 섞여 있을 수 있다.

규칙 : 
-아래 '과외 기록지 템플릿' 형식 그대로 출력해.
-불필요한 서론/사족 없이 기록지 본문만 출력해.
-과외 템플릿에 들어가는 국어, 영어, 수학, 과학 과목 중 이번 수업에 해당하는 과목만 작성해.
- 의미를 바꾸지 말 것.
- 문맥상 확실한 경우에만 영어 표현을 자연스럽게 복원/정리할 것.
- 확신이 낮으면 원문을 유지하고 괄호로 추정어를 병기: 예) 서머라이즈(summarize)
- 최종 출력은 사용자가 쉽게 첨삭할 수 있도록 "보기 좋은 일반 텍스트"로 출력할 것.

과외 기록지 템플릿과 완성된 예시는 아래와 같아.

[과외 기록지 템플릿]
### 과외 진도
- **국어**: [교재명 + Day or 내용]
- **영어**: [교재명 + 챕터 + 내용]

---
### 과외 내용

#### 국어
- [내용별 요약 정리]

#### 영어
- [진도 또는 숙제 방식 설명]
- [예시 해석 방식 포함 가능]

---
### 숙제

- **국어**
    - [구체적인 숙제 내용]
- **영어**
    - [구체적인 숙제 내용]
    
[과외 기록지 예시]
**과외 진도**

- 천일문 챕터 5 복습 및 4형식/5형식 개념 학습
- 문장 형식 1~5형식 정리
- 전치사 **on / off** 학습 (의미 확장 포함)
- 숙제 검사 및 문장 구조 분석법 반복 훈련

---

**과외 내용**

**문장 형식 정리**

| 형식 | 구조 | 해석/개념 정리 |
| --- | --- | --- |
| 1형식 | S + V | 주어가 동사하다 (*혼자 드립*) |
| 2형식 | S + V + C | 주어 = 보어 (*개인기: 주어 설명*) |
| 3형식 | S + V + O | 주어가 목적어에게 동작 (*패스 한 번*) |
| 4형식 | S + V + IO + DO | 주어가 간목에게 직목을 준다 (*패스 두 번*) |
| 5형식 | S + V + O + OC | 목적어와 보어가 같다 (*목적어 개인기*) |
- **4형식 vs 5형식 구별법**:
    
    → 목적어와 보어 사이에 **"같다"** 선 그어보기
    
    → 앞뒤 같으면 5형식, 다르면 4형식
    

**문장 구조 분석 방법**

- 숙제 문장들에 대해 **S(주어), V(동사), O(목적어), C(보어)** 표시
- 안 되는 문장은 **형광펜** 표시 → 수업 시간에 추가 설명

**전치사 On / Off 의미 확장**

✅ **on (접촉/영향/지속)**

- 붙어 있음 → **접촉**
- 영향을 줌 → **영향**
- 계속 붙어 있음 → **지속/의존**

✅ **off (분리/중단/강조)**

- 물리적 **분리**, **단절**
- 관계나 상황의 **중단**, **완결**
- 눈에 띄게 **강조** (떨어져 있어 눈에 들어옴)

→ **예시 비유**: 친구 관계/발표 상황을 통해 직관적으로 설명

---

**숙제**

- **천일문 챕터 5 (p.72–75)**
    - 해석: 굵은 문장 중심
    - 문장 구조 분석: **S/V/O/C** 구분
    - 해석 안 되는 문장은 **형광펜** 표시
    - 수업 필기 순서대로 정리
- 다음 시간 예고: **전치사 add / about / around** 개념 학습 예정


[수업 전체 스크립트]
${script}
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      // 필요하면 길이/추론 조절
      // reasoning: { effort: "low" },
    });

    res.json({ summary: response.output_text });
  } catch (e) {
    res.status(500).send(e?.message || "server error");
  }
});

app.post("/api/pdf", (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).send("text가 비어있음");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="tutoring.pdf"');

    const doc = new PDFDocument({ margin: 50 });

    doc.font("fonts/NotoSansKR-Regular.ttf");
    
    doc.pipe(res);

    doc.fontSize(18).text("과외 기록지", { align: "center" });
    doc.moveDown();

    doc.fontSize(11).text(text, {
      align: "left",
      lineGap: 4,
    });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).send(e?.message || "PDF 생성 서버 에러");
  }
});

app.listen(5500, () => {
  console.log("Server running: http://localhost:5500");
});


//node server.mjs
//서버 실행 명령어
