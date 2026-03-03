import { forwardRef } from "react";
import { motion } from "framer-motion";

const stats = [
  { value: "78%", label: "of dating-app users experience burnout", source: "Forbes Health 2025/26" },
  { value: "80%", label: "of women report dating fatigue", source: "Forbes Health 2025/26" },
  { value: "60–67%", label: "men on major platforms vs 33–40% women", source: "Industry data 2026" },
  { value: "5–9%", label: "right-swipe rate for women, vs 60–65% for men", source: "Hinge / Tinder analytics" },
];

const causes = [
  { pct: "41%", label: "Ghosting" },
  { pct: "35%", label: "Disappointment" },
  { pct: "24%", label: "Repetitive conversations" },
];

const StatsSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="py-24 md:py-32 bg-secondary/30">
      <div className="container max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-luxury uppercase text-primary/60 mb-4 block">
            The reality
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            The swipe economy is broken.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We built Verity because the numbers demanded something fundamentally different.
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg p-6 text-center"
            >
              <div className="font-serif text-3xl md:text-4xl text-gold-gradient mb-3">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {stat.label}
              </p>
              <p className="text-xs text-muted-foreground/50">{stat.source}</p>
            </motion.div>
          ))}
        </div>

        {/* Causes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-6 tracking-wide uppercase">
            Leading causes of dating fatigue
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {causes.map((c) => (
              <div key={c.label} className="flex items-baseline gap-2">
                <span className="font-serif text-2xl text-primary">{c.pct}</span>
                <span className="text-sm text-muted-foreground">{c.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
});

StatsSection.displayName = "StatsSection";

export default StatsSection;
