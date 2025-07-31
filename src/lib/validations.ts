import { z } from "zod";

// Date range schema
const dateRangeSchema = z.object({
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

// Time range schema
const timeRangeSchema = z.object({
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
});

// Voorbeeld login schema
export const loginSchema = z.object({
  email: z.string().min(1, { message: "E-mailadres is verplicht." }).email({ message: "Ongeldig e-mailadres." }),
  password: z.string().min(8, { message: "Wachtwoord moet minimaal 8 tekens lang zijn." }),
});

// Uitgebreide contact schema met custom pickers
export const contactSchema = z.object({
  // Basis informatie
  firstName: z.string().min(2, { message: "Voornaam moet minimaal 2 tekens lang zijn." }),
  lastName: z.string().min(2, { message: "Achternaam moet minimaal 2 tekens lang zijn." }),
  email: z.string().min(1, { message: "E-mailadres is verplicht." }).email({ message: "Ongeldig e-mailadres." }),
  phone: z.string().optional(),
  
  // Select velden
  projectType: z.string().min(1, { message: "Selecteer een project type." }),
  budget: z.string().min(1, { message: "Selecteer een budget range." }),
  timeline: z.string().min(1, { message: "Selecteer een timeline." }),
  
  // Custom pickers
  preferredStartDate: z.string().min(1, { message: "Selecteer een gewenste startdatum." }),
  preferredStartTime: z.string().nullable().optional(),
  projectDeadline: z.string().optional(),
  availabilityDateRange: dateRangeSchema.optional(),
  availabilityTimeRange: timeRangeSchema.optional(),
  
  // Bericht
  message: z.string().min(10, { message: "Bericht moet minimaal 10 tekens lang zijn." }),
  
  // Checkbox
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Je moet de voorwaarden accepteren om door te gaan."
  }),
  
  // Optionele newsletter
  newsletter: z.boolean().default(false),
});

// Type inference
export type LoginFormData = z.infer<typeof loginSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;