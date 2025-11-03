import React from 'react';

const TopNotice = () => {
  return (
    <div
      className="text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded-t-lg"
      style={{ direction: 'rtl' }} // Ensure Farsi text displays correctly
    >
      💬 If you are an international user, you can also chat in English 🇬🇧
    </div>
  );
};

export default TopNotice;