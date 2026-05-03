import express from "express";
import Stripe from "stripe";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());

// ✅ 解决跨域
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ 免费次数限制（内存版）
const usageMap = new Map();
const FREE_LIMIT = 10;

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getIP(req) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
}

// ✅ 首页
app.get("/", (req, res) => {
  res.send("FluentReply API running 🚀");
});

// ✅ 创建 Stripe 支付
app.post("/api/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: process.env.WEBSITE_URL + "?success=true",
      cancel_url: process.env.WEBSITE_URL
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ AI生成
app.post("/api/generate", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.json({ result: "请输入内容" });
    }

    const ip = getIP(req);
    const today = getToday();
    const key = `${ip}_${today}`;

    const count = usageMap.get(key) || 0;

    // ❗限制免费次数
    if (count >= FREE_LIMIT) {
      return res.json({
        result: "🚫 今日免费次数已用完，请升级 Pro",
        limit: true
      });
    }

    // 👉 调用 OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an expert English writing assistant.

- Translate Chinese to natural American English
- Improve English to sound native
- Follow style if provided

Only output final sentence.
`
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.json({
        result: "OpenAI错误：" + data.error.message
      });
    }

    const result = data.choices?.[0]?.message?.content;

    // 👉 计数+1
    usageMap.set(key, count + 1);

    res.json({
      result: result || "无结果",
      remaining: FREE_LIMIT - count - 1
    });

  } catch (err) {
    res.json({
      result: "服务器错误：" + err.message
    });
  }
});

// ✅ 启动
app.listen(10000, () => {
  console.log("Server running 🚀");
});
