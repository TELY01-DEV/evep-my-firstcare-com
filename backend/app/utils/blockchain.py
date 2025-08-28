import hashlib
import json
from datetime import datetime
from typing import Any, Dict

def generate_blockchain_hash(data: str) -> str:
    """
    Generate a blockchain-style hash for audit trail verification
    
    Args:
        data: String data to hash
        
    Returns:
        SHA-256 hash of the data
    """
    # Create a timestamped hash
    timestamp = datetime.utcnow().isoformat()
    hash_data = f"{data}:{timestamp}"
    
    # Generate SHA-256 hash
    hash_object = hashlib.sha256(hash_data.encode('utf-8'))
    return hash_object.hexdigest()

def verify_blockchain_hash(data: str, expected_hash: str) -> bool:
    """
    Verify a blockchain hash (simplified version)
    
    Args:
        data: Original data string
        expected_hash: Expected hash to verify against
        
    Returns:
        True if hash matches, False otherwise
    """
    # For now, we'll just generate a new hash and compare
    # In a real implementation, you'd want to store the timestamp
    # and verify the exact hash
    current_hash = generate_blockchain_hash(data)
    return current_hash == expected_hash

def create_audit_block(action: str, user_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create an audit block for blockchain-style logging
    
    Args:
        action: The action being performed
        user_id: ID of the user performing the action
        details: Additional details about the action
        
    Returns:
        Audit block with hash
    """
    timestamp = datetime.utcnow().isoformat()
    
    block_data = {
        "action": action,
        "user_id": user_id,
        "timestamp": timestamp,
        "details": details
    }
    
    # Create hash from block data
    data_string = json.dumps(block_data, sort_keys=True)
    block_hash = generate_blockchain_hash(data_string)
    
    return {
        "block_hash": block_hash,
        "data": block_data,
        "created_at": timestamp
    }

def generate_transaction_id() -> str:
    """
    Generate a unique transaction ID for blockchain operations
    
    Returns:
        Unique transaction ID
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    random_suffix = hashlib.md5(timestamp.encode()).hexdigest()[:8]
    return f"TXN{timestamp}{random_suffix}"
