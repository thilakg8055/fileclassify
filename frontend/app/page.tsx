// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/lib/store";

// export default function HomePage() {
//   const router = useRouter();
//   const { token, role } = useAuthStore();

//   useEffect(() => {
//     if (token && role === "admin") router.push("/admin/dashboard");
//     else if (token && role === "employee") router.push("/employee/dashboard");
//     else router.push("/login");
//   }, []);

//   return <div className="min-h-screen flex items-center justify-center">
//     <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
//   </div>;
// }

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();

  
  const {
    token,
    role,
    initialized
  } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;

    if (token && role === "admin") {
      router.replace("/admin/dashboard");
    }
    else if (token && role === "employee") {
      router.replace("/employee/dashboard");
    }
    else {
      router.replace("/login");
    }

  }, [token, role, initialized, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );
}
