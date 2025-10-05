// proxy.js
import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

// ---- CORS ----
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/track", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "Falta parámetro url" });
  }

  console.log(`🌍 Abriendo LiveTrack: ${url}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: puppeteer.executablePath(), // ?? usa el binario propio
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
      ],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      referer: url,
      origin: "https://livetrack.garmin.com",
    });

    let trackData = null;

    // Escuchar todas las respuestas
    page.on("response", async (response) => {
      try {
        const req = response.request();
        if (
          req.url().includes("/apollo/graphql") &&
          response.status() === 200
        ) {
          const json = await response.json();
          if (
            json?.data?.trackPointsBySessionId?.trackPoints?.length
          ) {
            trackData = json.data.trackPointsBySessionId.trackPoints;
            console.log(
              `✅ Track detectado: ${trackData.length} puntos`
            );
          }
        }
      } catch (e) {
        console.warn("⚠️ Error procesando respuesta:", e.toString());
      }
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Esperar hasta 15 segundos a que lleguen los datos
    const start = Date.now();
    while (!trackData && Date.now() - start < 15000) {
      await new Promise((r) => setTimeout(r, 500));
    }

    await browser.close();

    if (trackData) {
	  // Extraer solo lat/lng
	  const coords = trackData
		.filter(p => p?.position?.lat && p?.position?.lon)
		.map(p => [p.position.lat, p.position.lon]);

	  console.log(`✅ Devueltos ${coords.length} puntos a Leaflet`);

	  res.json(coords);
	} else {
	  console.log("⚠️ No se recibió trackPointsBySessionId");
	  res.status(404).json({ error: "No se recibió trackPointsBySessionId" });
	}
  } catch (err) {
    console.error("❌ Error general:", err);
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy con Puppeteer corriendo en http://localhost:${PORT}`);
});
