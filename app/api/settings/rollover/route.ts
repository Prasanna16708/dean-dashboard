import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDatabaseBackup } from '@/lib/services/backupService';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Create Pre-Rollover Backup safely
    try {
      await createDatabaseBackup('Pre-Rollover');
    } catch (backupErr) {
      console.warn("Safety backup notice (proceeding with transaction):", backupErr);
    }

    // 2. Safe Cascade within a single database transaction
    const results = await prisma.$transaction(async (tx) => {
      // Step A: Graduate / Archive Year IV students
      const graduatedResult = await tx.student.updateMany({
        where: {
          currentYear: { in: ['IV', '4', 'IV Year', '4th Year', 'Fourth Year'] },
          status: 'Active'
        },
        data: {
          currentYear: 'Graduated',
          status: 'Archived'
        }
      });

      // Step B: Promote Year III -> Year IV
      const year4Result = await tx.student.updateMany({
        where: {
          currentYear: { in: ['III', '3', 'III Year', '3rd Year', 'Third Year'] },
          status: 'Active'
        },
        data: {
          currentYear: 'IV'
        }
      });

      // Step C: Promote Year II -> Year III
      const year3Result = await tx.student.updateMany({
        where: {
          currentYear: { in: ['II', '2', 'II Year', '2nd Year', 'Second Year'] },
          status: 'Active'
        },
        data: {
          currentYear: 'III'
        }
      });

      // Step D: Promote Year I -> Year II
      const year2Result = await tx.student.updateMany({
        where: {
          currentYear: { in: ['I', '1', 'I Year', '1st Year', 'First Year'] },
          status: 'Active'
        },
        data: {
          currentYear: 'II'
        }
      });

      const summary = {
        graduated: graduatedResult.count,
        promotedTo4: year4Result.count,
        promotedTo3: year3Result.count,
        promotedTo2: year2Result.count,
        totalAffected: graduatedResult.count + year4Result.count + year3Result.count + year2Result.count
      };

      // Step E: Create Audit Log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'ACADEMIC_ROLLOVER_COMPLETED',
          entity: 'System',
          metadata: JSON.stringify(summary)
        }
      });

      return summary;
    });

    return NextResponse.json({
      success: true,
      message: 'Academic Year Rollover executed successfully.',
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error("Academic Rollover Error:", error);
    return NextResponse.json({
      error: error.message || 'Internal Server Error occurred during rollover.'
    }, { status: 500 });
  }
}
