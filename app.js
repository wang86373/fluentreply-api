import express from "express";

const app = express();
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  const { text } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Rewrite in natural English." },
        { role: "user", content: text }
      ]
    })
  });

  const data = await response.json();
  res.json({ result: data.choices[0].message.content });
});

app.listen(10000, () => {
  console.log("Server running");
});
