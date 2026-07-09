import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, BookOpen, Award, CheckCircle2, Search, Sparkles, PlayCircle } from "lucide-react";
import { useTopics, useAllLessons, useTodayLesson, useLessonProgress } from "@/hooks/useAcademy";

export default function Academy() {
  const navigate = useNavigate();
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: allLessons, isLoading: lessonsLoading } = useAllLessons();
  const { data: todayLesson, isLoading: todayLoading } = useTodayLesson();
  const { data: progress } = useLessonProgress();

  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  const isLessonComplete = (lessonId: number) => progress?.some((p) => p.lessonId === lessonId && p.completed);

  const filteredLessons = useMemo(() => {
    if (!allLessons) return [];
    return allLessons.filter((lesson) => {
      const matchesTopic = topicFilter === "all" || String(lesson.topicId) === topicFilter;
      const matchesSearch =
        search.trim() === "" ||
        lesson.title.toLowerCase().includes(search.toLowerCase()) ||
        lesson.topicName.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [allLessons, topicFilter, search]);

  const groupedByTopic = useMemo(() => {
    const groups = new Map<number, { topicId: number; topicName: string; lessons: typeof filteredLessons }>();
    for (const lesson of filteredLessons) {
      if (!groups.has(lesson.topicId)) {
        groups.set(lesson.topicId, { topicId: lesson.topicId, topicName: lesson.topicName, lessons: [] });
      }
      groups.get(lesson.topicId)!.lessons.push(lesson);
    }
    return Array.from(groups.values()).sort((a, b) => a.topicName.localeCompare(b.topicName));
  }, [filteredLessons]);

  const totalLessons = allLessons?.length ?? 0;
  const completedLessons = allLessons?.filter((l) => isLessonComplete(l.id)).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <GraduationCap className="h-9 w-9 text-purple-600" />
          Learn
        </h1>
        <p className="text-muted-foreground text-lg">
          {totalLessons > 0
            ? `${completedLessons} of ${totalLessons} lessons complete`
            : "Learn at your own pace"}
        </p>
      </div>

      {todayLoading ? (
        <Skeleton className="h-40" />
      ) : todayLesson ? (
        <Card
          className="cursor-pointer border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:border-purple-400 transition-colors"
          onClick={() => navigate(`/academy/lessons/${todayLesson.id}`)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
              <Sparkles className="h-4 w-4" />
              Today's Lesson
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-2">{todayLesson.topicName}</Badge>
                <h2 className="text-2xl font-bold">{todayLesson.title}</h2>
                <p className="text-base text-muted-foreground mt-2 line-clamp-2">
                  {todayLesson.content}
                </p>
              </div>
              <Button className="shrink-0" onClick={(e) => { e.stopPropagation(); navigate(`/academy/lessons/${todayLesson.id}`); }}>
                Start
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 mb-3" />
            <h3 className="text-lg font-medium mb-1">You're all caught up!</h3>
            <p className="text-muted-foreground">You've completed every lesson in the library.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {[...(topics ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map((topic) => (
              <SelectItem key={topic.id} value={String(topic.id)}>{topic.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {topicsLoading || lessonsLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : groupedByTopic.length > 0 ? (
        <div className="space-y-6">
          {groupedByTopic.map((group) => (
            <div key={group.topicId} className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                {group.topicName}
              </h3>
              <div className="space-y-2">
                {[...group.lessons].sort((a, b) => a.sortOrder - b.sortOrder).map((lesson) => {
                  const complete = isLessonComplete(lesson.id);
                  return (
                    <Card
                      key={lesson.id}
                      className={`cursor-pointer transition-colors hover:border-purple-300 ${complete ? "border-green-200 bg-green-50/50" : ""}`}
                      onClick={() => navigate(`/academy/lessons/${lesson.id}`)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        {complete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium truncate">{lesson.title}</h4>
                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.videoUrl && <PlayCircle className="h-4 w-4 text-purple-500" />}
                              {lesson.xpReward > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Award className="h-3 w-3" />
                                  {lesson.xpReward} XP
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No lessons match your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
