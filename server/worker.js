import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import Groq from "groq-sdk";
import "dotenv/config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const embedText = async (text) => {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
};

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    const data = JSON.parse(job.data);

    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    await client
      .createCollection("langchainjs-testing", {
        vectors: { size: 1536, distance: "Cosine" },
      })
      .catch(() => {});

    for (let i = 0; i < docs.length; i++) {
      const vector = await embedText(docs[i].pageContent);

      await client.upsert("langchainjs-testing", {
        points: [
          {
            id: `${i}`,
            payload: {
              text: docs[i].pageContent,
              metadata: docs[i].metadata,
            },
            vector,
          },
        ],
      });
    }
  },
  {
    concurrency: 50,
    connection: { host: "localhost", port: 6379 },
  }
);
