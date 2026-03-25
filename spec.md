# The Focus Den

## Current State
MySquad.tsx has:
- Create Squad and Join Squad forms
- A single Squad Chat section that requires manually typing a squad name to load messages
- Active Squads section shows an empty state placeholder with no actual squad list
- No persistence of which squads the user has joined/created

Backend has `getSquadMessages(squadId)` and `sendSquadMessage(squadId, messageText)` but no `getCallerSquads` API to list a user's squads.

## Requested Changes (Diff)

### Add
- LocalStorage persistence of squads the user has created/joined (store array of {id, name})
- Active Squads section now renders a card for each saved squad, showing the squad name, member count placeholder, and a "Open Chat" button
- Dedicated per-squad chat: clicking "Open Chat" on a squad card opens a full chat view scoped to that specific squad (no manual name entry needed)
- Chat view header shows the squad name clearly
- Back button in chat view returns to the squad list

### Modify
- After creating or joining a squad, automatically save it to localStorage and immediately show it in Active Squads list
- Remove the manual "Enter squad name to load chat" input field -- squad selection now happens through the squad cards
- Active Squads section no longer shows the static empty state when squads exist

### Remove
- The standalone chat squad-name input (chatSquadInput / Load button) since chat is now accessed via squad cards

## Implementation Plan
1. Add `useLocalStorage` hook or inline localStorage state for `mySquads: Array<{id: string, name: string}>`
2. On successful createSquad / joinSquad, push the new squad into mySquads list
3. Render Active Squads as a list of cards; when none exist show the existing empty state
4. Add `selectedSquad` state; clicking "Open Chat" on a card sets selectedSquad
5. When selectedSquad is set, show a chat panel with the squad name as header, back button, message list, and send input -- reusing existing chat logic
6. Remove chatSquadInput state and handleLoadChat function
