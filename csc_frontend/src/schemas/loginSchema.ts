import { z } from "zod";

export const loginSchema = z.object({
  stationId: z
    .string()
    .min(1, "Station ID is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});