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
    k8sPort: process.env.KUBERNETES_SERVICE_PORT,
    odooUrl: process.env.ODOO_URL || 'https://inferencebros.odoo.com',
    odooApiKey: process.env.ODOO_API_KEY || '',
    odooDatabase: process.env.ODOO_DATABASE || 'inferencebros'
} : {
    bifrostUrl: 'http://localhost:8082',
    useInClusterAuth: false,
    kubeconfig: process.env.KUBECONFIG || `${process.env.HOME}/.kube/config`,
    odooUrl: process.env.ODOO_URL || 'https://inferencebros.odoo.com',
    odooApiKey: process.env.ODOO_API_KEY || '',
    odooDatabase: process.env.ODOO_DATABASE || 'inferencebros'
};

// --- UTILS ---

function logger(level, message, data = '') {
    const timestamp = new Date().toISOString();
    const cleanData = typeof data === 'object' ? JSON.stringify(data) : data;
    console.log(`[${timestamp}] [${level}] ${message} ${cleanData}`);
}

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
        if (options.body) req.write(options.body);
        req.end();
    });
}

function getBillingRange() {
    const end = new Date();
    end.setUTCSeconds(0, 0, 0); 
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    start.setDate(start.getDate() - 1);
    start.setUTCSeconds(0, 0, 0);

    return { 
        start_date: start.toISOString(), 
        end_date: end.toISOString() 
    };
}

// --- CORE PRICING & USAGE LOGIC ---

async function getK8sModelPricing() {
    logger('SCAN', 'Fetching model pricing from K8s annotations...');
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
    } catch (err) { 
        logger('ERROR', 'Failed to fetch Kubernetes Model Pricing', err.message);
        return {}; 
    }

    const pricingMap = {};
    const items = kubeData.items || [];
    items.forEach(item => {
        const raw = item.metadata.annotations?.['openrouter.ai/json'];
        if (raw) {
            try {
                const m = JSON.parse(raw);
                pricingMap[m.id] = {
                    name: m.name,
                    prompt: parseFloat(m.pricing.prompt || 0),
                    completion: parseFloat(m.pricing.completion || 0),
                    request: parseFloat(m.pricing.request || 0)
                };
            } catch (e) {}
        }
    });
    logger('INFO', `Pricing loaded for ${Object.keys(pricingMap).length} models.`);
    return pricingMap;
}

async function aggregateUsageFromLogs(vkId, vkName, startDate, endDate) {
    let page = 1;
    let hasMore = true;
    let totalLogsScanned = 0;
    const modelUsage = {}; 
    const startEnc = encodeURIComponent(startDate);
    const endEnc = encodeURIComponent(endDate);

    while (hasMore) {
        const url = `${CONFIG.bifrostUrl}/api/logs?virtual_key=${vkId}&start_date=${startEnc}&end_date=${endEnc}&page=${page}&limit=100`;
        try {
            const response = await request(url);
            const logs = response.logs || [];
            if (logs.length === 0) {
                if (page === 1) logger('DEBUG', `No logs found for key: ${vkName} (${vkId})`);
                break;
            }
            
            totalLogsScanned += logs.length;
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
        } catch (err) { 
            logger('ERROR', `Log aggregation failed for VK ${vkName} on page ${page}`, err.message);
            hasMore = false; 
        }
    }
    if (totalLogsScanned > 0) logger('INFO', `Finished scanning key [${vkName}]: ${totalLogsScanned} logs processed.`);
    return modelUsage;
}

async function generateInvoices() {
    const { start_date, end_date } = getBillingRange();
    logger('INFO', `Starting usage aggregation for range: ${start_date} to ${end_date}`);
    
    const [modelPricing, vkResponse] = await Promise.all([
        getK8sModelPricing(),
        request(`${CONFIG.bifrostUrl}/api/governance/virtual-keys`)
    ]);

    const allKeys = vkResponse.virtual_keys || [];
    logger('INFO', `Found ${allKeys.length} Virtual Keys in Bifrost.`);

    const keysByCustomer = allKeys.reduce((acc, vk) => {
        const cid = vk.customer_id;
        if (!cid) return acc;
        if (!acc[cid]) acc[cid] = { id: cid, name: vk.customer?.name || `Customer ${cid}`, keys: [] };
        acc[cid].keys.push(vk);
        return acc;
    }, {});

    const customers = Object.values(keysByCustomer);
    logger('INFO', `Aggregating usage for ${customers.length} unique customers...`);

    const invoicePromises = customers.map(async (group) => {
        logger('SCAN', `Processing Customer: ${group.name} (${group.keys.length} keys)`);
        
        const usageResults = await Promise.all(group.keys.map(vk => 
            aggregateUsageFromLogs(vk.id, vk.name || vk.id, start_date, end_date)
        ));

        const combinedUsage = {};
        usageResults.forEach(res => {
            for (const [mid, stats] of Object.entries(res)) {
                if (!combinedUsage[mid]) combinedUsage[mid] = { prompt: 0, completion: 0, requests: 0 };
                combinedUsage[mid].prompt += stats.prompt;
                combinedUsage[mid].completion += stats.completion;
                combinedUsage[mid].requests += stats.requests;
            }
        });

        const invoice = buildInvoice(group, combinedUsage, modelPricing, start_date, end_date);
        if (invoice.total_tokens > 0) {
            logger('INFO', `Usage Summary [${group.name}]: ${invoice.total_tokens.toLocaleString()} tokens | Total: ${invoice.total_cost} EUR`);
        }
        return invoice;
    });

    const invoices = await Promise.all(invoicePromises);
    const billableInvoices = invoices.filter(inv => inv.total_tokens > 0);
    logger('INFO', `Generation complete. ${billableInvoices.length} customers have billable usage.`);
    return billableInvoices;
}

