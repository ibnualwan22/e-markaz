"use server";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";


export async function getPendaftaran(periodeId?: string) {
  try {
    // Jika tidak ada filter, default ke periode aktif
    let filterPeriodeId = periodeId;
    if (!filterPeriodeId) {
      const active = await prisma.periode.findFirst({
        where: { statusAktif: true },
        orderBy: { createdAt: 'desc' }
      });
      if (active) filterPeriodeId = active.id;
    }

    return await prisma.pendaftaran.findMany({
      where: filterPeriodeId ? { periodeId: filterPeriodeId } : undefined,
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

export async function getAllPeriode() {
  try {
    return await prisma.periode.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch {
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

      const masaBerlaku = new Date();
      masaBerlaku.setMonth(masaBerlaku.getMonth() + 1);

      const santri = await tx.santri.create({
        data: {
          userId: user.id,
          pendaftaranId: id,
          isActive: true,
          masaBerlaku
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
