import VoceraName from "@/components/branding/vocera-name";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#0F0F1A]">
       {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[500px] h-[300px] rounded-full
                      bg-[rgba(120,62,246,0.07)] blur-[100px] pointer-events-none"/>

       {/* logo */}
       <div className="text-center mb-8 flex flex-col items-center">

             <div className="mb-6">
               <VoceraName />
             </div>

          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Welcome back
          </h1>
          {/* <p className="text-sm text-white/40 mt-1.5">
            Sign in to your account to continue
          </p> */}
        </div>
      
      {children}
    </div>
  );
}