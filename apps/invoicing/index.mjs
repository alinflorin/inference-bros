import http from 'http';
import https from 'https';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = 8080;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// --- CONFIG ---
const CONFIG = IS_PRODUCTION ? {
    bifrostUrl: 'http://bifrost.bifrost:8080',
    useInClusterAuth: true,
    tokenPath: '/var/run/secrets/kubernetes.io/serviceaccount/token',
    caPath: '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt',
    k8sHost: process.env.KUBERNETES_SERVICE_HOST,
    k8sPort: process.env.KUBERNETES_SERVICE_PORT
} : {
    bifrostUrl: 'http://localhost:8082',
    useInClusterAuth: false,
    kubeconfig: process.env.KUBECONFIG || `${process.env.HOME}/.kube/config`
};

// --- UTILS ---
function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
                } else {
                    reject(new Error(`API Error (${res.statusCode}): ${body}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

/**
 * Generates RFC3339 timestamps for Bifrost
 * Start: Current Time - 1 Month - 1 Day
 * End: Current Time
 */
function getBillingRange() {
    const end = new Date();
    const start = new Date(end);
    
    // 1. Go back exactly one month
    start.setMonth(start.getMonth() - 1);
    // 2. Subtract an additional day as requested
    start.setDate(start.getDate() - 1);

    return { 
        start_date: start.toISOString(), 
        end_date: end.toISOString() 
    };
}

// --- CORE LOGIC ---
async function getK8sModelPricing() {
    let kubeData;
    try {
        if (!CONFIG.useInClusterAuth) {
            const kubeconfigArg = CONFIG.kubeconfig ? `--kubeconfig=${CONFIG.kubeconfig}` : '';
            const { stdout } = await execAsync(`kubectl ${kubeconfigArg} get models.kubeai.org -n kubeai -o json`);
            kubeData = JSON.parse(stdout);
        } else {
            const token = fs.readFileSync(CONFIG.tokenPath, 'utf8');
            const ca = fs.readFileSync(CONFIG.caPath);
            kubeData = await request(`https://${CONFIG.k8sHost}:${CONFIG.k8sPort}/apis/kubeai.org/v1/models`, {
                ca,
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
        }
    } catch (err) { return {}; }

    const pricingMap = {};
    kubeData.items?.forEach(item => {
        const raw = item.metadata.annotations?.['openrouter.ai/json'];
        if (!raw) return;
        try {
            const m = JSON.parse(raw);
            pricingMap[m.id] = {
                name: m.name,
                prompt: parseFloat(m.pricing.prompt || 0),
                completion: parseFloat(m.pricing.completion || 0),
                request: parseFloat(m.pricing.request || 0)
            };
        } catch (e) {}
    });
    return pricingMap;
}

async function aggregateUsageFromLogs(vkId, startDate, endDate) {
    let page = 1;
    let hasMore = true;
    const modelUsage = {}; 
    
    // URL Encode the RFC3339 strings for the query params
    const startEnc = encodeURIComponent(startDate);
    const endEnc = encodeURIComponent(endDate);

    while (hasMore) {
        const url = `${CONFIG.bifrostUrl}/api/logs?virtual_key=${vkId}&start_date=${startEnc}&end_date=${endEnc}&page=${page}&limit=100`;
        try {
            const response = await request(url);
            const logs = response.logs || [];
            if (logs.length === 0) break;
            logs.forEach(log => {
                const mid = log.model || 'unknown';
                if (!modelUsage[mid]) modelUsage[mid] = { prompt: 0, completion: 0, requests: 0 };
                modelUsage[mid].prompt += (log.token_usage?.prompt_tokens || 0);
                modelUsage[mid].completion += (log.token_usage?.completion_tokens || 0);
                modelUsage[mid].requests += 1;
            });
            if (response.total_pages && page >= response.total_pages) hasMore = false;
            else if (logs.length < 100) hasMore = false;
            else page++;
        } catch (err) { hasMore = false; }
    }
    return modelUsage;
}

