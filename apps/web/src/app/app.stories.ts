import { provideNoopAnimations } from '@angular/platform-browser/animations';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';

import { App } from './app';

const meta: Meta<App> = {
  title: 'Metria/Layer decision support',
  component: App,
  decorators: [
    applicationConfig({
      providers: [provideNoopAnimations()],
    }),
  ],
};

export default meta;

type Story = StoryObj<App>;

export const Default: Story = {};
