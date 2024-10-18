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
import React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface ComponentProps {
    username: string
}

const formSchema = z.object({
    code: z.string().min(1),
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

export const ForgotPasswordSubmitContainer: React.FC<ComponentProps> = ({ username }) => {
    const { toast } = useToast();

    const form = createForm(formSchema, {
        code: "",
        password: "",
        confirmPassword: ""
    });

    async function handleSubmit(values: z.infer<typeof formSchema>) {
        try {
            await Auth.forgotPasswordSubmit(username, values.code, values.password)
            toast({
                title: "Successfully reset password",
                description: "Please sign in with your new password."
            })
            $authStatus.set({ status: "unauthenticated" })
        } catch (error) {
            const errorDescription = extractErrorMessage(error);
            toast({
                variant: "destructive",
                title: "An error occurred changing your password",
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
                            <CardTitle className="text-2xl">Change Password</CardTitle>
                            <CardDescription>
                                Enter the code sent to your email and your new password to proceed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code</FormLabel>
                                            <FormControl>
                                                <InputOTP maxLength={6} {...field}>
                                                    <InputOTPGroup>
                                                        <InputOTPSlot index={0} />
                                                        <InputOTPSlot index={1} />
                                                        <InputOTPSlot index={2} />
                                                        <InputOTPSlot index={3} />
                                                        <InputOTPSlot index={4} />
                                                        <InputOTPSlot index={5} />
                                                    </InputOTPGroup>
                                                </InputOTP>
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
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" disabled={form.formState.isSubmitting} onMouseDown={() => $authStatus.set({ status: "forgotPassword" })}
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