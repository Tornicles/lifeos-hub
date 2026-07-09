import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Award } from "lucide-react";
import { useShareableCards } from "@/hooks/useFinance";
import { toast } from "sonner";

function drawCard(canvas: HTMLCanvasElement, title: string, subtitle: string | null | undefined) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = 800;
  const h = 450;
  canvas.width = w;
  canvas.height = h;

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#f59e0b");
  gradient.addColorStop(1, "#22c55e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(w - 100, 100, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("🏆 LifeOS Milestone", 48, 80);

  ctx.font = "bold 44px sans-serif";
  wrapText(ctx, title, 48, 200, w - 96, 52);

  if (subtitle) {
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    wrapText(ctx, subtitle, 48, 300, w - 96, 36);
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

export function ShareableCards() {
  const { data: cards, isLoading } = useShareableCards();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function handleShare(title: string, subtitle: string | null | undefined) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCard(canvas, title, subtitle);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "milestone.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title, text: subtitle ?? undefined });
        } catch {
          // user cancelled share sheet — no-op
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "milestone.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image downloaded — share it however you like!");
      }
    }, "image/png");
  }

  if (isLoading || !cards || cards.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="font-semibold flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Milestones
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{card.title}</div>
                {card.subtitle && <div className="text-xs text-muted-foreground truncate">{card.subtitle}</div>}
              </div>
              <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => handleShare(card.title, card.subtitle)}>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          ))}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
