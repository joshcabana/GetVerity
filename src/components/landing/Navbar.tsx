import { useState, useEffect, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import VerityLogo from "@/components/VerityLogo";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = forwardRef<HTMLElement>((_, ref) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <VerityLogo className="h-7 w-auto" linkTo="/" />
        <div className="flex items-center gap-4">
          <a
            href="#how-it-works"
            className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <ThemeToggle />
          <Link to="/auth">
            <Button variant="gold-outline" size="sm">
              Get verified
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
