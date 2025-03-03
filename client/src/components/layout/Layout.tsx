import { ReactNode } from "react";
import { motion } from "framer-motion";
import { SunIcon } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const headerVariants = {
  hidden: { y: -50, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export function Layout({ children }: LayoutProps) {
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-[#FFF5E1] to-[#FFE4B5]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header 
        className="bg-gradient-to-r from-[#009B3A] to-[#006400] text-white py-8 relative overflow-hidden"
        variants={headerVariants}
      >
        {/* Decorative elements */}
        <motion.div 
          className="absolute top-0 right-0 w-32 h-32 opacity-20"
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            easings: ["easeInOut"]
          }}
        >
          <SunIcon size={128} />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            className="text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-2 font-serif">
              Jamaican Restaurant Story
            </h1>
            <p className="text-lg md:text-xl text-yellow-200 font-light">
              Share Your Journey from Jamaica to Success
            </p>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      <motion.footer 
        className="bg-black text-white py-6 mt-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-yellow-200">Daniel Hill Novus | Nexum 2025</p>
          <p className="text-sm text-gray-400 mt-2">
            Preserving Your Culture, One Story at a Time
          </p>
        </div>
      </motion.footer>
    </motion.div>
  );
}