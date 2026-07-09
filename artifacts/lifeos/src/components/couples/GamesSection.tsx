import { useState } from "react";
import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2 } from "lucide-react";
import { useGames, useGameSessions, useStartGameSession, useGameSession, useSubmitGameResponse } from "@/hooks/useCouplesGames";
import { useQuiz } from "@/hooks/useAcademy";

interface QuestionOption {
  id: string;
  text: string;
}

export function GamesSection({ coupleId }: { coupleId: string }) {
  const { data: games, isLoading: gamesLoading } = useGames();
  const { data: sessions, isLoading: sessionsLoading } = useGameSessions(coupleId);
  const startSession = useStartGameSession(coupleId);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  function handleStart(gameId: number) {
    startSession.mutate(gameId, { onSuccess: (id) => setActiveSessionId(id) });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Couples Games
        </CardTitle>
        <CardDescription>Play together and earn XP for your team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gamesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {games?.map((game) => {
              const inProgress = sessions?.find((s) => s.gameId === game.id && s.status === "in_progress");
              return (
                <div key={game.id} className="rounded-lg border p-3 space-y-2">
                  <div className="font-semibold">{game.title}</div>
                  {game.description && <p className="text-xs text-muted-foreground">{game.description}</p>}
                  <Button
                    size="sm"
                    variant={inProgress ? "outline" : "default"}
                    onClick={() => (inProgress ? setActiveSessionId(inProgress.id) : handleStart(game.id))}
                    disabled={startSession.isPending}
                  >
                    {inProgress ? "Continue" : "Play"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Recent sessions</div>
          {sessionsLoading ? (
            <Skeleton className="h-10" />
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s) => {
                const game = games?.find((g) => g.id === s.gameId);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className="w-full flex items-center justify-between rounded-lg border p-2 text-left hover:bg-muted/50"
                  >
                    <span className="text-sm">{game?.title ?? `Game #${s.gameId}`}</span>
                    <Badge variant={s.status === "completed" ? "default" : "outline"}>{s.status}</Badge>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No games played yet.</p>
          )}
        </div>
      </CardContent>

      <Dialog open={!!activeSessionId} onOpenChange={(open) => !open && setActiveSessionId(null)}>
        <DialogContent className="max-w-lg">
          {activeSessionId && <GameSessionPlayer sessionId={activeSessionId} coupleId={coupleId} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function GameSessionPlayer({ sessionId, coupleId }: { sessionId: string; coupleId: string }) {
  const { user } = useUser();
  const { data, isLoading } = useGameSession(sessionId);
  const submit = useSubmitGameResponse(sessionId, coupleId);

  if (isLoading || !data) {
    return <Skeleton className="h-40" />;
  }

  const { session, game, responses } = data;
  const myResponses = responses.filter((r) => r.userId === user?.id);
  const myKeys = new Set(myResponses.map((r) => r.promptKey));

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{game.title}</DialogTitle>
        <DialogDescription>{game.description}</DialogDescription>
      </DialogHeader>

      {session.status === "completed" ? (
        <ResultSummary game={game} result={session.result} />
      ) : game.mechanicType === "simultaneous_reveal" ? (
        <SimultaneousReveal config={game.config as any} myKeys={myKeys} onSubmit={(promptKey, response) => submit.mutate({ promptKey, response })} />
      ) : game.mechanicType === "point_allocation" ? (
        <PointAllocation config={game.config as any} alreadySubmitted={myKeys.has("allocation")} onSubmit={(response) => submit.mutate({ promptKey: "allocation", response })} />
      ) : game.mechanicType === "guess" ? (
        <GuessGame config={game.config as any} myResponses={myResponses} onSubmit={(promptKey, response) => submit.mutate({ promptKey, response })} />
      ) : game.mechanicType === "head_to_head_quiz" ? (
        <HeadToHeadQuiz config={game.config as any} myKeys={myKeys} onSubmit={(promptKey, response) => submit.mutate({ promptKey, response })} />
      ) : (
        <p className="text-sm text-muted-foreground">Unsupported game type.</p>
      )}
    </div>
  );
}

function ResultSummary({ game, result }: { game: { mechanicType: string }; result: any }) {
  if (!result) return <p className="text-sm text-muted-foreground">Game complete!</p>;
  if (result.type === "simultaneous_reveal") {
    return <p className="text-sm">You matched on {result.matches} of {result.total} questions. 🎉</p>;
  }
  if (result.type === "point_allocation") {
    return (
      <div className="space-y-2 text-sm">
        {result.allocations?.map((a: any, i: number) => (
          <div key={i} className="rounded-md border p-2">
            <div className="text-xs text-muted-foreground mb-1">{a.userId.slice(0, 8)}…</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(a.points, null, 2)}</pre>
          </div>
        ))}
      </div>
    );
  }
  if (result.type === "guess") {
    return <p className="text-sm">You guessed {result.correctGuesses} of {result.total} correctly. 🎯</p>;
  }
  if (result.type === "head_to_head_quiz") {
    return (
      <div className="space-y-1 text-sm">
        {Object.entries(result.scores ?? {}).map(([userId, score]) => (
          <div key={userId} className="flex justify-between">
            <span>{userId.slice(0, 8)}…</span>
            <span className="font-semibold">{String(score)} pts</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">Game complete!</p>;
}

function SimultaneousReveal({
  config,
  myKeys,
  onSubmit,
}: {
  config: { questions: { id: string; text: string; options: QuestionOption[] }[] };
  myKeys: Set<string>;
  onSubmit: (promptKey: string, response: { optionId: string }) => void;
}) {
  const nextQuestion = config.questions?.find((q) => !myKeys.has(q.id));
  if (!nextQuestion) {
    return <p className="text-sm text-muted-foreground">Waiting for your partner to finish...</p>;
  }
  return (
    <div className="space-y-3">
      <p className="font-medium">{nextQuestion.text}</p>
      <div className="grid gap-2">
        {nextQuestion.options.map((opt) => (
          <Button key={opt.id} variant="outline" className="justify-start" onClick={() => onSubmit(nextQuestion.id, { optionId: opt.id })}>
            {opt.text}
          </Button>
        ))}
      </div>
    </div>
  );
}

function PointAllocation({
  config,
  alreadySubmitted,
  onSubmit,
}: {
  config: { values: { id: string; label: string }[] };
  alreadySubmitted: boolean;
  onSubmit: (response: Record<string, number>) => void;
}) {
  const [points, setPoints] = useState<Record<string, string>>({});
  if (alreadySubmitted) return <p className="text-sm text-muted-foreground">Waiting for your partner to finish...</p>;

  const total = config.values.reduce((sum, v) => sum + (Number(points[v.id]) || 0), 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Allocate 100 points across what matters most to you.</p>
      {config.values.map((v) => (
        <div key={v.id} className="flex items-center gap-2">
          <Label className="flex-1">{v.label}</Label>
          <Input
            type="number"
            className="w-24"
            value={points[v.id] ?? ""}
            onChange={(e) => setPoints((prev) => ({ ...prev, [v.id]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex items-center justify-between text-sm">
        <span className={total === 100 ? "text-muted-foreground" : "text-destructive"}>Total: {total} / 100</span>
        <Button
          disabled={total !== 100}
          onClick={() =>
            onSubmit(
              Object.fromEntries(config.values.map((v) => [v.id, Number(points[v.id]) || 0])),
            )
          }
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

function GuessGame({
  config,
  myResponses,
  onSubmit,
}: {
  config: { questions: { id: string; text: string; min: number; max: number }[] };
  myResponses: { promptKey: string }[];
  onSubmit: (promptKey: string, response: { value: number }) => void;
}) {
  const [value, setValue] = useState("");
  const submittedKeys = new Set(myResponses.map((r) => r.promptKey));
  const nextQuestion = config.questions.find((q) => !submittedKeys.has(`answer:${q.id}`));
  const nextGuess = config.questions.find((q) => !submittedKeys.has(`guess:${q.id}`));
  const target = nextQuestion ?? nextGuess;
  const mode: "answer" | "guess" | null = nextQuestion ? "answer" : nextGuess ? "guess" : null;

  if (!target || !mode) {
    return <p className="text-sm text-muted-foreground">Waiting for your partner to finish...</p>;
  }

  return (
    <div className="space-y-3">
      <p className="font-medium">
        {mode === "answer" ? target.text : `What do you think your partner said for: "${target.text}"?`}
      </p>
      <Input
        type="number"
        min={target.min}
        max={target.max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`${target.min} - ${target.max}`}
      />
      <Button
        onClick={() => {
          const num = Number(value);
          if (Number.isNaN(num)) return;
          onSubmit(`${mode}:${target.id}`, { value: num });
          setValue("");
        }}
        disabled={!value.trim()}
      >
        Submit
      </Button>
    </div>
  );
}

function HeadToHeadQuiz({
  config,
  myKeys,
  onSubmit,
}: {
  config: { quizId: number };
  myKeys: Set<string>;
  onSubmit: (promptKey: string, response: { selectedOptionId: string; responseTimeMs: number }) => void;
}) {
  const { data: quiz, isLoading } = useQuiz(config.quizId);
  const [startedAt] = useState(() => Date.now());

  if (isLoading || !quiz) return <Skeleton className="h-24" />;

  const nextQuestion = quiz.questions.find((q) => !myKeys.has(`q${q.id}`));
  if (!nextQuestion) {
    return <p className="text-sm text-muted-foreground">Waiting for your partner to finish...</p>;
  }
  const options = (nextQuestion.options as QuestionOption[]) ?? [];

  return (
    <div className="space-y-3">
      <p className="font-medium">{nextQuestion.questionText}</p>
      <div className="grid gap-2">
        {options.map((opt) => (
          <Button
            key={opt.id}
            variant="outline"
            className="justify-start"
            onClick={() =>
              onSubmit(`q${nextQuestion.id}`, { selectedOptionId: opt.id, responseTimeMs: Date.now() - startedAt })
            }
          >
            {opt.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
