"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ActionConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (isLoading) return; // Prevent closing while loading
      if (!open) onClose();
    }}>
      <AlertDialogContent className="bg-[#111111] border-white/10 rounded-[2rem] p-8 max-w-md animate-in fade-in zoom-in-95 duration-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-white tracking-tight">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400 mt-2 leading-relaxed text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-10 flex flex-col-reverse sm:flex-row gap-3">
          <AlertDialogCancel 
            onClick={(e) => {
              if (isLoading) e.preventDefault();
              else onClose();
            }}
            disabled={isLoading}
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 font-medium transition-all disabled:opacity-50"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (!isLoading) onConfirm();
            }}
            disabled={isLoading}
            className={cn(
              "flex-1 rounded-2xl h-14 font-bold text-white transition-all shadow-xl disabled:opacity-70",
              variant === "destructive" 
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" 
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </span>
            ) : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
