import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertResponseSchema, type InsertResponse, type Response, type Question } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceRecorder } from "./VoiceRecorder";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import { Trash2, Play, Pause } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecordingEntry {
  audioUrl: string;
  transcription: string;
}

export function QuestionnaireForm() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const initialQuestion = parseInt(queryParams.get('question') || '1');

  const [currentQuestionId, setCurrentQuestionId] = useState(initialQuestion);
  const [recordingsByQuestion, setRecordingsByQuestion] = useState<Record<number, RecordingEntry[]>>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [_, setLocation] = useLocation();

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  // Fetch user responses
  const { data: userResponses = [], isLoading: responsesLoading } = useQuery<Response[]>({
    queryKey: ['/api/user/responses'],
    onSuccess: (data) => {
      console.log('Fetched responses:', data);
      // Initialize recordings for all existing responses
      const recordings: Record<number, RecordingEntry[]> = {};

      data.forEach(response => {
        if (response.transcriptions && response.transcriptions.length > 0) {
          recordings[response.questionId] = response.transcriptions.map((text, index) => ({
            transcription: text,
            audioUrl: response.audioUrl || ''
          }));
        }
      });

      console.log('Setting recordings state:', recordings);
      setRecordingsByQuestion(recordings);
    }
  });

  // Find current response
  const currentResponse = userResponses.find(r => r.questionId === currentQuestionId);

  const form = useForm<InsertResponse>({
    resolver: zodResolver(insertResponseSchema),
    defaultValues: {
      questionId: currentQuestionId,
      textResponse: currentResponse?.textResponse || "",
      audioUrl: currentResponse?.audioUrl || "",
      transcriptions: currentResponse?.transcriptions || [],
    },
  });

  // Effect to handle response changes when switching questions
  useEffect(() => {
    if (currentResponse) {
      console.log('Loading response for question:', currentQuestionId, currentResponse);
      form.reset({
        questionId: currentQuestionId,
        textResponse: currentResponse.textResponse || "",
        audioUrl: currentResponse.audioUrl || "",
        transcriptions: currentResponse.transcriptions || [],
      });

      // Update recordings in state
      if (currentResponse.transcriptions && currentResponse.transcriptions.length > 0) {
        setRecordingsByQuestion(prev => ({
          ...prev,
          [currentQuestionId]: currentResponse.transcriptions.map(text => ({
            transcription: text,
            audioUrl: currentResponse.audioUrl || ''
          }))
        }));
      }
    }
  }, [currentQuestionId, currentResponse, form]);

  const handlePlayAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      const audio = document.getElementById(audioUrl) as HTMLAudioElement;
      audio?.pause();
    } else {
      if (playingAudio) {
        const currentAudio = document.getElementById(playingAudio) as HTMLAudioElement;
        currentAudio?.pause();
      }
      setPlayingAudio(audioUrl);
      const audio = document.getElementById(audioUrl) as HTMLAudioElement;
      audio?.play();
    }
  };

  const { mutate: saveResponse, isPending } = useMutation({
    mutationFn: async (data: InsertResponse & { redirectToDashboard?: boolean }) => {
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
        body: JSON.stringify({
          ...data,
          audioUrl: (recordingsByQuestion[data.questionId] || [])[0]?.audioUrl,
          transcriptions: (recordingsByQuestion[data.questionId] || []).map(r => r.transcription),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save response');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/responses'] });
      toast({
        title: "Response Saved",
        description: "Your response has been saved successfully",
      });

      if (variables.redirectToDashboard) {
        setLocation('/dashboard');
      }
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

  const handleTranscription = (text: string, audioUrl: string) => {
    console.log('New transcription:', text, 'for question:', currentQuestionId);
    console.log('New audio URL:', audioUrl);

    const newRecording = { transcription: text, audioUrl };
    const currentRecordings = recordingsByQuestion[currentQuestionId] || [];
    const updatedRecordings = [...currentRecordings, newRecording];

    setRecordingsByQuestion(prev => ({
      ...prev,
      [currentQuestionId]: updatedRecordings
    }));

    form.setValue('transcriptions', updatedRecordings.map(r => r.transcription));
    form.setValue('audioUrl', audioUrl);
  };

  const handleDeleteTranscription = (indexToDelete: number) => {
    const currentRecordings = recordingsByQuestion[currentQuestionId] || [];
    const newRecordings = currentRecordings.filter((_, index) => index !== indexToDelete);

    setRecordingsByQuestion(prev => ({
      ...prev,
      [currentQuestionId]: newRecordings
    }));

    // Update form values
    form.setValue('transcriptions', newRecordings.map(r => r.transcription));
    if (newRecordings.length === 0) {
      form.setValue('audioUrl', '');
    }

    toast({
      title: "Transcription Deleted",
      description: "Recording and transcription have been removed",
    });
  };

  const handleSave = form.handleSubmit((data) => {
    const dataToSave = {
      ...data,
      questionId: currentQuestionId,
      redirectToDashboard: true
    };

    console.log('Submitting form data:', dataToSave);
    saveResponse(dataToSave);
  });

  const handleNextQuestion = async () => {
    const data = form.getValues();
    // Save current response without redirecting
    await saveResponse({
      ...data,
      questionId: currentQuestionId,
      redirectToDashboard: false
    });

    // Move to next question
    const nextQuestionId = Math.min(questions.length || 8, currentQuestionId + 1);
    setCurrentQuestionId(nextQuestionId);

    // Reset form for next question only if there's no existing response
    const nextResponse = userResponses.find(r => r.questionId === nextQuestionId);
    form.reset({
      questionId: nextQuestionId,
      textResponse: nextResponse?.textResponse || "",
      audioUrl: nextResponse?.audioUrl || "",
      transcriptions: nextResponse?.transcriptions || [],
    });
  };

  if (questionsLoading || responsesLoading) {
    return <div>Loading...</div>;
  }

  const currentQuestion = questions.find(q => q.id === currentQuestionId);
  const hasRecordings = (recordingsByQuestion[currentQuestionId] || []).length > 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            Question {currentQuestionId} of {questions.length || 0}
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

                {/* Show transcription box if there are recordings */}
                {hasRecordings && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium">Transcriptions:</h3>
                    <div className="space-y-2">
                      {(recordingsByQuestion[currentQuestionId] || []).map((recording, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded flex justify-between items-start">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Recording {index + 1}:</span>
                            <p className="mt-1 text-gray-700">{recording.transcription}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayAudio(recording.audioUrl)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {playingAudio === recording.audioUrl ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Recording</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this recording and its transcription? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTranscription(index)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          <audio 
                            id={recording.audioUrl}
                            src={recording.audioUrl}
                            className="hidden"
                            onEnded={() => setPlayingAudio(null)}
                          />
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
                    onClick={handleNextQuestion}
                    disabled={currentQuestionId === (questions.length || 8)}
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