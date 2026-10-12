import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import NewProjectScreen from '@/app/(tabs)/neu';
import { Button } from '@/components/button';
import { useAppStore } from '@/store/app-store';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

beforeEach(() => {
  mockPush.mockClear();
  useAppStore.setState({ projects: [], plan: 'free', onboardingCompleted: true });
});

describe('Button', () => {
  it('ist für Screenreader als Schaltfläche beschriftet', async () => {
    const onPress = jest.fn();
    await render(<Button label="Speichern" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Speichern' });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('löst deaktiviert keine Aktion aus', async () => {
    const onPress = jest.fn();
    await render(<Button label="Speichern" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Speichern' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Neues Projekt', () => {
  it('zeigt eine verständliche Meldung bei fehlendem Namen', async () => {
    await render(<NewProjectScreen />);
    await fireEvent.press(screen.getByTestId('create-project'));
    expect(await screen.findByText('Projektname fehlt.')).toBeTruthy();
    expect(useAppStore.getState().projects).toHaveLength(0);
  });

  it('legt ein Projekt an und öffnet es', async () => {
    await render(<NewProjectScreen />);
    await fireEvent.changeText(screen.getByTestId('project-name'), 'Mängelliste Rohbau');
    await fireEvent.press(screen.getByRole('radio', { name: 'Bau & Handwerk' }));
    await fireEvent.press(screen.getByTestId('create-project'));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const [project] = useAppStore.getState().projects;
    expect(project).toMatchObject({ name: 'Mängelliste Rohbau', category: 'construction' });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/projekt/[id]',
      params: { id: project?.id },
    });
  });

  it('meldet das Tariflimit im kostenlosen Tarif', async () => {
    useAppStore.getState().addProject({ name: 'Vorhanden' });
    await render(<NewProjectScreen />);
    await fireEvent.changeText(screen.getByTestId('project-name'), 'Zweites Projekt');
    await fireEvent.press(screen.getByTestId('create-project'));
    expect(await screen.findByTestId('submit-error')).toBeTruthy();
    expect(useAppStore.getState().projects).toHaveLength(1);
  });
});
