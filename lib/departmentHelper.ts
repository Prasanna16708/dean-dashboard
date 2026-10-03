import prisma from '@/lib/prisma';

export function normalizeDeptName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\band\b/g, '')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Common aliases for college departments
const DEPT_ALIASES: Record<string, string[]> = {
  'Computer Science Engineering': [
    'cse', 'cs', 'computerscience', 'computerscienceandengineering', 'computerscienceengineering', 'be cse', 'btech cse'
  ],
  'Information Technology': [
    'it', 'infotech', 'informationtechnology', 'informationtech', 'btech it'
  ],
  'Artificial Intelligence and Data Science': [
    'aids', 'ai', 'ai ds', 'aids', 'artificialintelligence', 'artificialintelligenceanddatascience', 'datascience', 'btech aids'
  ],
  'Electronic Communication Engineering': [
    'ece', 'electronics', 'electronicandcommunicationengineering', 'electronicsandcommunicationengineering', 'electroniccommunicationengineering', 'be ece'
  ],
  'Electrical and Electronics Engineering': [
    'eee', 'electrical', 'electricalandelectronicsengineering', 'electricalelectronicsengineering', 'be eee'
  ],
  'Mechanical and Civil Engineering': [
    'mech', 'civil', 'mechanical', 'mechanicalandcivilengineering', 'mechanicalcivilengineering', 'be mech', 'be civil'
  ],
  'Biomedical Engineering': [
    'bme', 'biomed', 'biomedical', 'biomedicalengineering', 'be bme'
  ]
};

/**
 * Finds an existing department or creates one if not found.
 */
export async function findOrCreateDepartment(rawName: string, tx: any): Promise<string> {
  const cleanName = rawName.trim();
  if (!cleanName) return '';

  const normalizedInput = normalizeDeptName(cleanName);

  // Fetch all existing departments in DB
  const existingDepts: Array<{ id: string; name: string }> = await tx.department.findMany();

  // 1. Direct exact or normalized match with existing DB departments
  for (const dept of existingDepts) {
    if (
      dept.name.toLowerCase().trim() === cleanName.toLowerCase() ||
      normalizeDeptName(dept.name) === normalizedInput
    ) {
      return dept.id;
    }
  }

  // 2. Check alias dictionary
  for (const [canonicalName, aliases] of Object.entries(DEPT_ALIASES)) {
    const normCanonical = normalizeDeptName(canonicalName);
    const normAliases = aliases.map(normalizeDeptName);

    if (normalizedInput === normCanonical || normAliases.includes(normalizedInput)) {
      // Find if canonical name already exists in DB
      const found = existingDepts.find(d => normalizeDeptName(d.name) === normCanonical);
      if (found) return found.id;

      // Otherwise create with clean canonical name
      const created = await tx.department.create({
        data: { name: canonicalName }
      });
      return created.id;
    }
  }

  // 3. If completely new, auto-create the department cleanly
  const created = await tx.department.create({
    data: { name: cleanName }
  });
  return created.id;
}
