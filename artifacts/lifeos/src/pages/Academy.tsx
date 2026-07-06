import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, ArrowLeft, BookOpen, Award } from "lucide-react";
import { useTopics, useLessons, useLessonProgress, useMarkLessonProgress } from "@/hooks/useAcademy";

export default function Academy() {
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const { data: lessons, isLoading: lessonsLoading } = useLessons(selectedTopicId);
  const { data: progress } = useLessonProgress();
  const markProgress = useMarkLessonProgress();

  const isLessonComplete = (lessonId: number) => progress?.some((p) => p.lessonId === lessonId && p.completed);
  const selectedTopic = topics?.find((t) => t.id === selectedTopicId);
  const completedCount = lessons?.filter((l) => isLessonComplete(l.id)).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <GraduationCap className="h-9 w-9 text-purple-600" />
          Academy
        </h1>
        <p className="text-muted-foreground text-lg">Learn at your own pace</p>
      </div>

      {selectedTopicId === null ? (
        topicsLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : topics && topics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[...topics].sort((a, b) => a.sortOrder - b.sortOrder).map((topic) => (
              <Card
                key={topic.id}
                className="cursor-pointer hover:border-purple-300 transition-colors"
                onClick={() => setSelectedTopicId(topic.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    {topic.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{topic.description || "No description"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No topics available yet</h3>
              <p className="text-muted-foreground">Check back soon for learning content.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTopicId(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedTopic?.name}</h2>
              {lessons && lessons.length > 0 && (
                <p className="text-sm text-muted-foreground">{completedCount} of {lessons.length} lessons complete</p>
              )}
            </div>
          </div>

          {lessonsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : lessons && lessons.length > 0 ? (
            <div className="space-y-3">
              {[...lessons].sort((a, b) => a.sortOrder - b.sortOrder).map((lesson) => {
                const complete = isLessonComplete(lesson.id);
                return (
                  <Card key={lesson.id} className={complete ? "border-green-200 bg-green-50/50" : ""}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Checkbox
                        checked={!!complete}
                        onCheckedChange={(checked) => markProgress.mutate({ lessonId: lesson.id, completed: !!checked })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{lesson.title}</h3>
                          {lesson.xpReward > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Award className="h-3 w-3" />
                              {lesson.xpReward} XP
                            </Badge>
                          )}
                        </div>
                        {lesson.content && <p className="text-sm text-muted-foreground mt-1">{lesson.content}</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No lessons in this topic yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
