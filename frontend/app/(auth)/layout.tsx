import VoceraName from "@/components/branding/vocera-name";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark">
       {/* Background glow */}
      {/* <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[500px] h-[300px] rounded-full
                      bg-[rgba(120,62,246,0.07)] blur-[100px] pointer-events-none"/> */}

      
      {children}
    </div>
  );
}