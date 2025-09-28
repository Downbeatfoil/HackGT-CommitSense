"""
Snowflake RAG Integration for Legacy Code Analysis
=================================================

This module demonstrates the production integration between Snowflake Cortex
and the Legacy Lens code explanation system. It handles vector storage,
similarity search, and context retrieval for RAG-powered code explanations.

Key Features:
- Vector embedding storage using Snowflake Cortex
- Similarity search for code context retrieval
- Integration with commit history and documentation
- RAG pipeline for enhanced Gemini explanations
"""

import snowflake.connector
import snowflake.cortex as cortex
from typing import Dict, List, Optional, Tuple
import json
import numpy as np
from datetime import datetime


class SnowflakeRAGProcessor:
    """
    Handles all Snowflake Cortex operations for the Legacy Lens RAG pipeline.
    
    This class manages:
    - Code chunk embedding and storage
    - Vector similarity search for context retrieval
    - Commit and documentation metadata indexing
    - RAG context preparation for Gemini explanations
    """
    
    def __init__(self, connection_params: Dict):
        """Initialize Snowflake connection and Cortex integration."""
        self.connection = snowflake.connector.connect(**connection_params)
        self.cursor = self.connection.cursor()
        
        # Initialize Cortex embedding model
        self.embedding_model = "e5-base-v2"  # Snowflake Cortex embedding model
        
        # Table schemas for RAG data storage
        self.setup_rag_tables()
    
    def setup_rag_tables(self):
        """
        Create Snowflake tables optimized for RAG operations.
        
        Tables created:
        - CODE_EMBEDDINGS: Vector embeddings of code chunks
        - COMMIT_METADATA: Git commit information with context
        - DOCUMENTATION_VECTORS: Embedded documentation and comments
        """
        
        # Code embeddings table with vector similarity search support
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS CODE_EMBEDDINGS (
                chunk_id VARCHAR PRIMARY KEY,
                file_path VARCHAR NOT NULL,
                line_start INTEGER,
                line_end INTEGER,
                code_content TEXT,
                embedding VECTOR(FLOAT, 768),  -- Cortex embedding dimension
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
                last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
            )
        """)
        
        # Commit metadata for historical context
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS COMMIT_METADATA (
                commit_hash VARCHAR PRIMARY KEY,
                author_name VARCHAR,
                author_email VARCHAR,
                commit_date TIMESTAMP,
                message TEXT,
                files_changed ARRAY,
                ticket_references ARRAY,
                embedding VECTOR(FLOAT, 768)  -- Embedded commit message
            )
        """)
        
        # Documentation and comment embeddings
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS DOCUMENTATION_VECTORS (
                doc_id VARCHAR PRIMARY KEY,
                doc_type VARCHAR,  -- 'comment', 'docstring', 'readme', etc.
                content TEXT,
                file_path VARCHAR,
                embedding VECTOR(FLOAT, 768),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
            )
        """)
    
    def embed_code_chunk(self, code_content: str, file_path: str, 
                        line_start: int, line_end: int) -> str:
        """
        Create vector embedding for a code chunk using Snowflake Cortex.
        
        Args:
            code_content: The actual code text to embed
            file_path: Path to the source file
            line_start: Starting line number
            line_end: Ending line number
            
        Returns:
            chunk_id: Unique identifier for the embedded chunk
        """
        
        # Use Snowflake Cortex to generate embedding
        embedding_result = cortex.Complete(
            model=self.embedding_model,
            prompt=f"Embed this code for similarity search: {code_content}"
        )
        
        # Extract embedding vector from Cortex response
        embedding_vector = embedding_result['embedding']
        
        # Generate unique chunk ID
        chunk_id = f"{file_path}:{line_start}-{line_end}"
        
        # Store in Snowflake with vector similarity index
        self.cursor.execute("""
            INSERT INTO CODE_EMBEDDINGS 
            (chunk_id, file_path, line_start, line_end, code_content, embedding)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (chunk_id, file_path, line_start, line_end, code_content, embedding_vector))
        
        return chunk_id
    
    def similarity_search_code_context(self, query_code: str, 
                                     top_k: int = 5) -> List[Dict]:
        """
        Perform vector similarity search to find relevant code context.
        
        This is the core RAG retrieval function that finds similar code
        chunks to provide context for Gemini explanations.
        
        Args:
            query_code: The code snippet to find context for
            top_k: Number of similar chunks to retrieve
            
        Returns:
            List of similar code chunks with metadata
        """
        
        # Generate embedding for the query code
        query_embedding = cortex.Complete(
            model=self.embedding_model,
            prompt=f"Embed this code for similarity search: {query_code}"
        )['embedding']
        
        # Use Snowflake's vector similarity search
        similarity_query = """
            SELECT 
                chunk_id,
                file_path,
                line_start,
                line_end,
                code_content,
                VECTOR_COSINE_SIMILARITY(embedding, %s) as similarity_score
            FROM CODE_EMBEDDINGS
            ORDER BY similarity_score DESC
            LIMIT %s
        """
        
        self.cursor.execute(similarity_query, (query_embedding, top_k))
        results = self.cursor.fetchall()
        
        # Format results for RAG pipeline
        context_chunks = []
        for row in results:
            context_chunks.append({
                'chunk_id': row[0],
                'file_path': row[1],
                'line_range': f"{row[2]}-{row[3]}",
                'code_content': row[4],
                'similarity_score': row[5]
            })
        
        return context_chunks
    
    def get_commit_context(self, file_path: str, 
                          max_commits: int = 10) -> List[Dict]:
        """
        Retrieve commit history context for a specific file.
        
        Used to provide historical context about why code was written
        and who was involved in its development.
        """
        
        commit_query = """
            SELECT 
                commit_hash,
                author_name,
                commit_date,
                message,
                ticket_references
            FROM COMMIT_METADATA
            WHERE ARRAY_CONTAINS(%s, files_changed)
            ORDER BY commit_date DESC
            LIMIT %s
        """
        
        self.cursor.execute(commit_query, (file_path, max_commits))
        commits = self.cursor.fetchall()
        
        return [
            {
                'commit_hash': commit[0][:7],  # Short hash
                'author': commit[1],
                'date': commit[2],
                'message': commit[3],
                'tickets': commit[4]
            }
            for commit in commits
        ]
    
    def build_rag_context(self, highlighted_code: str, 
                         file_path: str) -> Dict:
        """
        Build comprehensive RAG context for Gemini explanation generation.
        
        This function combines:
        - Similar code chunks from vector search
        - Commit history for the file
        - Related documentation
        
        Returns a structured context object for Gemini prompting.
        """
        
        # Get similar code context via vector search
        similar_chunks = self.similarity_search_code_context(highlighted_code)
        
        # Get commit history context
        commit_history = self.get_commit_context(file_path)
        
        # Search for related documentation
        doc_context = self.search_documentation_context(highlighted_code)
        
        # Build structured RAG context
        rag_context = {
            'target_code': highlighted_code,
            'file_path': file_path,
            'similar_code_examples': similar_chunks,
            'commit_history': commit_history,
            'documentation': doc_context,
            'context_timestamp': datetime.now().isoformat()
        }
        
        return rag_context
    
    def search_documentation_context(self, code_snippet: str) -> List[Dict]:
        """
        Search for relevant documentation using vector similarity.
        
        Finds comments, docstrings, and README content that might
        explain the purpose or usage of similar code patterns.
        """
        
        # Generate embedding for documentation search
        query_embedding = cortex.Complete(
            model=self.embedding_model,
            prompt=f"Find documentation for: {code_snippet}"
        )['embedding']
        
        doc_query = """
            SELECT 
                doc_type,
                content,
                file_path,
                VECTOR_COSINE_SIMILARITY(embedding, %s) as relevance_score
            FROM DOCUMENTATION_VECTORS
            WHERE VECTOR_COSINE_SIMILARITY(embedding, %s) > 0.7
            ORDER BY relevance_score DESC
            LIMIT 5
        """
        
        self.cursor.execute(doc_query, (query_embedding, query_embedding))
        docs = self.cursor.fetchall()
        
        return [
            {
                'type': doc[0],
                'content': doc[1],
                'source': doc[2],
                'relevance': doc[3]
            }
            for doc in docs
        ]
    
    def generate_gemini_context_prompt(self, rag_context: Dict) -> str:
        """
        Format RAG context into an optimized prompt for Gemini.
        
        This function structures all the retrieved context into a
        prompt that helps Gemini generate accurate explanations about
        what code does, why it exists, and who wrote it.
        """
        
        prompt_parts = [
            "# Code Explanation Request",
            f"## Target Code (from {rag_context['file_path']}):",
            f"```python\n{rag_context['target_code']}\n```",
            "",
            "## Similar Code Context:",
        ]
        
        # Add similar code examples
        for chunk in rag_context['similar_code_examples'][:3]:
            prompt_parts.extend([
                f"### {chunk['file_path']} (lines {chunk['line_range']}):",
                f"```python\n{chunk['code_content']}\n```",
                ""
            ])
        
        # Add commit history context
        prompt_parts.extend([
            "## Recent Commit History:",
        ])
        
        for commit in rag_context['commit_history'][:5]:
            prompt_parts.append(
                f"- {commit['commit_hash']}: {commit['message']} "
                f"by {commit['author']} on {commit['date']}"
            )
        
        # Add documentation context
        if rag_context['documentation']:
            prompt_parts.extend([
                "",
                "## Related Documentation:",
            ])
            
            for doc in rag_context['documentation']:
                prompt_parts.extend([
                    f"### {doc['type'].title()} from {doc['source']}:",
                    doc['content'],
                    ""
                ])
        
        prompt_parts.extend([
            "",
            "## Please provide:",
            "1. What this code does (technical explanation)",
            "2. Why this code exists (business/project context)",
            "3. Source information (commit IDs, ticket references, author info)"
        ])
        
        return "\n".join(prompt_parts)


