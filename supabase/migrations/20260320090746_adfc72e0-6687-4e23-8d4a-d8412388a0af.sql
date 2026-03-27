ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access admins table"
ON public.admins
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));