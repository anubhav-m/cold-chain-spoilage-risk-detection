const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", pythonApi: PYTHON_API });
});

app.post("/api/predict", async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/predict`, req.body);
    res.json(response.data);
  } catch (error) {
    const detail = error.response?.data || error.message;
    res.status(500).json({
      message: "Failed to fetch prediction from Python service",
      detail,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
