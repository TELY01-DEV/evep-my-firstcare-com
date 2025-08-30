"""
Vector Service for EVEP Platform
Handles vector embeddings and similarity search
"""

import asyncio
import numpy as np
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.core.database import get_database
from app.core.config import Config

class VectorService:
    """Vector Service for embeddings and similarity search"""
    
    def __init__(self):
        self.config = Config.get_module_config("ai_ml")
        self.db = None
    
    async def initialize(self) -> None:
        """Initialize the vector service"""
        # Initialize database connection
        db_client = get_database()
        self.db = db_client.evep
        
        print("✅ Vector Service initialized (simplified version)")
    
    async def create_embedding(self, text: str) -> List[float]:
        """Create vector embedding for text (simplified version)"""
        try:
            # Create a simple hash-based embedding
            text_hash = hashlib.md5(text.encode()).hexdigest()
            # Convert hash to numeric values
            embedding = [float(int(text_hash[i:i+2], 16)) / 255.0 for i in range(0, 32, 2)]
            # Pad to 384 dimensions
            embedding.extend([0.0] * (384 - len(embedding)))
            return embedding[:384]
            
        except Exception as e:
            print(f"Error creating embedding: {e}")
            # Return random embedding as fallback
            return list(np.random.rand(384))
    
    async def store_embedding(self, content_id: str, content_type: str, text: str, metadata: Dict[str, Any] = None) -> bool:
        """Store embedding in vector database (simplified version)"""
        try:
            # Create embedding
            embedding = await self.create_embedding(text)
            
            # Store in MongoDB
            await self.db.embeddings.insert_one({
                "content_id": content_id,
                "content_type": content_type,
                "embedding": embedding,
                "text": text,
                "metadata": metadata or {},
                "created_at": datetime.utcnow()
            })
            
            return True
            
        except Exception as e:
            print(f"Error storing embedding: {e}")
            return False
    
    async def search_similar(self, query: str, limit: int = 10, content_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar content using vector similarity (simplified version)"""
        try:
            # Create query embedding
            query_embedding = await self.create_embedding(query)
            
            # Search in MongoDB (simple cosine similarity)
            filter_query = {}
            if content_type:
                filter_query["content_type"] = content_type
            
            embeddings = await self.db.embeddings.find(filter_query).limit(limit).to_list(limit)
            
            # Calculate similarities
            results = []
            for emb in embeddings:
                similarity = self._cosine_similarity(query_embedding, emb["embedding"])
                results.append({
                    "content_id": emb["content_id"],
                    "content_type": emb["content_type"],
                    "text": emb["text"],
                    "metadata": emb["metadata"],
                    "similarity_score": similarity
                })
            
            # Sort by similarity score
            results.sort(key=lambda x: x["similarity_score"], reverse=True)
            
            return results[:limit]
            
        except Exception as e:
            print(f"Error searching similar content: {e}")
            return []
    
    async def update_patient_embedding(self, patient_id: str) -> bool:
        """Update patient embedding with latest data"""
        try:
            # Get patient data
            patient = await self.db.patients.find_one({"_id": patient_id})
            if not patient:
                return False
            
            # Create patient text representation
            patient_text = f"""
            Patient: {patient.get('name', 'Unknown')}
            Age: {patient.get('age', 'Unknown')}
            Gender: {patient.get('gender', 'Unknown')}
            Medical History: {patient.get('medical_history', {})}
            Contact: {patient.get('contact_info', {})}
            """
            
            # Store embedding
            return await self.store_embedding(
                content_id=str(patient_id),
                content_type="patient",
                text=patient_text,
                metadata={
                    "patient_id": str(patient_id),
                    "name": patient.get('name'),
                    "age": patient.get('age'),
                    "gender": patient.get('gender')
                }
            )
            
        except Exception as e:
            print(f"Error updating patient embedding: {e}")
            return False
    
    async def update_screening_embedding(self, screening_id: str) -> bool:
        """Update screening embedding with latest data"""
        try:
            # Get screening data
            screening = await self.db.screenings.find_one({"_id": screening_id})
            if not screening:
                return False
            
            # Get patient data
            patient = await self.db.patients.find_one({"_id": screening["patient_id"]})
            
            # Create screening text representation
            screening_text = f"""
            Screening ID: {screening.get('screening_id', 'Unknown')}
            Patient: {patient.get('name', 'Unknown') if patient else 'Unknown'}
            Type: {screening.get('screening_type', 'Unknown')}
            Results: {screening.get('results', {})}
            Date: {screening.get('screening_date', 'Unknown')}
            Status: {screening.get('status', 'Unknown')}
            """
            
            # Store embedding
            return await self.store_embedding(
                content_id=str(screening_id),
                content_type="screening",
                text=screening_text,
                metadata={
                    "screening_id": str(screening_id),
                    "patient_id": str(screening["patient_id"]),
                    "screening_type": screening.get('screening_type'),
                    "status": screening.get('status'),
                    "date": screening.get('screening_date')
                }
            )
            
        except Exception as e:
            print(f"Error updating screening embedding: {e}")
            return False
    
    async def get_embeddings_stats(self) -> Dict[str, Any]:
        """Get embeddings statistics"""
        try:
            # Get stats from MongoDB
            total_embeddings = await self.db.embeddings.count_documents({})
            
            # Get stats by content type
            pipeline = [
                {"$group": {"_id": "$content_type", "count": {"$sum": 1}}}
            ]
            type_stats = await self.db.embeddings.aggregate(pipeline).to_list(None)
            
            return {
                "total_embeddings": total_embeddings,
                "by_content_type": {stat["_id"]: stat["count"] for stat in type_stats},
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting embeddings stats: {e}")
            return {"error": str(e)}
    
    async def delete_embedding(self, content_id: str) -> bool:
        """Delete embedding from vector database"""
        try:
            if self.collection:
                # Delete from ChromaDB
                self.collection.delete(ids=[content_id])
            
            # Delete from MongoDB
            await self.db.embeddings.delete_one({"content_id": content_id})
            
            return True
            
        except Exception as e:
            print(f"Error deleting embedding: {e}")
            return False
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            # Ensure vectors have same length
            min_len = min(len(vec1), len(vec2))
            vec1 = vec1[:min_len]
            vec2 = vec2[:min_len]
            
            # Calculate dot product
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            
            # Calculate magnitudes
            mag1 = sum(a * a for a in vec1) ** 0.5
            mag2 = sum(b * b for b in vec2) ** 0.5
            
            # Avoid division by zero
            if mag1 == 0 or mag2 == 0:
                return 0.0
            
            # Calculate cosine similarity
            return dot_product / (mag1 * mag2)
            
        except Exception as e:
            print(f"Error calculating cosine similarity: {e}")
            return 0.0
