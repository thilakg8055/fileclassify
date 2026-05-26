// // "use client";

// // import { useEffect } from "react";
// // import { useAuthStore } from "@/lib/store";

// // export default function AuthLoader({
// //   children,
// // }: {
// //   children: React.ReactNode;
// // }) {
// //   const loadAuth = useAuthStore((s) => s.loadAuth);

// //   useEffect(() => {
// //     loadAuth();
// //   }, [loadAuth]);

// //   return <>{children}</>;
// // }


// "use client";

// import { useEffect, useState } from "react";
// import { useAuthStore } from "@/lib/store";

// export default function AuthLoader({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const loadAuth = useAuthStore((s) => s.loadAuth);
//   const initialized = useAuthStore((s) => s.initialized);
//   const [ready, setReady] = useState(false);

//   useEffect(() => {
//     // loadAuth is synchronous (just reads localStorage), so after
//     // calling it the store is immediately populated before any
//     // child component mounts and fires API calls.
//     loadAuth();
//     setReady(true);
//   }, [loadAuth]);

//   // Don't render children at all until auth is restored.
//   // This prevents any page/layout from firing API calls with
//   // a null token before localStorage has been read.
//   if (!ready || !initialized) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div
//           style={{
//             width: 32,
//             height: 32,
//             border: "3px solid #F59E0B",
//             borderTopColor: "transparent",
//             borderRadius: "50%",
//             animation: "spin 0.7s linear infinite",
//           }}
//         />
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

"use client";

import { useLayoutEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";

export default function AuthLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadAuth = useAuthStore((s) => s.loadAuth);
  const [ready, setReady] = useState(false);

  // useLayoutEffect runs synchronously before the browser paints,
  // so auth is restored before ANY child component can mount and
  // fire API calls.
  useLayoutEffect(() => {
    loadAuth();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid #F59E0B",
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return <>{children}</>;
}