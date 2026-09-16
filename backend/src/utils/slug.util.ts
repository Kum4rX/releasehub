import { Changelog } from '../models/changelog.model';

/**
 * Normalizes a string into a human-readable, URL-safe slug.
 */
export const slugify = (text: string): string => {
  const base = text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens

  return base || 'update';
};

/**
 * Generates a guaranteed unique slug for a changelog document.
 * If collisions exist in the database, appends an incrementing counter (-1, -2, etc.).
 *
 * @param title - The changelog title to slugify
 * @param excludeId - Optional MongoDB ID to exclude when updating an existing document
 */
export const generateUniqueSlug = async (
  title: string,
  excludeId?: string
): Promise<string> => {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Changelog.findOne(query).select('_id');
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};
