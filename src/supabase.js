import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owrgaldepieeqkpgwwsp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cmdhbGRlcGllZXFrcGd3d3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDQwNDEsImV4cCI6MjA5NzI4MDA0MX0.UfOcNOFbqcOA2Cn19r3xyeWb6RJgkUde2DhqtozjIY0'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)
