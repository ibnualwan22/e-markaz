"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function getAccounts() {
  try {
    return await prisma.user.findMany({
      where: {
        role: { name: { notIn: ["Santri"] } } // Santri managed in Data Santri
      },
      include: { role: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    return [];
  }
}

export async function getRoles() {
  try {
    return await prisma.role.findMany({
      where: { name: { notIn: ["Santri", "Super Admin"] } }
    });
  } catch (error) {
    return [];
  }
}

export async function saveAccount(id: string | null, data: { username: string, password?: string, roleId: string }) {
  try {
    if (data.username === 'admin' && !id) {
       return { success: false, error: 'Sistem menolak: Duplikasi username admin dilarang!' };
    }
    
    if (id) {
      const userCheck = await prisma.user.findUnique({ where: { id } });
      if (userCheck?.username === 'admin') {
         return { success: false, error: 'Sistem menolak: Akun Super Admin tidak boleh diubah!' };
      }
      const updateData: any = { username: data.username, roleId: data.roleId };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      await prisma.user.update({ where: { id }, data: updateData });
    } else {
      if (!data.password) throw new Error("Password wajib diisi untuk pengguna baru");
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          roleId: data.roleId
        }
      });
    }
    revalidatePath("/admin/akun");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAccount(id: string) {
  try {
    const userCheck = await prisma.user.findUnique({ where: { id } });
    if (userCheck?.username === 'admin') {
       return { success: false, error: 'Sistem menolak: Akun Super Admin mutlak dan tidak boleh dihapus!' };
    }
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/akun");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
