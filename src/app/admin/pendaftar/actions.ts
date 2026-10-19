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
    const pendaftar = await prisma.pendaftaran.findUnique({
      where: { id },
      include: { santri: { include: { user: true } } }
    });
    if (!pendaftar || pendaftar.status !== "MENUNGGU") {
      throw new Error("Data tidak valid atau sudah diproses");
    }

    // Cari santri & user yang sudah dibuat saat pendaftaran
    // Fallback: buat baru jika data lama (sebelum fitur ini)
    let username: string;
    let plainPassword: string | null = null;

    await prisma.$transaction(async (tx) => {
      // Update status pendaftaran
      await tx.pendaftaran.update({
        where: { id },
        data: { status: "DITERIMA" }
      });

      if (pendaftar.santri && pendaftar.santri.user) {
        // Data baru: user & santri sudah ada, tinggal aktifkan
        username = pendaftar.santri.user.username;
        const masaBerlaku = new Date();
        masaBerlaku.setMonth(masaBerlaku.getMonth() + 1);
        await tx.santri.update({
          where: { id: pendaftar.santri.id },
          data: { isActive: true, masaBerlaku }
        });
      } else {
        // Fallback data lama: buat user & santri baru
        const p = pendaftar as any;
        if (p.username && p.passwordHash) {
          username = p.username;
        } else {
          username = generateUsername(pendaftar.namaLengkap, id);
          plainPassword = generatePassword();
        }
        const hashedPassword = p.passwordHash || await bcrypt.hash(plainPassword!, 10);

        let santriRole = await tx.role.findUnique({ where: { name: 'Santri' } });
        if (!santriRole) {
          santriRole = await tx.role.create({ data: { name: 'Santri' } });
        }

        // Cek apakah user sudah ada (dari pendaftaran baru tapi santri gagal dibuat)
        let user = await tx.user.findUnique({ where: { username } });
        if (!user) {
          user = await tx.user.create({
            data: {
              username,
              password: hashedPassword,
              roleId: santriRole!.id
            }
          });
        }

        const masaBerlaku = new Date();
        masaBerlaku.setMonth(masaBerlaku.getMonth() + 1);

        await tx.santri.create({
          data: {
            userId: user.id,
            pendaftaranId: id,
            isActive: true,
            masaBerlaku
          }
        });
      }
    });

    revalidatePath("/admin/pendaftar");
    if (plainPassword) {
      return { success: true, credentials: { username: username!, password: plainPassword } };
    }
    return { success: true, credentials: { username: username!, password: "(sesuai yang didaftarkan)" } };
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
