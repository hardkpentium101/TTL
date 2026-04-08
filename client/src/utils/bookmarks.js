/**
 * Bookmark utility functions for managing lesson bookmarks
 * Stores bookmarks in localStorage
 */

const BOOKMARKS_KEY = 'text_to_learn_bookmarks';

/**
 * Get all bookmarks from localStorage
 * @returns {Array} Array of bookmark objects
 */
export const getBookmarks = () => {
  try {
    const bookmarks = localStorage.getItem(BOOKMARKS_KEY);
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch (error) {
    console.error('Failed to parse bookmarks:', error);
    return [];
  }
};

/**
 * Save bookmarks to localStorage
 * @param {Array} bookmarks - Array of bookmark objects
 */
export const saveBookmarks = (bookmarks) => {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
  }
};

/**
 * Add a bookmark
 * @param {Object} bookmark - Bookmark object
 * @param {string} bookmark.id - Unique identifier for the lesson
 * @param {string} bookmark.lessonTitle - Title of the lesson
 * @param {string} bookmark.courseTitle - Title of the course
 * @param {string} bookmark.moduleTitle - Title of the module
 * @param {string} bookmark.courseId - ID of the course
 * @param {number} bookmark.moduleIndex - Index of the module
 * @param {number} bookmark.lessonIndex - Index of the lesson
 */
export const addBookmark = (bookmark) => {
  const bookmarks = getBookmarks();
  
  // Check if already bookmarked
  const exists = bookmarks.some(b => b.id === bookmark.id);
  if (exists) {
    return false;
  }

  const newBookmark = {
    ...bookmark,
    timestamp: Date.now(),
  };

  const updatedBookmarks = [newBookmark, ...bookmarks];
  saveBookmarks(updatedBookmarks);
  return true;
};

/**
 * Remove a bookmark by ID
 * @param {string} id - Bookmark ID to remove
 * @returns {boolean} True if removed, false if not found
 */
export const removeBookmark = (id) => {
  const bookmarks = getBookmarks();
  const filteredBookmarks = bookmarks.filter(b => b.id !== id);
  
  if (filteredBookmarks.length === bookmarks.length) {
    return false; // Not found
  }

  saveBookmarks(filteredBookmarks);
  return true;
};

/**
 * Check if a lesson is bookmarked
 * @param {string} id - Lesson ID to check
 * @returns {boolean} True if bookmarked
 */
export const isBookmarked = (id) => {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.id === id);
};

/**
 * Get bookmarks for a specific course
 * @param {string} courseId - Course ID
 * @returns {Array} Array of bookmark objects for the course
 */
export const getBookmarksByCourse = (courseId) => {
  const bookmarks = getBookmarks();
  return bookmarks.filter(b => b.courseId === courseId);
};

/**
 * Clear all bookmarks
 */
export const clearAllBookmarks = () => {
  localStorage.removeItem(BOOKMARKS_KEY);
};

/**
 * Toggle bookmark status for a lesson
 * @param {Object} bookmark - Bookmark object
 * @returns {boolean} True if added, false if removed
 */
export const toggleBookmark = (bookmark) => {
  if (isBookmarked(bookmark.id)) {
    removeBookmark(bookmark.id);
    return false;
  } else {
    addBookmark(bookmark);
    return true;
  }
};
