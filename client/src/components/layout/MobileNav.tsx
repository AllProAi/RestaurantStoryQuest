import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Home, BarChart2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-white/90 shadow-md rounded-full h-12 w-12"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-3/4 max-w-xs bg-white shadow-lg z-50 flex flex-col"
          >
            <div className="flex flex-col p-6 space-y-6 mt-16">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3 text-lg font-medium py-2">
                  <Home className="h-5 w-5" />
                  Home
                </div>
              </Link>

              {isLoggedIn && (
                <>
                  <Link href="/home" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-3 text-lg font-medium py-2">
                      <Home className="h-5 w-5" />
                      User Home
                    </div>
                  </Link>
                  
                  {isAdmin && (
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3 text-lg font-medium py-2">
                        <BarChart2 className="h-5 w-5" />
                        Dashboard
                      </div>
                    </Link>
                  )}
                </>
              )}

              {isLoggedIn ? (
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-3 mt-auto"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center justify-center gap-3 bg-[#009B3A] hover:bg-[#006400] text-white py-3 rounded-md text-lg font-medium mt-auto">
                    Login
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 