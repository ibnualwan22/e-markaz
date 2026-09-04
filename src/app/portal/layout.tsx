import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarSantri from "@/components/SidebarSantri";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Prevent admin from seeing Santri portal
  if (session.user.role !== "Santri") {
    redirect("/admin");
  }

  return (
    <div className="flex bg-background min-h-screen">
      <SidebarSantri />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
