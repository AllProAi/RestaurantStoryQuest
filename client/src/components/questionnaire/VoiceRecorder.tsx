import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/lib/openai';

interface VoiceRecorderProps {
  language: "en" | "patois";
  onTranscription: (text: string, audioUrl: string) => void;
}

interface Recording {
  url: string;
  transcription: string;
  isPlaying: boolean;
}

export function VoiceRecorder({ language, onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showRestartButton, setShowRestartButton] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioElements = useRef<HTMLAudioElement[]>([]);

  const uploadAudio = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload audio');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  };

  const startRecording = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRestartButton(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 2,
          sampleRate: 48000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });

          // Upload the audio file and get a permanent URL
          const permanentUrl = await uploadAudio(audioBlob);
          console.log('Audio uploaded, permanent URL:', permanentUrl);

          // Get transcription
          const transcribedText = await transcribeAudio(audioBlob);
          console.log('Received transcription:', transcribedText);

          if (transcribedText) {
            setRecordings(prev => [...prev, {
              url: permanentUrl,
              transcription: transcribedText,
              isPlaying: false
            }]);

            // Pass both transcription and permanent URL to parent
            onTranscription(transcribedText, permanentUrl);

            toast({
              title: language === "en" ? "Recording transcribed" : "Recording done",
              description: language === "en" ? 
                "Your story has been transcribed" : 
                "Yu story write out now",
            });
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          toast({
            title: language === "en" ? "Recording failed" : "Recording nuh work",
            description: language === "en" ? 
              "Please try recording again" : 
              "Try record it one more time",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
          setShowRestartButton(true);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: language === "en" ? "Microphone access denied" : "Mic nuh work",
        description: language === "en" ? 
          "Please allow microphone access to record your story" : 
          "Yu haffi let wi use di mic fi record yu story",
        variant: "destructive",
      });
    }
  };

  const stopRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setShowRestartButton(true); // Show restart button immediately after stopping
    }
  };

  const togglePlayback = (index: number) => {
    if (!audioElements.current[index]) return;

    const audio = audioElements.current[index];
    const isCurrentlyPlaying = !audio.paused;

    // Pause all other recordings
    audioElements.current.forEach((otherAudio, i) => {
      if (i !== index && !otherAudio.paused) {
        otherAudio.pause();
        setRecordings(prev => prev.map((rec, idx) => 
          idx === i ? { ...rec, isPlaying: false } : rec
        ));
      }
    });

    // Toggle current recording
    if (isCurrentlyPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setRecordings(prev => prev.map((rec, idx) => 
      idx === index ? { ...rec, isPlaying: !isCurrentlyPlaying } : rec
    ));
  };

  const restartRecording = () => {
    setIsRecording(false);
    setShowRestartButton(false);
    startRecording(new MouseEvent('click'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex-1 w-full text-center sm:text-left">
          <p className="font-medium text-amber-800">
            {language === "en" ? "Record in English" : "Record in Patois"}
          </p>
          <p className="text-sm text-amber-600 mt-1">
            {isRecording ? "Recording in progress..." : recordings.length > 0 ? "Recording complete!" : "Click to start recording"}
          </p>
        </div>

        <div className="flex gap-3">
          {!isRecording ? (
            <Button
              disabled={isProcessing}
              onClick={startRecording}
              className="h-14 w-14 sm:h-12 sm:w-12 rounded-full bg-red-500 hover:bg-red-600"
              aria-label="Start recording"
            >
              <Mic className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="h-14 w-14 sm:h-12 sm:w-12 rounded-full bg-gray-500 hover:bg-gray-600"
              aria-label="Stop recording"
            >
              <Square className="h-6 w-6" />
            </Button>
          )}

          {showRestartButton && (
            <Button
              variant="outline"
              onClick={restartRecording}
              className="h-14 w-14 sm:h-12 sm:w-12 rounded-full"
              aria-label="Restart recording"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-white/80 rounded-lg border">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mr-2" />
          <p className="text-amber-800">Processing your recording...</p>
        </div>
      )}

      <AnimatePresence>
        {recordings.map((recording, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-white rounded-lg border shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-2">Recording {index + 1}</p>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {recording.transcription || "Transcription not available"}
                </p>
              </div>
              
              <div className="flex gap-2 self-end sm:self-center mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 w-12 sm:h-10 sm:w-10 rounded-full"
                  onClick={() => togglePlayback(index)}
                  aria-label={recording.isPlaying ? "Pause" : "Play"}
                >
                  {recording.isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Hidden audio elements */}
      <div className="hidden">
        {recordings.map((_, index) => (
          <audio
            key={index}
            ref={(el) => {
              if (el) audioElements.current[index] = el;
            }}
            onEnded={() => {
              setRecordings(prev => prev.map((rec, idx) => 
                idx === index ? { ...rec, isPlaying: false } : rec
              ));
            }}
          />
        ))}
      </div>
    </div>
  );
}