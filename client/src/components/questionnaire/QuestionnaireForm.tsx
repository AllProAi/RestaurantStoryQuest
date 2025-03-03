import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertResponseSchema, type InsertResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { SECTIONS } from "@/lib/constants";
import { Section } from "./Section";
import { ProgressBar } from "./ProgressBar";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function QuestionnaireForm() {
  const [currentSection, setCurrentSection] = useState(0);
  const [language, setLanguage] = useState<"en" | "patois">("en");
  const [_, setLocation] = useLocation();

  const form = useForm<InsertResponse>({
    resolver: zodResolver(insertResponseSchema),
    defaultValues: {
      language: "en",
      mediaUrls: [],
      personalJourney: {
        childhood: "",
        immigration: "",
        challenges: "",
        familyRecipes: "",
        influences: "",
        customs: "",
      },
      culinaryHeritage: {
        signatureDishes: "",
        ingredients: "",
        techniques: "",
        recipeEvolution: "",
        fusion: "",
        menuPhilosophy: "",
      },
      businessDevelopment: {
        inspiration: "",
        timeline: "",
        vision: "",
        challenges: "",
        achievements: "",
        aspirations: "",
      },
      communityConnections: {
        customers: "",
        localBusiness: "",
        events: "",
        economy: "",
        jamaicanCommunity: "",
      },
      visualPreferences: {
        colors: [],
        imagery: "",
        symbols: "",
        atmosphere: "",
        tone: "",
      },
    },
  });

  const { mutate: saveResponse, isPending } = useMutation({
    mutationFn: async (data: InsertResponse) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save response');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "en" ? "Progress Saved" : "Yu progress save up",
        description: language === "en" ? "Your responses have been saved" : "Wi keep yu answers safe",
      });
    },
    onError: (error) => {
      toast({
        title: language === "en" ? "Save Failed" : "Save nuh work",
        description: error instanceof Error ? error.message : "Failed to save responses",
        variant: "destructive",
      });

      // If token is invalid, redirect to login
      if (error instanceof Error && error.message.includes('token')) {
        setLocation('/login');
      }
    }
  });

  const handleSave = form.handleSubmit((data) => {
    console.log('Form data before save:', data);
    saveResponse({ 
      ...data,
      language,
      mediaUrls: data.mediaUrls || [],
    });
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="outline"
          onClick={() => setLanguage(lang => lang === "en" ? "patois" : "en")}
        >
          {language === "en" ? "Switch to Patois" : "Switch to English"}
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending 
            ? (language === "en" ? "Saving..." : "Saving...") 
            : (language === "en" ? "Save Progress" : "Save it up")
          }
        </Button>
      </div>

      <ProgressBar currentSection={currentSection} totalSections={SECTIONS.length} />

      <Form {...form}>
        <form onSubmit={handleSave} className="space-y-8">
          <Section
            section={SECTIONS[currentSection]}
            language={language}
            form={form}
          />

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentSection(c => Math.max(0, c - 1))}
              disabled={currentSection === 0}
            >
              {language === "en" ? "Previous" : "Go Back"}
            </Button>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/dashboard')}
              >
                {language === "en" ? "View Dashboard" : "Go to Dashboard"}
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentSection(c => Math.min(SECTIONS.length - 1, c + 1))}
                disabled={currentSection === SECTIONS.length - 1}
              >
                {language === "en" ? "Next" : "Next Piece"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}