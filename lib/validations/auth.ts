import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const registerSchemaBase = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: passwordSchema,
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v === true, { message: "You must agree to continue" }),
  marketingConsent: z.boolean().default(false),
});

export const registerSchema = registerSchemaBase.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const jobSeekerOnboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  headline: z.string().min(1, "Headline is required"),
  location: z.string().min(1, "Location is required"),
  yearsOfExperience: z.string().min(1, "Select years of experience"),
});

export const recruiterOnboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().min(1, "Company name is required"),
  designation: z.string().min(1, "Designation is required"),
  companySize: z.string().min(1, "Select company size"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormValues = z.output<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginFormValues = z.output<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type JobSeekerOnboardingInput = z.infer<typeof jobSeekerOnboardingSchema>;
export type RecruiterOnboardingInput = z.infer<typeof recruiterOnboardingSchema>;
