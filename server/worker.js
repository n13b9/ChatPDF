import { Worker } from "bullmq";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantClient } from "@qdrant/js-client-rest";
import "dotenv/config";

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const embedChunk = async (embeddings, text, attempt = 1) => {
  try {
    const result = await Promise.race([
      embeddings.embedDocuments([text]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Embedding timeout")), 20000)
      ),
    ]);
    return result[0];
  } catch (err) {
    if (attempt >= 3) throw err;
    console.log(`Retrying embedding (attempt ${attempt})...`);
    await new Promise(res => setTimeout(res, 1500));
    return embedChunk(embeddings, text, attempt + 1);
  }
};

const worker = new Worker(
  "file-upload-queue",
  async job => {
    console.log("Job received:", job.data);
    const data = JSON.parse(job.data);

    console.log("Loading PDF:", data.path);
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();
    console.log("PDF loaded. Chunks:", docs.length);

    console.log("Creating collection if needed...");
    await client
      .createCollection("langchainjs-testing", {
        vectors: { size: 384, distance: "Cosine" },
      })
      .catch(() => {});
    console.log("Collection ready.");

    console.log("Initializing embeddings...");
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      provider: "hf-inference",
      model: "sentence-transformers/all-MiniLM-L6-v2",
    });
    console.log("Embedding model ready.");

    console.log("Uploading chunks...");
    for (let i = 0; i < docs.length; i++) {
      console.log(`Embedding chunk ${i}`);
      const vector = await embedChunk(embeddings, docs[i].pageContent);
      console.log(`Embedding complete for chunk ${i}`);

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

      console.log(`Uploaded chunk ${i}`);
    }

    console.log("All docs added to Qdrant Cloud");
  },
  {
    concurrency: 100,
    connection: { host: "localhost", port: 6379 },
  }
);
