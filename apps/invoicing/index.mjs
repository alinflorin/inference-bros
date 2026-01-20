import http from 'http';
import https from 'https';
import fs from 'fs';

const PORT = 8080;
const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';
const K8S_HOST = process.env.KUBERNETES_SERVICE_HOST;
const K8S_PORT = process.env.KUBERNETES_SERVICE_PORT;

const server = http.createServer((req, res) => {
    const sendJSON = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    if (req.url === '/' && req.method === 'GET') {
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
                        
                        // Filter and Transform logic
                        const openRouterModels = kubeData.items
                            .filter(item => 
                                item.metadata.annotations && 
                                item.metadata.annotations['openrouter.ai/json']
                            )
                            .map(item => {
                                try {
                                    // Parse the string content of the annotation
                                    return JSON.parse(item.metadata.annotations['openrouter.ai/json']);
                                } catch (e) {
                                    console.error(`Failed to parse annotation for ${item.metadata.name}`);
                                    return null;
                                }
                            })
                            .filter(model => model !== null); // Remove any that failed parsing

                        sendJSON(200, {data: openRouterModels});
                    } else {
                        sendJSON(k8sRes.statusCode, { error: 'K8s API Error', details: body });
                    }
                });
            });

            k8sReq.on('error', (err) => sendJSON(500, { error: 'Request Failed', msg: err.message }));
            k8sReq.end();

        } catch (err) {
            sendJSON(500, { error: 'Internal Error', msg: err.message });
        }
    } else {
        sendJSON(404, { error: 'Not Found' });
    }
});

server.listen(PORT, () => console.log(`Listening on ${PORT}!`));

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);