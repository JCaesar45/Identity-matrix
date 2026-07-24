type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestConfig<T> {
    endpoint: string;
    method: HttpMethod;
    payload?: T;
    headers?: Record<string, string>;
    timeout?: number;
}

interface ApiResponse<T> {
    data: T;
    status: number;
    requestId: string;
    timestamp: number;
}

interface EntropyPayload {
    enclave_id: string;
    byte_length: number;
    algorithm: 'CRYSTALS-Kyber-1024' | 'Dilithium-3' | 'Falcon-1024';
}

interface EntropyData {
    request_id: string;
    enclave_id: string;
    entropy_hex: string;
    timestamp: number;
    algorithm: string;
    processing_time_ms: number;
}

class AetherisError extends Error {
    public readonly statusCode: number;
    public readonly requestId: string;

    constructor(message: string, statusCode: number, requestId: string) {
        super(message);
        this.name = 'AetherisError';
        this.statusCode = statusCode;
        this.requestId = requestId;
    }
}

class AetherisClient {
    private readonly baseUrl: string;
    private readonly authToken: string;
    private readonly defaultTimeout: number;

    constructor(baseUrl: string, authToken: string, defaultTimeout: number = 5000) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.authToken = authToken;
        this.defaultTimeout = defaultTimeout;
    }

    private async request<TReq, TRes>(config: RequestConfig<TReq>): Promise<ApiResponse<TRes>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.defaultTimeout);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            'X-Client-Version': '2.4.0',
            ...config.headers
        };

        try {
            const response = await fetch(`${this.baseUrl}${config.endpoint}`, {
                method: config.method,
                headers,
                body: config.payload ? JSON.stringify(config.payload) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new AetherisError(
                    errorBody.detail || 'Request failed',
                    response.status,
                    errorBody.request_id || 'unknown'
                );
            }

            const data = await response.json() as TRes;
            
            return {
                data,
                status: response.status,
                requestId: response.headers.get('X-Request-Id') || 'unknown',
                timestamp: Date.now()
            };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof AetherisError) throw error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new AetherisError('Request timed out', 408, 'timeout');
            }
            throw new AetherisError('Network error', 0, 'network');
        }
    }

    public async generateEntropy(payload: EntropyPayload): Promise<ApiResponse<EntropyData>> {
        return this.request<EntropyPayload, EntropyData>({
            endpoint: '/api/v1/entropy/generate',
            method: 'POST',
            payload
        });
    }

    public async initiateHandshake(publicKey: string, signature: string, nonce: string): Promise<ApiResponse<{ queue_id: string }>> {
        return this.request({
            endpoint: '/api/v1/handshake/initiate',
            method: 'POST',
            payload: { public_key_hex: publicKey, signature_hex: signature, nonce }
        });
    }
}

type Listener<T> = (state: T) => void;

class ReactiveStore<T> {
    private state: T;
    private listeners: Set<Listener<T>> = new Set();

    constructor(initialState: T) {
        this.state = initialState;
    }

    public getState(): Readonly<T> {
        return this.state;
    }

    public setState(partial: Partial<T>): void {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    public subscribe(listener: Listener<T>): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}

interface AppState {
    isAuthenticated: boolean;
    enclaveId: string | null;
    currentEntropy: string | null;
    isLoading: boolean;
    error: string | null;
}

const store = new ReactiveStore<AppState>({
    isAuthenticated: false,
    enclaveId: null,
    currentEntropy: null,
    isLoading: false,
    error: null
});

const client = new AetherisClient('https://api.aetheris.io', 'aetheris_dev_token_123');

async function bootstrapEnclave(enclaveId: string) {
    store.setState({ isLoading: true, error: null, enclaveId });
    
    try {
        const response = await client.generateEntropy({
            enclave_id: enclaveId,
            byte_length: 64,
            algorithm: 'CRYSTALS-Kyber-1024'
        });
        
        store.setState({
            isAuthenticated: true,
            currentEntropy: response.data.entropy_hex,
            isLoading: false
        });
    } catch (err) {
        const message = err instanceof AetherisError ? err.message : 'Unknown error';
        store.setState({ isLoading: false, error: message });
    }
}

store.subscribe((state) => {
    console.log('[Aetheris State Update]', state);
});
