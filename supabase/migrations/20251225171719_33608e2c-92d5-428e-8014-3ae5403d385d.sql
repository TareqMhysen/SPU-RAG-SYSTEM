-- Create table for storing documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing document chunks with metadata
CREATE TABLE public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  page INTEGER NOT NULL DEFAULT 1,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for question history
CREATE TABLE public.question_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT,
  citations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_history ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for demo (no auth required)
CREATE POLICY "Public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete documents" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Public read chunks" ON public.document_chunks FOR SELECT USING (true);
CREATE POLICY "Public insert chunks" ON public.document_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete chunks" ON public.document_chunks FOR DELETE USING (true);

CREATE POLICY "Public read history" ON public.question_history FOR SELECT USING (true);
CREATE POLICY "Public insert history" ON public.question_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete history" ON public.question_history FOR DELETE USING (true);

-- Create index for faster chunk retrieval
CREATE INDEX idx_chunks_document ON public.document_chunks(document_id);
CREATE INDEX idx_chunks_source ON public.document_chunks(source);