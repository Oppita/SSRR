import { supabase } from './supabase';

/**
 * Formats a date string to YYYY-MM-DD for input[type="date"]
 */
export const formatDateForInput = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  
  // If it's already YYYY-MM-DD, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // If it's DD/MM/YYYY or DD/MM/YY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];
    
    if (year.length === 2) {
      year = '20' + year; // Assume 20xx
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // Try native Date parsing
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore
  }
  
  return '';
};

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload.
 * @param folderPath The folder path within the bucket (e.g., 'proyectos/123/').
 * @returns The public URL of the uploaded file.
 */
export const uploadDocumentToStorage = async (file: File, folderPath: string): Promise<string> => {
  // Try localStorage override first, then configured bucket, then common variations
  const storageOverride = typeof window !== 'undefined' ? localStorage.getItem('supabase_bucket_override') : null;
  const configuredBucket = import.meta.env.VITE_STORAGE_BUCKET;
  
  const bucketNamesToTry = [
    storageOverride,
    configuredBucket,
    'documents-srr',
    'documents',
    'storage',
    'files'
  ].filter(Boolean) as string[];
  
  // Create a unique file name to avoid collisions
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  
  // Sanitize folder path to remove accents and special characters
  const sanitizedFolderPath = folderPath
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9.\-_/]/g, "_"); // Replace spaces and special chars with underscore
    
  const filePath = `${sanitizedFolderPath}/${fileName}`;

  let uploadError = null;
  let successfulBucket = '';

  for (const bucketName of bucketNamesToTry) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (!error) {
        successfulBucket = bucketName;
        uploadError = null;
        break; // Upload succeeded, stop trying other names
      } else {
        uploadError = error;
        console.warn(`Failed to upload to bucket '${bucketName}':`, error.message);
      }
    } catch (err) {
      console.warn(`Exception when trying bucket '${bucketName}':`, err);
    }
  }

  if (uploadError || !successfulBucket) {
    console.error('Error uploading to Supabase Storage after trying all bucket names:', uploadError);
    throw uploadError || new Error('Failed to upload to any known bucket. Please check your Supabase Storage configuration.');
  }

  // Get the public URL from the successful bucket
  const { data: urlData } = supabase.storage
    .from(successfulBucket)
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Failed to get public URL for uploaded file');
  }

  return urlData.publicUrl;
};

/**
 * Attempts to repair a Supabase Storage URL by trying alternative bucket names.
 * Returns the first working URL or the original if none work.
 */
export const getRepairedUrl = async (url: string): Promise<string | null> => {
  if (!url || url === '#' || !url.startsWith('http')) {
    return url;
  }

  try {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) return url;
    } catch (fetchError) {
      // Failed to fetch (e.g., CORS error on 404). Continue to try alternative buckets.
      console.warn('Initial fetch failed, trying alternatives:', fetchError);
    }

    // If we get a 404 or a "Bucket not found" error, try to repair the URL
    let projectUrl = '';
    let filePath = '';
    let originalBucket = '';

    const projectUrlMatch = url.match(/^(https:\/\/.*\.supabase\.co)\/storage\/v1\/object\/public\//);
    if (projectUrlMatch) {
      projectUrl = projectUrlMatch[1];
      const parts = url.split('/storage/v1/object/public/')[1].split('/');
      originalBucket = parts[0];
      filePath = parts.slice(1).join('/');
    } else {
      // Try to use the configured Supabase URL if the regex fails
      const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
      if (configuredUrl && url.includes('/storage/v1/object/public/')) {
        projectUrl = configuredUrl.replace(/\/$/, '');
        const parts = url.split('/storage/v1/object/public/')[1].split('/');
        originalBucket = parts[0];
        filePath = parts.slice(1).join('/');
      } else {
        return null; // Cannot parse URL, and original failed
      }
    }
    
    const storageOverride = typeof window !== 'undefined' ? localStorage.getItem('supabase_bucket_override') : null;
    const configuredBucket = import.meta.env.VITE_STORAGE_BUCKET;
    
    const alternativeBuckets = [
      storageOverride,
      configuredBucket,
      'documents-srr',
      'documents',
      'storage',
      'files'
    ].filter(Boolean) as string[];

    // Remove duplicates but keep order
    const uniqueBuckets = [...new Set(alternativeBuckets)];

    for (const bucket of uniqueBuckets) {
      // Skip if it's the same as the original bucket that already failed
      if (decodeURIComponent(originalBucket) === bucket) continue;

      const tryUrl = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${filePath}`;
      try {
        const tryRes = await fetch(tryUrl, { method: 'HEAD' });
        if (tryRes.ok) {
          console.info(`Auto-repair: Found file in bucket: ${bucket}`);
          return tryUrl;
        }
      } catch (e) {
        // Continue
      }
    }
  } catch (error) {
    console.warn('Error during URL repair check:', error);
  }

  // If we reach here, all attempts failed.
  return null;
};

/**
 * Attempts to download a file, and if it fails with 'Bucket not found', 
 * tries alternative bucket names.
 */
export const downloadFileWithAutoRepair = async (url: string, fileName: string): Promise<void> => {
  if (!url || url === '#') {
    throw new Error('URL de archivo no válida');
  }

  try {
    // If it's already a blob URL, we can just download it directly
    if (url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const repairedUrl = await getRepairedUrl(url);
    
    if (!repairedUrl) {
      alert('No se pudo descargar el archivo. Es posible que el archivo haya sido eliminado o que el bucket de almacenamiento no exista.');
      return;
    }

    const response = await fetch(repairedUrl);
    
    if (!response.ok) {
      throw new Error(`Error al descargar el archivo: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error in downloadFileWithAutoRepair:', error);
    
    // If it's a TypeError (like Failed to fetch), it's likely a CORS issue due to a 404 (bucket not found)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      alert('No se pudo descargar el archivo. Es posible que el archivo haya sido eliminado o que el bucket de almacenamiento no exista.');
    } else {
      // Fallback: just try to open the original URL in a new tab
      window.open(url, '_blank');
    }
  }
};
