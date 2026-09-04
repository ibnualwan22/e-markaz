"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function getPendaftaran() {
  try {
    return await prisma.pendaftaran.findMany({
      include: {
        periode: true,
        program: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

function generateUsername(nama: string, id: string) {
  const clean = nama.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean.substring(0, 6)}_${id.substring(id.length - 4)}`;
}

function generatePassword() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function accPendaftaran(id: string) {
  try {
    const pendaftar = await prisma.pendaftaran.findUnique({ where: { id } });
    if (!pendaftar || pendaftar.status !== "MENUNGGU") {
      throw new Error("Data tidak valid atau sudah diproses");
    }

    const username = generateUsername(pendaftar.namaLengkap, id);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let santriRole = await prisma.role.findUnique({ where: { name: 'Santri' } });
    if (!santriRole) {
      santriRole = await prisma.role.create({ data: { name: 'Santri' } });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedPendaftaran = await tx.pendaftaran.update({
        where: { id },
        data: { status: "DITERIMA" }
      });

      const user = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          roleId: santriRole!.id
        }
      });

      const santri = await tx.santri.create({
        data: {
          userId: user.id,
          pendaftaranId: id
        }
      });

      return { user, updatedPendaftaran };
    });

    revalidatePath("/admin/pendaftar");
    return { success: true, credentials: { username, password: plainPassword } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectPendaftaran(id: string) {
  try {
    await prisma.pendaftaran.update({
      where: { id },
      data: { status: "DITOLAK" }
    });
    revalidatePath("/admin/pendaftar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
