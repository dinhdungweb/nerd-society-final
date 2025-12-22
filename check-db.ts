import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
    const combos = await prisma.combo.findMany()
    console.log('Total combos:', combos.length)
    console.log('Active combos:', combos.filter(c => c.isActive).length)
    console.log('Sample:', combos[0])
}

check()
