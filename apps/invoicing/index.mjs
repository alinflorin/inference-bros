import http from 'http';
import https from 'https';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = 8080;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

function getBillingRange() {
    const now = new Date();
    const end = new Date(now);
    
    const start = new Date(now);
    // Go back exactly one month (no day subtraction)
    start.setMonth(start.getMonth() - 1);

    const format = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return { start_date: format(start), end_date: format(end) };
}

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
    } catch (err) {
        return {};
    }

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

    while (hasMore) {
        const url = `${CONFIG.bifrostUrl}/api/logs?virtual_key=${vkId}&start_date=${startDate}&end_date=${endDate}&page=${page}&limit=100`;
        try {
            const response = await request(url);
            const logs = response.logs || [];
            if (logs.length === 0) break;

            logs.forEach(log => {
                const mid = log.model || 'unknown';
                if (!modelUsage[mid]) {
                    modelUsage[mid] = { prompt: 0, completion: 0, requests: 0 };
                }
                modelUsage[mid].prompt += (log.token_usage?.prompt_tokens || 0);
                modelUsage[mid].completion += (log.token_usage?.completion_tokens || 0);
                modelUsage[mid].requests += 1;
            });

            if (response.total_pages && page >= response.total_pages) hasMore = false;
            else if (logs.length < 100) hasMore = false;
            else page++;
        } catch (err) {
            hasMore = false;
        }
    }
    return modelUsage;
}

async function generateInvoices() {
    const { start_date, end_date } = getBillingRange();
    const [modelPricing, vkResponse] = await Promise.all([
        getK8sModelPricing(),
        request(`${CONFIG.bifrostUrl}/api/governance/virtual-keys`)
    ]);

    const allKeys = vkResponse.virtual_keys || [];
    const keysByCustomer = allKeys.reduce((acc, vk) => {
        const cid = vk.customer_id;
        if (!cid) return acc;
        if (!acc[cid]) {
            acc[cid] = { id: cid, name: vk.customer?.name || `Customer ${cid}`, keys: [] };
        }
        acc[cid].keys.push(vk);
        return acc;
    }, {});

    const invoicePromises = Object.values(keysByCustomer).map(async (group) => {
        const usageResults = await Promise.all(
            group.keys.map(vk => aggregateUsageFromLogs(vk.id, start_date, end_date))
        );

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
    const inv = {
        customer_id: customer.id,
        customer_name: customer.name,
        currency: 'EUR',
        location: process.env.LOCATION || 'local',
        period: { start, end },
        total_cost: 0,
        total_tokens: 0,
        total_prompt_tokens: 0,
        total_completion_tokens: 0,
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
            prompt_cost: Number(pCost.toFixed(6)),
            completion_cost: Number(cCost.toFixed(6)),
            cost: Number(totalModelCost.toFixed(6))
        };

        inv.total_prompt_tokens += usage.prompt;
        inv.total_completion_tokens += usage.completion;
        inv.total_tokens += (usage.prompt + usage.completion);
        
        inv.total_prompt_cost += pCost;
        inv.total_completion_cost += cCost;
        inv.total_cost += totalModelCost;
    }

    inv.total_prompt_cost = Number(inv.total_prompt_cost.toFixed(6));
    inv.total_completion_cost = Number(inv.total_completion_cost.toFixed(6));
    inv.total_cost = Number(inv.total_cost.toFixed(6));
    
    return inv;
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/invoicing/generate' && req.method === 'GET') {
        try {
            const invoices = await generateInvoices();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            // Direct JSON Array output
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

server.listen(PORT, () => console.log(`Invoicing Service Running on port ${PORT}`));