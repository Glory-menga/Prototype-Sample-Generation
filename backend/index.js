import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Replicate from "replicate";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  try {
    const input = {
      prompt,
      model_version: "stereo-large", // you can also try "large" or "melody-large"
      duration: 16, // duration in seconds (your request)
      output_format: "mp3",
      normalization_strategy: "peak", // keeps volume normalized
    };

    const prediction = await replicate.predictions.create({
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb", // MusicGen official
      input,
    });

    // Poll until the prediction is ready
    let result = prediction;
    while (
      result.status !== "succeeded" &&
      result.status !== "failed" &&
      result.status !== "canceled"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result = await replicate.predictions.get(result.id);
    }

    if (result.status === "succeeded") {
      res.json({ audio: result.output });
    } else {
      res.status(500).json({ error: "Prediction failed", status: result.status });
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Something went wrong with Replicate" });
  }
});

app.listen(5000, () => {
  console.log("🎵 MusicGen backend running on http://localhost:5000");
});
