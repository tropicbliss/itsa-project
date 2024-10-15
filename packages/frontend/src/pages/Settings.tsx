import { Button } from "@/components/ui/button";
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
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { $authStatus } from "@/lib/contextLib";

export function Settings() {
  return (
    <div className="grid gap-6">
      <ChangePassword />
      <MFASettings />
    </div>
  );
}

function ChangePassword() {
  const { toast } = useToast();

  const formSchema = z
    .object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(1),
      confirmPassword: z.string().min(1),
    })
    .superRefine(({ newPassword, confirmPassword }, ctx) => {
      if (confirmPassword !== newPassword) {
        ctx.addIssue({
          code: "custom",
          message: "The passwords did not match",
          path: ["confirmPassword"],
        });
      }
    });

  const form = createForm(formSchema, {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, values.oldPassword, values.newPassword);
      toast({
        title: "Successfully changed password",
      });
    } catch (error) {
      const errorDescription = extractErrorMessage(error);
      toast({
        variant: "destructive",
        title: "An error occurred resetting the password",
        description: errorDescription,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem className="grid gap-3">
                  <FormLabel>Old password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="grid gap-3">
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="grid gap-3">
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button disabled={loading} type="submit">
              Reset Password
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function MFASettings() {
  const { toast } = useToast();

  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    Auth.currentAuthenticatedUser().then((user) => Auth.getPreferredMFA(user)).then((mfa) => setIsEnabled(mfa !== "NOMFA"))
  }, [])

  if (isEnabled) {
    return <Card>
      <CardHeader>
        <CardTitle>Disable MFA</CardTitle>
      </CardHeader>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={async () => {
          const user = await Auth.currentAuthenticatedUser();
          await Auth.setPreferredMFA(user, "NOMFA")
          setIsEnabled(false)
        }}>
          Disable
        </Button>
      </CardFooter>
    </Card>
  } else {
    return <Card>
      <CardHeader>
        <CardTitle>Set up MFA</CardTitle>
      </CardHeader>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={async () => {
          const user = await Auth.currentAuthenticatedUser();
          $authStatus.set({ status: "setupTotp", user })
        }}>
          Enable
        </Button>
      </CardFooter>
    </Card>
  }
}
