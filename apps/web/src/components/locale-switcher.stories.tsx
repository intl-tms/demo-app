import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import {LocaleSwitcher} from './locale-switcher';

const meta = {
  title: 'Components/LocaleSwitcher',
  component: LocaleSwitcher,
  parameters: {layout: 'centered'}
} satisfies Meta<typeof LocaleSwitcher>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
