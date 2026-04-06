"use client";
import { motion } from 'framer-motion';

const variants = {
  hidden: { 
    opacity: 0, 
    x: '100vw', 
    scale: 0.95,
    filter: 'blur(5px)',
    boxShadow: '-100px 0 100px rgba(0,0,0,0.5)'
  },
  enter: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    filter: 'blur(0)',
    boxShadow: '0 0 0 rgba(0,0,0,0)'
  },
  exit: { 
    opacity: 0, 
    x: '-20vw', 
    scale: 0.98,
    filter: 'blur(2px)'
  },
};

export default function Template({ children }) {
  return (
    <motion.main
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.8 }}
      className="w-full h-full bg-cream relative z-10"
      style={{ transformOrigin: 'top left' }}
    >
      {children}
    </motion.main>
  );
}
