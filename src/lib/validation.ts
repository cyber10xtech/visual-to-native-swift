import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const bookingSchema = z.object({
  serviceType: z.string().trim().min(1, "Service type is required").max(200),
  description: z.string().max(2000).optional(),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().optional(),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
});

export const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export const NIGERIAN_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Kaduna", "Enugu",
  "Benin City", "Warri", "Calabar", "Owerri", "Uyo", "Abeokuta", "Ilorin",
  "Jos", "Aba", "Akure", "Asaba", "Awka", "Lokoja", "Minna", "Ado-Ekiti",
  "Osogbo", "Abakaliki", "Bauchi", "Yola", "Lafia", "Makurdi", "Sokoto",
  "Maiduguri", "Gombe", "Jalingo", "Damaturu", "Birnin Kebbi", "Gusau",
  "Dutse", "Katsina",
];
