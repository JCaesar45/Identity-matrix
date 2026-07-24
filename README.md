# Aetheris: Post-Quantum Infrastructure

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-Proprietary-blue)
![Java](https://img.shields.io/badge/Java-21-ED8B00)
![Python](https://img.shields.io/badge/Python-3.11-3776AB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)

Aetheris is a high-performance, quantum-ready cryptographic infrastructure platform. It provides lattice-based primitives, zero-knowledge proof execution at the edge, and sub-millisecond RPC via a custom binary protocol over QUIC.

## Architecture

The system is split into three distinct tiers to optimize for both I/O throughput and CPU-bound cryptographic lifting:

1. **Edge Routing (Python/FastAPI):** Handles WebSocket connections, authentication, and rapid entropy generation.
2. **Core Compute (Java 21):** Performs heavy lattice-based key generation and iterated hashing using the `ForkJoinPool`.
3. **Client State (TypeScript):** Manages frontend state, WebSocket lifecycles, and type-safe API consumption.

```text
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|  Frontend (TS)    | <---> |  Edge API (Py)    | <---> |  Core Compute (J) |
|  Vanilla + Canvas |  QUIC |  FastAPI + Uvicorn|  gRPC |  Java 21 + Loom   |
|                   |       |                   |       |                   |
+-------------------+       +-------------------+       +-------------------+
```

## Prerequisites

- Python 3.11+
- Java 21+ (JDK)
- Node.js 20+ (for TypeScript compilation)
- Modern browser with WebGL 2.0 support

## Quickstart

### 1. Edge API (Python)
```bash
cd edge-api
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn[standard] pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 2. Core Compute (Java)
```bash
cd core-compute
javac -d out src/io/aetheris/core/crypto/*.java
java -cp out io.aetheris.core.crypto.QuantumHashProcessor
```

### 3. Frontend
The frontend is entirely static. Serve the root directory using any HTTP server.
```bash
npx serve .
```

## Security Considerations

This repository contains mock implementations for demonstration purposes. For production deployments:
- Replace the mock `aetheris_dev_token` with actual mTLS certificates.
- Ensure the Java compute cluster is deployed within a hardware security module (HSM) enclave.
- Rotate lattice seeds every 24 hours.

## References

Crockford, D. (2008). *JavaScript: The good parts*. O'Reilly Media.

Nielsen, J. (2020, January 14). *10 usability heuristics for user interface design*. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/

Stallings, W. (2020). *Cryptography and network security: Principles and practice* (8th ed.). Pearson.

Zakas, N. C. (2012). *High performance JavaScript*. O'Reilly Media.
