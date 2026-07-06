import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Heart, Copy, UserPlus } from "lucide-react";
import {
  useCouples,
  useCreateCoupleHook,
  useInvitePartner,
  useAcceptInvite,
  useCoupleDiscussionPrompts,
} from "@/hooks/useCouples";
import { toast } from "sonner";

export default function Couples() {
  const { data: couples, isLoading } = useCouples();
  const createCouple = useCreateCoupleHook();
  const invitePartner = useInvitePartner();
  const acceptInvite = useAcceptInvite();
  const { data: prompts, isLoading: promptsLoading } = useCoupleDiscussionPrompts();

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [acceptCode, setAcceptCode] = useState("");

  const couple = couples?.[0];
  const isLinked = couple?.status === "active";

  const handleInvite = () => {
    if (!couple) return;
    invitePartner.mutate({ coupleId: couple.id }, { onSuccess: (code) => setInviteCode(code) });
  };

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptCode.trim()) return;
    acceptInvite.mutate(acceptCode.trim());
    setAcceptCode("");
  };

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Heart className="h-9 w-9 text-pink-600" />
          Couples
        </h1>
        <p className="text-muted-foreground text-lg">Grow together with shared goals and conversations</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Connection</CardTitle>
            <CardDescription>
              {couple ? (isLinked ? "You're linked with a partner" : "Waiting for your partner to accept an invite") : "You haven't started a couple profile yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!couple ? (
              <Button onClick={() => createCouple.mutate()} disabled={createCouple.isPending} className="gap-2">
                <Heart className="h-4 w-4" />
                {createCouple.isPending ? "Creating..." : "Start a Couple Profile"}
              </Button>
            ) : isLinked ? (
              <Badge className="gap-1 bg-pink-100 text-pink-700 hover:bg-pink-100">
                <Heart className="h-3 w-3" />
                Linked
              </Badge>
            ) : (
              <div className="space-y-3">
                <Button onClick={handleInvite} disabled={invitePartner.isPending} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  {invitePartner.isPending ? "Generating..." : "Invite Partner"}
                </Button>
                {inviteCode && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                    <code className="font-mono text-sm flex-1">{inviteCode}</code>
                    <Button variant="ghost" size="icon" onClick={copyCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!isLinked && (
              <form onSubmit={handleAccept} className="flex items-end gap-2 pt-2 border-t">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="accept-code">Have an invite code?</Label>
                  <Input id="accept-code" placeholder="Enter invite code" value={acceptCode} onChange={(e) => setAcceptCode(e.target.value)} />
                </div>
                <Button type="submit" variant="outline" disabled={acceptInvite.isPending || !acceptCode.trim()}>
                  {acceptInvite.isPending ? "Linking..." : "Accept"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Discussion Prompts</CardTitle>
          <CardDescription>Conversation starters for you and your partner</CardDescription>
        </CardHeader>
        <CardContent>
          {promptsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : prompts && prompts.length > 0 ? (
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="p-3 rounded-lg border">
                  <p>{prompt.promptText}</p>
                  {prompt.category && <Badge variant="outline" className="mt-2">{prompt.category}</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No discussion prompts available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
