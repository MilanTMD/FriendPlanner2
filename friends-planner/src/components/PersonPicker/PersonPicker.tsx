import { UserPlus } from 'lucide-react';
import { useLocation } from 'wouter';
import { useData } from '../../state/DataContext';
import { usePinPrompt } from '../../state/PinPromptContext';
import { useSession } from '../../state/SessionContext';
import { NEW_PERSON_PATH } from '../../routes';
import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';
import { PersonBadge } from '../PersonBadge/PersonBadge';
import { Sheet } from '../Sheet/Sheet';
import { Users } from 'lucide-react';
import styles from './PersonPicker.module.css';

/** "Who are you?" - pick a person; their PIN is asked once per device. */
export function PersonPicker({ onClose }: { onClose: () => void }) {
  const { people } = useData();
  const { person: acting } = useSession();
  const { requestPin } = usePinPrompt();
  const [, navigate] = useLocation();

  const choose = (id: string) => {
    const person = people.find((p) => p.id === id);
    if (!person) return;
    onClose();
    if (acting?.id === person.id) return;
    void requestPin(person);
  };

  return (
    <Sheet title="Who are you?" onClose={onClose} testId="person-picker">
      {people.length === 0 ? (
        <EmptyState icon={Users} message="No people yet. Add yourself first." />
      ) : (
        <ul className={styles.list}>
          {people.map((person) => (
            <li key={person.id} className={styles.item}>
              <button type="button" className={styles.row} onClick={() => choose(person.id)}>
                <PersonBadge name={person.name} colorId={person.colorId} variant="row" />
                {acting?.id === person.id ? <span className={styles.you}>You</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.footer}>
        <Button
          variant="secondary"
          icon={UserPlus}
          block
          onClick={() => {
            onClose();
            navigate(NEW_PERSON_PATH);
          }}
        >
          I&apos;m new here
        </Button>
      </div>
    </Sheet>
  );
}
