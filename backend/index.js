import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Replicate from "replicate";
import axios from "axios";

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
    const cleanedPromptResponse = await replicate.run("meta/meta-llama-3-70b-instruct", {
      input: {
        prompt: `Rewrite this music prompt so it is grammatically correct and clearly describes a melody only (no drums or percussion). Respond with the corrected prompt only — no explanation, no intro, just the prompt:\n\n"${prompt}"`,
        system_prompt: "You are a music AI assistant that rewrites prompts for generating melodies only — no beats or percussion.",
        max_new_tokens: 60,
      },
    });

    const cleanedPrompt = cleanedPromptResponse.join("").trim().replace(/^["']+|["'.]+$/g, '');

    const titleResponse = await replicate.run("meta/meta-llama-3-70b-instruct", {
      input: {
        prompt: `Give me only a short and creative music title (maximum 5 words) based on the following prompt. No explanation. Just the title.\n\nPrompt: "${cleanedPrompt}"`,
        system_prompt: "You are a creative assistant that creates titles for music samples.",
        max_new_tokens: 20,
      },
    });

    const title = titleResponse.join("").trim().replace(/^["']+|["'.]+$/g, '');

    const input = {
      prompt: cleanedPrompt,
      model_version: "stereo-large",
      duration: 16,
      output_format: "mp3",
      normalization_strategy: "peak",
    };

    const prediction = await replicate.predictions.create({
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      input,
    });

    let result = prediction;
    while (!["succeeded", "failed", "canceled"].includes(result.status)) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result = await replicate.predictions.get(result.id);
    }

    if (result.status === "succeeded") {
      res.json({
        audio: result.output,
        prompt: cleanedPrompt,
        title: title,
      });
    } else {
      res.status(500).json({ error: "Sample generation failed", status: result.status });
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Something went wrong during generation" });
  }
});

app.get("/proxy-audio", async (req, res) => {
  const audioUrl = req.query.url;
  if (!audioUrl) return res.status(400).send("Missing audio URL");

  try {
    const response = await axios.get(audioUrl, { responseType: "stream" });
    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).send("Failed to stream audio");
  }
});

app.listen(5000, () => {
  console.log("🎵 AI model running on http://localhost:5000");
});
