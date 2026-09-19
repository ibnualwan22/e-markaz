import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/l-admin");
  }

  // Prevents Santri from accessing Admin routes
  if (session.user.role === "Santri") {
    redirect("/portal");
  }

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-4 pt-20 md:pt-8 md:p-8 overflow-y-auto w-full max-w-full">
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
