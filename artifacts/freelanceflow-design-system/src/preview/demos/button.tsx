import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Row } from '../parts';

export function ButtonDemo() {
  return (
    <div className="space-y-6 rounded-2xl border bg-card p-6 text-card-foreground">
      <Row label="Core actions">
        <Button>Build your workbench <ArrowRight /></Button>
        <Button variant="outline">See how it works</Button>
        <Button variant="secondary">Save draft</Button>
      </Row>
      <Row label="Sizes">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Mail">
          <Mail />
        </Button>
      </Row>
      <Row label="Additional variants">
        <Button variant="ghost">Quiet text action</Button>
        <Button variant="link">Inline link</Button>
        <Button variant="destructive">Delete client</Button>
      </Row>
      <Row label="States">
        <Button disabled>Disabled</Button>
        <Button disabled>
          <Loader2 className="animate-spin" /> Loading
        </Button>
      </Row>
    </div>
  );
}
