import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8 text-center">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Check Your Email</h1>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              We've sent you a confirmation link. Please check your email and click the link to activate your account.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
