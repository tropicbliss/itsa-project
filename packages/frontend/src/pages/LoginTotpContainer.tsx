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
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"

interface ComponentProps {
    user: any
}

export const LoginTotpContainer: React.FC<ComponentProps> = ({ user }) => {
    const { toast } = useToast();

    const [verificationCode, setVerificationCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit() {
        try {
            setIsLoading(true)
            await Auth.confirmSignIn(user, verificationCode, "SOFTWARE_TOKEN_MFA")
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

    return <form className="flex justify-center items-center h-screen" onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
    }}>
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Verify MFA</CardTitle>
                <CardDescription>
                    Use your favourite authenticator app (e.g., Google Authenticator) to enter your 6-digit OTP.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <InputOTP maxLength={6} onChange={setVerificationCode}>
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
            </CardContent>
            <CardFooter>
                <Button
                    disabled={verificationCode.length !== 6 || isLoading} type="submit" className="w-full"
                >
                    Sign in
                </Button>
            </CardFooter>
        </Card>
    </form>
}