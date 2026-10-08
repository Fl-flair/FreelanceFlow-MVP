import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Stack } from '../parts';

export function TextareaDemo() {
  return (
    <div className="max-w-xl space-y-6 rounded-2xl border bg-card p-6">
      <Stack label="Client notes">
        <div className="space-y-1.5">
          <Label htmlFor="demo-client-notes">Notes</Label>
          <Textarea id="demo-client-notes" placeholder="Add context for this client" rows={4} />
          <p className="text-xs text-muted-foreground">Keep useful context close to the work.</p>
        </div>
      </Stack>
      <Stack label="States">
        <Textarea defaultValue="A concise project update." />
        <Textarea placeholder="Disabled" disabled />
      </Stack>
    </div>
  );
}
