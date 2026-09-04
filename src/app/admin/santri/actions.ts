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
