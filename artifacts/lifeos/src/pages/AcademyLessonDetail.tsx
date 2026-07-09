import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Award, Clock, CheckCircle2 } from "lucide-react";
import { useLesson, useLessonProgress, useMarkLessonProgress } from "@/hooks/useAcademy";

function estimateReadingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function AcademyLessonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lessonId = id ? Number(id) : null;
  const { data: lesson, isLoading } = useLesson(lessonId);
  const { data: progress } = useLessonProgress();
  const markProgress = useMarkLessonProgress();

  const complete = lessonId !== null && progress?.some((p) => p.lessonId === lessonId && p.completed);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/academy")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Learn
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">This lesson could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lessonContent = lesson.content ?? "";
  const paragraphs = lessonContent.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const readingMinutes = estimateReadingMinutes(lessonContent);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Button variant="ghost" onClick={() => navigate("/academy")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Learn
      </Button>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lesson.topicName}</Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {readingMinutes} min read
          </span>
          {lesson.xpReward > 0 && (
            <Badge variant="outline" className="gap-1">
              <Award className="h-3 w-3" />
              {lesson.xpReward} XP
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-tight">{lesson.title}</h1>
      </div>

      {lesson.videoUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
          <iframe
            src={lesson.videoUrl}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="space-y-4 text-base leading-relaxed">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="pt-2">
        {complete ? (
          <Button variant="outline" className="gap-2" disabled>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Completed
          </Button>
        ) : (
          <Button
            className="gap-2"
            onClick={() => markProgress.mutate({ lessonId: lesson.id, completed: true })}
            disabled={markProgress.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Complete
          </Button>
        )}
      </div>
    </div>
  );
}
