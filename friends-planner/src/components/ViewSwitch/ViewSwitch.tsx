import { calendarPath, timelinePath } from '../../routes';
import { useActiveView } from '../../lib/useActiveView';
import { SegmentLink, SegmentedNav } from '../SegmentedControl/SegmentedControl';

/** Calendar | Timeline. Keeps the selected month. */
export function ViewSwitch() {
  const { kind, month, isView } = useActiveView();
  return (
    <SegmentedNav label="View">
      <SegmentLink href={calendarPath(month)} current={isView && kind === 'calendar'}>
        Calendar
      </SegmentLink>
      <SegmentLink href={timelinePath(month)} current={isView && kind === 'timeline'}>
        Timeline
      </SegmentLink>
    </SegmentedNav>
  );
}
