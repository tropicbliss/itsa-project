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

interface ComponentProps {
    user: any
}

const formSchema = z.object({
    password: z.string().min(1),
    confirmPassword: z.string().min(1)
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: "custom",
            message: "The passwords did not match",
            path: ["confirmPassword"],
        });
    }
});

export const ForceChangePasswordContainer: React.FC<ComponentProps> = ({ user }) => {
    const { toast } = useToast();

    const form = createForm(formSchema, {
        password: "",
        confirmPassword: "",
    });

    async function handleSubmit(values: z.infer<typeof formSchema>) {
        try {
            const updatedUser = await Auth.completeNewPassword(user, values.password)
            $authStatus.set({ status: "setupTotp", user: updatedUser })
        } catch (error) {
            const errorDescription = extractErrorMessage(error);
            toast({
                variant: "destructive",
                title: "An error occurred changing the password",
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
                            <CardTitle className="text-2xl">Change your password</CardTitle>
                            <CardDescription>
                                Change your password to finish setting up your new account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
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
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm password</FormLabel>
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
                                Next
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </Form>
    );
}