# Tic-Tac-Toe React Refactor

## Overview

This project is a planned refactor of the existing plain JavaScript Tic-Tac-Toe frontend into a React-based application.

The purpose of the refactor is not simply to rewrite existing JavaScript files as `.jsx` files. The goal is to reorganize the application around React's component-based architecture, one-way data flow, reusable UI components, hooks, and explicit state ownership.

The existing project already separates several concerns through views, controllers, services, game logic, session management, and CSS files. The React version builds on these existing responsibilities while restructuring them according to React conventions.

The frontend will also be redesigned to communicate with the Spring Boot version of the Tic-Tac-Toe backend through REST APIs.

### Source Project

Current plain JavaScript project:

[GitHub - hbsamson/tictactoe (`refactor/api-design` branch)](https://github.com/hbsamson/tictactoe/tree/refactor/api-design)

---

## Migration Goals

The migration has the following goals:

* Convert the existing UI into React function components.
* Organize the application primarily by feature or domain.
* Make component responsibilities easy to identify and maintain.
* Replace manual DOM manipulation with React rendering.
* Replace controller-driven UI updates with state-driven rendering.
* Maintain one-way data flow from parent components to child components.
* Keep API communication separate from presentation components.
* Use React Router for page-level navigation.
* Use React Context only where state must be shared across unrelated components.
* Keep local state local whenever possible.
* Integrate the frontend with the redesigned Spring Boot REST API.
* Preserve existing Tic-Tac-Toe behavior while improving frontend structure.
* Avoid both overly large "god components" and unnecessary component fragmentation.

The refactor should produce a project where another developer can locate, understand, and modify a feature without needing to trace unrelated files throughout the application.

---

# Technology Decisions

| Concern                | Decision                | Reasoning                                                                                                                                                                    |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI Library             | React                   | Required for the training activity and provides the component-based architecture being studied.                                                                              |
| Project Setup          | Vite + React            | Provides a modern development/build environment while keeping the application a client-side React project.                                                                   |
| Language               | JavaScript with JSX     | The existing project is written in JavaScript, so keeping JavaScript allows the exercise to focus on React architecture rather than introducing TypeScript at the same time. |
| Routing                | React Router            | Provides explicit application routes and removes the need to maintain separate `index.html` and `history.html` pages.                                                        |
| Shared State           | React Context           | Appropriate for the current lightweight application when multiple unrelated components need the same runtime state.                                                          |
| Local State            | `useState`              | Component-specific state should remain owned by the component or feature that needs it.                                                                                      |
| Side Effects           | `useEffect`             | Used for effects such as API communication, timers, subscriptions, or synchronization with systems outside React.                                                            |
| Styling                | Tailwind CSS - Proposed | Tailwind can reduce repeated CSS and make component styling easier to locate. This is currently a planning decision and depends on whether it is permitted for the activity. |
| Styling Fallback       | Existing CSS structure  | If Tailwind is not permitted, the existing CSS can be migrated and reorganized without changing the React architecture.                                                      |
| Backend                | Spring Boot REST API    | Backend responsibilities stay outside the React frontend. React should communicate with Spring Boot through the frontend service layer.                                      |
| External State Library | None initially          | Zustand or another state library would add unnecessary complexity for the current scope. It can be reconsidered if application state becomes significantly more complex.     |

---

# Standards and Heuristics

The design distinguishes between **standards** and **heuristics**.

A standard is a convention or requirement that should consistently be followed by the project.

A heuristic is a rule of thumb used to decide how the application should be structured when there is no single mandatory answer.

For example, React establishes a component-based model, but deciding exactly how large a component should be is an architectural judgment.

The main heuristic used for this refactor is:

> A component should have a clear responsibility and should be easy for another developer to locate and modify later.

This means that neither of the following approaches is desirable:

* putting most of the application into one large component;
* creating a separate component for every small piece of markup.

Component boundaries should instead follow application responsibilities.

---

# Existing Plain JavaScript Structure

The existing frontend is approximately organized as follows:

```text
.
├── assets/
│   └── icons/
├── css/
│   ├── components/
│   ├── global.css
│   ├── responsive.css
│   └── style.css
├── js/
│   ├── components/
│   │   ├── app-shell.js
│   │   ├── base-component.js
│   │   ├── game-start-overlay.js
│   │   ├── game-view.js
│   │   ├── history-view.js
│   │   ├── lobby-view.js
│   │   ├── modal-overlay.js
│   │   ├── replay-view.js
│   │   ├── toast-bar.js
│   │   └── waiting-view.js
│   ├── controllers/
│   │   ├── event-handler.js
│   │   ├── game-controller.js
│   │   └── history-controller.js
│   ├── game/
│   │   └── game.js
│   ├── lobby/
│   │   └── lobby.js
│   ├── notifications/
│   │   └── notifications.js
│   ├── room/
│   │   ├── room-service.js
│   │   └── room-storage.js
│   ├── session/
│   │   └── game-session.js
│   ├── api.js
│   ├── app.js
│   ├── config.js
│   └── ui.js
├── history.html
└── index.html
```

The project already has useful separation between UI, controllers, game logic, API communication, room handling, notifications, and session state.

However, some responsibilities can be simplified when moved to React because React itself manages rendering and component lifecycle.

---

# Proposed React Project Structure

The React version will use **feature-first organization**.

Related files are grouped by application domain first and then by technical responsibility inside that domain.

```text
tictactoe-react/
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── App.jsx
│   │   └── router.jsx
│   │
│   ├── assets/
│   │   ├── images/
│   │   │   ├── bg-night-lights.png
│   │   │   ├── dialogue1.png
│   │   │   ├── dialogue2.png
│   │   │   ├── lost.png
│   │   │   ├── start-blank.png
│   │   │   └── victory.png
│   │   │
│   │   └── icons/
│   │       ├── ann.png
│   │       ├── makoto.png
│   │       ├── morgana.png
│   │       ├── ren.png
│   │       ├── ryuji.png
│   │       └── yusuke.png
│   │
│   ├── components/
│   │   ├── feedback/
│   │   │   ├── ModalOverlay.jsx
│   │   │   └── ToastBar.jsx
│   │   │
│   │   └── layout/
│   │       └── AppShell.jsx
│   │
│   ├── context/
│   │   └── GameContext.jsx
│   │
│   ├── features/
│   │   │
│   │   ├── lobby/
│   │   │   ├── components/
│   │   │   │   └── LobbyView.jsx
│   │   │   └── hooks/
│   │   │       └── useLobby.js
│   │   │
│   │   ├── room/
│   │   │   ├── components/
│   │   │   │   └── WaitingView.jsx
│   │   │   └── services/
│   │   │       └── roomService.js
│   │   │
│   │   ├── game/
│   │   │   ├── components/
│   │   │   │   ├── GameStartOverlay.jsx
│   │   │   │   └── GameView.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useGame.js
│   │   │   └── utils/
│   │   │       └── gameLogic.js
│   │   │
│   │   └── history/
│   │       ├── components/
│   │       │   ├── HistoryView.jsx
│   │       │   └── ReplayView.jsx
│   │       └── hooks/
│   │           └── useHistory.js
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── config/
│   │   └── apiConfig.js
│   │
│   ├── styles/
│   │   └── index.css
│   │
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
└── README.md
```

This is a planned structure. Additional files should only be introduced when an actual responsibility requires them.

For example, the presence of an existing `controls.css` file does **not** automatically mean that a `Controls.jsx` component must be created. A component should be extracted only when its behavior, reuse, complexity, or independent responsibility justifies it.

---

# Why Feature-Based Organization?

A purely technical structure could place every component in one folder:

```text
components/
hooks/
services/
utils/
```

This works for small projects but becomes harder to navigate as the application grows.

For this project, feature-based organization makes relationships more obvious.

For example:

```text
features/
└── history/
    ├── components/
    │   ├── HistoryView.jsx
    │   └── ReplayView.jsx
    └── hooks/
        └── useHistory.js
```

A developer working on game history can immediately find the relevant UI and logic without searching through global folders containing unrelated game, lobby, and room files.

Cross-feature functionality remains outside feature folders.

Examples include:

```text
components/
services/
context/
config/
```

These contain functionality that is shared by several domains.

---

# Logical Component Decomposition

## 1. Application Layer

### `main.jsx`

`main.jsx` is the React entry point.

Its responsibility should remain minimal:

* initialize React;
* render the root application;
* load global styling;
* attach the application to the HTML root element.

Business logic should not be placed here.

---

### `App.jsx`

`App.jsx` represents the top-level application.

Its responsibilities may include:

* mounting global providers;
* rendering the application router;
* providing the common application shell.

It should not contain detailed Tic-Tac-Toe game logic.

---

### `router.jsx`

Routing is moved into React Router instead of maintaining separate HTML pages.

The initial known page routes are:

```text
/
 /history
```

The existing `index.html` and `history.html` therefore become routes inside a single React application.

No additional route is assumed for replay functionality. `ReplayView` can remain part of the history feature unless a separate replay URL becomes a project requirement.

---

# 2. Shared Components

## `AppShell.jsx`

Derived from:

```text
js/components/app-shell.js
```

`AppShell` contains layout that is shared across page-level features.

Possible examples include the common application frame, background, header area, or page container.

It should not own feature-specific game logic.

---

## `ModalOverlay.jsx`

Derived from:

```text
js/components/modal-overlay.js
```

This remains a shared component because a modal is a reusable UI concern rather than belonging exclusively to one feature.

Its state should generally be controlled by its owner through props.

Example conceptual interface:

```jsx
<ModalOverlay
  open={isOpen}
  onClose={handleClose}
>
  ...
</ModalOverlay>
```

The component receives data through props rather than reading or modifying another component's state directly.

---

## `ToastBar.jsx`

Derived from:

```text
js/components/toast-bar.js
js/notifications/notifications.js
```

The visual notification component and the logic that decides when to show notifications should be separated where practical.

`ToastBar` should primarily be responsible for displaying notification information.

---

# 3. Lobby Feature

```text
features/lobby/
├── components/
│   └── LobbyView.jsx
└── hooks/
    └── useLobby.js
```

### `LobbyView.jsx`

Derived from:

```text
js/components/lobby-view.js
```

This component represents the lobby screen.

It should primarily describe the lobby UI while delegating stateful behavior to hooks or services when that behavior becomes sufficiently complex.

---

### `useLobby.js`

This hook is intended for lobby-specific state and behavior that would otherwise make `LobbyView` unnecessarily large.

A hook should not be created merely to reduce line count. It should represent a meaningful reusable or independently understandable behavior.

---

# 4. Room Feature

```text
features/room/
├── components/
│   └── WaitingView.jsx
└── services/
    └── roomService.js
```

### `WaitingView.jsx`

Derived from:

```text
js/components/waiting-view.js
```

This component represents the waiting-room UI.

Rendering should be based on current React state rather than manually changing DOM elements when room state changes.

---

### `roomService.js`

Derived from:

```text
js/room/room-service.js
```

Room-related API operations belong outside React presentation components.

The service layer allows components and hooks to request operations without needing to know the details of URLs, HTTP configuration, or request construction.

---

# 5. Game Feature

```text
features/game/
├── components/
│   ├── GameStartOverlay.jsx
│   └── GameView.jsx
├── hooks/
│   └── useGame.js
└── utils/
    └── gameLogic.js
```

## `GameView.jsx`

Derived from:

```text
js/components/game-view.js
```

`GameView` represents the main game interface.

It should render the game according to the current state.

It should not become responsible for every aspect of:

* networking;
* session management;
* game rules;
* notifications;
* routing;
* persistence.

If those responsibilities are all placed inside `GameView`, it would become a god component.

---

## `GameStartOverlay.jsx`

Derived from:

```text
js/components/game-start-overlay.js
```

This remains separate because the start overlay is already an identifiable UI responsibility with a lifecycle independent from the main board display.

---

## `useGame.js`

Some responsibilities currently handled by:

```text
js/controllers/game-controller.js
js/controllers/event-handler.js
```

can be expressed through React state, component event handlers, and a game-specific custom hook.

Rather than maintaining a traditional UI controller that manually updates views, React allows state changes to automatically cause the UI to render again.

Conceptually:

```text
User action
    ↓
event handler
    ↓
update state / call service
    ↓
React re-renders
    ↓
UI reflects current state
```

This replaces patterns such as:

```text
User action
    ↓
controller
    ↓
manually locate DOM element
    ↓
manually modify DOM
```

---

## `gameLogic.js`

Derived from:

```text
js/game/game.js
```

Pure game rules should not automatically be converted into React hooks or components.

Logic such as:

* checking game rules;
* evaluating board state;
* determining valid game results;

can remain ordinary JavaScript functions.

This keeps React responsible for UI and state management while game-domain calculations remain independent.

Pure game functions are also easier to reason about because their output depends only on their input.

---

# 6. History Feature

```text
features/history/
├── components/
│   ├── HistoryView.jsx
│   └── ReplayView.jsx
└── hooks/
    └── useHistory.js
```

## `HistoryView.jsx`

Derived from:

```text
js/components/history-view.js
js/controllers/history-controller.js
```

The history view should focus on rendering the player's game history.

API retrieval and state transitions should be moved into a hook or service instead of mixing HTTP logic with large amounts of JSX.

---

## `ReplayView.jsx`

Derived from:

```text
js/components/replay-view.js
```

Replay behavior remains separate because displaying an individual game's move history is a different responsibility from displaying the list of available games.

This is an example of useful decomposition rather than decomposition based only on file size.

---

## `useHistory.js`

History-specific asynchronous behavior can be grouped into `useHistory`.

For example, this hook may coordinate:

* history loading state;
* selected history records;
* API errors;
* state used by `HistoryView` and `ReplayView`.

The HTTP implementation itself should remain in the API/service layer.

---

# Mapping the Existing Architecture to React

| Existing File/Area      | Planned React Equivalent      | Decision                                                                             |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `index.html`            | React route `/`               | Page becomes part of the SPA.                                                        |
| `history.html`          | React route `/history`        | Separate HTML document is no longer necessary.                                       |
| `app.js`                | `App.jsx`, router, contexts   | Bootstrap responsibilities are separated from feature logic.                         |
| `ui.js`                 | React components              | React becomes responsible for rendering UI from state.                               |
| `base-component.js`     | Removed                       | Function components already provide the common React component model.                |
| `app-shell.js`          | `AppShell.jsx`                | Remains a shared layout component.                                                   |
| `game-view.js`          | `GameView.jsx`                | Converted into a declarative React component.                                        |
| `game-start-overlay.js` | `GameStartOverlay.jsx`        | Converted into a React overlay component.                                            |
| `lobby-view.js`         | `LobbyView.jsx`               | Converted into the lobby feature.                                                    |
| `waiting-view.js`       | `WaitingView.jsx`             | Converted into the room feature.                                                     |
| `history-view.js`       | `HistoryView.jsx`             | Converted into the history feature.                                                  |
| `replay-view.js`        | `ReplayView.jsx`              | Remains a separate history responsibility.                                           |
| `modal-overlay.js`      | `ModalOverlay.jsx`            | Shared reusable feedback component.                                                  |
| `toast-bar.js`          | `ToastBar.jsx`                | Shared notification UI.                                                              |
| `game-controller.js`    | `useGame.js` + handlers       | React state replaces much controller-driven UI synchronization.                      |
| `history-controller.js` | `useHistory.js` + handlers    | History behavior is colocated with the history domain.                               |
| `event-handler.js`      | Component/hook event handlers | React handles events declaratively.                                                  |
| `game/game.js`          | `gameLogic.js`                | Pure game logic remains ordinary JavaScript.                                         |
| `room-service.js`       | `roomService.js`              | Network/domain service remains separate from UI.                                     |
| `room-storage.js`       | Reviewed separately           | Persistence should only remain if persistence across refreshes is actually required. |
| `game-session.js`       | Local state and/or Context    | Runtime shared session state moves into React's state model.                         |
| `notifications.js`      | React notification state      | Notification rendering becomes state-driven.                                         |
| `api.js`                | `services/api.js`             | Central HTTP communication with Spring Boot.                                         |
| `config.js`             | `config/apiConfig.js`         | Runtime/API configuration remains separate from components.                          |

---

# Why `BaseComponent` Is Not Migrated

The existing project uses:

```text
base-component.js
```

because the plain JavaScript implementation needed a reusable abstraction for UI component behavior.

React already provides the component abstraction.

A React function component is simply a JavaScript function that returns UI:

```jsx
function ExampleComponent(props) {
  return (
    <div>
      ...
    </div>
  );
}
```

Creating another custom `BaseComponent` abstraction would therefore duplicate React's own component model and make the migration unnecessarily complex.

Shared behavior should instead be expressed through:

* composition;
* props;
* custom hooks;
* shared utilities.

---

# State Management Strategy

React state should be placed as close as possible to the component that owns it.

Three questions should be asked when deciding where data belongs:

1. Does only this component need the data?
2. Do several React components need the data?
3. Does the data need to exist outside React or survive the application lifecycle?

---

## Local State

Use `useState` when state belongs to a component or closely related feature.

Examples of appropriate local state include UI values such as:

```text
selected item
modal visibility
form input
loading indicator
temporary error message
```

State should not automatically be placed into Context simply because Context is available.

---

## Shared Application State

Use `useContext` when multiple unrelated parts of the React tree require the same state.

For this initial implementation, Context is preferred over adding an external state-management library.

A planned shared context is:

```text
GameContext
```

It can hold shared runtime information that genuinely needs to be accessed by multiple game-related components.

The exact values placed in the context should be decided based on actual component requirements during implementation.

The context should **not** become a container for every variable in the application.

---

## Persistent State

React Context exists only while the application is running.

It does not automatically replace persistence mechanisms.

Therefore:

```text
room-storage.js
```

should not be removed solely because Context is introduced.

If some information must survive a browser refresh, an appropriate persistence strategy must still be used.

If persistence is no longer necessary after the Spring Boot redesign, the storage code can be removed.

This should be determined from the final application requirements rather than assumed during the React migration.

---

# Props and Data Flow

Props flow from parent components to child components.

```text
Parent
  ↓
Child
  ↓
Nested Child
```

Props should be treated as read-only.

A receiving component should not directly mutate an object that it receives through props.

Bad:

```js
props.player.name = "Ren";
```

Preferred:

```js
const updatedPlayer = {
  ...player,
  name: "Ren"
};
```

The component that owns the state should be responsible for applying the update.

This preserves predictable one-way data flow.

---

# Hooks

Hooks allow function components to use React features such as state, effects, references, and shared context.

Hooks should be called consistently at the top level of React components or other hooks.

---

## `useState`

Use `useState` for values that change and affect rendering.

```jsx
const [selectedGame, setSelectedGame] = useState(null);
```

Use state when changing the value should cause the UI to update.

---

## `useEffect`

Use `useEffect` when React must synchronize with something outside the normal render calculation.

Possible examples include:

* requests that depend on component lifecycle;
* timers;
* event subscriptions;
* browser APIs.

`useEffect` should not be used simply to calculate a value that can be calculated directly from existing state or props.

---

## `useMemo`

`useMemo` can cache derived calculations.

It should not be applied automatically to every calculated value.

Use it when recomputing a derived value is meaningfully expensive or when stable derived identity is required.

---

## `useCallback`

`useCallback` provides a stable function reference between renders when its dependencies have not changed.

It should be introduced when function identity actually matters, such as when interacting with memoized children or hook dependencies.

Using `useCallback` around every event handler would add complexity without automatically improving performance.

---

## `useRef`

`useRef` stores a value that persists between renders without causing another render when changed.

It is appropriate for concerns such as:

* references to DOM elements;
* mutable values that should survive renders;
* values used by timers or other imperative APIs.

Normal display state should generally use `useState` instead.

---

## `useContext`

`useContext` provides access to shared application state through a React Context provider.

It is appropriate when data is required by components that do not have a convenient direct parent-child relationship.

For the current project, this is preferred over introducing a larger state-management library.

---

# Derived Data

Data that can be calculated from existing state should generally not be stored as another independent state value.

For example, if the game result can be calculated from the board:

```text
board
   ↓
calculate result
   ↓
display result
```

it is usually preferable to calculate the result rather than maintain two independently mutable sources of truth:

```text
board state
result state
```

unless the application has a specific reason to store both.

This reduces synchronization problems.

---

# Non-Mutating State Updates

React state should be treated as immutable.

Bad:

```js
board[0] = "X";
setBoard(board);
```

Preferred:

```js
const nextBoard = [...board];
nextBoard[0] = "X";

setBoard(nextBoard);
```

The new object or array gives React an updated state identity and avoids modifying existing state directly.

---

# List Keys

React keys identify items between renders.

Keys should be based on stable identities whenever possible.

Preferred:

```jsx
games.map((game) => (
  <GameRow
    key={game.id}
    game={game}
  />
));
```

Array indexes should not be used as the default key when items can be inserted, removed, reordered, or refreshed in a different order.

The key represents the identity of the item, not merely its current position.

---

# Component Identity

Components should normally be declared at module level.

Preferred:

```jsx
function GameBoard() {
  ...
}

function GameView() {
  return <GameBoard />;
}
```

Avoid declaring a new component inside another component unless there is a deliberate reason to do so:

```jsx
function GameView() {
  function GameBoard() {
    ...
  }

  return <GameBoard />;
}
```

Repeatedly recreating component definitions can make component identity harder to reason about and may reset component state unexpectedly.

---

# React Router

The existing application currently uses separate HTML entry points:

```text
index.html
history.html
```

The React application instead uses a single entry point and lets React Router determine which page-level component to display.

Conceptually:

```text
Browser
   ↓
React Router
   ├── /         → Main game flow
   └── /history  → HistoryView
```

This keeps navigation inside the same frontend application and avoids maintaining duplicate HTML entry files.

---

# API and Spring Boot Integration

React is responsible for the frontend.

Spring Boot is responsible for backend behavior and REST endpoints.

The applications communicate through HTTP:

```text
React Component
      ↓
Custom Hook
      ↓
Frontend Service
      ↓
REST Request
      ↓
Spring Boot API
```

A component should not need to know the backend's complete URL construction or HTTP configuration.

For example:

```jsx
function HistoryView() {
  const { games, loading, error } = useHistory();

  ...
}
```

rather than placing repeated request configuration directly throughout UI components.

The common HTTP implementation belongs in:

```text
src/services/api.js
```

while feature-specific API behavior can be placed with the relevant feature when appropriate.

For example:

```text
features/room/services/roomService.js
```

The existing legacy server files under:

```text
server/
```

are not part of the React frontend migration.

The redesigned backend is handled through the Spring Boot application instead.

The React and Spring Boot applications should remain architecturally separate even if they are eventually stored in the same repository.

---

# Styling Decision

## Proposed: Tailwind CSS

Tailwind CSS is being considered for the React rewrite.

This would allow styling to be colocated more closely with React markup and could reduce the number of narrowly scoped CSS files.

The current project contains styles such as:

```text
css/components/cheer-panel.css
css/components/controls.css
css/components/game-start.css
css/components/game.css
css/components/header.css
css/components/history.css
css/components/lobby.css
css/components/modal.css
css/components/toast.css
css/components/waiting-room.css
```

A React migration does not require that each CSS file correspond to a React component.

Component boundaries should be determined by UI responsibility rather than by existing stylesheet boundaries.

### If Tailwind Is Approved

Most component-specific styling can move into JSX using Tailwind utility classes while global styling remains in:

```text
src/styles/index.css
```

### If Tailwind Is Not Approved

The same React architecture can be retained while migrating the existing CSS.

For example:

```text
features/
└── history/
    ├── components/
    │   ├── HistoryView.jsx
    │   └── ReplayView.jsx
    └── styles/
        └── history.css
```

Therefore, Tailwind is a styling choice rather than an architectural dependency.

---

# Naming Conventions

Consistent naming makes the responsibility of a file recognizable before it is opened.

## React Components

Use **PascalCase** and `.jsx`.

```text
GameView.jsx
LobbyView.jsx
WaitingView.jsx
HistoryView.jsx
ReplayView.jsx
ToastBar.jsx
ModalOverlay.jsx
```

React components are visually distinguishable from ordinary JavaScript modules.

---

## Hooks

Hooks use the `use` prefix followed by PascalCase naming.

```text
useGame.js
useHistory.js
useLobby.js
```

Examples:

```js
useGame()
useHistory()
useLobby()
```

The `use` prefix is important because it identifies the function as a React hook.

---

## Services

Use **camelCase** with `.js`.

```text
api.js
roomService.js
```

Services should describe the resource or responsibility they communicate with.

---

## Utilities

Use **camelCase** with `.js`.

```text
gameLogic.js
formatDate.js
```

Utilities should contain ordinary JavaScript functions rather than React components.

---

## Configuration

Use descriptive camelCase filenames.

```text
apiConfig.js
```

Configuration should not be mixed with UI implementation.

---

## Context

A context file that provides React components should use PascalCase:

```text
GameContext.jsx
```

Typical exports may include:

```text
GameContext
GameProvider
useGameContext
```

---

## Feature Folders

Feature folders use simple lowercase domain names:

```text
game/
history/
lobby/
room/
```

The names describe business/application concepts instead of technical implementation details.

---

# Good Practices

The React refactor should follow these practices:

* Keep components focused on clear responsibilities.
* Prefer function components.
* Keep state as close as possible to the component that owns it.
* Use Context only when several unrelated components require shared state.
* Keep props read-only.
* Perform non-mutating state updates.
* Keep REST communication outside presentation components.
* Keep pure game logic independent from React.
* Use custom hooks for meaningful stateful behavior.
* Use stable keys for rendered lists.
* Group files by feature or domain.
* Extract shared components only when they are genuinely shared.
* Use React Router instead of separate HTML page implementations.
* Use `useEffect` for synchronization and side effects rather than general calculations.
* Use `useMemo` and `useCallback` only when they solve an actual identity or computation problem.
* Keep component definitions stable and easy to locate.
* Prefer derived values over duplicated state where possible.
* Keep Spring Boot implementation details outside React components.
* Make the project structure understandable without requiring knowledge of the original implementation.

---

# Practices to Avoid

## God Components

Avoid putting the full lobby, room, game, history, API, and notification logic into `App.jsx` or `GameView.jsx`.

Bad structure:

```text
App.jsx
  ├── routing
  ├── API calls
  ├── lobby
  ├── waiting room
  ├── complete game logic
  ├── history
  ├── replay
  ├── notifications
  └── modal management
```

This makes unrelated features tightly coupled.

---

## Excessive Component Splitting

Small files do not automatically mean good component architecture.

Avoid components whose only purpose is wrapping a trivial element without adding meaningful reuse, behavior, or responsibility.

For example, the project does not automatically need:

```text
GameTitle.jsx
GameSubtitle.jsx
GameButtonText.jsx
GameButtonIcon.jsx
```

simply to make each file smaller.

---

## Mutating Props

Do not modify values received directly through props.

---

## Mutating State

Do not modify state arrays or objects directly before passing them back to their setter.

---

## Putting Everything in Context

Context should not become global storage for every application variable.

Local state remains preferable when only one feature or component needs the value.

---

## Unnecessary Effects

Do not use `useEffect` to synchronize two pieces of state when one can be derived from the other.

---

## Premature Memoization

Do not wrap all values in `useMemo` or all functions in `useCallback`.

Memoization introduces additional dependencies and complexity and should solve a specific problem.

---

## Direct DOM Manipulation

Avoid manually querying and changing DOM elements when the same UI can be represented through React state.

Instead of:

```js
document.querySelector(...).style.display = "none";
```

prefer:

```jsx
{isVisible && <Component />}
```

Direct DOM access should be reserved for cases where an external or imperative API actually requires it.

---

## API Calls Distributed Throughout UI Components

Avoid repeating raw `fetch()` configuration in multiple components.

Centralize HTTP concerns in the service layer.

---

# Training-Specific Repository Conventions

The React training specifies that test files should not be pushed to the training repository.

This is treated as a **training-specific repository rule**, rather than a general React architectural principle.

In a normal production application, automated tests are commonly committed alongside application code.

Generated and local development files should also remain outside version control where applicable, including:

```text
node_modules/
dist/
.idea/
```

Project-specific editor configuration should only be committed when intentionally shared by the team.

---

# Why Controllers Are Reduced in React

The plain JavaScript application currently contains:

```text
controllers/
├── event-handler.js
├── game-controller.js
└── history-controller.js
```

This structure is useful when code must coordinate DOM views manually.

React changes the relationship between state and UI.

Instead of instructing the UI how to change:

```text
Controller
   ↓
find element
   ↓
change element
```

React describes what the UI should look like for the current state:

```text
State
   ↓
React component
   ↓
Rendered UI
```

Therefore, many existing controller responsibilities can be divided between:

* component event handlers;
* custom hooks;
* Context;
* pure functions;
* services.

This does not mean all controller logic is deleted.

It means each responsibility is moved to the React layer where it logically belongs instead of preserving the original architecture one-to-one.

---

# Example Data Flow

A game move could conceptually follow this flow:

```text
User selects a cell
        ↓
GameView event handler
        ↓
useGame
        ↓
validate/update local state
        ↓
API service if backend synchronization is required
        ↓
Spring Boot REST API
        ↓
updated React state
        ↓
GameView re-renders
```

The view does not need to manually update individual cells.

The board displayed by React is a result of the current game state.

---

# Component Decomposition Heuristic

Before creating a new component, consider the following questions:

### Does it have its own responsibility?

A game replay has a responsibility different from the game history list.

Creating `ReplayView` separately is therefore reasonable.

### Is it reused?

Shared modals and toast notifications are appropriate shared components.

### Does it have meaningful independent behavior?

A complex board or control area may eventually justify extraction.

### Would extraction make the code easier to understand?

If a section makes its parent difficult to read or reason about, a component may be useful.

### Is the only reason that the file is becoming long?

File length alone is not enough reason to create components.

The goal is understandable responsibilities rather than the highest possible number of components.

---

# React State Mental Model

The refactor follows three categories of state.

## Stuff only this component needs

Use local state.

```text
Component
└── useState
```

## Stuff several React components need

Lift the state to the nearest useful common owner or use Context when the consumers are sufficiently distributed.

```text
GameProvider
├── Component A
├── Component B
└── Component C
```

## Stuff that must exist outside React

Use the appropriate external system.

Examples can include:

```text
Spring Boot API
browser persistence
external state store
external subscription
```

Context should not be used merely to imitate an external persistence mechanism.

---

# Future State Management

The current application will start with:

```text
useState
useContext
custom hooks
```

An external state-management library such as Zustand is intentionally not part of the initial design.

It should only be considered later if requirements introduce problems such as:

* increasingly complex global state;
* many unrelated context providers;
* frequent updates to shared state causing undesirable renders;
* complicated cross-feature state coordination;
* state that needs a dedicated external store.

The state-management solution should grow with the requirements rather than being added preemptively.

---

# Scope of the Migration

The migration includes:

```text
Plain JavaScript UI
        ↓
React UI

Separate HTML pages
        ↓
React Router

Manual DOM updates
        ↓
State-driven rendering

Controller-heavy UI coordination
        ↓
Hooks + state + event handlers

Existing backend integration
        ↓
Spring Boot REST integration
```

The migration does **not** include the training example involving an admin panel and person viewer.

Those screens were examples used during the React learning session and are not part of the Tic-Tac-Toe application's functional scope.

---

# Summary of Decisions

The React refactor will initially use:

```text
React
Vite
JavaScript / JSX
React Router
useState
useContext
custom hooks
Spring Boot REST API
feature-based project organization
```

Tailwind CSS is the proposed styling approach but remains dependent on the allowed technologies for the activity.

The architecture deliberately does not introduce an external state-management library for the current project size.

The central objective of the refactor is not to reproduce the existing JavaScript architecture file-for-file.

Instead, responsibilities are reorganized around React's model:

```text
Components → describe UI
Props      → pass read-only data downward
State      → represents changing UI/application data
Hooks      → encapsulate stateful React behavior
Context    → shares selected runtime state
Services   → communicate with Spring Boot
Utilities  → contain pure reusable logic
Router     → controls page-level navigation
```

This provides a structure that remains small enough for the current Tic-Tac-Toe activity while making the project's component boundaries and responsibilities easier to identify, maintain, and extend.
