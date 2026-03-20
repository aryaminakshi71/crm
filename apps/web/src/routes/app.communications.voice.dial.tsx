import { Button, Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Phone,
  PhoneOutgoing,
  Delete,
  Clock,
  Volume2,
  Mic,
  MicOff,
  Video,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/voice/dial")({
  component: DialpadPage,
});

function DialpadPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const handleKeyPress = (key: string) => {
    if (key === "delete") {
      setPhoneNumber((prev) => prev.slice(0, -1));
    } else {
      setPhoneNumber((prev) => prev + key);
    }
  };

  const startCall = async () => {
    if (!phoneNumber) return;
    setIsCalling(true);
    // Simulate call
    let duration = 0;
    const interval = setInterval(() => {
      duration++;
      setCallDuration(duration);
      if (!isCalling) {
        clearInterval(interval);
      }
    }, 1000);
  };

  const endCall = () => {
    setIsCalling(false);
    setPhoneNumber("");
    setCallDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const KEYS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/voice" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Dialpad</h2>
            <p className="text-muted-foreground text-sm">Make outbound calls</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="border-border/60">
          <CardContent className="p-6">
            {/* Phone Number Display */}
            <div className="text-center mb-8">
              {isCalling ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
                    <Phone className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold">{phoneNumber}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {formatDuration(callDuration)}
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter number"
                    className="text-3xl font-mono text-center bg-transparent border-none outline-none w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {phoneNumber ? `${phoneNumber.length} digits` : "Enter a phone number"}
                  </p>
                </>
              )}
            </div>

            {/* Dialpad */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {KEYS.map((row, rowIdx) =>
                row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className="h-16 rounded-xl bg-muted hover:bg-muted/80 text-xl font-medium transition-colors"
                    disabled={isCalling}
                  >
                    {key}
                  </button>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              {isCalling ? (
                <>
                  <Button
                    variant={isMuted ? "primary" : "outline"}
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                  >
                    <Volume2 className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                  >
                    <Video className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={endCall}
                  >
                    <Phone className="h-6 w-6 rotate-[135deg]" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={() => handleKeyPress("delete")}
                    disabled={!phoneNumber}
                  >
                    <Delete className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="primary"
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={startCall}
                    disabled={!phoneNumber}
                  >
                    <PhoneOutgoing className="h-6 w-6" />
                  </Button>
                  <div className="w-14" />
                </>
              )}
            </div>

            {/* Quick Dial */}
            <div className="mt-8 pt-6 border-t">
              <p className="text-sm font-medium mb-3">Quick Dial</p>
              <div className="flex flex-wrap gap-2">
                {["+1 555-123-4567", "+1 555-234-5678", "+1 555-345-6789"].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPhoneNumber(num.replace(/\D/g, ""))}
                    className="px-3 py-1 text-sm border rounded-full hover:bg-muted/50"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
