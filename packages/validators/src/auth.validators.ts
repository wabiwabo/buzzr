import { z } from 'zod';
import { UserRole } from '@buzzr/shared-types';

export const loginOtpRequestSchema = z.object({
  phone: z.string().regex(/^08\d{8,12}$/, 'Nomor HP tidak valid (format: 08xxxxxxxxxx)'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^08\d{8,12}$/),
  code: z.string().length(6, 'Kode OTP harus 6 digit'),
});

export const loginPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export const registerUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^08\d{8,12}$/).optional(),
  role: z.nativeEnum(UserRole),
  areaId: z.string().uuid().optional(),
});

export type LoginOtpRequest = z.infer<typeof loginOtpRequestSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type LoginPasswordRequest = z.infer<typeof loginPasswordSchema>;
export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
