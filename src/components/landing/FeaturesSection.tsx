import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Video, ShieldCheck, Brain, Compass, Calendar, Users } from "lucide-react";

const features = [
  {
    icon: Video,
    title: "45-Second Anonymous Video",
    description:
      "Two strangers, one fully anonymous live call. No profiles, no photos, no bios. Just real human connection in its purest form.",
  },
  {
    icon: ShieldCheck,
    title: "Mutual-Spark Privacy",
    description:
      "Both choose Spark or Pass independently. Only mutual sparks reveal identities. No rejection notifications — ever. Zero ego damage by design.",
  },
  {
    icon: Brain,
    title: "Live Safety Checks",
    description:
      "During live calls, Verity runs safety checks using transcript snippets (where browser support exists) and call metadata. No raw call video is stored.",
  },
  {
    icon: Compass,
    title: "Intention Over Addiction",
    description:
      "No infinite scroll. No streaks. No dopamine traps. Verity is designed to be used, not to trap you into using it.",
  },
  {
    icon: Calendar,
    title: "Scheduled Drops",
    description:
      "RSVP to themed, time-limited sessions. Night Owls, Tech Professionals, Creatives & Makers, Over 35, Introvert Hours — join the Drop that fits your energy.",
  },
  {
    icon: Users,
    title: "Friendfluence Drops",
    description:
      "Bring a friend to a Drop for shared courage and double the chances. Real connections are braver together.",
  },
];

const FeaturesSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} id="how-it-works" className="py-24 md:py-32">
      <div className="container max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-xs tracking-luxury uppercase text-primary/60 mb-4 block">
            The Verity experience
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground">
            Six pillars. Zero compromise.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group bg-card border border-border rounded-lg p-8 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_40px_hsl(43_72%_55%/0.06)]"
            >
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-500">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;
