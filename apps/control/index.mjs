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
      odooTaxId: parseInt(process.env.ODOO_TAX_ID || "129"),
    }
  : {
      bifrostUrl: "http://localhost:8082",
      useInClusterAuth: false,
      kubeconfig: process.env.KUBECONFIG || `${process.env.HOME}/.kube/config`,
      odooUrl: process.env.ODOO_URL || "https://inferencebros.odoo.com",
      odooApiKey: process.env.ODOO_API_KEY || "",
      odooDatabase: process.env.ODOO_DATABASE || "inferencebros",
      odooTaxId: parseInt(process.env.ODOO_TAX_ID || "129"),
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
    const timeout = options.timeout || 30000; // 30 second default timeout

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

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// --- VALIDATION ---

async function validateApiKey(apiKey) {
  try {
    const url = `${CONFIG.bifrostUrl}/api/governance/virtual-keys`;
    const response = await request(url);
    
    const allKeys = response.virtual_keys || [];
    const matchingKey = allKeys.find((vk) => vk.value === apiKey);
    
    if (!matchingKey) {
      return { valid: false, reason: "Key not found" };
    }
    
    if (!matchingKey.is_active) {
      return { valid: false, reason: "Key inactive" };
    }
    
    return {
      valid: true,
      keyId: matchingKey.id,
      keyName: matchingKey.name,
    };
  } catch (err) {
    logger("WARN", `API key validation failed`, err.message);
    return { valid: false, reason: "Service error" };
  }
}

// OPTION 1: Bill for the PREVIOUS COMPLETE CALENDAR MONTH
function getBillingRange(referenceDate = null) {
  const now = referenceDate ? new Date(referenceDate) : new Date();

  // Start of previous month
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - 1, // Previous month
      1, // First day
      0,
      0,
      0,
      0, // Midnight
    ),
  );

  // Start of current month (= end of previous month)
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(), // Current month
      1, // First day
      0,
      0,
      0,
      0, // Midnight
    ),
  );

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    month_label: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
  };
}

// --- CORE PRICING & USAGE LOGIC ---

async function getK8sModelNames() {
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
    logger("ERROR", "Failed to fetch Kubernetes Model Names", err.message);
    return {};
  }

  const nameMap = {};
  kubeData.items?.forEach((item) => {
    const raw = item.metadata.annotations?.["openrouter.ai/json"];
    if (!raw) return;
    try {
      const m = JSON.parse(raw);
      nameMap[m.id] = m.name;
    } catch (e) {}
  });
  return nameMap;
}

async function getUsageStats(vkId, startDate, endDate, model = null) {
  const startEnc = encodeURIComponent(startDate);
  const endEnc = encodeURIComponent(endDate);
  
  let url = `${CONFIG.bifrostUrl}/api/logs/stats?virtual_key_ids=${vkId}&start_time=${startEnc}&end_time=${endEnc}`;
  if (model) {
    url += `&models=${encodeURIComponent(model)}`;
  }
  
  try {
    const response = await request(url);
    return {
      total_requests: response.total_requests || 0,
      total_tokens: response.total_tokens || 0,
      total_cost: response.total_cost || 0,
    };
  } catch (err) {
    logger("ERROR", `Stats aggregation failed for VK ${vkId}`, err.message);
    return {
      total_requests: 0,
      total_tokens: 0,
      total_cost: 0,
    };
  }
}

async function aggregateUsageFromStats(vkId, startDate, endDate) {
  // Get the list of all available models from Kubernetes
  const modelNames = await getK8sModelNames();
  const modelIds = Object.keys(modelNames);
  
  // Now get stats per model
  const modelUsage = {};
  
  for (const modelId of modelIds) {
    const stats = await getUsageStats(vkId, startDate, endDate, modelId);
    if (stats.total_requests > 0 || stats.total_cost > 0) {
      modelUsage[modelId] = {
        total_tokens: stats.total_tokens,
        total_requests: stats.total_requests,
        total_cost: stats.total_cost,
      };
    }
  }
  
  return modelUsage;
}

