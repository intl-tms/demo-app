import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import Home from './page';

const meta = {
  title: 'Pages/Home',
  component: Home
} satisfies Meta<typeof Home>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
