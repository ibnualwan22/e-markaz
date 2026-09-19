"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSantriGlobal() {
  try {
    return await prisma.santri.findMany({
      include: {
        pendaftaran: {
          include: {
            program: true,
            periode: true
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function updateSantriName(pendaftaranId: string, newName: string) {
  try {
    await prisma.pendaftaran.update({
      where: { id: pendaftaranId },
      data: { namaLengkap: newName }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSantri(santriId: string) {
  try {
    const santri = await prisma.santri.findUnique({ where: { id: santriId } });
    if (!santri) throw new Error("Santri tidak ditemukan");

    await prisma.$transaction(async (tx) => {
      await tx.santri.delete({ where: { id: santriId } }); // cascades to absensiantri
      await tx.pendaftaran.delete({ where: { id: santri.pendaftaranId } });
      if (santri.userId) {
        await tx.user.delete({ where: { id: santri.userId } });
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPrograms() {
  return await prisma.program.findMany({ where: { statusAktif: true } });
}

export async function getPeriodes() {
  return await prisma.periode.findMany({ where: { statusAktif: true } });
}

import * as xlsx from "xlsx";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function resetUserPassword(userId: string) {
  try {
    const plainPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { success: true, plainPassword };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function downloadTemplate() {
  const ws = xlsx.utils.aoa_to_sheet([
    ["Nama Lengkap", "Jenis Kelamin (L/P)", "Tempat Lahir", "Tanggal Lahir (DD-MM-YYYY)", "No WA", "Email", "Provinsi", "Kota", "Kecamatan", "Detail Alamat"]
  ]);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Template");
  const buffer = xlsx.write(wb, { type: "base64", bookType: "xlsx" });
  return buffer;
}

function generateUsername(nama: string, id: string) {
  const clean = nama.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean.substring(0, 6)}_${id.substring(id.length - 4)}`;
}

export async function importSantriData(base64Data: string, programId: string, periodeId: string) {
  try {
    const buffer = Buffer.from(base64Data, "base64");
    const wb = xlsx.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1 });

    const rows = data.slice(1).filter(r => r.length > 0 && r[0]); 

    let santriRole = await prisma.role.findUnique({ where: { name: 'Santri' } });
    if (!santriRole) santriRole = await prisma.role.create({ data: { name: 'Santri' } });

    const results = [];

    for (const row of rows) {
      if (!row[0]) continue;
      
      const tg: any = row[3];
      let tgl = new Date("2000-01-01");
      // Basic Excel date handling or string handling
      if (typeof tg === 'number') {
        const utc_days = Math.floor(tg - 25569);
        const utc_value = utc_days * 86400;                                        
        tgl = new Date(utc_value * 1000);
      } else if (typeof tg === 'string') {
        const parts = tg.split(/[-/]/);
        if (parts.length === 3) {
           tgl = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
           tgl = new Date(tg);
           if (isNaN(tgl.getTime())) tgl = new Date("2000-01-01");
        }
      }

      const pendaftaran = await prisma.pendaftaran.create({
        data: {
          namaLengkap: String(row[0] || "-"),
          jenisKelamin: String(row[1] || "").toLowerCase() === "p" ? "PEREMPUAN" : "LAKI_LAKI",
          tempatLahir: String(row[2] || "-"),
          tanggalLahir: tgl,
          noWa: String(row[4] || "-"),
          email: String(row[5] || ""),
          provinsiId: String(row[6] || "00"), 
          kotaId: String(row[7] || "00"),
          kecamatanId: String(row[8] || "00"),
          detailAlamat: String(row[9] || "-"),
          programId,
          periodeId,
          status: "DITERIMA",
          kodeUnik: 0,
          totalBiaya: 0
        }
      });

      const username = generateUsername(pendaftaran.namaLengkap, pendaftaran.id);
      const plainPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          roleId: santriRole.id
        }
      });

      await prisma.santri.create({
        data: {
          userId: user.id,
          pendaftaranId: pendaftaran.id
        }
      });

      results.push({ namaLengkap: pendaftaran.namaLengkap, username, password: plainPassword });
    }

    revalidatePath("/admin/santri");
    return { success: true, count: rows.length, results };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
