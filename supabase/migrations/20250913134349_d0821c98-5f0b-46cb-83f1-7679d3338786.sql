-- Enable required extensions for cron functionality
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a daily cron job to keep the Supabase project active
SELECT cron.schedule(
  'keep-supabase-alive-daily',
  '0 12 * * *', -- Daily at 12:00 PM UTC
  $$
  SELECT
    net.http_post(
        url:='https://yrzepnwtzbqjidnoindt.supabase.co/functions/v1/keep-alive',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyemVwbnd0emJxamlkbm9pbmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTY4MTUsImV4cCI6MjA3MjQ5MjgxNX0.TC8PNSZQf7NGPAwkOfsIFCbGAKtcZE0O6cHsxBJLvpA"}'::jsonb,
        body:='{"trigger": "daily-cron"}'::jsonb
    ) as request_id;
  $$
);