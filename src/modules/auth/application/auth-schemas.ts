import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Saisissez une adresse e-mail valide.").trim().toLowerCase(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(128),
});

export const registrationSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2, "Le nom affiché doit contenir au moins 2 caractères.").max(60),
});
