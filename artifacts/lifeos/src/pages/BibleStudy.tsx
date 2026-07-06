import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { useBibleVerses } from "@/hooks/useBible";

export default function BibleStudy() {
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const { data: allVerses, isLoading: allLoading } = useBibleVerses();
  const { data: verses, isLoading } = useBibleVerses(theme);

  const themes = useMemo(() => {
    const set = new Set<string>();
    allVerses?.forEach((v) => v.theme && set.add(v.theme));
    return Array.from(set).sort();
  }, [allVerses]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <BookOpen className="h-9 w-9 text-amber-600" />
          Bible & Stewardship
        </h1>
        <p className="text-muted-foreground text-lg">Scripture to guide your walk</p>
      </div>

      {!allLoading && themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant={theme === undefined ? "default" : "outline"} size="sm" onClick={() => setTheme(undefined)}>
            All
          </Button>
          {themes.map((t) => (
            <Button key={t} variant={theme === t ? "default" : "outline"} size="sm" onClick={() => setTheme(t)}>
              {t}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : verses && verses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {verses.map((verse) => (
            <Card key={verse.id}>
              <CardContent className="p-5 space-y-2">
                <p className="text-base italic leading-relaxed">&ldquo;{verse.verseText}&rdquo;</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-amber-700">{verse.reference} ({verse.translation})</span>
                  {verse.theme && <Badge variant="outline">{verse.theme}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No verses available for this theme yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
