import React, { useState, useEffect } from 'react';

type MenuItem = 'INFRASTRUCTURE' | 'MODELS' | 'PRICING' | 'GET STARTED';

interface ContentSection {
    title: string;
    subtitle: string;
    description: string;
}

interface LogEntry {
    timestamp: string;
    message: string;
}

interface ModalContent {
    title: string;
    content: string;
}

interface ButtonConfig {
    label: string;
    title: string;
    content: string;
}

const InferenceBrosLanding: React.FC = () => {
    const [activeMenu, setActiveMenu] = useState<MenuItem>('INFRASTRUCTURE');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ModalContent | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredMenu, setHoveredMenu] = useState<MenuItem | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([
        {
            timestamp: new Date(Date.now() - 12000).toISOString(),
            message: '$ init --boot-sequence'
        },
        {
            timestamp: new Date(Date.now() - 11000).toISOString(),
            message: '→ System initialization started'
        },
        {
            timestamp: new Date(Date.now() - 10000).toISOString(),
            message: '$ verify --core-modules'
        },
        {
            timestamp: new Date(Date.now() - 9000).toISOString(),
            message: '→ All modules verified'
        },
        {
            timestamp: new Date(Date.now() - 8000).toISOString(),
            message: '$ connect --network-layer'
        },
        {
            timestamp: new Date(Date.now() - 7000).toISOString(),
            message: '→ Network connection established'
        },
        {
            timestamp: new Date(Date.now() - 6000).toISOString(),
            message: '$ load --resource-pool'
        },
        {
            timestamp: new Date(Date.now() - 5000).toISOString(),
            message: '→ Resources allocated'
        },
        {
            timestamp: new Date(Date.now() - 4000).toISOString(),
            message: '$ sync --global-state'
        },
        {
            timestamp: new Date(Date.now() - 3000).toISOString(),
            message: '→ Synchronization complete'
        },
        {
            timestamp: new Date(Date.now() - 2000).toISOString(),
            message: '$ status --system'
        },
        {
            timestamp: new Date(Date.now() - 1000).toISOString(),
            message: '→ System ready'
        }
    ]);

    const menuItems: MenuItem[] = ['INFRASTRUCTURE', 'MODELS', 'PRICING', 'GET STARTED'];

    const content: Record<MenuItem, ContentSection> = {
        INFRASTRUCTURE: {
            title: 'BARE-METAL AI INFRASTRUCTURE',
            subtitle: '↳ KUBERNETES-BASED PLATFORM',
            description: 'Deploy and serve AI language models on your own hardware with enterprise-grade Kubernetes orchestration.'
        },
        MODELS: {
            title: 'SUPPORTED AI MODELS',
            subtitle: '↳ QWEN / LLAMA / MISTRAL',
            description: 'Access cutting-edge language models including Qwen, Llama, and other open-source models via OpenAI-compatible API.'
        },
        PRICING: {
            title: 'TRANSPARENT PRICING',
            subtitle: '↳ PAY-PER-USE MODEL',
            description: 'Flexible pricing based on actual usage. No hidden fees, no long-term commitments. Scale up or down as needed.'
        },
        'GET STARTED': {
            title: 'QUICK START GUIDE',
            subtitle: '↳ DEPLOY IN MINUTES',
            description: 'Quick setup guide to deploy your first AI model. From API keys to production-ready inference in under 10 minutes.'
        }
    };

    const buttonContent: Record<MenuItem, ButtonConfig[]> = {
        INFRASTRUCTURE: [
            {
                label: 'DEPLOYMENT',
                title: 'DEPLOYMENT',
                content: `Deploy AI models on bare-metal infrastructure with full control over your hardware resources.

Our platform supports:
- Automated container orchestration
- Load balancing across multiple nodes
- Zero-downtime deployments
- Rollback capabilities
- Custom resource allocation

Perfect for enterprises requiring dedicated hardware and maximum performance.`
            },
            {
                label: 'API ACCESS',
                title: 'API ACCESS',
                content: `OpenAI-compatible API endpoints for seamless integration with your existing applications.

Features:
- RESTful API design
- WebSocket support for streaming
- Rate limiting and quota management
- API key authentication
- Comprehensive documentation
- SDKs for Python, JavaScript, Go

Start making inference calls in minutes with our intuitive API.`
            },
            {
                label: 'MONITORING',
                title: 'MONITORING',
                content: `Real-time monitoring and analytics for your AI infrastructure.

Track:
- Request latency and throughput
- Resource utilization (CPU, GPU, Memory)
- Model performance metrics
- Error rates and debugging logs
- Cost analytics per model/endpoint
- Usage patterns and trends

Full observability with customizable dashboards and alerts.`
            }
        ],
        MODELS: [
            {
                label: 'MODEL CATALOG',
                title: 'MODEL CATALOG',
                content: `Browse our comprehensive catalog of supported language models.

Available Models:
- Qwen 2.5 (7B, 14B, 32B, 72B parameters)
- Llama 3.1 (8B, 70B, 405B parameters)
- Mistral 7B and Mixtral 8x7B
- DeepSeek models
- CodeLlama for code generation
- Custom fine-tuned models

All models support:
- Chat completions
- Text generation
- Function calling
- Streaming responses`
            },
            {
                label: 'BENCHMARKS',
                title: 'PERFORMANCE BENCHMARKS',
                content: `Detailed performance metrics for all supported models.

Benchmark Data:
- Tokens per second (throughput)
- Time to first token (latency)
- Context window utilization
- Memory footprint
- GPU requirements
- Accuracy on standard datasets

All benchmarks measured on our bare-metal infrastructure with real-world workloads.

Compare models to find the best fit for your use case.`
            },
            {
                label: 'CUSTOM MODELS',
                title: 'CUSTOM MODEL DEPLOYMENT',
                content: `Deploy your own fine-tuned or custom models on our infrastructure.

Supported Formats:
- GGUF quantized models
- Hugging Face Transformers
- vLLM compatible models
- TensorRT optimized models

Features:
- Automatic model optimization
- Custom tokenizer support
- Model versioning
- A/B testing capabilities
- Private model hosting

Bring your own models and leverage our infrastructure for inference at scale.`
            }
        ],
        PRICING: [
            {
                label: 'PAY PER USE',
                title: 'PAY-PER-USE MODEL',
                content: `Simple, transparent pricing based on actual consumption.

BILLING STRUCTURE:
- Token-based pricing
- Charged only for what you use
- No minimum commitments
- No hidden fees
- No setup costs
- Cancel anytime

FLEXIBILITY:
- Scale up or down instantly
- No long-term contracts
- Pay as you grow
- Volume discounts available

Our pricing model ensures you only pay for the resources you actually consume, making it cost-effective for projects of any size.`
            },
            {
                label: 'USAGE TRACKING',
                title: 'USAGE TRACKING',
                content: `Monitor your consumption in real-time with comprehensive analytics.

TRACKING FEATURES:
- Real-time usage dashboard
- Detailed per-model metrics
- Historical usage data
- Cost breakdowns
- Usage alerts
- Export capabilities
- API analytics

TRANSPARENCY:
- Clear cost visibility
- No surprise charges
- Predictable billing
- Detailed invoices
- Usage forecasting

Track every request and understand exactly what you're paying for at all times.`
            },
            {
                label: 'ENTERPRISE',
                title: 'ENTERPRISE SOLUTIONS',
                content: `Custom solutions for organizations with specific requirements.

ENTERPRISE FEATURES:
- Dedicated infrastructure
- Custom pricing models
- Volume commitments
- Priority support
- Custom SLA agreements
- On-premise deployment options
- White-label capabilities
- Dedicated account management

CONTACT US:
Get in touch with our sales team to discuss:
- Custom pricing structures
- Volume discounts
- Infrastructure requirements
- Compliance needs
- Integration support

We work with you to create a solution that fits your organization's needs and budget.`
            }
        ],
        'GET STARTED': [
            {
                label: 'API REFERENCE',
                title: 'API REFERENCE',
                content: `Complete API documentation for integrating with Inference Bros.

ENDPOINTS:
- /v1/completions - Text completion
- /v1/chat/completions - Chat interface
- /v1/models - List available models
- /v1/embeddings - Generate embeddings

AUTHENTICATION:
- API key authentication
- Bearer token support
- Rate limiting headers
- Request signing

REQUEST FORMAT:
- JSON request/response
- Streaming support via SSE
- WebSocket connections
- Batch processing

RESPONSE CODES:
- 200: Success
- 401: Unauthorized
- 429: Rate limit exceeded
- 500: Server error

Full API documentation with examples available in our developer portal.`
            },
            {
                label: 'START NOW →',
                title: 'GET STARTED NOW',
                content: `Ready to deploy? Start using Inference Bros in three simple steps.

STEP 1: CREATE ACCOUNT
- Sign up for free account
- Verify your email
- Choose your plan
- Get your API key

STEP 2: MAKE FIRST REQUEST
- Install SDK or use cURL
- Configure authentication
- Select your model
- Send test request

STEP 3: GO TO PRODUCTION
- Monitor performance
- Scale as needed
- Get support when needed
- Optimize costs

QUICK START:
curl https://api.inferencebros.com/v1/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"model": "qwen-72b", "prompt": "Hello"}'

Need help? Our support team is ready to assist you at every step.

→ CREATE YOUR FREE ACCOUNT NOW`
            },
            {
                label: 'DOCUMENTATION',
                title: 'DOCUMENTATION',
                content: `Comprehensive guides and tutorials for all aspects of the platform.

GETTING STARTED:
- Quick start guide
- Installation instructions
- First API call tutorial
- Authentication setup
- SDK setup guides

GUIDES:
- Model selection guide
- Performance optimization
- Error handling
- Streaming responses
- Batch processing
- Rate limiting

TUTORIALS:
- Building a chatbot
- Document processing
- Code generation
- Custom integrations
- Production deployment

SDKS & LIBRARIES:
- Python SDK
- JavaScript/TypeScript SDK
- Go SDK
- REST API examples
- Code snippets

Visit our documentation portal for detailed guides, video tutorials, and community examples.`
            }
        ]
    };

    const addLog = (message: string) => {
        const timestamp = new Date().toISOString();
        setLogs(prev => {
            const newLogs = [...prev, { timestamp, message }];
            return newLogs.slice(-12);
        });
    };

    const handleMenuClick = (item: MenuItem) => {
        const path = item.toLowerCase();
        addLog(`$ cd /menu/${path}`);

        setTimeout(() => {
            setActiveMenu(item);
            setIsMobileMenuOpen(false);
            addLog(`→ NAVIGATION COMPLETE`);
        }, 300);
    };

    const openModal = (title: string, content: string) => {
        setModalContent({ title, content });
        setIsModalOpen(true);
        addLog(`$ open --modal=${title.toLowerCase().replace(/\s+/g, '-')}`);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        addLog(`→ Modal closed`);
    };

    // ESC key to close modal
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    const currentButtons = buttonContent[activeMenu];

    React.useEffect(() => {
        // Set body and html to full width
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.width = '100%';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.documentElement.style.width = '100%';

        // Ensure viewport meta tag is set
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            document.head.appendChild(viewport);
        }
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        // Only prevent overflow on desktop
        if (window.innerWidth >= 1024) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, []);

    return (
        <div className="bg-black lg:w-screen lg:h-screen lg:fixed lg:inset-0" style={{ width: '100vw', minHeight: '100vh' }}>
            {/* Desktop Layout */}
            <div className="hidden lg:block h-full overflow-hidden">
                <div className="grid grid-cols-[400px_1fr] grid-rows-[100px_1fr_80px_10px_100px_10px] h-full bg-black text-white font-mono">

                    {/* Header */}
                    <div className="bg-black flex items-center px-10">
                        <img src="/IB_icon.svg" alt="Inference Bros Logo" className="h-7 mr-4" />
                        <div className="text-2xl font-bold tracking-[2px]">INFERENCE BROS.</div>
                    </div>

                    {/* Menu */}
                    <div className="bg-black flex flex-col justify-center px-10 gap-5 row-start-2">
                        <div className="text-sm opacity-50 mb-4 tracking-wider">$ ls /menu</div>
                        {menuItems.map((item) => (
                            <div
                                key={item}
                                className={`text-5xl font-bold tracking-tight cursor-pointer select-none transition-all duration-300 ${hoveredMenu && hoveredMenu !== item ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'
                                    }`}
                                onClick={() => handleMenuClick(item)}
                                onMouseEnter={() => setHoveredMenu(item)}
                                onMouseLeave={() => setHoveredMenu(null)}
                            >
                                {item}
                            </div>
                        ))}
                    </div>

                    {/* Dynamic Window */}
                    <div className="bg-black flex flex-col justify-center items-center p-20 col-start-2 row-start-1 row-span-2 overflow-hidden">
                        <div className="text-7xl font-light tracking-[4px] text-center leading-[1.4] mb-10 max-w-4xl">
                            {content[activeMenu].title.split(' ').map((word, i, arr) => (
                                <React.Fragment key={i}>
                                    {word}
                                    {(i + 1) % 3 === 0 && i !== arr.length - 1 ? <br /> : ' '}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="text-xl tracking-[2px] opacity-90 mb-6">
                            {content[activeMenu].subtitle}
                        </div>
                        <div className="text-base max-w-2xl text-center opacity-80 leading-relaxed mb-8">
                            {content[activeMenu].description}
                        </div>

                        {/* Renewable Energy Badge - Only for Infrastructure */}
                        {activeMenu === 'INFRASTRUCTURE' && (
                            <div className="flex flex-col items-center mt-6 opacity-70">
                                <img src="/leaf.svg" alt="Renewable Energy" className="h-8 w-8 mb-2" />
                                <div className="text-sm tracking-[2px] uppercase">
                                    Powered by 100% Renewable Energy
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation History */}
                    <div className="bg-black px-10 flex flex-col justify-center row-start-3 row-span-2 overflow-hidden">
                        <div className="text-3xl font-bold tracking-wide mb-2">System Status</div>
                        <div className="flex flex-col-reverse gap-0.5 max-h-16 overflow-hidden">
                            {logs.slice(-7).reverse().map((log, index) => (
                                <div key={index} className="text-xs opacity-80 font-mono leading-tight">
                                    [{new Date(log.timestamp).toLocaleTimeString('en-US', {
                                        hour12: false,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}] {log.message}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 bg-black col-start-2 row-start-3">
                        {currentButtons.map((button, index) => (
                            <button
                                key={index}
                                className={`${index === 1 && activeMenu === 'GET STARTED'
                                        ? 'bg-white text-black'
                                        : 'bg-black text-white'
                                    } flex items-center justify-center font-bold text-lg tracking-wide ${index === 1 && activeMenu === 'GET STARTED'
                                        ? 'hover:bg-gray-200'
                                        : 'hover:bg-white hover:text-black'
                                    } transition-colors cursor-pointer`}
                                onClick={() => openModal(button.title, button.content)}
                            >
                                {button.label}
                            </button>
                        ))}
                    </div>

                    {/* Spacer */}
                    <div className="bg-black col-start-2 row-start-4"></div>

                    {/* Footer */}
                    <div className="bg-black flex justify-center items-center px-16 col-start-2 row-start-5">
                        <div className="flex gap-8 text-sm tracking-[2px]">
                            <div className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                FAQ
                            </div>
                            <div className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                TERMS
                            </div>
                            <div className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                PRIVACY
                            </div>
                            <div className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                COOKIES
                            </div>
                        </div>
                    </div>

                    {/* Bottom Spacer */}
                    <div className="bg-black col-start-2 row-start-6"></div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden min-h-screen bg-black text-white font-mono" style={{ width: '100vw', overflowX: 'hidden' }}>
                {/* Mobile Header */}
                <div className="bg-black flex items-center py-6 sticky top-0 z-40 relative" style={{ width: '100vw', maxWidth: '100vw', paddingLeft: '16px', paddingRight: '16px' }}>
                    <div className="flex items-center">
                        <img src="/IB_icon.svg" alt="Inference Bros Logo" className="h-7 mr-2 flex-shrink-0" />
                        <div className="text-lg font-bold tracking-[0.5px] whitespace-nowrap">INFERENCE BROS.</div>
                    </div>
                    <button
                        className="text-3xl font-bold leading-none bg-transparent border-none outline-none focus:outline-none flex items-center justify-center"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ boxShadow: 'none', border: 'none', position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', padding: '0', margin: '0' }}
                    >
                        {isMobileMenuOpen ? '×' : '☰'}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black z-50 flex flex-col pt-24 overflow-hidden">
                        {/* Close button */}
                        <button
                            className="text-4xl font-bold leading-none bg-transparent border-none outline-none focus:outline-none flex items-center justify-center text-white"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{ boxShadow: 'none', border: 'none', position: 'absolute', right: '16px', top: '24px', padding: '0', margin: '0', zIndex: 60 }}
                        >
                            ×
                        </button>

                        <div className="flex-1 flex flex-col justify-center px-6 gap-8">
                            <div className="text-base opacity-50 mb-4 tracking-wider">$ ls /menu</div>
                            {menuItems.map((item) => (
                                <div
                                    key={item}
                                    className="text-4xl font-bold tracking-tight cursor-pointer select-none break-words"
                                    onClick={() => handleMenuClick(item)}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile Content */}
                {!isMobileMenuOpen && (
                    <div className="flex flex-col overflow-x-hidden">
                        {/* Dynamic Window */}
                        <div className="bg-black flex flex-col justify-center items-center px-4 py-16 min-h-[60vh]">
                            <div className="text-4xl font-light tracking-[2px] text-center leading-[1.2] mb-8 break-words w-full">
                                {content[activeMenu].title}
                            </div>
                            <div className="text-xl tracking-[2px] opacity-90 mb-6 text-center break-words">
                                {content[activeMenu].subtitle}
                            </div>
                            <div className="text-base max-w-lg text-center opacity-80 leading-relaxed px-2">
                                {content[activeMenu].description}
                            </div>

                            {/* Renewable Energy Badge - Only for Infrastructure */}
                            {activeMenu === 'INFRASTRUCTURE' && (
                                <div className="flex flex-col items-center mt-8 opacity-70">
                                    <img src="/leaf.svg" alt="Renewable Energy" className="h-12 w-12 mb-3" />
                                    <div className="text-sm tracking-[2px] uppercase text-center px-4">
                                        Powered by 100% Renewable Energy
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 bg-black border-t-2 border-white">
                            {currentButtons.map((button, index) => (
                                <button
                                    key={index}
                                    className={`${index === 1 && activeMenu === 'GET STARTED'
                                            ? 'bg-white text-black'
                                            : 'bg-black text-white'
                                        } flex items-center justify-center font-bold text-lg tracking-wide py-8 border-b-2 border-white last:border-b-0 px-4`}
                                    onClick={() => openModal(button.title, button.content)}
                                >
                                    {button.label}
                                </button>
                            ))}
                        </div>

                        {/* System Status */}
                        <div className="bg-black px-4 py-8 border-t-2 border-white overflow-x-hidden">
                            <div className="text-3xl font-bold tracking-wide mb-4">System Status</div>
                            <div className="flex flex-col-reverse gap-2">
                                {logs.slice(-5).reverse().map((log, index) => (
                                    <div key={index} className="text-xs opacity-80 font-mono leading-relaxed break-all">
                                        [{new Date(log.timestamp).toLocaleTimeString('en-US', {
                                            hour12: false,
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}] {log.message}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-black flex justify-center items-center px-4 py-10 border-t-2 border-white">
                            <div className="flex flex-wrap gap-6 text-sm tracking-[2px] justify-center">
                                <div className="cursor-pointer opacity-80">FAQ</div>
                                <div className="cursor-pointer opacity-80">TERMS</div>
                                <div className="cursor-pointer opacity-80">PRIVACY</div>
                                <div className="cursor-pointer opacity-80">COOKIES</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && modalContent && (
                <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-black border-2 border-white max-w-3xl w-full max-h-[85vh] flex flex-col animate-in" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-white text-black px-8 py-5 flex justify-between items-center border-b-2 border-black">
                            <h2 className="text-2xl font-bold tracking-[3px]">{modalContent.title}</h2>
                            <button
                                className="text-4xl font-bold text-black bg-white leading-none w-10 h-10 flex items-center justify-center border-none outline-none focus:outline-none focus:ring-0 cursor-pointer"
                                onClick={closeModal}
                                style={{ boxShadow: 'none', border: 'none' }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 text-white whitespace-pre-line leading-relaxed text-base overflow-y-auto flex-1 scrollbar-thin">
                            <div className="border-l-4 border-white pl-6">
                                {modalContent.content}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-black px-8 py-5 flex justify-between items-center border-t-2 border-white">
                            <div className="text-xs opacity-50 tracking-[2px]">ESC TO CLOSE</div>
                            <button
                                className="bg-white text-black px-8 py-3 font-bold tracking-[2px] hover:bg-gray-200 border-none outline-none focus:outline-none focus:ring-0 cursor-pointer"
                                onClick={closeModal}
                                style={{ boxShadow: 'none', border: 'none' }}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InferenceBrosLanding;
