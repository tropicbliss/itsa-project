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
import { useAppContext } from "@/lib/contextLib";
import { extractErrorMessage } from "@/lib/error";
import { createForm } from "@/lib/forms";
import { Auth } from "aws-amplify";
import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(1, {
    message: "Username must not be empty",
  }),
  password: z.string().min(1, {
    message: "Password must not be empty",
  }),
});

export function LoginForm() {
  const { toast } = useToast();
  const { userHasAuthenticated } = useAppContext();

  const form = createForm(formSchema, {
    username: "",
    password: "",
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      await Auth.signIn(values.username, values.password);
      userHasAuthenticated(true);
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
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