async function generateInvoices(nowString, referenceDate = null) {
  const billingInfo = getBillingRange(referenceDate);
  const { start_date, end_date, month_label } = billingInfo;

  logger(
    "INFO",
    `Analyzing usage period: ${start_date} to ${end_date}${month_label ? ` (${month_label})` : ""}`,
  );

  const [modelNames, vkResponse] = await Promise.all([
    getK8sModelNames(),
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
        aggregateUsageFromStats(vk.id, start_date, end_date),
      ),
    );
    const combinedUsage = {};
    usageResults.forEach((res) => {
      for (const [mid, stats] of Object.entries(res)) {
        if (!combinedUsage[mid])
          combinedUsage[mid] = { total_tokens: 0, total_requests: 0, total_cost: 0 };
        combinedUsage[mid].total_tokens += stats.total_tokens;
        combinedUsage[mid].total_requests += stats.total_requests;
        combinedUsage[mid].total_cost += stats.total_cost;
      }
    });
    return buildInvoice(
      group,
      combinedUsage,
      modelNames,
      start_date,
      end_date,
      month_label,
      nowString,
    );
  });

  const invoices = await Promise.all(invoicePromises);
  return invoices.filter((inv) => inv.total_tokens > 0);
}

function buildInvoice(
  customer,
  combinedUsage,
  modelNames,
  start,
  end,
  monthLabel,
  nowString,
) {
  const location = process.env.LOCATION || "local";
  const cleanName = customer.name.replace(/\s+/g, "_");

  // Use month label if available for cleaner invoice IDs
  const periodId = monthLabel || `${start}_${end}`;
  const invoice_id = `${cleanName}_${periodId}_${location}`.replace(/:/g, "-");

  const inv = {
    invoice_id,
    customer_id: customer.id,
    customer_name: customer.name,
    currency: "EUR",
    issued_at: nowString,
    location,
    period: { start, end },
    total_cost: 0,
    total_tokens: 0,
    models: {},
  };

  for (const [mid, usage] of Object.entries(combinedUsage)) {
    const modelName = modelNames[mid] || mid;

    inv.models[mid] = {
      model_name: modelName,
      total_tokens: usage.total_tokens,
      total_requests: usage.total_requests,
      cost: Number(usage.total_cost.toFixed(6)),
    };

    inv.total_tokens += usage.total_tokens;
    inv.total_cost += usage.total_cost;
  }

  inv.total_cost = Number(inv.total_cost.toFixed(6));
  return inv;
}

// --- USAGE QUERY (NEW) ---

async function calculateUsage(apiKey, startDate, endDate) {
  logger("INFO", `Calculating usage for key ${apiKey} from ${startDate} to ${endDate}`);
  
  const [modelNames, usageData] = await Promise.all([
    getK8sModelNames(),
    aggregateUsageFromStats(apiKey, startDate, endDate),
  ]);

  const models = [];
  let totalTokens = 0;
  let totalRequests = 0;
  let totalCost = 0;

  for (const [modelId, usage] of Object.entries(usageData)) {
    const modelName = modelNames[modelId] || modelId;

    models.push({
      model_id: modelId,
      model_name: modelName,
      total_tokens: usage.total_tokens,
      total_requests: usage.total_requests,
      total_cost: Number(usage.total_cost.toFixed(6)),
    });

    totalTokens += usage.total_tokens;
    totalRequests += usage.total_requests;
    totalCost += usage.total_cost;
  }

  // Sort by cost descending
  models.sort((a, b) => b.total_cost - a.total_cost);

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    summary: {
      total_tokens: totalTokens,
      total_requests: totalRequests,
      total_cost: Number(totalCost.toFixed(6)),
      currency: "EUR",
    },
    models,
  };
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

