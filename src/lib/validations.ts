import { z } from "zod";

// Voorbeeld login schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Ongeldig e-mailadres." }),
  password: z.string().min(8, { message: "Wachtwoord moet minimaal 8 tekens lang zijn." }),
});

// Uitgebreide contact schema
export const contactSchema = z.object({
  // Basis informatie
  firstName: z.string().min(2, { message: "Voornaam moet minimaal 2 tekens lang zijn." }),
  lastName: z.string().min(2, { message: "Achternaam moet minimaal 2 tekens lang zijn." }),
  email: z.string().email({ message: "Ongeldig e-mailadres." }),
  phone: z.string().optional(),
  
  // Select velden
  projectType: z.string().min(1, { message: "Selecteer een project type." }),
  budget: z.string().min(1, { message: "Selecteer een budget range." }),
  timeline: z.string().min(1, { message: "Selecteer een timeline." }),
  
  // Date pickers
  preferredStartDate: z.date({ message: "Selecteer een gewenste startdatum." }),
  projectDeadline: z.date().optional(),
  availabilityStart: z.date().optional(),
  availabilityEnd: z.date().optional(),
  
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