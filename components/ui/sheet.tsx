"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  snapPoints?: number[];
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "rounded-t-[28px]",
              "glass-elevated",
              "safe-bottom",
              className
            )}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {title && (
              <div className="px-6 pb-2 pt-1">
                <h3 className="text-[17px] font-semibold text-white/95 text-center">
                  {title}
                </h3>
              </div>
            )}

            <div className="px-4 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
