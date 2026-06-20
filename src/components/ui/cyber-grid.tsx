"use client";

import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

export function CyberGrid() {
  const [mounted, setMounted] = useState(false);
  
  // Track cursor position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Apply a smooth spring physics effect to the cursor tracking
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Dynamic radial gradients using the spring values
  const maskImage = useMotionTemplate`radial-gradient(600px circle at ${springX}px ${springY}px, black, transparent)`;
  const backgroundGlow = useMotionTemplate`radial-gradient(800px circle at ${springX}px ${springY}px, rgba(0, 242, 254, 0.08), transparent 50%)`;

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) {
    // Fallback base background before hydration to prevent mismatch
    return <div className="fixed inset-0 bg-[#030303] -z-50 pointer-events-none" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-[#030303]">
      
      {/* 
        Base static Cyan Grid 
        Fades out toward the bottom via a static mask
      */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00f2fe 1px, transparent 1px),
            linear-gradient(to bottom, #00f2fe 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to bottom, black 20%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 100%)"
        }}
      />

      {/* 
        Interactive Neon Fuchsia Grid
        Revealed dynamically as the cursor moves over it
      */}
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, #f355da 1px, transparent 1px),
            linear-gradient(to bottom, #f355da 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage,
          WebkitMaskImage: maskImage
        }}
      />

      {/* 
        Soft Ambient Follow-Glow 
        Tracks the cursor and provides a subtle cyan illumination bloom
      */}
      <motion.div
        className="absolute inset-0 mix-blend-screen pointer-events-none"
        style={{
          background: backgroundGlow
        }}
      />
      
    </div>
  );
}
