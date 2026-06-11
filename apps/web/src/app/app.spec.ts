import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { fireEvent, render, screen } from '@testing-library/angular';
import { BehaviorSubject } from 'rxjs';

import { App } from './app';
import { AuthState } from './auth/auth.models';
import { AuthStore } from './auth/auth.store';

describe('App', () => {
  it('renders the Metria GIS workbench surface', async () => {
    const authState: AuthState = {
      status: 'authenticated',
      user: {
        id: 'metria-user',
        username: 'metria',
        displayName: 'Metria Användare',
        roles: ['case-worker', 'restricted-geodata', 'exporter'],
        rawRoles: ['case-worker', 'restricted-geodata', 'exporter'],
      },
    };
    const authState$ = new BehaviorSubject<AuthState>(authState);

    await render(App, {
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthStore,
          useValue: {
            state$: authState$.asObservable(),
            snapshot: authState,
            login: vi.fn(),
            logout: vi.fn(),
          },
        },
      ],
    });

    expect(screen.getByRole('heading', { name: /SOLLENTUNA SJÖBERG 5:5/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Användare: Metria Användare/i })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Sökläge/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Sök fastighet, adress eller ort/i })).toBeTruthy();
    expect(screen.getByLabelText('Lista med lagerbeslut').textContent).toContain(
      'Fastighetsgränser',
    );
    expect(screen.queryByText(/Export:/i)).toBeNull();
    expect(screen.queryByText(/projektionsvarningar/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Behörighet/i })).toBeNull();
    expect(screen.queryByText('3006')).toBeNull();
    expect(screen.queryByText(/96\/100/i)).toBeNull();
    expect(
      screen.getByLabelText(/synliga lager: Fastighetsgränser, Klimatriskzoner/i),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox', { name: /Klimatriskzoner/i }));

    expect(screen.getByLabelText(/synliga lager: Fastighetsgränser$/i)).toBeTruthy();
    expect(
      (screen.getByRole('checkbox', { name: /Klimatriskzoner/i }) as HTMLInputElement).checked,
    ).toBe(false);
  });
});
