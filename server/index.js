import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import Groq from "groq-sdk";
import "dotenv/config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const queue = new Queue("file-upload-queue", {
  connection: { host: "localhost", port: 6379 },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  return res.json({ status: "All Good!" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  return res.json({ message: "uploaded" });
});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.message;

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: userQuery,
  });

  const vector = embedding.data[0].embedding;

  const search = await qdrant.query("langchainjs-testing", {
    vector,
    top: 3,
  });

  const SYSTEM = `
You are a helpful assistant. Use only the context to answer.
Context:
${JSON.stringify(search)}
`;

  const chat = await groq.chat.completions.create({
    model: "llama-3.1-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userQuery },
    ],
  });

  return res.json({
    message: chat.choices[0].message.content,
    docs: search,
  });
});

app.listen(8000, () => console.log(`Server started on PORT:8000`));
