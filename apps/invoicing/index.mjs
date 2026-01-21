import http from 'http';
import https from 'https';
import fs from 'fs';

const PORT = 8080;
const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';
const K8S_HOST = process.env.KUBERNETES_SERVICE_HOST;
const K8S_PORT = process.env.KUBERNETES_SERVICE_PORT;
const BIFROST_URL = process.env.BIFROST_URL || 'http://bifrost.bifrost:8080';

const server = http.createServer((req, res) => {
    const sendJSON = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    if (req.url === '/invoicing/generate' && req.method === 'GET') {
        generateInvoices()
            .then(invoices => sendJSON(200, { data: invoices }))
            .catch(err => sendJSON(500, { error: 'Invoice Generation Failed', msg: err.message }));
    } else {
        sendJSON(404, { error: 'Not Found' });
    }
});

function getPreviousMonthRange() {
    const now = new Date();
    
    // Get first day of current month
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get last day of previous month (one day before first day of current month)
    const lastDayPrevMonth = new Date(firstDayCurrentMonth - 1);
    
    // Get first day of previous month
    const firstDayPrevMonth = new Date(lastDayPrevMonth.getFullYear(), lastDayPrevMonth.getMonth(), 1);
    
    // Format as YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    return {
        start_date: formatDate(firstDayPrevMonth),
        end_date: formatDate(lastDayPrevMonth)
    };
}

async function generateInvoices() {
    // Get date range for previous month
    const { start_date, end_date } = getPreviousMonthRange();
    
    console.log(`Generating invoices for period: ${start_date} to ${end_date}`);
    
    // Step 1: Get model pricing from Kubernetes
    const modelPricing = await getModelPricing();
    
    // Step 2: Get aggregated usage stats from Bifrost
    const usageStats = await getBifrostStats(start_date, end_date);
    
    // Step 3: Calculate invoices
    const invoices = calculateInvoices(usageStats, modelPricing, start_date, end_date);
    
    return invoices;
}

function getModelPricing() {
    return new Promise((resolve, reject) => {
        try {
            const token = fs.readFileSync(TOKEN_PATH, 'utf8');
            const ca = fs.readFileSync(CA_PATH);

            const options = {
                hostname: K8S_HOST,
                port: K8S_PORT,
                path: '/apis/kubeai.org/v1/models',
                method: 'GET',
                ca: ca,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };

            const k8sReq = https.request(options, (k8sRes) => {
                let body = '';
                k8sRes.on('data', (chunk) => body += chunk);
                k8sRes.on('end', () => {
                    if (k8sRes.statusCode === 200) {
                        const kubeData = JSON.parse(body);
                        
                        // Build pricing map: { modelId: { prompt: price, completion: price } }
                        const pricingMap = {};
                        
                        kubeData.items
                            .filter(item => 
                                item.metadata.annotations && 
                                item.metadata.annotations['openrouter.ai/json']
                            )
                            .forEach(item => {
                                try {
                                    const modelData = JSON.parse(item.metadata.annotations['openrouter.ai/json']);
                                    pricingMap[modelData.id] = {
                                        name: modelData.name,
                                        prompt: parseFloat(modelData.pricing.prompt),
                                        completion: parseFloat(modelData.pricing.completion),
                                        image: parseFloat(modelData.pricing.image || 0),
                                        request: parseFloat(modelData.pricing.request || 0)
                                    };
                                } catch (e) {
                                    console.error(`Failed to parse annotation for ${item.metadata.name}`);
                                }
                            });

                        resolve(pricingMap);
                    } else {
                        reject(new Error(`K8s API returned ${k8sRes.statusCode}: ${body}`));
                    }
                });
            });

            k8sReq.on('error', (err) => reject(err));
            k8sReq.end();

        } catch (err) {
            reject(err);
        }
    });
}

function getBifrostStats(start_date, end_date) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BIFROST_URL}/api/logs/stats`);
        
        // Add query parameters for filtering/grouping
        url.searchParams.append('group_by', 'customer,model');
        url.searchParams.append('start_date', start_date);
        url.searchParams.append('end_date', end_date);
        
        const protocol = url.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // Add auth header if Bifrost requires it
                // 'Authorization': `Bearer ${process.env.BIFROST_API_KEY}`
            }
        };

        const bifrostReq = protocol.request(url, options, (bifrostRes) => {
            let body = '';
            bifrostRes.on('data', (chunk) => body += chunk);
            bifrostRes.on('end', () => {
                if (bifrostRes.statusCode === 200) {
                    try {
                        const data = JSON.parse(body);
                        resolve(data.stats || data.data || data);
                    } catch (e) {
                        reject(new Error('Failed to parse Bifrost stats response'));
                    }
                } else {
                    reject(new Error(`Bifrost API returned ${bifrostRes.statusCode}: ${body}`));
                }
            });
        });

        bifrostReq.on('error', (err) => reject(err));
        bifrostReq.end();
    });
}

function calculateInvoices(usageStats, modelPricing, start_date, end_date) {
    // Group stats by customer
    const customerInvoices = {};

    // Assuming stats response structure like:
    // [
    //   { customer_id: "cust1", model: "qwen-25-05b", total_prompt_tokens: 10000, total_completion_tokens: 5000 },
    //   ...
    // ]
    
    usageStats.forEach(stat => {
        const customerId = stat.customer_id || stat.customer || 'unknown';
        const model = stat.model;
        const promptTokens = stat.total_prompt_tokens || stat.prompt_tokens || 0;
        const completionTokens = stat.total_completion_tokens || stat.completion_tokens || 0;

        if (!customerInvoices[customerId]) {
            customerInvoices[customerId] = {
                customer_id: customerId,
                billing_period: {
                    start: start_date,
                    end: end_date
                },
                total_cost: 0,
                total_prompt_tokens: 0,
                total_completion_tokens: 0,
                models: {}
            };
        }

        if (!customerInvoices[customerId].models[model]) {
            customerInvoices[customerId].models[model] = {
                model_name: model,
                prompt_tokens: 0,
                completion_tokens: 0,
                cost: 0
            };
        }

        // Get pricing for this model
        const pricing = modelPricing[model];
        
        if (pricing) {
            const promptCost = promptTokens * pricing.prompt;
            const completionCost = completionTokens * pricing.completion;
            const totalCost = promptCost + completionCost;

            customerInvoices[customerId].models[model].prompt_tokens += promptTokens;
            customerInvoices[customerId].models[model].completion_tokens += completionTokens;
            customerInvoices[customerId].models[model].cost += totalCost;
            
            customerInvoices[customerId].total_cost += totalCost;
            customerInvoices[customerId].total_prompt_tokens += promptTokens;
            customerInvoices[customerId].total_completion_tokens += completionTokens;
        } else {
            console.warn(`No pricing found for model: ${model}`);
        }
    });

    // Convert to array format
    return Object.values(customerInvoices).map(customer => ({
        customer_id: customer.customer_id,
        billing_period: customer.billing_period,
        total_cost: parseFloat(customer.total_cost.toFixed(6)),
        total_prompt_tokens: customer.total_prompt_tokens,
        total_completion_tokens: customer.total_completion_tokens,
        total_tokens: customer.total_prompt_tokens + customer.total_completion_tokens,
        models: Object.values(customer.models).map(m => ({
            ...m,
            cost: parseFloat(m.cost.toFixed(6))
        }))
    }));
}

server.listen(PORT, () => console.log(`Invoicing service listening on ${PORT}!`));

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);