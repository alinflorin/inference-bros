import http from "http";
import https from "https";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const PORT = 8080;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// --- CONFIG ---
const CONFIG = IS_PRODUCTION
  ? {
      bifrostUrl: "http://bifrost.bifrost:8080",
      useInClusterAuth: true,
      tokenPath: "/var/run/secrets/kubernetes.io/serviceaccount/token",
      caPath: "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt",
      k8sHost: process.env.KUBERNETES_SERVICE_HOST,
      k8sPort: process.env.KUBERNETES_SERVICE_PORT,
      odooUrl: process.env.ODOO_URL || "https://inferencebros.odoo.com",
      odooApiKey: process.env.ODOO_API_KEY || "",
      odooDatabase: process.env.ODOO_DATABASE || "inferencebros",
    }
  : {
      bifrostUrl: "http://localhost:8082",
      useInClusterAuth: false,
      kubeconfig: process.env.KUBECONFIG || `${process.env.HOME}/.kube/config`,
      odooUrl: process.env.ODOO_URL || "https://inferencebros.odoo.com",
      odooApiKey: process.env.ODOO_API_KEY || "",
      odooDatabase: process.env.ODOO_DATABASE || "inferencebros",
    };

// --- UTILS ---

function logger(level, message, data = "") {
  const timestamp = new Date().toISOString();
  const cleanData = typeof data === "object" ? JSON.stringify(data) : data;
  console.log(`[${timestamp}] [${level}] ${message} ${cleanData}`);
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`API Error (${res.statusCode}): ${body}`));
        }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// FIXED: Simple 30-day lookback
function getBillingRange() {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
}

// --- CORE PRICING & USAGE LOGIC ---

