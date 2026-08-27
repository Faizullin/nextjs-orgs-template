import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">It takes less than a minute</p>
        </div>
        <SignUp appearance={{ elements: { rootBox: "mx-auto" } }} />
      </div>
    </div>
  );
}
