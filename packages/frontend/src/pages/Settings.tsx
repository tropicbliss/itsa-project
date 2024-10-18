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
      <UserProfileSettings />
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

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, values.oldPassword, values.newPassword);
      toast({
        title: "Successfully changed password",
      });
      form.reset()
    } catch (error) {
      const errorDescription = extractErrorMessage(error);
      toast({
        variant: "destructive",
        title: "An error occurred resetting the password",
        description: errorDescription,
      });
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
            <Button disabled={form.formState.isSubmitting} type="submit">
              Reset Password
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function UserProfileSettings() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false)

  const formSchema = z
    .object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
    });
  const form = createForm(formSchema, {
    email: "",
    firstName: "",
    lastName: ""
  });

  useEffect(() => {
    setIsLoading(true)
    try {
      Auth.currentAuthenticatedUser().then((user) => Auth.userAttributes(user)).then((attributes) => {
        const email = attributes.find((attribute) => attribute.Name === "email")?.Value
        const firstName = attributes.find((attribute) => attribute.Name === "given_name")?.Value
        const lastName = attributes.find((attribute) => attribute.Name === "family_name")?.Value
        if (email === undefined || firstName === undefined || lastName === undefined) {
          throw new Error("A required attribute is not found")
        }
        form.setValue("email", email)
        form.setValue("firstName", firstName)
        form.setValue("lastName", lastName)
      })
    } catch (error) {
      const errorDescription = extractErrorMessage(error);
      toast({
        variant: "destructive",
        title: "An error occurred fetching user attributes",
        description: errorDescription,
      });
    } finally {
      setIsLoading(false)
    }
  }, [])

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        email: values.email,
        "given_name": values.firstName,
        "family_name": values.lastName,
      })
      toast({
        title: "Successfully updated user profile",
      });
    } catch (error) {
      const errorDescription = extractErrorMessage(error);
      toast({
        variant: "destructive",
        title: "An error occurred updating user profile",
        description: errorDescription,
      });
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardHeader>
            <CardTitle>Update User Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-3">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="grid gap-3">
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="grid gap-3">
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button disabled={form.formState.isSubmitting || isLoading} type="submit">
              Update
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
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    Auth.currentAuthenticatedUser().then((user) => Auth.getPreferredMFA(user)).then((mfa) => setIsEnabled(mfa !== "NOMFA"))
  }, [])

  if (isEnabled) {
    return <Card>
      <CardHeader>
        <CardTitle>Disable MFA</CardTitle>
      </CardHeader>
      <CardFooter className="border-t px-6 py-4">
        <Button disabled={isLoading} onMouseDown={async () => {
          try {
            setIsLoading(true)
            const user = await Auth.currentAuthenticatedUser();
            await Auth.setPreferredMFA(user, "NOMFA")
            setIsEnabled(false)
            toast({
              title: "Successfully disabled MFA",
            });
          } catch (error) {
            const errorDescription = extractErrorMessage(error);
            toast({
              variant: "destructive",
              title: "An error occurred disabling MFA",
              description: errorDescription,
            });
          } finally {
            setIsLoading(false)
          }
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
        <Button disabled={isLoading} onMouseDown={async () => {
          try {
            setIsLoading(true)
            const user = await Auth.currentAuthenticatedUser();
            $authStatus.set({ status: "setupTotp", user })
          } catch (error) {
            const errorDescription = extractErrorMessage(error);
            toast({
              variant: "destructive",
              title: "An error occurred enabling MFA",
              description: errorDescription,
            });
          }
        }}>
          Enable
        </Button>
      </CardFooter>
    </Card>
  }
}
