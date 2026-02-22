import { userProfile } from '@/app/action/user';
import { authIsRequired } from '@/lib/auth-utils'
import { redirect } from 'next/navigation';
import { UpdateProfile as UpdateProfileForm } from '@/components/auth/UpdateProfileForm';
import { ChangePasswordForm } from '@/components/auth/ChangePassword';


export default async function UpdateProfile() {
    await authIsRequired();
    const user = await userProfile();

  if (!user) redirect("/sign-in");
  return (
    <div className="w-full p-6 shadow-lg mx-auto max-w-7xl min-h-dvh rounded-2xl h-full flex gap-6 justify-center items-start">
      <UpdateProfileForm
        email={user.email}
        name={user.name ?? ""}
        image={user.image ?? ""}
      />

      <ChangePasswordForm />

      {/* <ToggleOtpForm twoFactorEnabled={user.twoFactorEnabled} /> */}
      </div>
  )
}
