import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -4, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      className="flex gap-1.5 p-2"
      aria-label="Bot is typing"
    >
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      />
    </motion.div>
  );
};

export default LoadingSpinner;