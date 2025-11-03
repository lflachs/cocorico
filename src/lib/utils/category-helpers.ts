/**
 * Category utility functions for hierarchical filtering
 */

type Category = {
  id: string;
  parentId?: string | null;
  children?: Category[];
};

/**
 * Get all descendant category IDs (children, grandchildren, etc.)
 * @param categoryId - The parent category ID
 * @param categories - Flat or hierarchical list of categories
 * @returns Array of all descendant category IDs including the parent
 */
export function getAllDescendantCategoryIds(
  categoryId: string,
  categories: Category[]
): string[] {
  const result = new Set<string>([categoryId]); // Include the parent itself

  // Recursive function to collect all descendants
  const collectDescendants = (parentId: string) => {
    const children = categories.filter((cat) => cat.parentId === parentId);

    for (const child of children) {
      result.add(child.id);
      // Check if this child has children in its children property (hierarchical structure)
      if (child.children && child.children.length > 0) {
        child.children.forEach((grandchild) => {
          result.add(grandchild.id);
          collectDescendants(grandchild.id);
        });
      } else {
        // Recursively check for descendants in flat structure
        collectDescendants(child.id);
      }
    }
  };

  collectDescendants(categoryId);

  return Array.from(result);
}

/**
 * Flatten a hierarchical category tree into a flat array
 * @param categories - Hierarchical category tree
 * @returns Flat array of all categories
 */
export function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = [];

  const flatten = (cats: Category[]) => {
    for (const cat of cats) {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children);
      }
    }
  };

  flatten(categories);
  return result;
}
