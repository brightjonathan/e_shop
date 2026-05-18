"use clint"

import Navbar from "@/components/Admin/AdminNavbar";
import styles from "@/css/Admin.module.scss";
// import '@/css/globalScss.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.admin}>
      <div className={styles.navbar}>
        <Navbar />
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};