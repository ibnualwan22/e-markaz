"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

const defaultModules = ["DASHBOARD", "PERIODE", "PROGRAM", "PENDAFTAR", "SANTRI", "ABSENSI", "REKAP_ABSENSI", "MATERI", "AKUN", "ROLE"];
const defaultActions = ["READ", "CREATE", "UPDATE", "DELETE"];

export async function getRolesAndPermissions() {
  try {
    // Basic auto-seed mapping
    const existingPerms = await prisma.permission.count();
    if (existingPerms === 0) {
      const dataToInject = [];
      for (const m of defaultModules) {
        for (const a of defaultActions) {
          dataToInject.push({ module: m, action: a });
        }
      }
      await prisma.permission.createMany({ data: dataToInject, skipDuplicates: true });
    }

    const roles = await prisma.role.findMany({
      where: { name: { notIn: ["Super Admin", "Santri"] } },
      include: {
        permissions: { include: { permission: true } }
      }
    });

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }]
    });

    return { roles, permissions };
  } catch (error) {
    return { roles: [], permissions: [] };
  }
}

export async function saveRole(id: string | null, name: string, permissionIds: string[]) {
  try {
    if (name === "Super Admin" || name === "Santri") {
      return { success: false, error: "Role sistem tidak dapat dimodifikasi!" };
    }
    
    if (id) {
       await prisma.role.update({ where: { id }, data: { name } });
       await prisma.rolePermission.deleteMany({ where: { roleId: id } });
       if (permissionIds.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionIds.map(pid => ({ roleId: id, permissionId: pid }))
          });
       }
    } else {
       const role = await prisma.role.create({ data: { name } });
       if (permissionIds.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionIds.map(pid => ({ roleId: role.id, permissionId: pid }))
          });
       }
    }
    revalidatePath("/admin/role");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRole(id: string) {
  try {
    const roleCheck = await prisma.role.findUnique({ where: { id } });
    if (roleCheck?.name === "Super Admin" || roleCheck?.name === "Santri") {
      return { success: false, error: "Role sistem tidak dapat dihapus!" };
    }
    await prisma.role.delete({ where: { id } });
    revalidatePath("/admin/role");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