async function pushToOdoo(invoice, dryRun = "none") {
  logger(
    "INFO",
    `Syncing Customer: ${invoice.customer_name} [Dry Run: ${dryRun}]`,
  );

  if (dryRun === "all") {
    logger(
      "INFO",
      `DRY_RUN (ALL): Skipping Odoo interaction for ${invoice.invoice_id}`,
    );
    return { status: "dry_run_skipped" };
  }

  const existingInvoice = await checkInvoiceExists(invoice.invoice_id);
  if (existingInvoice) {
    logger("INFO", `DUPLICATE: Invoice ${invoice.invoice_id} already exists.`);
    return { status: "duplicate", odoo_id: existingInvoice };
  }

  if (dryRun === "validate") {
    logger(
      "INFO",
      `DRY_RUN (VALIDATE): Invoice ${invoice.invoice_id} not found in Odoo. Skipping creation.`,
    );
    return { status: "dry_run_validated_missing" };
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
      name: `AI Usage: ${m.model_name} (${m.total_tokens.toLocaleString()} tokens, ${m.total_requests.toLocaleString()} requests)`,
      quantity: 1,
      price_unit: m.cost,
      tax_ids: [[6, 0, [CONFIG.odooTaxId]]],
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
          mail_partner_ids: [partnerId],
        },
      ],
      context: {
        active_model: "account.move",
        active_ids: [odooId],
      },
    });

    const wizardId = Array.isArray(wizardIds) ? wizardIds[0] : wizardIds;

    await odooCall("account.move.send.wizard", "action_send_and_print", {
      ids: [wizardId],
      context: {
        active_model: "account.move",
        active_ids: [odooId],
      },
    });

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

