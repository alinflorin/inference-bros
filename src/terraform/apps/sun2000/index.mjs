import http from "node:http";
import https from "node:https";

const KIOSK_URL = process.env.KIOSK_URL;
const KIOSK_KK = process.env.KIOSK_KK;
const SCRAPE_INTERVAL = parseInt(process.env.SCRAPE_INTERVAL || "300", 10) * 1000;
const PORT = 8080;

let metrics = {
  realTimePower: null,
  dailyEnergy: null,
  monthEnergy: null,
  yearEnergy: null,
  cumulativeEnergy: null,
};
let scrapeSuccess = 0;
let lastScrapeTimestamp = 0;

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod
      .get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject)
      .on("timeout", function () {
        this.destroy();
        reject(new Error("Request timeout"));
      });
  });
}

async function scrapeKiosk() {
  try {
    const url = `${KIOSK_URL}?kk=${KIOSK_KK}`;
    const response = await fetchJSON(url);

    if (!response.data) {
      throw new Error("No data field in response");
    }

    const decoded = decodeHtmlEntities(response.data);
    const data = JSON.parse(decoded);

    metrics.realTimePower = parseFloat(data.realTimePower) || 0;
    metrics.dailyEnergy = parseFloat(data.dailyEnergy) || 0;
    metrics.monthEnergy = parseFloat(data.monthEnergy) || 0;
    metrics.yearEnergy = parseFloat(data.yearEnergy) || 0;
    metrics.cumulativeEnergy = parseFloat(data.cumulativeEnergy) || 0;

    scrapeSuccess = 1;
    lastScrapeTimestamp = Date.now() / 1000;
    console.log(
      `Scrape OK: ${metrics.realTimePower} kW, ${metrics.dailyEnergy} kWh today`
    );
  } catch (err) {
    scrapeSuccess = 0;
    console.error(`Scrape failed: ${err.message}`);
  }
}

function formatMetrics() {
  const lines = [];

  lines.push("# HELP sun2000_real_time_power_kw Current power output in kW");
  lines.push("# TYPE sun2000_real_time_power_kw gauge");
  if (metrics.realTimePower !== null) {
    lines.push(`sun2000_real_time_power_kw ${metrics.realTimePower}`);
  }

  lines.push("# HELP sun2000_daily_energy_kwh Energy produced today in kWh");
  lines.push("# TYPE sun2000_daily_energy_kwh gauge");
  if (metrics.dailyEnergy !== null) {
    lines.push(`sun2000_daily_energy_kwh ${metrics.dailyEnergy}`);
  }

  lines.push(
    "# HELP sun2000_month_energy_kwh Energy produced this month in kWh"
  );
  lines.push("# TYPE sun2000_month_energy_kwh gauge");
  if (metrics.monthEnergy !== null) {
    lines.push(`sun2000_month_energy_kwh ${metrics.monthEnergy}`);
  }

  lines.push(
    "# HELP sun2000_year_energy_kwh Energy produced this year in kWh"
  );
  lines.push("# TYPE sun2000_year_energy_kwh gauge");
  if (metrics.yearEnergy !== null) {
    lines.push(`sun2000_year_energy_kwh ${metrics.yearEnergy}`);
  }

  lines.push(
    "# HELP sun2000_cumulative_energy_kwh Lifetime energy production in kWh"
  );
  lines.push("# TYPE sun2000_cumulative_energy_kwh gauge");
  if (metrics.cumulativeEnergy !== null) {
    lines.push(`sun2000_cumulative_energy_kwh ${metrics.cumulativeEnergy}`);
  }

  lines.push(
    "# HELP sun2000_scrape_success Whether the last kiosk scrape succeeded (1=yes, 0=no)"
  );
  lines.push("# TYPE sun2000_scrape_success gauge");
  lines.push(`sun2000_scrape_success ${scrapeSuccess}`);

  lines.push(
    "# HELP sun2000_last_scrape_timestamp Unix timestamp of last successful scrape"
  );
  lines.push("# TYPE sun2000_last_scrape_timestamp gauge");
  lines.push(`sun2000_last_scrape_timestamp ${lastScrapeTimestamp}`);

  return lines.join("\n") + "\n";
}

const server = http.createServer((req, res) => {
  if (req.url === "/metrics" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(formatMetrics());
  } else if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404);
    res.end("Not Found\n");
  }
});

if (!KIOSK_URL || !KIOSK_KK) {
  console.error("KIOSK_URL and KIOSK_KK environment variables are required");
  process.exit(1);
}

scrapeKiosk();
setInterval(scrapeKiosk, SCRAPE_INTERVAL);

server.listen(PORT, () => {
  console.log(`Sun2000 exporter listening on :${PORT}`);
  console.log(`Scrape interval: ${SCRAPE_INTERVAL / 1000}s`);
});
