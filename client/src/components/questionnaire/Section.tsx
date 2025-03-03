import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import type { InsertResponse } from "@shared/schema";

interface SectionProps {
  section: {
    id: string;
    title: string;
    titlePatois: string;
    fields: Array<{
      key: string;
      label: string;
      labelPatois: string;
    }>;
  };
  language: "en" | "patois";
  form: UseFormReturn<InsertResponse>;
}

export function Section({ section, language, form }: SectionProps) {
  return (
    <Card className="border-2 border-[#FED100]">
      <CardHeader className="bg-[#009B3A] text-white">
        <h2 className="text-2xl font-bold">
          {language === "en" ? section.title : section.titlePatois}
        </h2>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {section.fields.map((field) => (
          <FormField
            key={field.key}
            control={form.control}
            name={`${section.id}.${field.key}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">
                  {language === "en" ? field.label : field.labelPatois}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-[100px]"
                    placeholder={language === "en" ? "Share your story..." : "Tell wi bout it..."}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}
