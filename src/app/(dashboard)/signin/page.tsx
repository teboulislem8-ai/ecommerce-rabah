import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "./SignInForm";

type SignInProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignIn({ searchParams }: SignInProps) {
  const params = await searchParams;
  const message = params.message ? String(params.message) : null;
  const redirectTo = params.redirectTo ? String(params.redirectTo) : undefined;

  return (
    <div className="bg-background flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل معلوماتك للدخول إلى حسابك
          </CardDescription>
        </CardHeader>
        <SignInForm message={message} redirectTo={redirectTo} />
      </Card>
    </div>
  );
}
