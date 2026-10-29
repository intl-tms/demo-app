// The demo's own sign-in area for the Storybook panel: the words and looks
// are the website's, written in React. Signing in itself is the addon's: the
// view only shows the state and calls signIn or signOut, and never sees the
// code or the token.
//
// The area is inside the panel's shadow root, where the page's stylesheets do
// not reach, so it is styled inline.

import {useEffect, useState, type CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';
import type {SignInControls, SignInState, SignInView} from '@intl-tms/core/storybook';

const line: CSSProperties = {margin: 0, flex: '1 1 100%'};
const muted: CSSProperties = {...line, opacity: 0.75};
const action: CSSProperties = {
  height: 28,
  padding: '0 12px',
  border: '1px solid currentColor',
  borderRadius: 6,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer'
};

function words(state: SignInState): string {
  switch (state.status) {
    case 'signed-in':
      return state.name === undefined ? 'You are signed in.' : `Signed in as ${state.name}.`;
    case 'signing-in':
      return 'Choose your account in the sign-in window.';
    case 'popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups for Storybook and try again.';
    case 'not-permitted':
      return 'Your account may not edit translations.';
    case 'expired':
      return 'Your sign-in has ended. Sign in again; your changes are kept.';
    default:
      return 'Sign in with your demo account to edit translations.';
  }
}

function SignIn({controls}: {controls: SignInControls}) {
  const [state, setState] = useState(controls.state);
  useEffect(() => controls.onChange(setState), [controls]);
  const signedIn = state.status === 'signed-in' || state.status === 'not-permitted';
  return (
    <>
      <p style={line}>{words(state)}</p>
      {/* The website's own words, shown as text. */}
      {state.help === undefined ? null : <p style={muted}>{state.help}</p>}
      {state.status === 'signing-in' ? null : (
        // signIn() is called straight from the click, or the browser blocks the pop-up.
        <button type="button" style={action} onClick={signedIn ? controls.signOut : controls.signIn}>
          {signedIn ? 'Sign out' : 'Sign in'}
        </button>
      )}
    </>
  );
}

export const signInView: SignInView = (element, controls) => {
  const root = createRoot(element);
  root.render(<SignIn controls={controls} />);
  return () => root.unmount();
};
