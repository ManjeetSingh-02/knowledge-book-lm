// internal-imports
import { env } from '../config/env.js';

// external-imports
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';

cloudinary.config({
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
});

export async function uploadToCloudinary(
  workspaceId: string,
  file: Express.Multer.File
): Promise<string> {
  return new Promise((resolve, reject) =>
    Readable.from(file.buffer).pipe(
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: `sources/${workspaceId}`,
          public_id: `${Date.now()}-${file.originalname}`,
          format: 'pdf',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed'));

          resolve(result.secure_url);
        }
      )
    )
  );
}
