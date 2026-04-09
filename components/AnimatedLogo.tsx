'use client';

import { motion, Variants } from 'motion/react';

const letterVariants: Variants = {
  hidden: { opacity: 0, scale: 3, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: 'easeOut' }
  }
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

export function AnimatedLogo({ 
  width = 254, 
  height = 32, 
  className = '', 
  onComplete 
}: { 
  width?: number | string, 
  height?: number | string, 
  className?: string, 
  onComplete?: () => void 
}) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 508.56 64"
      width={width}
      height={height}
      className={className}
      fill="#A61717"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onAnimationComplete={(definition) => {
        if (definition === 'visible') {
          onComplete?.();
        }
      }}
    >
      {/* G */}
      <motion.g variants={letterVariants} style={{ transformOrigin: '9% 50%' }}>
        <path d="M471.51,392l5.82-16H519.9l-10.73,29.47a16,16,0,0,1-15,10.53H428.72l19.46-53.47a16,16,0,0,1,15-10.53h65.42l-5.83,16H471.73l-11.65,32h25.54l2.92-8Z" transform="translate(-428.72 -352)"/>
      </motion.g>
      {/* A */}
      <motion.g variants={letterVariants} style={{ transformOrigin: '25% 50%' }}>
        <path d="M533.32,362.53,513.85,416h25.54l5.83-16h25.54l-5.82,16h25.54l23.29-64H548.35A16,16,0,0,0,533.32,362.53ZM576.58,384H551l5.83-16h25.54Z" transform="translate(-428.72 -352)"/>
      </motion.g>
      {/* L */}
      <motion.g variants={letterVariants} style={{ transformOrigin: '38% 50%' }}>
        <polygon points="170.27 64 193.56 0 219.1 0 195.81 64 170.27 64"/>
      </motion.g>
      {/* L */}
      <motion.g variants={letterVariants} style={{ transformOrigin: '45% 50%' }}>
        <polygon points="204.32 64 227.62 0 253.16 0 229.86 64 204.32 64"/>
      </motion.g>
      {/* E */}
      <motion.g variants={letterVariants} style={{ transformOrigin: '56% 50%' }}>
        <polyline points="338.29 0 332.47 16 281.39 16 278.48 24 321.04 24 315.22 40 272.65 40 269.74 48 320.82 48 315 64 238.38 64 261.67 0"/>
      </motion.g>
      {/* R */}
      <motion.g variants={letterVariants} style={{ transformOrigin: '77% 50%' }}>
        <path d="M840.72,352h-65.2l-23.29,64h25.54l8.74-24H795l8.74,24h25.54l-8.74-24h5.85a16,16,0,0,0,15-10.53l6.82-18.73A8,8,0,0,0,840.72,352Zm-22.85,24H792.33l2.91-8h25.54Z" transform="translate(-428.72 -352)"/>
      </motion.g>
      {/* O */}
      <motion.g variants={letterVariants} style={{ transformOrigin: '93% 50%' }}>
        <path d="M856.83,362.53,837.36,416h65.42a16,16,0,0,0,15-10.53L937.28,352H871.86A16,16,0,0,0,856.83,362.53ZM894.27,400H868.73l11.65-32h25.54Z" transform="translate(-428.72 -352)"/>
      </motion.g>
    </motion.svg>
  );
}
