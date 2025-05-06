import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'categories' },
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined,
            ) => {
              if (error) return reject(error);
              if (!result)
                return reject(new Error('No result returned from Cloudinary'));
              resolve(result.secure_url);
            },
          );

          uploadStream.end(file.buffer);
        }),
    );

    return Promise.all(uploadPromises);
  }
}
