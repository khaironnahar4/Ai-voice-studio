import { SignInForm } from "@/components/auth/SignInForm";
import { authIsNotRequired } from "@/lib/auth/auth-utils";


export default async function SignInPage() {
  await authIsNotRequired();

  return <SignInForm />;
}
