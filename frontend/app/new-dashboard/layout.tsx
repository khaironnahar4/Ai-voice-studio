
import { ThemeProvider } from "@/utils/ThemeProvider";
import React from "react";

const UserDashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div>
      <ThemeProvider>{children}</ThemeProvider>
    </div>
  );
};

export default UserDashboardLayout;
