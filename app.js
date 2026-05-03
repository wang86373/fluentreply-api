import express from "express";

const app = express();

app.use(express.json());

// ✅ 解决跨域（CORS）
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ 测试接口
app.get("/", (req, res) => {
  res.send("FluentReply API is running 🚀");
});

// ✅ 核心API
app.post("/api/generate", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.json({ result: "请输入内容" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an expert English writing assistant.

Your job:
- Rewrite or translate the user's message into natural, fluent American English.
- If the input is Chinese, translate it into natural English.
- If the input is already English, improve it to sound more natural and native.

Style rules:
- Default: natural, casual, native-like
- If the user includes a style keyword, follow it:
  Professional / Casual / Friendly / Confident / Romantic / Business

Output rules:
- Only return the final rewritten sentence
- Do NOT explain
- Do NOT add extra commentary
`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    // ❗处理 OpenAI 错误
    if (data.error) {
      console.error("OpenAI Error:", data.error);
      return res.json({
        result: "OpenAI 错误：" + data.error.message
      });
    }

    const result = data.choices?.[0]?.message?.content;

    res.json({
      result: result || "未生成结果"
    });

  } catch (error) {
    console.error("Server Error:", error);

    res.status(500).json({
      result: "服务器错误：" + error.message
    });
  }
});

// ✅ 启动服务
app.listen(10000, () => {
  console.log("Server running on port 10000 🚀");
});
