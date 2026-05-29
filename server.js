const express = require("express");
const axios   = require("axios");
const app     = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UC_BASE = "https://dashanddot.unicommerce.co.in";
const SECRET  = process.env.PROXY_SECRET || "dashanddot-proxy-2024";

// ── Auth check ───────────────────────────────────────────
app.use((req, res, next) => {
  if (req.headers["x-proxy-secret"] !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// ── Forward any request to Unicommerce ───────────────────
app.all("/uc/*", async (req, res) => {
  const ucPath = req.path.replace("/uc", "");
  const ucUrl  = UC_BASE + ucPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "");

  try {
    const response = await axios({
      method:  req.method,
      url:     ucUrl,
      headers: {
        "Content-Type":  req.headers["content-type"]  || "application/json",
        "Authorization": req.headers["authorization"] || ""
      },
      data: req.body,
      timeout: 30000
    });

    res.status(response.status).json(response.data);

  } catch (err) {
    const status = err.response ? err.response.status : 500;
    const data   = err.response ? err.response.data   : { error: err.message };
    res.status(status).json(data);
  }
});

// ── Health check ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("UC Proxy running on port " + PORT));
