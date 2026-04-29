import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("AI Knowledge Assistant is running 🚀");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});