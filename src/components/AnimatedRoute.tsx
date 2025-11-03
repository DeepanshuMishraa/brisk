import { ReactNode } from "react";
import { motion } from "motion/react";

interface AnimatedRouteProps {
  children: ReactNode;
}

export function AnimatedRoute({ children }: AnimatedRouteProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
