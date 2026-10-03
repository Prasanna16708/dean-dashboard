import prisma from '@/lib/prisma';

export async function executeAcademicRollover(adminId: string) {
  // We wrap the entire rollover in a single transaction so it never partially updates
  return await prisma.$transaction(async (tx) => {
    
    // 1. Log the initiation of the rollover
    await tx.auditLog.create({
      data: {
        adminId,
        action: 'ACADEMIC_ROLLOVER_STARTED',
        entity: 'System',
        metadata: JSON.stringify({ timestamp: new Date().toISOString() })
      }
    });

    // 2. Archive IV Year Students
    // They are moved to "Graduated" and their status becomes "Archived" to preserve history
    const graduated = await tx.student.updateMany({
      where: { currentYear: 'IV', status: 'Active' },
      data: { currentYear: 'Graduated', status: 'Archived' }
    });

    // 3. Promote III Year -> IV Year
    const year4 = await tx.student.updateMany({
      where: { currentYear: 'III', status: 'Active' },
      data: { currentYear: 'IV' }
    });

    // 4. Promote II Year -> III Year
    const year3 = await tx.student.updateMany({
      where: { currentYear: 'II', status: 'Active' },
      data: { currentYear: 'III' }
    });

    // 5. Promote I Year -> II Year
    const year2 = await tx.student.updateMany({
      where: { currentYear: 'I', status: 'Active' },
      data: { currentYear: 'II' }
    });

    // Note: The 'I' year slot is now empty and ready for the Dean to import the new incoming batch.

    // 6. Log the completion and results
    const results = {
      graduated: graduated.count,
      promotedTo4: year4.count,
      promotedTo3: year3.count,
      promotedTo2: year2.count
    };

    await tx.auditLog.create({
      data: {
        adminId,
        action: 'ACADEMIC_ROLLOVER_COMPLETED',
        entity: 'System',
        metadata: JSON.stringify(results)
      }
    });

    return results;
  });
}