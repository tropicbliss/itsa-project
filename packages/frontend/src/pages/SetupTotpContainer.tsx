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
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from "react";
import { Auth } from "aws-amplify";
import { extractErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/use-toast";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { z } from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComponentProps {
    user: any
}

const formSchema = z.object({
    pin: z.string().min(6, {
        message: "Your one-time password must be 6 characters.",
    }),
})

export const SetupTotpContainer: React.FC<ComponentProps> = ({ user }) => {
    const { toast } = useToast();

    const [qrcode, setQrcode] = useState<{ code: string, raw: string } | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            pin: "",
        },
    })

    useEffect(() => {
        setIsLoading(true)
        Auth.setupTOTP(user).then((code) => {
            const str = "otpauth://totp/AWSCognito:" + user.username + "?secret=" + code + "&issuer=" + "MU-FinTech-ITM";
            setQrcode({ code: str, raw: code })
        }).catch((error) => {
            const errorDescription = extractErrorMessage(error);
            toast({
                variant: "destructive",
                title: "An error occurred fetching the TOTP code",
                description: errorDescription,
            });
        }).finally(() => setIsLoading(false))
    }, [])

    async function handleSubmit(data: z.infer<typeof formSchema>) {
        try {
            await Auth.verifyTotpToken(user, data.pin)
            await Auth.setPreferredMFA(user, "TOTP")
            $authStatus.set({ status: "authenticated" })
        } catch (error) {
            const errorDescription = extractErrorMessage(error);
            toast({
                variant: "destructive",
                title: "An error occurred submitting the TOTP verification code",
                description: errorDescription,
            });
        }
    }

    return (
        <Form {...form}>
            <form className="flex justify-center items-center h-screen" onSubmit={form.handleSubmit(handleSubmit)}>
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Enable MFA</CardTitle>
                        <CardDescription>
                            Use your favourite authenticator app (e.g., Google Authenticator) to add an extra layer of security to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-3">
                        {qrcode && <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                    <QRCodeSVG onClick={async () => {
                                        await navigator.clipboard.writeText(qrcode.raw)
                                        toast({
                                            title: "Copied to clipboard"
                                        })
                                    }} className="dark:invert" value={qrcode.code} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Copy code</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>}
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
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
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
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" disabled={isLoading} onClick={() => $authStatus.set({ status: "authenticated" })}
                        >
                            Skip
                        </Button>
                        <Button type="submit"
                            disabled={form.formState.isSubmitting || isLoading}
                        >
                            Sign in
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}