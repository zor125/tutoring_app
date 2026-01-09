import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

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
아래 '과외 기록지 템플릿' 형식 그대로 출력해.
불필요한 서론/사족 없이 기록지 본문만 출력해.

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
    - [포인트당 몇 문장 해석, 직독직해 방식 여부 등]

[수업 전체 스크립트]
${script}
`.trim();

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: prompt,
      // 필요하면 길이/추론 조절
      // reasoning: { effort: "low" },
    });

    res.json({ summary: response.output_text });
  } catch (e) {
    res.status(500).send(e?.message || "server error");
  }
});

app.listen(5500, () => {
  console.log("Server running: http://localhost:5500");
});
