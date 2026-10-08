import { Badge } from '../../components/ui/badge';
import { Row } from '../parts';

export function BadgeDemo() {
  return (
    <div className="space-y-6 rounded-2xl border bg-card p-6">
      <Row label="Invoice and proposal statuses">
        <Badge variant="success">Paid</Badge>
        <Badge variant="success">Accepted</Badge>
        <Badge variant="warning">Due soon</Badge>
        <Badge variant="destructive">Overdue</Badge>
        <Badge variant="destructive">Declined</Badge>
        <Badge variant="secondary">Draft</Badge>
      </Row>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        Statuses use compact, borderless pills. Reserve sage for completed or
        accepted work; use destructive red only for overdue or declined states.
      </p>
    </div>
  );
}
