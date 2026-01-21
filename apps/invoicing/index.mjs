import http from 'http';
import https from 'https';
import fs from 'fs';

const PORT = 8080;
const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';
const K8S_HOST = process.env.KUBERNETES_SERVICE_HOST;
const K8S_PORT = process.env.KUBERNETES_SERVICE_PORT;
const BIFROST_URL = 'http://bifrost.bifrost:8080';

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

async function generateInvoices() {
    // Step 1: Get model pricing from Kubernetes
    const modelPricing = await getModelPricing();
    
    // Step 2: Get usage data from Bifrost
    const usageData = await getBifrostUsage();
    
    // Step 3: Calculate invoices
    const invoices = calculateInvoices(usageData, modelPricing);
    
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

function getBifrostUsage() {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BIFROST_URL}/api/logs`);
        
        // Add query parameters for filtering (customize as needed)
        // url.searchParams.append('start_date', '2026-01-01');
        // url.searchParams.append('end_date', '2026-01-31');
        url.searchParams.append('limit', '10000'); // Adjust as needed
        
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
                        resolve(data.logs || data.data || []); // Adjust based on actual response structure
                    } catch (e) {
                        reject(new Error('Failed to parse Bifrost response'));
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

function calculateInvoices(usageData, modelPricing) {
    // Group usage by customer
    const customerUsage = {};

    usageData.forEach(log => {
        const customerId = log.customer_id || log.customer || 'unknown';
        const model = log.model;
        const promptTokens = log.usage?.prompt_tokens || 0;
        const completionTokens = log.usage?.completion_tokens || 0;

        if (!customerUsage[customerId]) {
            customerUsage[customerId] = {
                customer_id: customerId,
                total_cost: 0,
                models: {}
            };
        }

        if (!customerUsage[customerId].models[model]) {
            customerUsage[customerId].models[model] = {
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

            customerUsage[customerId].models[model].prompt_tokens += promptTokens;
            customerUsage[customerId].models[model].completion_tokens += completionTokens;
            customerUsage[customerId].models[model].cost += totalCost;
            customerUsage[customerId].total_cost += totalCost;
        } else {
            console.warn(`No pricing found for model: ${model}`);
        }
    });

    // Convert to array format
    return Object.values(customerUsage).map(customer => ({
        ...customer,
        models: Object.values(customer.models),
        total_cost: parseFloat(customer.total_cost.toFixed(6))
    }));
}

server.listen(PORT, () => console.log(`Invoicing service listening on ${PORT}!`));

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);