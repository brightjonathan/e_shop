"use clint"

import Navbar from "@/components/Admin/AdminNavbar";
import AdminGuard from "@/components/AdminGuide";
// import styles from "@/css/Admin.module.scss";
// import '@/css/globalScss.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     // The root wrapper must be flex + no overflow
<div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

  {/* Sidebar — fixed in place, scrolls only its own content */}
  <aside style={{ flexShrink: 0, height: '100%', overflowY: 'auto'}}>
    <Navbar />
  </aside>

  {/* Main content — takes remaining space, scrolls independently */}
  <main style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
    <AdminGuard>
    {children}  {/* ← ProductForm lives in here */}
    </AdminGuard>
  </main>

</div>
  );
};


//  <div className=''>
//       <div className=''>
//         <Navbar />
//       </div>

//       <div className=''>
//         {children}
//       </div>
//     </div>