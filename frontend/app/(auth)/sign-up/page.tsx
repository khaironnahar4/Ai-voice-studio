import { SignUpForm } from "@/components/auth/SignUpForm";
import { authIsNotRequired } from "@/lib/auth-utils";

export default async function SignUpPage() {
  await authIsNotRequired();  

  return (
    <SignUpForm />
  );
}
