/**
 * Extract hashtags from post content
 * @param {string} content - Post content
 * @returns {Array} Array of hashtags without the # symbol
 */
export const extractHashtags = (content) => {
  if (!content) return [];
  
  // Regex để tìm hashtag (# theo sau bởi các chữ cái, số hoặc gạch dưới)
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Loại bỏ ký tự # và trả về mảng
  return matches.map(tag => tag.substring(1));
};

/**
 * Extract mentions from post content
 * @param {string} content - Post content
 * @returns {Array} Array of usernames without the @ symbol
 */
export const extractMentions = (content) => {
  if (!content) return [];
  
  // Regex để tìm mention (@ theo sau bởi các chữ cái, số hoặc gạch dưới)
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  
  if (!matches) return [];
  
  // Loại bỏ ký tự @ và trả về mảng
  return matches.map(mention => mention.substring(1));
};

/**
 * Format post content with linked hashtags and mentions
 * @param {string} content - Raw post content
 * @returns {string} HTML-formatted content with linked hashtags and mentions
 */
export const formatContent = (content) => {
  if (!content) return '';
  
  // Replace hashtags with linked versions
  let formatted = content.replace(/#(\w+)/g, '<a href="/tags/$1" class="hashtag">#$1</a>');
  
  // Replace mentions with linked versions
  formatted = formatted.replace(/@(\w+)/g, '<a href="/profiles/$1" class="mention">@$1</a>');
  
  return formatted;
};

/**
 * Truncate content to a specific length with ellipsis
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated content
 */
export const truncateContent = (content, maxLength = 100) => {
  if (!content || content.length <= maxLength) return content;
  
  return content.substring(0, maxLength) + '...';
}; 