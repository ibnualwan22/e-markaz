import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    let adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'Admin' } });
    }

    const modules = ["PERIODE", "PROGRAM", "SANTRI", "PENDAFTAR", "MATERI", "ABSENSI", "AKUN", "ROLE", "DASHBOARD", "PEMBAYARAN"];
    const actions = ["CREATE", "READ", "UPDATE", "DELETE"];

    // Ensure all permissions exist and map them
    for (const mod of modules) {
      for (const act of actions) {
        let perm = await prisma.permission.findFirst({
          where: { module: mod, action: act }
        });
        if (!perm) {
          perm = await prisma.permission.create({
            data: { module: mod, action: act }
          });
        }
        
        // Link to Admin Role
        const link = await prisma.rolePermission.findFirst({
          where: { roleId: adminRole.id, permissionId: perm.id }
        });
        if (!link) {
          await prisma.rolePermission.create({
            data: { roleId: adminRole.id, permissionId: perm.id }
          });
        }
      }
    }

    const password = await bcrypt.hash('adminMarkaz', 10);
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password },
      create: {
        username: 'admin',
        password,
        roleId: adminRole.id
      }
    });

    return NextResponse.json({ success: true, message: "Penyemaian (Seed) selesai. Seluruh akses menu telah dibuka. User 'admin' password 'adminMarkaz' terbuat." });
  } catch (e) {
    return NextResponse.json({ error: e }, { status: 500 });
  }
}
