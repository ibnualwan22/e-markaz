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

    const password = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password,
        roleId: adminRole.id
      }
    });

    return NextResponse.json({ success: true, message: "Penyemaian (Seed) selesai. User 'admin' password 'admin123' terbuat." });
  } catch(e) {
    return NextResponse.json({ error: e }, { status: 500 });
  }
}
