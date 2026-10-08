import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export function CardDemo() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
          Recent invoice
        </p>
        <CardTitle className="mt-2 font-serif text-xl">Brand identity · Alder &amp; Ash</CardTitle>
        <CardDescription>Invoice 008 · Issued June 10</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="font-serif text-3xl font-bold tracking-tight">$2,400</p>
            <p className="mt-1 text-sm text-muted-foreground">Due June 24</p>
          </div>
          <div className="rounded-2xl border border-secondary bg-secondary/70 p-4 text-right">
            <p className="text-xs font-semibold text-muted-foreground">Client</p>
            <p className="mt-1 text-sm font-semibold">Alder &amp; Ash</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3 border-t border-border pt-4">
        <Badge variant="warning">Due soon</Badge>
        <Button variant="outline">View invoice</Button>
      </CardFooter>
    </Card>
  );
}
