import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import type { InsertResponse } from "@shared/schema";
import { CULTURAL_PROVERBS } from "@/lib/constants";

interface SectionProps {
  section: {
    id: string;
    title: string;
    titlePatois: string;
    fields: Array<{
      key: string;
      label: string;
      labelPatois: string;
      prompt: string;
    }>;
  };
  language: "en" | "patois";
  form: UseFormReturn<InsertResponse>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100
    }
  },
  exit: { 
    opacity: 0,
    y: -50,
    transition: { duration: 0.2 }
  }
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      type: "spring",
      damping: 25,
      stiffness: 120
    }
  })
};

export function Section({ section, language, form }: SectionProps) {
  const randomProverb = CULTURAL_PROVERBS[Math.floor(Math.random() * CULTURAL_PROVERBS.length)];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section.id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <Card className="border-2 border-[#FED100] overflow-hidden transform hover:scale-[1.01] transition-transform duration-200">
          <CardHeader className="bg-gradient-to-r from-[#009B3A] to-[#006400] text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-2">
                {language === "en" ? section.title : section.titlePatois}
              </h2>
              <p className="text-sm text-yellow-200 italic">
                {randomProverb}
              </p>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 bg-gradient-to-b from-white to-[#FFF5E1]">
            {section.fields.map((field, index) => (
              <motion.div
                key={field.key}
                variants={fieldVariants}
                custom={index}
                initial="hidden"
                animate="visible"
              >
                <FormField
                  control={form.control}
                  name={`${section.id.replace("-", "")}['${field.key}']`}
                  render={({ field: formField }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-lg font-semibold text-[#006400]">
                        {language === "en" ? field.label : field.labelPatois}
                      </FormLabel>
                      <motion.p 
                        className="text-sm text-gray-600 italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        {field.prompt}
                      </motion.p>
                      <FormControl>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Textarea
                            {...formField}
                            className="min-h-[100px] border-2 border-[#009B3A] focus:border-[#FED100] transition-colors duration-200"
                            placeholder={
                              language === "en"
                                ? "Share your story..."
                                : "Tell wi bout it..."
                            }
                          />
                        </motion.div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}