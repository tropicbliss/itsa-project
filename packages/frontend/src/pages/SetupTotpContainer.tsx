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

interface ComponentProps {
    user: any
}

export const SetupTotpContainer: React.FC<ComponentProps> = ({ user }) => {
    const { toast } = useToast();

    const [qrcode, setQrcode] = useState<string | null>(null)
    const [verificationCode, setVerificationCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        Auth.setupTOTP(user).then((code) => {
            const str = "otpauth://totp/AWSCognito:" + user.username + "?secret=" + code + "&issuer=" + "Global Bank";
            setQrcode(str)
        }).catch((error) => {
            const errorDescription = extractErrorMessage(error);
            toast({
                variant: "destructive",
                title: "An error occurred fetching the TOTP code",
                description: errorDescription,
            });
        }).finally(() => setIsLoading(false))
    }, [])

    async function handleSubmit(skip: boolean) {
        try {
            if (!skip) {
                await Auth.verifyTotpToken(user, verificationCode)
                await Auth.setPreferredMFA(user, "TOTP")
            }
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

    return <form className="flex justify-center items-center h-screen" onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(false)
    }}>
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Enable MFA</CardTitle>
                <CardDescription>
                    Use your favourite authenticator app (e.g., Google Authenticator) to add an extra layer of security to your account.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-9">
                {qrcode && <QRCodeSVG className="mx-auto dark:invert" value={qrcode} />}
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
            <CardFooter className="flex justify-between">
                <Button variant="outline" disabled={isLoading} onClick={() => handleSubmit(true)}
                >
                    Skip
                </Button>
                <Button type="submit"
                    disabled={verificationCode.length !== 6 || isLoading}
                >
                    Sign in
                </Button>
            </CardFooter>
        </Card>
    </form>
}