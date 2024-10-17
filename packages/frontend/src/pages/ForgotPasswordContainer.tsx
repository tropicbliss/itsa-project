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
    username: z.string().email(),
});

export function ForgotPasswordContainer() {
    const { toast } = useToast();

    const form = createForm(formSchema, {
        username: "",
    });

    async function handleSubmit(values: z.infer<typeof formSchema>) {
        try {
            await Auth.forgotPassword(values.username)
            toast({
                title: "Successfully sent password reset email",
                description: "Remember to check your spam folder."
            })
            $authStatus.set({ status: "forgotPasswordSubmit", username: values.username })
        } catch (error) {
            const errorDescription = extractErrorMessage(error);
            toast({
                variant: "destructive",
                title: "An error occurred submitting password reset request",
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
                            <CardTitle className="text-2xl">Password Reset</CardTitle>
                            <CardDescription>
                                Enter your email below to reset your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="username"
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
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" disabled={form.formState.isSubmitting} onClick={() => $authStatus.set({ status: "unauthenticated" })}
                            >
                                Back
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}
                            >
                                Submit
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </Form>
    );
}