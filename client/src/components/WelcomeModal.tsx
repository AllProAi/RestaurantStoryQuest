import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal if user hasn't seen it before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-600">
            Welcome to Our Universal Translator
          </DialogTitle>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <DialogDescription className="text-base leading-relaxed">
            <p className="mb-4">
              Much like the babel fish from The Hitchhiker's Guide to the Galaxy, 
              our transcription service breaks down language barriers across the universe.
            </p>
            <p className="mb-4">
              By seamlessly capturing and preserving bilingual narratives through 
              advanced media technologies, we're enhancing communication and understanding 
              between cultures.
            </p>
            <p className="italic text-sm text-green-600">
              Created and maintained by Daniel Hill
              <br />
              dba Novus | Nexum Labs
            </p>
          </DialogDescription>
          <div className="flex justify-end">
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              Begin Your Journey
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}