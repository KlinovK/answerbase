import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatbotPage() {
  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle>Your chatbot is ready for setup.</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Add knowledge sources to start answering questions.
        </p>
      </CardContent>
    </Card>
  );
}
