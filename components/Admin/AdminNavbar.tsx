"use client"

import { useState } from "react";
import { useAppContext } from "@/Context/AppContextProvider";
import styles from "@/css/AdminNavbar.module.scss";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import {
  HiHome,
  HiCube,
  HiPlusCircle,
  HiClipboardList,
  HiLogout,
  HiMenuAlt2,
  HiX, // Import your custom icon here
} from "react-icons/hi";
import { ImProfile } from "react-icons/im";
import { handleSignOut } from "../HandleSignOut";
import { signOutUser } from "@/lib/Actions/UserAuth.action";

const navLinks = [
  { href: "/admin-panel", label: "Home", icon: HiHome },
  { href: "/admin-panel/add-product", label: "Add Product", icon: HiPlusCircle },
  { href: "/admin-panel/all-products", label: "Products", icon: HiCube },
  { href: "/admin-panel/orders", label: "Orders", icon: HiClipboardList },
  { href: "/admin-panel/customers", label: "Customers", icon: ImProfile },
];

const AdminNavbar = () => {
  const { user } = useAppContext();
  const pathname = usePathname();
   const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Admin";
  

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Toggle button (visible on mobile) */}
      <button
        className={styles.toggleBtn}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
      >
        {isOpen ? <HiX size={22} /> : <HiMenuAlt2 size={22} />}
      </button>

      <aside className={`${styles.navbar} ${isOpen ? styles.open : styles.closed}`}>
        {/* Close button inside sidebar */}
        <button
          className={styles.closeBtn}
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation"
        >
          <HiX size={18} />
        </button>

        {/* User section */}
        <div className={styles.userSection}>
          <div className={styles.avatarWrapper}>
            <FaUserCircle size={52} className={styles.avatarIcon} />
            <span className={styles.onlineDot} aria-label="Online" />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.adminBadge}>Administrator</span>
            <h4 className={styles.userName}>{displayName}</h4>
            <p className={styles.userEmail}>{user?.email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Navigation */}
        <nav className={styles.nav}>
          <p className={styles.navLabel}>Navigation</p>
          <ul className={styles.navList}>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/admin-panel"
                  ? pathname === "/admin-panel"
                  : pathname.startsWith(href);

              return (
                <li key={href} className={styles.navItem}>
                  <Link
                    href={href}
                    className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                    onClick={() => {
                      // Auto-close on mobile
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                  >
                    <span className={styles.iconWrapper}>
                      <Icon size={18} />
                    </span>
                    <span className={styles.linkLabel}>{label}</span>
                    {isActive && <span className={styles.activePill} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Spacer */}
        <div className={styles.spacer} />

        {/* Sign out */}
        <div className={styles.footer} onClick={() => handleSignOut(signOutUser, router)}>
          <div className={styles.divider} />
          <button className={styles.signOutBtn}>
            <HiLogout size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminNavbar;
