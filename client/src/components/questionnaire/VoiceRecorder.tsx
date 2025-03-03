import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  language: "en" | "patois";
}

export function VoiceRecorder({ onTranscription, language }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);

        try {
          // Create audio element to play back recording
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          // For now, we'll just add a placeholder text since we're not doing actual transcription
          onTranscription("[Audio Recording Placeholder - Local Processing to be Implemented]");

          toast({
            title: language === "en" ? "Recording saved" : "Recording done",
            description: language === "en" ? 
              "Your story has been recorded successfully" : 
              "Yu story recorded good",
          });
        } catch (error) {
          toast({
            title: language === "en" ? "Recording failed" : "Recording nuh work",
            description: language === "en" ? 
              "Please try recording again" : 
              "Try record it one more time",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: language === "en" ? "Microphone access denied" : "Mic nuh work",
        description: language === "en" ? 
          "Please allow microphone access to record your story" : 
          "Yu haffi let wi use di mic fi record yu story",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {!isRecording ? (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600"
            disabled={isProcessing}
          >
            <Mic className="w-4 h-4 mr-2" />
            {language === "en" ? "Record Your Story" : "Record Yu Story"}
          </Button>
        </motion.div>
      ) : (
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Button
            onClick={stopRecording}
            variant="destructive"
          >
            <Square className="w-4 h-4 mr-2" />
            {language === "en" ? "Stop Recording" : "Stop Di Recording"}
          </Button>
        </motion.div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {language === "en" ? "Processing..." : "Working pon it..."}
        </div>
      )}
    </div>
  );
}