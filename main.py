from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import secrets
import hashlib
import time
import uvicorn
from typing import Optional

app = FastAPI(
    title="Aetheris Edge API",
    description="Post-quantum cryptographic edge routing and entropy generation.",
    version="2.4.0"
)

security = HTTPBearer()

class EntropyRequest(BaseModel):
    enclave_id: str = Field(..., min_length=16, max_length=64)
    byte_length: int = Field(default=32, ge=16, le=256)
    algorithm: str = Field(default="CRYSTALS-Kyber-1024", pattern="^(CRYSTALS-Kyber-1024|Dilithium-3|Falcon-1024)$")

class EntropyResponse(BaseModel):
    request_id: str
    enclave_id: str
    entropy_hex: str
    timestamp: int
    algorithm: str
    processing_time_ms: float

class HandshakePayload(BaseModel):
    public_key_hex: str
    signature_hex: str
    nonce: str

async def verify_enclave_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    if not token.startswith("aetheris_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid enclave token format"
        )
    return token

@app.post("/api/v1/entropy/generate", response_model=EntropyResponse, status_code=status.HTTP_201_CREATED)
async def generate_quantum_entropy(
    payload: EntropyRequest,
    token: str = Depends(verify_enclave_token)
):
    start_time = time.perf_counter()
    
    try:
        raw_bytes = secrets.token_bytes(payload.byte_length)
        
        context_hash = hashlib.sha3_256(
            payload.enclave_id.encode('utf-8') + raw_bytes
        ).digest()
        
        final_entropy = context_hash.hex()
        
        processing_time = (time.perf_counter() - start_time) * 1000
        
        return EntropyResponse(
            request_id=secrets.token_hex(8),
            enclave_id=payload.enclave_id,
            entropy_hex=final_entropy,
            timestamp=int(time.time() * 1000),
            algorithm=payload.algorithm,
            processing_time_ms=round(processing_time, 4)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Entropy generation failed: {str(e)}"
        )

@app.post("/api/v1/handshake/initiate", status_code=status.HTTP_202_ACCEPTED)
async def initiate_handshake(
    payload: HandshakePayload,
    token: str = Depends(verify_enclave_token)
):
    if len(payload.public_key_hex) % 2 != 0:
        raise HTTPException(status_code=400, detail="Malformed public key hex string")
        
    return {
        "status": "queued",
        "message": "Handshake payload routed to core Java compute cluster.",
        "queue_id": secrets.token_hex(16)
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        loop="uvloop",
        http="httptools"
    )