# Example usage for Legacy Lens integration
def initialize_rag_system(snowflake_config: Dict) -> SnowflakeRAGProcessor:
    """
    Initialize the Snowflake RAG system for Legacy Lens.
    
    This function sets up the connection and ensures all
    necessary tables and indexes are created for optimal
    vector similarity search performance.
    """
    
    processor = SnowflakeRAGProcessor(snowflake_config)
    
    # Create vector similarity indexes for performance
    processor.cursor.execute("""
        CREATE OR REPLACE SEARCH OPTIMIZATION ON CODE_EMBEDDINGS
    """)
    
    print("✅ Snowflake RAG system initialized successfully")
    print("📊 Vector similarity search ready for code context retrieval")
    print("🔍 RAG pipeline configured for Gemini explanation generation")
    
    return processor


# Configuration for production deployment
PRODUCTION_CONFIG = {
    'account': 'your-snowflake-account',
    'user': 'legacy_lens_service',
    'password': 'secure-service-password',
    'warehouse': 'LEGACY_LENS_WH',
    'database': 'CODE_ANALYSIS_DB',
    'schema': 'RAG_VECTORS',
    'role': 'LEGACY_LENS_ROLE'
}

# RAG processing pipeline configuration
RAG_CONFIG = {
    'embedding_model': 'e5-base-v2',  # Snowflake Cortex model
    'similarity_threshold': 0.7,      # Minimum similarity for context
    'max_context_chunks': 5,          # Chunks to include in RAG
    'max_commit_history': 10,         # Recent commits to consider
    'vector_dimensions': 768          # Embedding vector size
}