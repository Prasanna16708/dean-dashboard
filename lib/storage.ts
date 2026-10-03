import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type StorageStrategy = 'local' | 'college_server' | 'cloud';

export async function saveFile(
  fileBuffer: Buffer, 
  originalFilename: string, 
  moduleFolder: string,
  strategy: StorageStrategy = 'local' // Can be configured via env later
): Promise<{ fileUrl: string, fileSize: number, mimeType: string }> {
  
  // Sanitize filename and generate a secure unique ID
  const safeFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueId = crypto.randomUUID();
  const finalFilename = `${uniqueId}-${safeFilename}`;
  
  const fileSize = fileBuffer.length;
  // Basic MIME type extraction based on extension
  const ext = path.extname(originalFilename).toLowerCase();
  const mimeType = ext === '.pdf' ? 'application/pdf' : 
                   ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                   'application/octet-stream';

  if (strategy === 'local' || strategy === 'college_server') {
    // Save to the local filesystem securely
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', moduleFolder);
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, finalFilename);
    await writeFile(filePath, fileBuffer);

    // Return the URL path that can be used in the browser
    return {
      fileUrl: `/uploads/${moduleFolder}/${finalFilename}`,
      fileSize,
      mimeType
    };
  } else {
    // Future AWS S3 / Cloud implementation goes here
    throw new Error("Cloud storage strategy not yet implemented.");
  }
}