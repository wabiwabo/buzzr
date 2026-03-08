import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

// Mock the minio module
const mockPutObject = jest.fn();
const mockPresignedGetObject = jest.fn();
const mockRemoveObject = jest.fn();
const mockBucketExists = jest.fn();
const mockMakeBucket = jest.fn();

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    putObject: mockPutObject,
    presignedGetObject: mockPresignedGetObject,
    removeObject: mockRemoveObject,
    bucketExists: mockBucketExists,
    makeBucket: mockMakeBucket,
  })),
}));

describe('UploadService', () => {
  let service: UploadService;
  let configService: ConfigService;

  const mockConfigValues: Record<string, string> = {
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: '9000',
    MINIO_ACCESS_KEY: 'buzzr-minio',
    MINIO_SECRET_KEY: 'buzzr-minio-secret',
    MINIO_USE_SSL: 'false',
    MINIO_BUCKET_PREFIX: 'buzzr',
  };

  const createMockFile = (
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 100, // 100KB
    buffer: Buffer.from('fake-image-data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfigValues[key]),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('uploadFile', () => {
    it('should reject non-image file types', async () => {
      const file = createMockFile({
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
      });

      await expect(
        service.uploadFile('dlh_demo', file, 'complaints'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadFile('dlh_demo', file, 'complaints'),
      ).rejects.toThrow('Tipe file tidak diizinkan');
    });

    it('should reject files larger than 5MB', async () => {
      const file = createMockFile({
        size: 6 * 1024 * 1024, // 6MB
      });

      await expect(
        service.uploadFile('dlh_demo', file, 'complaints'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadFile('dlh_demo', file, 'complaints'),
      ).rejects.toThrow('Ukuran file maksimal 5MB');
    });

    it('should accept valid image types (jpg, jpeg, png, gif, webp)', async () => {
      const validTypes = [
        { mimetype: 'image/jpeg', originalname: 'photo.jpg' },
        { mimetype: 'image/jpeg', originalname: 'photo.jpeg' },
        { mimetype: 'image/png', originalname: 'photo.png' },
        { mimetype: 'image/gif', originalname: 'photo.gif' },
        { mimetype: 'image/webp', originalname: 'photo.webp' },
      ];

      mockBucketExists.mockResolvedValue(true);
      mockPutObject.mockResolvedValue({});
      mockPresignedGetObject.mockResolvedValue('https://minio.local/presigned-url');

      for (const type of validTypes) {
        const file = createMockFile(type);
        const result = await service.uploadFile('dlh_demo', file, 'complaints');
        expect(result).toHaveProperty('key');
        expect(result).toHaveProperty('url');
      }
    });

    it('should create bucket if it does not exist', async () => {
      mockBucketExists.mockResolvedValue(false);
      mockMakeBucket.mockResolvedValue(undefined);
      mockPutObject.mockResolvedValue({});
      mockPresignedGetObject.mockResolvedValue('https://minio.local/presigned-url');

      const file = createMockFile();
      await service.uploadFile('dlh_demo', file, 'complaints');

      expect(mockBucketExists).toHaveBeenCalledWith('buzzr-dlh_demo');
      expect(mockMakeBucket).toHaveBeenCalledWith('buzzr-dlh_demo');
    });

    it('should not create bucket if it already exists', async () => {
      mockBucketExists.mockResolvedValue(true);
      mockPutObject.mockResolvedValue({});
      mockPresignedGetObject.mockResolvedValue('https://minio.local/presigned-url');

      const file = createMockFile();
      await service.uploadFile('dlh_demo', file, 'complaints');

      expect(mockBucketExists).toHaveBeenCalledWith('buzzr-dlh_demo');
      expect(mockMakeBucket).not.toHaveBeenCalled();
    });

    it('should upload file with correct key format', async () => {
      mockBucketExists.mockResolvedValue(true);
      mockPutObject.mockResolvedValue({});
      mockPresignedGetObject.mockResolvedValue('https://minio.local/presigned-url');

      const file = createMockFile({ originalname: 'sampah-liar.jpg' });
      const result = await service.uploadFile('dlh_demo', file, 'complaints');

      expect(result.key).toMatch(/^complaints\/[a-f0-9-]+-sampah-liar\.jpg$/);
      expect(mockPutObject).toHaveBeenCalledWith(
        'buzzr-dlh_demo',
        expect.stringMatching(/^complaints\/[a-f0-9-]+-sampah-liar\.jpg$/),
        file.buffer,
        file.size,
        { 'Content-Type': 'image/jpeg' },
      );
    });

    it('should return presigned URL and key on success', async () => {
      mockBucketExists.mockResolvedValue(true);
      mockPutObject.mockResolvedValue({});
      mockPresignedGetObject.mockResolvedValue('https://minio.local/buzzr-dlh_demo/complaints/uuid-photo.jpg?token=abc');

      const file = createMockFile();
      const result = await service.uploadFile('dlh_demo', file, 'complaints');

      expect(result.url).toBe('https://minio.local/buzzr-dlh_demo/complaints/uuid-photo.jpg?token=abc');
      expect(result.key).toBeDefined();
      expect(typeof result.key).toBe('string');
    });
  });

  describe('getPresignedUrl', () => {
    it('should return presigned URL for given key', async () => {
      const expectedUrl = 'https://minio.local/buzzr-dlh_demo/complaints/uuid-photo.jpg?token=xyz';
      mockPresignedGetObject.mockResolvedValue(expectedUrl);

      const result = await service.getPresignedUrl('dlh_demo', 'complaints/uuid-photo.jpg');

      expect(mockPresignedGetObject).toHaveBeenCalledWith(
        'buzzr-dlh_demo',
        'complaints/uuid-photo.jpg',
        7 * 24 * 60 * 60,
      );
      expect(result).toBe(expectedUrl);
    });
  });

  describe('deleteFile', () => {
    it('should delete object from MinIO', async () => {
      mockRemoveObject.mockResolvedValue(undefined);

      await service.deleteFile('dlh_demo', 'complaints/uuid-photo.jpg');

      expect(mockRemoveObject).toHaveBeenCalledWith(
        'buzzr-dlh_demo',
        'complaints/uuid-photo.jpg',
      );
    });
  });
});
