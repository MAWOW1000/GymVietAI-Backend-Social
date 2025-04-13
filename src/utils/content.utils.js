/**
 * Extract hashtags from post content
 * @param {string} content - Post content
 * @returns {Array} Array of hashtags without the # symbol
 */
export const extractHashtags = (content) => {
  if (!content) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;
  
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1]);
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
};

/**
 * Extract mentions from post content
 * @param {string} content - Post content
 * @returns {Array} Array of usernames without the @ symbol
 */
export const extractMentions = (content) => {
  if (!content) return [];
  
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
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