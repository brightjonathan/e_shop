"use client";

import { useAppContext } from "@/Context/AppContextProvider";
import { useRouter } from "next/navigation";

const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppContext();
  const router = useRouter();

  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (!isAdmin) {
    return (
      <section style={{ height: "10vh" }}>
        <div>
          {/* <h2>Permission Denied.</h2>
          <p>This page can only be viewed by an Admin user.</p> */}

          {/* <button
            className="--btn"
            onClick={() => router.push("/")}
          >
            &larr; Back To Home
          </button> */}
        </div>
      </section>
    );
  }

  return <>{children}</>;
};

export default AdminOnlyRoute;