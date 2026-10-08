import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Stack } from '../parts';

export function InputDemo() {
  return (
    <div className="max-w-xl space-y-6 rounded-2xl border bg-card p-6">
      <Stack label="Client details">
        <div className="space-y-1.5">
          <Label htmlFor="demo-client-name">Client name</Label>
          <Input id="demo-client-name" placeholder="Client or company name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-client-email">Client email</Label>
          <Input id="demo-client-email" type="email" placeholder="billing@example.com" />
          <p className="text-xs text-muted-foreground">Used for your own records.</p>
        </div>
      </Stack>
      <Stack label="States">
        <Input defaultValue="Read only" readOnly aria-label="Read only example" />
        <Input placeholder="Disabled" disabled aria-label="Disabled example" />
        <Input placeholder="Invalid" aria-invalid="true" aria-label="Invalid example" />
      </Stack>
    </div>
  );
}
