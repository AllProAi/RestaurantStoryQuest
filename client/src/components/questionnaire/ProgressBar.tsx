import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentSection: number;
  totalSections: number;
}

export function ProgressBar({ currentSection, totalSections }: ProgressBarProps) {
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="mb-8">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-center mt-2">
        Section {currentSection + 1} of {totalSections}
      </p>
    </div>
  );
}
