
import React from 'react';

export const renderWithMentions = (text: string, onMentionClick: (username: string) => void) => {
  if (!text) return null;

  const parts = text.split(/(@\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <span
          key={index}
          className="text-indigo-400 font-black cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onMentionClick(username);
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};
