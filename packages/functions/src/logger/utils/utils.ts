/**
 * Splits an array into two arrays based on a predicate function.
 *
 * @param {Array} arr - The array to be split.
 * @param {Function} predicate - A function that takes an element and returns a boolean.
 * @returns {Array[]} An array with two sub-arrays: the first containing elements that satisfy the predicate, the second containing elements that don't.
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5];
 * const isEven = (n) => n % 2 === 0;
 * const [evens, odds] = splitByPredicate(numbers, isEven);
 * console.log(evens); // [2, 4]
 * console.log(odds);  // [1, 3, 5]
 */
export function splitByPredicate<T>(
  arr: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  return arr.reduce<[T[], T[]]>(
    (acc, item) => {
      if (predicate(item)) {
        acc[0].push(item); // Push to first array if predicate is true
      } else {
        acc[1].push(item); // Push to second array if predicate is false
      }
      return acc;
    },
    [[], []] // Initialize two empty arrays: one for true results, one for false results
  );
}
