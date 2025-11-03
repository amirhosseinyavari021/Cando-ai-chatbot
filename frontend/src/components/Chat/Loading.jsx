import React from 'react';

const Loading = () => {
  return (
    <div className="flex justify-start">
      {/* FIX: استفاده از رنگ‌های با کنتراست بالاتر */}
      <div className="p-4 rounded-lg max-w-lg bg-gray-200 dark:bg-dark-card">
        <div className="animate-pulse space-y-3">
          {/* FIX: ریتم منطقی‌تر و کنتراست بهتر برای میله‌ها */}
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;