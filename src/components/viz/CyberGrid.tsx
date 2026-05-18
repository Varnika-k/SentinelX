import React from 'react';
import { motion } from 'motion/react';

export function CyberGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      {/* Base Grid */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 209, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 209, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Pulsing Grid Accents */}
      <motion.div 
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 209, 0.1) 2px, transparent 2px),
            linear-gradient(to bottom, rgba(0, 255, 209, 0.1) 2px, transparent 2px)
          `,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Moving Scanlines */}
      <motion.div 
        animate={{
          y: ['-100%', '100%']
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-accent-cyan/10 to-transparent opacity-20"
      />

      {/* Perspective Dots */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-full h-full grid grid-cols-12 grid-rows-12">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              <div className="w-0.5 h-0.5 rounded-full bg-accent-cyan/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
