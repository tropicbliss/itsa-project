import { z } from "zod";

export const clientIdSchema = z.string().uuid();
