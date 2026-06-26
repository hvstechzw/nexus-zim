UPDATE public.teams
SET logo_url = regexp_replace(logo_url, '^https?://[^/]+/(data:)', '\1')
WHERE logo_url ~ '^https?://[^/]+/data:';