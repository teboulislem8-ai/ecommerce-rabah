import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "./SignUpForm";

type SignUpProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignUpPage({ searchParams }: SignUpProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ? String(params.redirectTo) : undefined;

  return (
    <div className="bg-background flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">إنشاء حساب</CardTitle>
          <CardDescription>
            أدخل معلوماتك لإنشاء حساب جديد
          </CardDescription>
        </CardHeader>
        <SignUpForm redirectTo={redirectTo} />
      </Card>
    </div>
  );
}
