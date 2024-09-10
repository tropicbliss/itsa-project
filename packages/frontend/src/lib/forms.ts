import { DefaultValues, useForm } from "react-hook-form";
import { z, ZodType } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export function createForm<T extends ZodType<any, any, any>>(
  formSchema: T,
  defaultValues: DefaultValues<z.TypeOf<T>>
) {
  return useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
}
