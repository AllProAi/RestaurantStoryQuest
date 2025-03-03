import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertResponseSchema, type InsertResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceRecorder } from "./VoiceRecorder";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";

export function QuestionnaireForm() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const initialQuestion = parseInt(queryParams.get('question') || '1');

  const [currentQuestionId, setCurrentQuestionId] = useState(initialQuestion);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [_, setLocation] = useLocation();

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
  });

  // Fetch existing response for current question
  const { data: currentResponse, isLoading: responseLoading } = useQuery({
    queryKey: ['/api/responses', currentQuestionId],
    enabled: !!currentQuestionId,
  });

  const form = useForm<InsertResponse>({
    resolver: zodResolver(insertResponseSchema),
    defaultValues: {
      questionId: currentQuestionId,
      textResponse: "",
      audioUrl: "",
      transcriptions: [],
    },
  });

  // Update form with existing response data when available
  useEffect(() => {
    if (currentResponse) {
      console.log('Loading existing response:', currentResponse);
      setTranscriptions(currentResponse.transcriptions || []);
      form.reset({
        questionId: currentQuestionId,
        textResponse: currentResponse.textResponse || "",
        audioUrl: currentResponse.audioUrl || "",
        transcriptions: currentResponse.transcriptions || [],
      });
    } else {
      setTranscriptions([]);
      form.reset({
        questionId: currentQuestionId,
        textResponse: "",
        audioUrl: "",
        transcriptions: [],
      });
    }
  }, [currentQuestionId, currentResponse, form]);

  const { mutate: saveResponse, isPending } = useMutation({
    mutationFn: async (data: InsertResponse) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Saving response data:', data);

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
      queryClient.invalidateQueries({ queryKey: ['/api/responses'] });
      toast({
        title: "Response Saved",
        description: "Your response has been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save response",
        variant: "destructive",
      });

      if (error instanceof Error && error.message.includes('token')) {
        setLocation('/login');
      }
    }
  });

  const handleTranscription = (text: string) => {
    console.log('Adding new transcription:', text);
    const newTranscriptions = [...transcriptions, text];
    setTranscriptions(newTranscriptions);
    form.setValue('transcriptions', newTranscriptions);
  };

  const handleSave = form.handleSubmit((data) => {
    console.log('Submitting form data:', {
      ...data,
      questionId: currentQuestionId,
      transcriptions,
    });

    saveResponse({
      ...data,
      questionId: currentQuestionId,
      transcriptions,
    });
  });

  if (questionsLoading || responseLoading) {
    return <div>Loading...</div>;
  }

  const currentQuestion = questions?.find(q => q.id === currentQuestionId);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            Question {currentQuestionId} of {questions?.length || 0}
          </h2>

          <p className="text-lg mb-6">{currentQuestion?.text}</p>

          <Form {...form}>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <label className="font-medium">Your Response:</label>
                <Textarea
                  {...form.register('textResponse')}
                  placeholder="Type your answer here..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-4">
                <label className="font-medium">Record Your Answer:</label>
                <VoiceRecorder
                  language="en"
                  onTranscription={handleTranscription}
                />

                {/* Display all transcriptions */}
                {transcriptions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium">Transcriptions:</h3>
                    <div className="space-y-2">
                      {transcriptions.map((text, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-500">Recording {index + 1}:</span>
                          <p className="mt-1 text-gray-700">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentQuestionId(id => Math.max(1, id - 1))}
                  disabled={currentQuestionId === 1}
                >
                  Previous
                </Button>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save Response"}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setCurrentQuestionId(id => Math.min(questions?.length || 8, id + 1))}
                    disabled={currentQuestionId === (questions?.length || 8)}
                  >
                    Next Question
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/dashboard')}
                  >
                    View All Responses
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}