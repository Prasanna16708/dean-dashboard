import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export const DEFAULT_PERIOD_TIMES = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:15 - 12:15',
  '12:15 - 01:15',
  '02:00 - 03:00',
  '03:00 - 04:00',
  '04:00 - 05:00',
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    if (staffId) {
      const timetable = await prisma.facultyTimetable.findFirst({
        where: { staffId },
        orderBy: { version: 'desc' },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              staffId: true,
              designation: true,
              department: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      if (!timetable) {
        return NextResponse.json({ timetable: null });
      }

      let parsedSchedule = null;
      if (timetable.scheduleData) {
        try {
          parsedSchedule = JSON.parse(timetable.scheduleData);
        } catch {
          parsedSchedule = null;
        }
      }

      return NextResponse.json({
        timetable: {
          ...timetable,
          parsedSchedule
        }
      });
    }

    // Otherwise return all active timetables
    const timetables = await prisma.facultyTimetable.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            staffId: true,
            department: { select: { id: true, name: true } }
          }
        }
      }
    });

    return NextResponse.json(timetables);
  } catch (error: any) {
    console.error('Error fetching timetable:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { staffId, periodTimes, schedule } = body;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Validate or use fallback for periodTimes (must be 7 items)
    const validPeriodTimes = Array.isArray(periodTimes) && periodTimes.length === 7
      ? periodTimes.map(t => String(t || '').trim())
      : DEFAULT_PERIOD_TIMES;

    // Validate 5 days schedule
    const sanitizedSchedule: Record<string, string[]> = {};
    for (const day of DAYS) {
      const daySlots = Array.isArray(schedule?.[day]) ? schedule[day] : [];
      sanitizedSchedule[day] = Array.from({ length: 7 }, (_, i) => String(daySlots[i] || '').trim());
    }

    const schedulePayload = {
      periodTimes: validPeriodTimes,
      schedule: sanitizedSchedule,
      updatedAt: new Date().toISOString()
    };

    const scheduleData = JSON.stringify(schedulePayload);

    const savedTimetable = await prisma.$transaction(async (tx) => {
      // Find existing latest timetable
      const existing = await tx.facultyTimetable.findFirst({
        where: { staffId },
        orderBy: { version: 'desc' }
      });

      let currentVersion = 1;
      let recordId = '';

      if (existing) {
        currentVersion = existing.version + 1;
        // Update existing active record or create next version
        const updated = await tx.facultyTimetable.update({
          where: { id: existing.id },
          data: {
            version: currentVersion,
            scheduleData,
            uploadedAt: new Date()
          }
        });
        recordId = updated.id;
      } else {
        const created = await tx.facultyTimetable.create({
          data: {
            staffId,
            version: 1,
            scheduleData,
            fileUrl: ''
          }
        });
        recordId = created.id;
      }

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'TIMETABLE_SAVED',
          entity: 'FacultyTimetable',
          entityId: recordId,
          metadata: JSON.stringify({ staffId, version: currentVersion })
        }
      });

      return { id: recordId, staffId, version: currentVersion, scheduleData };
    });

    return NextResponse.json({
      success: true,
      timetable: {
        ...savedTimetable,
        parsedSchedule: schedulePayload
      }
    });
  } catch (error: any) {
    console.error('Error saving timetable:', error);
    return NextResponse.json({ error: error.message || 'Failed to save timetable' }, { status: 500 });
  }
}
