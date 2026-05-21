"use client";

import { useAppContext } from "@/Context/AppContextProvider";

const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppContext();

  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (!isAdmin) {
    return (
      <></>
    );
  }

  return <>{children}</>;
};

export default AdminOnlyRoute;