async function getK8sModelPricing() {
  let kubeData;
  try {
    if (!CONFIG.useInClusterAuth) {
      const kubeconfigArg = CONFIG.kubeconfig
        ? `--kubeconfig=${CONFIG.kubeconfig}`
        : "";
      const { stdout } = await execAsync(
        `kubectl ${kubeconfigArg} get models.kubeai.org -n kubeai -o json`,
      );
      kubeData = JSON.parse(stdout);
    } else {
      const token = fs.readFileSync(CONFIG.tokenPath, "utf8");
      const ca = fs.readFileSync(CONFIG.caPath);
      kubeData = await request(
        `https://${CONFIG.k8sHost}:${CONFIG.k8sPort}/apis/kubeai.org/v1/models`,
        {
          ca,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
    }
  } catch (err) {
    logger("ERROR", "Failed to fetch Kubernetes Model Pricing", err.message);
    return {};
  }

  const pricingMap = {};
  kubeData.items?.forEach((item) => {
    const raw = item.metadata.annotations?.["openrouter.ai/json"];
    if (!raw) return;
    try {
      const m = JSON.parse(raw);
      pricingMap[m.id] = {
        name: m.name,
        prompt: parseFloat(m.pricing.prompt || 0),
        completion: parseFloat(m.pricing.completion || 0),
        request: parseFloat(m.pricing.request || 0),
      };
    } catch (e) {}
  });
  return pricingMap;
}

async function aggregateUsageFromLogs(vkId, startDate, endDate) {
  let page = 1;
  let hasMore = true;
  const modelUsage = {};
  const startEnc = encodeURIComponent(startDate);
  const endEnc = encodeURIComponent(endDate);

  while (hasMore) {
    const url = `${CONFIG.bifrostUrl}/api/logs?virtual_key=${vkId}&start_date=${startEnc}&end_date=${endEnc}&page=${page}&limit=100`;
    try {
      const response = await request(url);
      const logs = response.logs || [];
      if (logs.length === 0) break;
      logs.forEach((log) => {
        const mid = log.model || "unknown";
        if (!modelUsage[mid])
          modelUsage[mid] = { prompt: 0, completion: 0, requests: 0 };
        modelUsage[mid].prompt += log.token_usage?.prompt_tokens || 0;
        modelUsage[mid].completion += log.token_usage?.completion_tokens || 0;
        modelUsage[mid].requests += 1;
      });
      if (response.total_pages && page >= response.total_pages) hasMore = false;
      else if (logs.length < 100) hasMore = false;
      else page++;
    } catch (err) {
      logger("ERROR", `Log aggregation failed for VK ${vkId}`, err.message);
      hasMore = false;
    }
  }
  return modelUsage;
}

async function generateInvoices() {
  const { start_date, end_date } = getBillingRange();
  logger("INFO", `Analyzing usage period: ${start_date} to ${end_date}`);

  const [modelPricing, vkResponse] = await Promise.all([
    getK8sModelPricing(),
    request(`${CONFIG.bifrostUrl}/api/governance/virtual-keys`),
  ]);

  const allKeys = vkResponse.virtual_keys || [];
  const keysByCustomer = allKeys.reduce((acc, vk) => {
    const cid = vk.customer_id;
    if (!cid) return acc;
    if (!acc[cid])
      acc[cid] = {
        id: cid,
        name: vk.customer?.name || `Customer ${cid}`,
        keys: [],
      };
    acc[cid].keys.push(vk);
    return acc;
  }, {});

  const invoicePromises = Object.values(keysByCustomer).map(async (group) => {
    const usageResults = await Promise.all(
      group.keys.map((vk) =>
        aggregateUsageFromLogs(vk.id, start_date, end_date),
      ),
    );
    const combinedUsage = {};
    usageResults.forEach((res) => {
      for (const [mid, stats] of Object.entries(res)) {
        if (!combinedUsage[mid])
          combinedUsage[mid] = { prompt: 0, completion: 0, requests: 0 };
        combinedUsage[mid].prompt += stats.prompt;
        combinedUsage[mid].completion += stats.completion;
        combinedUsage[mid].requests += stats.requests;
      }
    });
    return buildInvoice(
      group,
      combinedUsage,
      modelPricing,
      start_date,
      end_date,
    );
  });

  const invoices = await Promise.all(invoicePromises);
  return invoices.filter((inv) => inv.total_tokens > 0);
}

function buildInvoice(customer, combinedUsage, pricing, start, end) {
  const location = process.env.LOCATION || "local";
  const cleanName = customer.name.replace(/\s+/g, "_");
  const invoice_id = `${cleanName}_${start}_${end}_${location}`.replace(
    /:/g,
    "-",
  );

  const inv = {
    invoice_id,
    customer_id: customer.id,
    customer_name: customer.name,
    currency: "EUR",
    issued_at: end,
    location,
    period: { start, end },
    total_cost: 0,
    total_tokens: 0,
    models: {},
  };

  for (const [mid, usage] of Object.entries(combinedUsage)) {
    const rates = pricing[mid];
    const pCost = rates ? usage.prompt * rates.prompt : 0;
    const cCost = rates ? usage.completion * rates.completion : 0;
    const rCost = rates ? usage.requests * rates.request : 0;
    const totalModelCost = pCost + cCost + rCost;

    inv.models[mid] = {
      model_name: rates?.name || mid,
      prompt_tokens: usage.prompt,
      completion_tokens: usage.completion,
      total_requests: usage.requests,
      cost: Number(totalModelCost.toFixed(6)),
    };

    inv.total_tokens += usage.prompt + usage.completion;
    inv.total_cost += totalModelCost;
  }

  inv.total_cost = Number(inv.total_cost.toFixed(6));
  return inv;
}

// --- ODOO INTEGRATION WITH RETRY & DEDUPLICATION ---

async function odooCall(model, method, body = {}, retries = 3) {
  const url = `${CONFIG.odooUrl}/json/2/${model}/${method}`;
  const payload = {
    context: { lang: "en_US" },
    ...body,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await request(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${CONFIG.odooApiKey}`,
          "X-Odoo-Database": CONFIG.odooDatabase,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = attempt * 1000;
      logger(
        "WARN",
        `Odoo call failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`,
        err.message,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function findOdooPartner(customerName) {
  try {
    const response = await odooCall("res.partner", "search", {
      domain: [["name", "=", customerName]],
      limit: 1,
    });
    return Array.isArray(response) && response.length > 0 ? response[0] : null;
  } catch (e) {
    logger(
      "ERROR",
      `Odoo Partner Search failed for "${customerName}"`,
      e.message,
    );
    return null;
  }
}

// FIXED: Check for existing invoice by reference
async function checkInvoiceExists(invoiceRef) {
  try {
    const response = await odooCall("account.move", "search", {
      domain: [["ref", "=", invoiceRef]],
      limit: 1,
    });
    return Array.isArray(response) && response.length > 0 ? response[0] : null;
  } catch (e) {
    logger(
      "ERROR",
      `Invoice existence check failed for ref "${invoiceRef}"`,
      e.message,
    );
    return null;
  }
}

// MODIFIED: pushToOdoo to include the sending step
async function pushToOdoo(invoice) {
  logger("INFO", `Syncing Customer: ${invoice.customer_name}`);

  const existingInvoice = await checkInvoiceExists(invoice.invoice_id);
  if (existingInvoice) {
    logger("INFO", `DUPLICATE: Invoice ${invoice.invoice_id} already exists.`);
    return { status: "duplicate", odoo_id: existingInvoice };
  }

  const partnerId = await findOdooPartner(invoice.customer_name);
  if (!partnerId) {
    logger("WARN", `MATCH-FAIL: "${invoice.customer_name}" not in Odoo.`);
    return { status: "skipped" };
  }

  const validModels = Object.values(invoice.models).filter((m) => m.cost > 0);
  if (validModels.length === 0)
    return { status: "skipped", reason: "zero_cost" };

  const issueDate = new Date(invoice.issued_at);
  const dueDate = new Date(issueDate);
  dueDate.setUTCDate(issueDate.getUTCDate() + 15);

  const invoiceLines = validModels.map((m) => [
    0,
    0,
    {
      name: `AI Usage: ${m.model_name} (${(m.prompt_tokens + m.completion_tokens).toLocaleString()} tokens)`,
      quantity: 1,
      price_unit: m.cost,
      // tax_ids: [[6, 0, [16]]],
    },
  ]);

  try {
    // 1. Create the Invoice
    const result = await odooCall("account.move", "create", {
      vals_list: [
        {
          partner_id: partnerId,
          move_type: "out_invoice",
          ref: String(invoice.invoice_id),
          invoice_date: issueDate.toISOString().split("T")[0],
          invoice_date_due: dueDate.toISOString().split("T")[0],
          invoice_line_ids: invoiceLines,
        },
      ],
    });

    const odooId = Array.isArray(result) ? result[0] : result;

    // 2. Post the invoice (Validates it)
    await odooCall("account.move", "action_post", {
      ids: [odooId],
    });

    const wizardIds = await odooCall("account.move.send.wizard", "create", {
      vals_list: [
        {
          move_id: odooId,
        },
      ],
      context: {
        active_model: "account.move",
        active_ids: [odooId],
      },
    });

    const wizardId = Array.isArray(wizardIds) ? wizardIds[0] : wizardIds;
    console.log(wizardId);

    const rr = await odooCall(
      "account.move.send.wizard",
      "action_send_and_print",
      {
        ids: [wizardId],
        context: {
          active_model: "account.move",
          active_ids: [odooId],
        },
      },
    );

    console.log(rr);

    const sent = true;

    logger(
      "SUCCESS",
      `Odoo Invoice Created, Posted & ${sent ? "Sent" : "Queue-Failed"}`,
      {
        odoo_id: odooId,
        customer: invoice.customer_name,
      },
    );

    return { status: "success", odoo_id: odooId, emailed: sent };
  } catch (err) {
    logger(
      "ERROR",
      `Odoo Process Error for ${invoice.customer_name}`,
      err.message,
    );
    return { status: "error", error: err.message };
  }
}

// --- UNIFIED EXECUTION LOGIC ---

async function executeBillingRun(triggerType) {
  const now = new Date();
  console.log("\n" + "=".repeat(60));
  logger(
    "RUN-START",
    `Trigger: ${triggerType} | Period ending: ${now.toISOString()}`,
  );
  console.log("=".repeat(60));

  try {
    const invoices = await generateInvoices();
    const results = [];

    if (invoices.length === 0) {
      logger("INFO", "No billing data found for this period.");
    } else {
      for (const inv of invoices) {
        try {
          const odooRes = await pushToOdoo(inv);
          results.push({
            invoice: inv,
            sync_result: odooRes,
          });
        } catch (err) {
          logger("ERROR", `Invoice processing failed, continuing with next`, {
            invoice_id: inv.invoice_id,
            customer: inv.customer_name,
            error: err.message,
          });

          results.push({
            invoice: inv,
            sync_result: {
              status: "fatal_error",
              error: err.message,
            },
          });

          // IMPORTANT: do NOT rethrow
        }
      }

      const successCount = results.filter(
        (r) => r.sync_result.status === "success",
      ).length;
      const skipCount = results.filter(
        (r) => r.sync_result.status === "skipped",
      ).length;
      const duplicateCount = results.filter(
        (r) => r.sync_result.status === "duplicate",
      ).length;

      console.log("-".repeat(60));
      logger("RUN-COMPLETE", "Final Report:", {
        total_detected: invoices.length,
        pushed_to_odoo: successCount,
        duplicates: duplicateCount,
        skipped_no_match: skipCount,
      });
    }

    console.log("=".repeat(60) + "\n");
    return {
      timestamp: now.toISOString(),
      trigger: triggerType,
      summary: {
        total_detected: invoices.length,
        synced: results.filter((r) => r.sync_result.status === "success")
          .length,
        duplicates: results.filter((r) => r.sync_result.status === "duplicate")
          .length,
        skipped: results.filter((r) => r.sync_result.status === "skipped")
          .length,
        errors: results.filter((r) => r.sync_result.status === "error").length,
      },
      details: results,
    };
  } catch (err) {
    logger("FATAL", "Critical Billing Run Failure", err.stack);
    throw err;
  }
}

// --- TRIGGER MECHANISMS ---

let lastRunMonth = -1;

// FIXED: 2-minute window to avoid missing exact second
function initCron() {
  logger(
    "INFO",
    "Scheduler active: Monitoring for 20th of every month at 00:00 UTC",
  );
  setInterval(async () => {
    const now = new Date();
    if (
      now.getUTCDate() === 20 &&
      now.getUTCHours() === 0 &&
      now.getUTCMinutes() < 2 && // 2-minute window instead of exact second
      lastRunMonth !== now.getUTCMonth()
    ) {
      lastRunMonth = now.getUTCMonth();
      await executeBillingRun("CRON_JOB");
    }
  }, 1000);
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/invoicing/generate" && req.method === "GET") {
    try {
      const report = await executeBillingRun("HTTP_TRIGGER");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(report));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  logger("INFO", `Invoicing Service online on port ${PORT}`);
  initCron();
});
