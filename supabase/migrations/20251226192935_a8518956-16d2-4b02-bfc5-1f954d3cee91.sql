-- Improve retrieval performance (FTS + fuzzy matching)

-- Enable trigram similarity support
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search index (language-agnostic 'simple' config)
CREATE INDEX IF NOT EXISTS document_chunks_content_fts_idx
ON public.document_chunks
USING GIN (to_tsvector('simple', content));

-- Trigram indexes for fuzzy substring matching (works well for Arabic/English keywords)
CREATE INDEX IF NOT EXISTS document_chunks_content_trgm_idx
ON public.document_chunks
USING GIN (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS document_chunks_source_trgm_idx
ON public.document_chunks
USING GIN (source gin_trgm_ops);