async function generateInvoices() {
    const { start_date, end_date } = getBillingRange();
    console.log(`Generating invoices for period: ${start_date} to ${end_date}`);
    const [modelPricing, vkResponse] = await Promise.all([
        getK8sModelPricing(),
        request(`${CONFIG.bifrostUrl}/api/governance/virtual-keys`)
    ]);

    const allKeys = vkResponse.virtual_keys || [];
    const keysByCustomer = allKeys.reduce((acc, vk) => {
        const cid = vk.customer_id;
        if (!cid) return acc;
        if (!acc[cid]) acc[cid] = { id: cid, name: vk.customer?.name || `Customer ${cid}`, keys: [] };
        acc[cid].keys.push(vk);
        return acc;
    }, {});

    const invoicePromises = Object.values(keysByCustomer).map(async (group) => {
        const usageResults = await Promise.all(group.keys.map(vk => aggregateUsageFromLogs(vk.id, start_date, end_date)));
        const combinedUsage = {};
        usageResults.forEach(res => {
            for (const [mid, stats] of Object.entries(res)) {
                if (!combinedUsage[mid]) combinedUsage[mid] = { prompt: 0, completion: 0, requests: 0 };
                combinedUsage[mid].prompt += stats.prompt;
                combinedUsage[mid].completion += stats.completion;
                combinedUsage[mid].requests += stats.requests;
            }
        });
        return buildInvoice(group, combinedUsage, modelPricing, start_date, end_date);
    });

    const invoices = await Promise.all(invoicePromises);
    return invoices.filter(inv => inv.total_tokens > 0);
}

function buildInvoice(customer, combinedUsage, pricing, start, end) {
    const location = process.env.LOCATION || 'local';
    
    // Generate Invoice ID using the high-precision timestamps
    const cleanName = customer.name.replace(/\s+/g, '_');
    const invoice_id = `${cleanName}_${start}_${end}_${location}`.replace(/:/g, '-');

    const inv = {
        invoice_id,
        customer_id: customer.id,
        customer_name: customer.name,
        currency: 'EUR',
        location,
        period: { start, end },
        total_cost: 0,
        total_tokens: 0,
        total_prompt_tokens: 0,
        total_completion_tokens: 0,
        total_requests_count: 0,
        total_requests_cost: 0,
        total_prompt_cost: 0,
        total_completion_cost: 0,
        models: {}
    };

    for (const [mid, usage] of Object.entries(combinedUsage)) {
        const rates = pricing[mid];
        const pCost = rates ? (usage.prompt * rates.prompt) : 0;
        const cCost = rates ? (usage.completion * rates.completion) : 0;
        const rCost = rates ? (usage.requests * rates.request) : 0;
        const totalModelCost = pCost + cCost + rCost;

        inv.models[mid] = {
            model_name: rates?.name || mid,
            prompt_tokens: usage.prompt,
            completion_tokens: usage.completion,
            requests: usage.requests,
            price_per_prompt_token: rates ? rates.prompt : 0,
            price_per_completion_token: rates ? rates.completion : 0,
            price_per_request: rates ? rates.request : 0,
            prompt_cost: Number(pCost.toFixed(6)),
            completion_cost: Number(cCost.toFixed(6)),
            requests_cost: Number(rCost.toFixed(6)),
            cost: Number(totalModelCost.toFixed(6))
        };

        inv.total_prompt_tokens += usage.prompt;
        inv.total_completion_tokens += usage.completion;
        inv.total_tokens += (usage.prompt + usage.completion);
        inv.total_requests_count += usage.requests;
        
        inv.total_prompt_cost += pCost;
        inv.total_completion_cost += cCost;
        inv.total_requests_cost += rCost;
        inv.total_cost += totalModelCost;
    }

    inv.total_prompt_cost = Number(inv.total_prompt_cost.toFixed(6));
    inv.total_completion_cost = Number(inv.total_completion_cost.toFixed(6));
    inv.total_requests_cost = Number(inv.total_requests_cost.toFixed(6));
    inv.total_cost = Number(inv.total_cost.toFixed(6));
    return inv;
}

// --- AUTOMATION / CRON JOB ---
let lastRunMonth = -1;

async function runScheduledJob() {
    const now = new Date();
    if (lastRunMonth === now.getUTCMonth()) return; 

    console.log(`[${now.toISOString()}] Starting scheduled monthly invoicing run...`);
    try {
        const invoices = await generateInvoices();
        console.log(`Successfully generated ${invoices.length} invoices.`);
        lastRunMonth = now.getUTCMonth();
    } catch (err) {
        console.error("Scheduled job failed:", err);
    }
}

function initCron() {
    console.log("Invoice scheduler active: Target 20th of every month at 00:00:00 UTC");
    setInterval(() => {
        const now = new Date();
        if (
            now.getUTCDate() === 20 && 
            now.getUTCHours() === 0 && 
            now.getUTCMinutes() === 0 &&
            now.getUTCSeconds() === 0
        ) {
            runScheduledJob();
        }
    }, 1000); 
}

// --- SERVER TRIGGER ---
const server = http.createServer(async (req, res) => {
    if (req.url === '/invoicing/generate' && req.method === 'GET') {
        try {
            const invoices = await generateInvoices();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(invoices));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Invoicing Service Running on port ${PORT}`);
    initCron();
});