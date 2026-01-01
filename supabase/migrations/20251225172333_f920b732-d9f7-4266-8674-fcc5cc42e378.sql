-- Create storage bucket for course documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-documents', 'course-documents', true);

-- Storage policies for the bucket
CREATE POLICY "Anyone can upload documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'course-documents');

CREATE POLICY "Anyone can read documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'course-documents');

CREATE POLICY "Anyone can delete documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'course-documents');