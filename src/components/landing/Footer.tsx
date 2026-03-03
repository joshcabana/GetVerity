import { forwardRef } from "react";
import { Link } from "react-router-dom";
import VerityLogo from "@/components/VerityLogo";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="border-t border-border py-12">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <VerityLogo className="h-6 w-auto" linkTo="/" />
            <span className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/transparency" className="hover:text-foreground transition-colors">
              Transparency
            </Link>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <Link to="/transparency" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/auth" className="hover:text-primary transition-colors">
              Get verified
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
