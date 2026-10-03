import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking system initialization state...');

  // Check if an admin already exists
  const adminCount = await prisma.admin.count();
  
  if (adminCount === 0) {
    console.log('No Admin found. Initializing first-run experience...');
    
    // Create the master Dean account
    const hashedPassword = await bcrypt.hash('Dean@2026', 12);
    
    await prisma.admin.create({
      data: {
        email: 'dean@agnicollege.edu',
        name: 'System Administrator (Dean)',
        passwordHash: hashedPassword,
      }
    });

    // Create a default foundational department to start with
    await prisma.department.create({
      data: {
        name: 'Information Technology',
        headOfDept: 'Pending Assignment',
      }
    });

    console.log('✅ Base system initialized successfully.');
  } else {
    console.log('System is already initialized. Skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });