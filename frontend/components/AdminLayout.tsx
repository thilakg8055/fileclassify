// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/lib/store";
// import AdminSidebar from "@/components/AdminSidebar";

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   const { token, role } = useAuthStore();
//   const router = useRouter();

//   useEffect(() => {
//     if (!token || role !== "admin") {
//       router.push("/admin");
//     }
//   }, [token, role]);

//   if (!token || role !== "admin") return null;

//   return (
//     <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
//       <AdminSidebar />
//       <main className="flex-1 ml-64 min-h-screen">
//         {children}
//       </main>
//     </div>
//   );
// }


// // "use client";

// // import { useEffect } from "react";
// // import { useRouter } from "next/navigation";
// // import { useAuthStore } from "@/lib/store";
// // import AdminSidebar from "./AdminSidebar";

// // export default function AdminLayout({
// //   children
// // }: {
// //   children: React.ReactNode
// // }) {

// //   const {
// //     token,
// //     role,
// //     initialized,
// //     loadAuth
// //   } = useAuthStore();

// //   const router = useRouter();

// //   useEffect(() => {

// //     loadAuth();

// //   }, []);

// //   useEffect(() => {

// //     if (
// //       initialized &&
// //       (!token || role !== "admin")
// //     ) {

// //       router.push("/admin");

// //     }

// //   }, [initialized, token, role]);

// //   if (!initialized) {

// //     return <div>Loading...</div>;

// //   }

// //   return (

// //     <div
// //       className="flex min-h-screen"
// //       style={{ background: "var(--bg)" }}
// //     >

// //       <AdminSidebar />

// //       <main className="flex-1 ml-64">

// //         {children}

// //       </main>

// //     </div>

// //   );

// // }


// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/lib/store";
// import AdminSidebar from "@/components/AdminSidebar";

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {

//   const {
//     token,
//     role,
//     initialized
//   } = useAuthStore();

//   const router = useRouter();

//   useEffect(() => {

//     if (!initialized) return;

//     if (!token || role !== "admin") {
//       router.replace("/admin");
//     }

//   }, [token, role, initialized, router]);

//   if (!initialized) {
//     return (
//       <div className="min-h-screen flex justify-center items-center">
//         Loading...
//       </div>
//     );
//   }

//   if (!token || role !== "admin") {
//     return null;
//   }

//   return (
//     <div
//       className="flex min-h-screen"
//       style={{ background: "var(--bg)" }}
//     >
//       <AdminSidebar />

//       <main className="flex-1 ml-64 min-h-screen">
//         {children}
//       </main>
//     </div>
//   );
// }

// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/lib/store";
// import AdminSidebar from "@/components/AdminSidebar";

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { token, role, initialized } = useAuthStore();
//   const router = useRouter();

//   useEffect(() => {
//     if (!initialized) return;
//     if (!token || role !== "admin") {
//       router.replace("/admin");
//     }
//   }, [token, role, initialized, router]);

//   // While auth state is not yet known, render nothing
//   if (!initialized) return null;

//   // Redirect in progress — render nothing to avoid flash
//   if (!token || role !== "admin") return null;

//   return (
//     <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
//       <AdminSidebar />
//       <main className="flex-1 ml-64 min-h-screen">{children}</main>
//     </div>
//   );
// }


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, role, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!token || role !== "admin") router.replace("/admin");
  }, [token, role, initialized, router]);

  // Don't render anything (and don't fire API calls) until:
  // 1. auth has been loaded from localStorage (initialized)
  // 2. user is confirmed as admin
  if (!initialized || !token || role !== "admin") return null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  );
}