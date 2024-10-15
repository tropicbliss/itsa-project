import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/lib/error";
import { createForm } from "@/lib/forms";
import { Auth } from "aws-amplify";
import { z } from "zod";
import { $authStatus } from "@/lib/contextLib";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, {
    message: "Password must not be empty",
  }),
});

export function LoginForm() {
  const { toast } = useToast();

  const form = createForm(formSchema, {
    email: "",
    password: "",
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      const user = await Auth.signIn(values.email, values.password);
      if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
        $authStatus.set({status: "forceChangePassword", email: values.email})
      } else {
        $authStatus.set({status: "authenticated"})
      }
    } catch (error) {
      const errorDescription = extractErrorMessage(error);
      toast({
        variant: "destructive",
        title: "An error occurred logging in",
        description: errorDescription,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex justify-center items-center h-screen">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your username below to login to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                disabled={form.formState.isSubmitting}
                type="submit"
                className="w-full"
              >
                Sign in
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}