async function executeBillingRun(
  triggerType,
  simulatedDate = null,
  dryRun = "none",
) {
  const now = simulatedDate ? new Date(simulatedDate) : new Date();
  const nowString = now.toISOString();
  console.log("\n" + "=".repeat(60));
  logger(
    "RUN-START",
    `Trigger: ${triggerType}${simulatedDate ? " (SIMULATED)" : ""} | Dry Run: ${dryRun} | Period ending: ${now.toISOString()}`,
  );
  console.log("=".repeat(60));

  try {
    const invoices = await generateInvoices(nowString, simulatedDate);
    const results = [];

    if (invoices.length === 0) {
      logger("INFO", "No billing data found for this period.");
    } else {
      for (const inv of invoices) {
        try {
          const odooRes = await pushToOdoo(inv, dryRun);
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
      const dryRunCount = results.filter((r) =>
        r.sync_result.status.startsWith("dry_run"),
      ).length;
      const errorCount = results.filter(
        (r) =>
          r.sync_result.status === "error" ||
          r.sync_result.status === "fatal_error",
      ).length;

      console.log("-".repeat(60));
      logger("RUN-COMPLETE", "Final Report:", {
        total_detected: invoices.length,
        pushed_to_odoo: successCount,
        duplicates: duplicateCount,
        skipped_no_match: skipCount,
        dry_runs: dryRunCount,
        errors: errorCount,
      });
    }

    console.log("=".repeat(60) + "\n");
    return {
      timestamp: now.toISOString(),
      trigger: triggerType,
      dry_run: dryRun,
      summary: {
        total_detected: invoices.length,
        synced: results.filter((r) => r.sync_result.status === "success")
          .length,
        duplicates: results.filter((r) => r.sync_result.status === "duplicate")
          .length,
        skipped: results.filter((r) => r.sync_result.status === "skipped")
          .length,
        dry_runs: results.filter((r) =>
          r.sync_result.status.startsWith("dry_run"),
        ).length,
        errors: results.filter(
          (r) =>
            r.sync_result.status === "error" ||
            r.sync_result.status === "fatal_error",
        ).length,
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

// Precise cron check for 2nd at 00:00:00
function initCron() {
  logger(
    "INFO",
    "Scheduler active: Monitoring for 2nd of every month at 00:00:00 UTC",
  );
  setInterval(async () => {
    const now = new Date();
    const currentDay = now.getUTCDate();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentSecond = now.getUTCSeconds();
    const currentMonth = now.getUTCMonth();

    // Check if it's the 2nd, at exactly 00:00:00, and we haven't run this month
    if (
      currentDay === 2 &&
      currentHour === 0 &&
      currentMinute === 0 &&
      currentSecond === 0 &&
      lastRunMonth !== currentMonth
    ) {
      lastRunMonth = currentMonth;
      await executeBillingRun("CRON_JOB");
    }
  }, 1000); // Check every second
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "invoicing" }));
    return;
  }

  // Invoice generation endpoint
  if (req.url.startsWith("/invoicing/generate") && req.method === "GET") {
    try {
      // Parse query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const simulatedDate = url.searchParams.get("date");

      // Parse dry_run parameter
      const dryRunParam = url.searchParams.get("dry_run");
      const dryRun = ["all", "validate"].includes(dryRunParam)
        ? dryRunParam
        : "none";

      // Validate date if provided
      if (simulatedDate) {
        const parsedDate = new Date(simulatedDate);
        if (isNaN(parsedDate.getTime())) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error:
                "Invalid date format. Use ISO 8601 format (e.g., 2025-02-20T00:00:00Z)",
            }),
          );
          return;
        }
      }

      const report = await executeBillingRun(
        "HTTP_TRIGGER",
        simulatedDate,
        dryRun,
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(report));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Usage query endpoint (NEW)
  if (req.url.startsWith("/usage") && req.method === "GET") {
    try {
      // Extract API key from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Missing or invalid Authorization header. Expected: Authorization: Bearer <api_key>",
          }),
        );
        return;
      }

      const apiKey = authHeader.substring(7); // Remove "Bearer "

      // Parse query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const startDate = url.searchParams.get("start_date");
      const endDate = url.searchParams.get("end_date");

      // Validate required parameters
      if (!startDate || !endDate) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Missing required parameters: start_date and end_date (ISO 8601 format)",
            example: "/usage?start_date=2025-01-01T00:00:00Z&end_date=2025-01-31T23:59:59Z",
          }),
        );
        return;
      }

      // Validate date formats
      const startParsed = new Date(startDate);
      const endParsed = new Date(endDate);
      
      if (isNaN(startParsed.getTime()) || isNaN(endParsed.getTime())) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Invalid date format. Use ISO 8601 format (e.g., 2025-01-01T00:00:00Z)",
          }),
        );
        return;
      }

      if (startParsed >= endParsed) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "start_date must be before end_date",
          }),
        );
        return;
      }

      // Validate API key
      logger("INFO", `Validating API key: ${apiKey.substring(0, 8)}...`);
      const validation = await validateApiKey(apiKey);
      
      if (!validation.valid) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Invalid or inactive API key",
            reason: validation.reason,
          }),
        );
        return;
      }

      logger("INFO", `Key validated: ${validation.keyName} (${validation.keyId})`);

      // Calculate usage
      const usage = await calculateUsage(validation.keyId, startDate, endDate);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(usage, null, 2));
      
      logger("INFO", `Usage query completed`, {
        key: validation.keyName,
        period: `${startDate} to ${endDate}`,
        total_cost: usage.summary.total_cost,
      });
    } catch (err) {
      logger("ERROR", "Usage query failed", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Internal server error",
          message: err.message,
        }),
      );
    }
    return;
  }

  // OpenRouter models endpoint (NEW)
  if (req.url === "/openrouter/models" && req.method === "GET") {
    try {
      if (!CONFIG.useInClusterAuth) {
        // Development mode: use kubectl
        const kubeconfigArg = CONFIG.kubeconfig
          ? `--kubeconfig=${CONFIG.kubeconfig}`
          : "";
        const { stdout } = await execAsync(
          `kubectl ${kubeconfigArg} get models.kubeai.org -n kubeai -o json`,
        );
        const kubeData = JSON.parse(stdout);

        const openRouterModels = kubeData.items
          .filter(
            (item) =>
              item.metadata.annotations &&
              item.metadata.annotations["openrouter.ai/json"],
          )
          .map((item) => {
            try {
              return JSON.parse(
                item.metadata.annotations["openrouter.ai/json"],
              );
            } catch (e) {
              logger("ERROR", `Failed to parse annotation for ${item.metadata.name}`);
              return null;
            }
          })
          .filter((model) => model !== null);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: openRouterModels }));
      } else {
        // Production mode: use in-cluster auth
        const token = fs.readFileSync(CONFIG.tokenPath, "utf8");
        const ca = fs.readFileSync(CONFIG.caPath);

        const options = {
          hostname: CONFIG.k8sHost,
          port: CONFIG.k8sPort,
          path: "/apis/kubeai.org/v1/models",
          method: "GET",
          ca: ca,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        };

        const k8sReq = https.request(options, (k8sRes) => {
          let body = "";
          k8sRes.on("data", (chunk) => (body += chunk));
          k8sRes.on("end", () => {
            if (k8sRes.statusCode === 200) {
              const kubeData = JSON.parse(body);

              const openRouterModels = kubeData.items
                .filter(
                  (item) =>
                    item.metadata.annotations &&
                    item.metadata.annotations["openrouter.ai/json"],
                )
                .map((item) => {
                  try {
                    return JSON.parse(
                      item.metadata.annotations["openrouter.ai/json"],
                    );
                  } catch (e) {
                    logger("ERROR", `Failed to parse annotation for ${item.metadata.name}`);
                    return null;
                  }
                })
                .filter((model) => model !== null);

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ data: openRouterModels }));
            } else {
              res.writeHead(k8sRes.statusCode, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "K8s API Error", details: body }));
            }
          });
        });

        k8sReq.on("error", (err) => {
          logger("ERROR", "K8s request failed", err.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request Failed", msg: err.message }));
        });
        k8sReq.end();
      }
    } catch (err) {
      logger("ERROR", "OpenRouter models endpoint failed", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Error", msg: err.message }));
    }
    return;
  }

  // Bifrost pricing sheet endpoint (NEW)
  if (req.url === "/bifrost/pricingSheet" && req.method === "GET") {
    try {
      let kubeData;
      
      if (!CONFIG.useInClusterAuth) {
        // Development mode: use kubectl
        const kubeconfigArg = CONFIG.kubeconfig
          ? `--kubeconfig=${CONFIG.kubeconfig}`
          : "";
        const { stdout } = await execAsync(
          `kubectl ${kubeconfigArg} get models.kubeai.org -n kubeai -o json`,
        );
        kubeData = JSON.parse(stdout);
      } else {
        // Production mode: use in-cluster auth
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

      const pricingSheet = {};
      
      kubeData.items?.forEach((item) => {
        const modelName = item.metadata.name;
        const annotationRaw = item.metadata.annotations?.["openrouter.ai/json"];
        
        if (!annotationRaw) return;
        
        try {
          const annotation = JSON.parse(annotationRaw);
          const pricing = annotation.pricing || {};
          
          // Format: kubeai/<model-name>
          const key = `kubeai/${modelName}`;
          
          pricingSheet[key] = {
            input_cost_per_token: parseFloat(pricing.prompt || 0),
            output_cost_per_token: parseFloat(pricing.completion || 0),
            input_cost_per_request: parseFloat(pricing.request || 0),
            mode: 'chat',
            provider: 'kubeai'
          };
        } catch (e) {
          logger("WARN", `Failed to parse pricing for model ${modelName}`, e.message);
        }
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(pricingSheet, null, 2));
      
      logger("INFO", `Pricing sheet generated with ${Object.keys(pricingSheet).length} models`);
    } catch (err) {
      logger("ERROR", "Pricing sheet endpoint failed", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Failed to generate pricing sheet",
          message: err.message,
        }),
      );
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  logger("INFO", `Invoicing Service online on port ${PORT}`);
  logger("INFO", `Endpoints:`);
  logger("INFO", `  - GET /invoicing/generate?date=<ISO>&dry_run=<all|validate|none>`);
  logger("INFO", `  - GET /usage?start_date=<ISO>&end_date=<ISO> (requires Authorization: Bearer <key>)`);
  logger("INFO", `  - GET /openrouter/models`);
  logger("INFO", `  - GET /bifrost/pricingSheet`);
  initCron();
});

// Graceful shutdown
const shutdown = () => {
  logger("INFO", "Shutting down gracefully...");
  server.close(() => {
    logger("INFO", "Server closed");
    process.exit(0);
  });
};