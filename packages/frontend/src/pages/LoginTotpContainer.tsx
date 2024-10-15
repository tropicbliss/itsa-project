import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { $authStatus } from "@/lib/contextLib";
import { useState } from "react";
import { Auth } from "aws-amplify";
import { extractErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/use-toast";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { z } from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

interface ComponentProps {
    user: any
}

const formSchema = z.object({
    pin: z.string().min(6, {
        message: "Your one-time password must be 6 characters.",
    }),
})

export const LoginTotpContainer: React.FC<ComponentProps> = ({ user }) => {
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            pin: "",
        },
    })

    async function handleSubmit(data: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true)
            await Auth.confirmSignIn(user, data.pin, "SOFTWARE_TOKEN_MFA")
            $authStatus.set({ status: "authenticated" })
        } catch (error) {
            const errorDescription = extractErrorMessage(error);
            toast({
                variant: "destructive",
                title: "An error occurred verifying the TOTP verification code",
                description: errorDescription,
            });
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form className="flex justify-center items-center h-screen" onSubmit={form.handleSubmit(handleSubmit)}>
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Verify MFA</CardTitle>
                        <CardDescription>
                            Use your favourite authenticator app (e.g., Google Authenticator) to enter your 6-digit OTP.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <FormField
                            control={form.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
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
                    </CardContent>
                    <CardFooter>
                        <Button
                            disabled={form.formState.isSubmitting || isLoading} type="submit" className="w-full"
                        >
                            Sign in
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}