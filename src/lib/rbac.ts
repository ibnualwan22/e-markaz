import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function hasPermission(module: string, action: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) return false;
  
  // Example: If role is "Admin" then allow all (opsional, sesuaikan dengan kebutuhan)
  // if (session.user.role === "Admin") return true;

  return session.user.permissions.some(
    (p) => p.module === module && p.action === action
  );
}

export async function hasRole(roleName: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === roleName;
}
