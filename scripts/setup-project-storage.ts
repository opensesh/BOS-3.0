/**
 * Setup script for project files storage bucket
 * 
 * Run this script to create the project-files bucket in Supabase Storage.
 * Alternatively, create it manually in the Supabase Dashboard.
 * 
 * Usage: npx tsx scripts/setup-project-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupProjectStorage() {
  console.log('Setting up project-files storage bucket...');

  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }

  const existingBucket = buckets?.find(b => b.name === 'project-files');
  
  if (existingBucket) {
    console.log('✓ Bucket "project-files" already exists');
    return;
  }

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('project-files', {
    public: true, // Make files publicly accessible
    fileSizeLimit: 50 * 1024 * 1024, // 50MB max file size
    allowedMimeTypes: [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Code
      'text/javascript',
      'text/typescript',
      'text/html',
      'text/css',
    ],
  });

  if (error) {
    console.error('Error creating bucket:', error);
    process.exit(1);
  }

  console.log('✓ Created bucket "project-files"');
  console.log('  - Public access: enabled');
  console.log('  - Max file size: 50MB');
  console.log('  - Allowed types: documents, text, images, code');
}

setupProjectStorage()
  .then(() => {
    console.log('\nSetup complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
  });