function buildInvoice(customer, combinedUsage, pricing, start, end) {
    const location = process.env.LOCATION || 'local';
    const cleanName = customer.name.replace(/\s+/g, '_');
    const invoice_id = `${cleanName}_${start}_${end}_${location}`.replace(/:/g, '-');

    const inv = {
        invoice_id,
        customer_id: customer.id,
        customer_name: customer.name,
        currency: 'EUR',
        issued_at: end,
        location,
        period: { start, end },
        total_cost: 0,
        total_tokens: 0,
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
            total_requests: usage.requests,
            cost: Number(totalModelCost.toFixed(6))
        };

        inv.total_tokens += (usage.prompt + usage.completion);
        inv.total_cost += totalModelCost;
    }

    inv.total_cost = Number(inv.total_cost.toFixed(6));
    return inv;
}

// --- ODOO INTEGRATION ---

async function odooCall(operation, model, method, args) {
    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: operation,
            args: [CONFIG.odooDatabase, 2, CONFIG.odooApiKey, model, method, ...args]
        },
        id: Math.floor(Math.random() * 1000)
    };

    return request(`${CONFIG.odooUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

async function findOdooPartner(customerName) {
    try {
        logger('ODOO', `Searching for partner: "${customerName}"`);
        const response = await odooCall("execute_kw", "res.partner", "search", [
            [['name', '=', customerName]], 
            { limit: 1 }
        ]);
        const partnerId = (response && response.length > 0) ? response[0] : null;
        if (partnerId) logger('ODOO', `Found Partner ID: ${partnerId} for "${customerName}"`);
        return partnerId;
    } catch (e) {
        logger('ERROR', `Odoo Partner Search failed for "${customerName}"`, e.message);
        return null;
    }
}

async function pushToOdoo(invoice) {
    const partnerId = await findOdooPartner(invoice.customer_name);
    if (!partnerId) {
        logger('WARN', `SKIPPING ODOO: No match for "${invoice.customer_name}"`);
        return { status: 'skipped', customer: invoice.customer_name };
    }

    const invoiceLines = Object.values(invoice.models).map(m => [0, 0, {
        name: `AI Usage: ${m.model_name} (${(m.prompt_tokens + m.completion_tokens).toLocaleString()} tokens)`,
        quantity: 1,
        price_unit: m.cost,
    }]);

    try {
        logger('ODOO', `Creating invoice for ${invoice.customer_name} (${invoiceLines.length} line items)`);
        const result = await odooCall("execute_kw", "account.move", "create", [[{
            'partner_id': partnerId,
            'move_type': 'out_invoice',
            'ref': invoice.invoice_id,
            'invoice_date': invoice.issued_at.split('T')[0],
            'invoice_line_ids': invoiceLines,
        }]]);
        
        logger('SUCCESS', `Odoo Invoice Created: ID ${result} for ${invoice.customer_name}`);
        return { status: 'success', odoo_id: result };
    } catch (err) {
        logger('ERROR', `Odoo Create Error for ${invoice.customer_name}`, err.message);
        return { status: 'error', error: err.message };
    }
}

// --- UNIFIED EXECUTION LOGIC ---

async function executeBillingRun(triggerType) {
    const now = new Date();
    console.log("\n" + "█".repeat(80));
    logger('RUN-START', `Trigger: ${triggerType} | Timestamp: ${now.toISOString()}`);
    console.log("█".repeat(80));

    try {
        const invoices = await generateInvoices();
        const results = [];
        
        if (invoices.length === 0) {
            logger('INFO', "Job finished: No usage data to process.");
        } else {
            for (const inv of invoices) { 
                const odooRes = await pushToOdoo(inv);
                results.push({
                    customer: inv.customer_name,
                    sync_result: odooRes
                });
            }

            const successCount = results.filter(r => r.sync_result.status === 'success').length;
            const skipCount = results.filter(r => r.sync_result.status === 'skipped').length;
            const errorCount = results.filter(r => r.sync_result.status === 'error').length;

            console.log("─".repeat(80));
            logger('RUN-COMPLETE', "Final Sync Report:", {
                total_detected: invoices.length,
                synced_successfully: successCount,
                skipped_no_partner: skipCount,
                errors: errorCount
            });
        }
        
        console.log("█".repeat(80) + "\n");
        return { 
            timestamp: now.toISOString(),
            trigger: triggerType,
            summary: {
                total_detected: invoices.length,
                synced: results.filter(r => r.sync_result.status === 'success').length,
                skipped: results.filter(r => r.sync_result.status === 'skipped').length,
                errors: results.filter(r => r.sync_result.status === 'error').length
            },
            details: results 
        };
    } catch (err) {
        logger('FATAL', "Critical Billing Run Failure", err.stack);
        throw err;
    }
}

// --- TRIGGER MECHANISMS ---

let lastRunMonth = -1;

function initCron() {
    logger('INFO', "Scheduler active: Monitoring for 20th of every month at 00:00:00 UTC");
    setInterval(async () => {
        const now = new Date();
        if (
            now.getUTCDate() === 20 && 
            now.getUTCHours() === 0 && 
            now.getUTCMinutes() === 0 &&
            now.getUTCSeconds() === 0 &&
            lastRunMonth !== now.getUTCMonth()
        ) {
            lastRunMonth = now.getUTCMonth();
            await executeBillingRun('CRON_JOB');
        }
    }, 1000); 
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/invoicing/generate' && req.method === 'GET') {
        try {
            const report = await executeBillingRun('HTTP_TRIGGER');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(report));
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
    logger('INFO', `Invoicing Service online on port ${PORT}`);
    initCron();
});