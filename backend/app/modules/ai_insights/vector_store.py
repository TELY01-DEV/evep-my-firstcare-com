"""
Vector Store for EVEP Platform

This module provides vector embedding generation and similarity search capabilities.
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb

logger = logging.getLogger(__name__)

class VectorStore:
    """Vector store for embedding generation and similarity search"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.embedding_model = None
        self.chroma_client = None
        self.collections = {}
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize embedding model and vector database"""
        try:
            # Initialize sentence transformer model
            self.embedding_model = SentenceTransformer(self.model_name)
            logger.info(f"Embedding model {self.model_name} loaded successfully")
            
            # Initialize ChromaDB client with telemetry disabled
            self.chroma_client = chromadb.PersistentClient(
                path="./chroma_db",
                settings=chromadb.Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info("ChromaDB client initialized successfully with telemetry disabled")
            
            # Initialize collections
            self._initialize_collections()
            
        except Exception as e:
            logger.error(f"Error initializing vector store components: {e}")
            raise
    
    def _initialize_collections(self):
        """Initialize vector store collections"""
        collection_names = [
            "screening_results",
            "medical_notes", 
            "ai_insights",
            "patient_data",
            "academic_correlation"
        ]
        
        for collection_name in collection_names:
            try:
                # Get or create collection
                collection = self.chroma_client.get_or_create_collection(
                    name=collection_name,
                    metadata={"description": f"Collection for {collection_name}"}
                )
                self.collections[collection_name] = collection
                logger.info(f"Collection {collection_name} initialized")
            except Exception as e:
                logger.error(f"Error initializing collection {collection_name}: {e}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a text string"""
        try:
            if not self.embedding_model:
                raise ValueError("Embedding model not initialized")
            
            embedding = self.embedding_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple text strings"""
        try:
            if not self.embedding_model:
                raise ValueError("Embedding model not initialized")
            
            embeddings = self.embedding_model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise
    
    def add_document(
        self,
        collection_name: str,
        document_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a document to the vector store"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            
            # Generate embedding
            embedding = self.generate_embedding(text)
            
            # Prepare metadata
            doc_metadata = metadata or {}
            doc_metadata["created_at"] = datetime.utcnow().isoformat()
            doc_metadata["text_length"] = len(text)
            
            # Add to collection
            collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[doc_metadata],
                ids=[document_id]
            )
            
            logger.info(f"Document {document_id} added to collection {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document to vector store: {e}")
            return False
    
    def add_documents_batch(
        self,
        collection_name: str,
        documents: List[Dict[str, Any]]
    ) -> int:
        """Add multiple documents to the vector store"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            
            # Prepare batch data
            ids = []
            texts = []
            metadatas = []
            
            for doc in documents:
                ids.append(doc["id"])
                texts.append(doc["text"])
                
                metadata = doc.get("metadata", {})
                metadata["created_at"] = datetime.utcnow().isoformat()
                metadata["text_length"] = len(doc["text"])
                metadatas.append(metadata)
            
            # Generate embeddings
            embeddings = self.generate_embeddings_batch(texts)
            
            # Add to collection
            collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Added {len(documents)} documents to collection {collection_name}")
            return len(documents)
            
        except Exception as e:
            logger.error(f"Error adding documents batch to vector store: {e}")
            return 0
    
    def search_similar(
        self,
        collection_name: str,
        query: str,
        n_results: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            
            # Generate query embedding
            query_embedding = self.generate_embedding(query)
            
            # Format metadata filter for ChromaDB
            where_clause = None
            if filter_metadata:
                # Convert metadata filter to ChromaDB format
                where_conditions = []
                for key, value in filter_metadata.items():
                    if isinstance(value, list):
                        # For lists, use $in operator
                        where_conditions.append({key: {"$in": value}})
                    else:
                        # For single values, use $eq operator
                        where_conditions.append({key: {"$eq": value}})
                
                if len(where_conditions) == 1:
                    where_clause = where_conditions[0]
                elif len(where_conditions) > 1:
                    # For multiple conditions, use $and operator
                    where_clause = {"$and": where_conditions}
            
            # Perform search
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause
            )
            
            # Format results
            formatted_results = []
            for i in range(len(results["ids"][0])):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i] if "distances" in results else None
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []
    
    def search_by_metadata(
        self,
        collection_name: str,
        metadata_filter: Dict[str, Any],
        n_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Search documents by metadata filter"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            
            # Format metadata filter for ChromaDB
            where_clause = None
            if metadata_filter:
                # Convert metadata filter to ChromaDB format
                where_conditions = []
                for key, value in metadata_filter.items():
                    if isinstance(value, list):
                        # For lists, use $in operator
                        where_conditions.append({key: {"$in": value}})
                    else:
                        # For single values, use $eq operator
                        where_conditions.append({key: {"$eq": value}})
                
                if len(where_conditions) == 1:
                    where_clause = where_conditions[0]
                elif len(where_conditions) > 1:
                    # For multiple conditions, use $and operator
                    where_clause = {"$and": where_conditions}
            
            # Perform metadata search
            results = collection.get(
                where=where_clause,
                limit=n_results
            )
            
            # Format results
            formatted_results = []
            for i in range(len(results["ids"])):
                formatted_results.append({
                    "id": results["ids"][i],
                    "text": results["documents"][i],
                    "metadata": results["metadatas"][i]
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching by metadata: {e}")
            return []
    
    def update_document(
        self,
        collection_name: str,
        document_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update an existing document"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            
            # Generate new embedding
            embedding = self.generate_embedding(text)
            
            # Prepare metadata
            doc_metadata = metadata or {}
            doc_metadata["updated_at"] = datetime.utcnow().isoformat()
            doc_metadata["text_length"] = len(text)
            
            # Update document
            collection.update(
                ids=[document_id],
                embeddings=[embedding],
                documents=[text],
                metadatas=[doc_metadata]
            )
            
            logger.info(f"Document {document_id} updated in collection {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating document in vector store: {e}")
            return False
    
    def delete_document(self, collection_name: str, document_id: str) -> bool:
        """Delete a document from the vector store"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            collection.delete(ids=[document_id])
            
            logger.info(f"Document {document_id} deleted from collection {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document from vector store: {e}")
            return False
    
    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics for a collection"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            count = collection.count()
            
            return {
                "collection_name": collection_name,
                "document_count": count,
                "created_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}
    
    def get_all_collection_stats(self) -> Dict[str, Any]:
        """Get statistics for all collections"""
        stats = {}
        for collection_name in self.collections.keys():
            stats[collection_name] = self.get_collection_stats(collection_name)
        return stats
    
    def clear_collection(self, collection_name: str) -> bool:
        """Clear all documents from a collection"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} not found")
            
            collection = self.collections[collection_name]
            collection.delete(where={})
            
            logger.info(f"Collection {collection_name} cleared")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing collection: {e}")
            return False
    
    def search_similar_screenings(
        self,
        screening_data: Dict[str, Any],
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for similar screening results"""
        try:
            # Create search query from screening data
            query_text = self._create_screening_query(screening_data)
            
            # Search in screening_results collection
            results = self.search_similar(
                collection_name="screening_results",
                query=query_text,
                n_results=n_results
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching similar screenings: {e}")
            return []
    
    def _create_screening_query(self, screening_data: Dict[str, Any]) -> str:
        """Create search query from screening data"""
        query_parts = []
        
        # Add basic screening information
        if "left_eye_distance" in screening_data:
            query_parts.append(f"Left eye distance: {screening_data['left_eye_distance']}")
        if "right_eye_distance" in screening_data:
            query_parts.append(f"Right eye distance: {screening_data['right_eye_distance']}")
        if "color_vision" in screening_data:
            query_parts.append(f"Color vision: {screening_data['color_vision']}")
        if "depth_perception" in screening_data:
            query_parts.append(f"Depth perception: {screening_data['depth_perception']}")
        
        # Add assessment information
        if "overall_assessment" in screening_data:
            query_parts.append(f"Assessment: {screening_data['overall_assessment']}")
        if "academic_impact" in screening_data:
            query_parts.append(f"Academic impact: {screening_data['academic_impact']}")
        
        return " ".join(query_parts)
    
    def add_screening_result(
        self,
        screening_id: str,
        screening_data: Dict[str, Any],
        patient_info: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a screening result to the vector store"""
        try:
            # Create text representation
            text = self._create_screening_text(screening_data, patient_info)
            
            # Prepare metadata
            metadata = {
                "screening_id": screening_id,
                "screening_type": screening_data.get("screening_type", "unknown"),
                "patient_id": patient_info.get("patient_id") if patient_info else None,
                "assessment": screening_data.get("overall_assessment", "unknown"),
                "academic_impact": screening_data.get("academic_impact", "unknown")
            }
            
            # Add to vector store
            return self.add_document(
                collection_name="screening_results",
                document_id=screening_id,
                text=text,
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"Error adding screening result to vector store: {e}")
            return False
    
    def _create_screening_text(
        self,
        screening_data: Dict[str, Any],
        patient_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create text representation of screening data"""
        text_parts = []
        
        # Add patient information
        if patient_info:
            text_parts.append(f"Patient: {patient_info.get('name', 'Unknown')}")
            text_parts.append(f"Age: {patient_info.get('age', 'Unknown')}")
        
        # Add screening results
        if "left_eye_distance" in screening_data:
            text_parts.append(f"Left eye distance vision: {screening_data['left_eye_distance']}")
        if "right_eye_distance" in screening_data:
            text_parts.append(f"Right eye distance vision: {screening_data['right_eye_distance']}")
        if "left_eye_near" in screening_data:
            text_parts.append(f"Left eye near vision: {screening_data['left_eye_near']}")
        if "right_eye_near" in screening_data:
            text_parts.append(f"Right eye near vision: {screening_data['right_eye_near']}")
        if "color_vision" in screening_data:
            text_parts.append(f"Color vision: {screening_data['color_vision']}")
        if "depth_perception" in screening_data:
            text_parts.append(f"Depth perception: {screening_data['depth_perception']}")
        
        # Add assessment
        if "overall_assessment" in screening_data:
            text_parts.append(f"Overall assessment: {screening_data['overall_assessment']}")
        if "academic_impact" in screening_data:
            text_parts.append(f"Academic impact: {screening_data['academic_impact']}")
        
        # Add recommendations
        if "recommendations" in screening_data:
            text_parts.append(f"Recommendations: {screening_data['recommendations']}")
        
        return " ".join(text_parts)
