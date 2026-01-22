import { SignInForm } from "@/components/auth/SignInForm";
import { authIsNotRequired } from "@/lib/auth-utils";


export default async function SignInPage() {
  await authIsNotRequired();

  return <SignInForm />;
}
