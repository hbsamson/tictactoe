# Tic-Tac-Toe

A responsive two-player Tic-Tac-Toe web application. The browser UI is built with HTML5, CSS, and JavaScript, while the supplied Java servlet server stores rooms and boards in memory.

## Project structure

```text
.
|-- index.html                     Browser UI
|-- css/                           Layout, components, and responsive styles
|-- js/
|   |-- app.js                     Application orchestration and match lifecycle
|   |-- api.js                     Payara endpoint client
|   |-- config.js                  Shared timing, key, and avatar configuration
|   |-- game.js                    Board parsing, turns, and result rules
|   |-- lobby.js                   Key, player profile, and avatar behavior
|   |-- notifications.js           Modals and toast notifications
|   |-- room-storage.js            Cross-tab room profiles, scores, and cheers
|   `-- ui.js                      Views, board rendering, and status display
|-- assets/                        Images, icons, and font
`-- server/TicTacToeServer1.war   Prebuilt Java servlet game server
```

The WAR contains the five endpoints required by the project brief:

```text
GET /tictactoe/tictactoeserver/createGame?key=ROOM_KEY
GET /tictactoe/tictactoeserver/move?key=ROOM_KEY&tile=X&y=0&x=0
GET /tictactoe/tictactoeserver/reset?key=ROOM_KEY
GET /tictactoe/tictactoeserver/check?key=ROOM_KEY
GET /tictactoe/tictactoeserver/board?key=ROOM_KEY
```

## Required environment

- A 64-bit Java 8 JDK (Payara 5.2022.5 supports Java 8 update 162 or newer)
- Payara Server 5.2022.5
- Eclipse IDE for Enterprise Java and Web Developers.
- Payara Tools installed from Eclipse Marketplace.
- Live Server configured to serve the repository frontend on port `5500`.
- Ports `5500` (frontend), `8080` (Payara HTTP), and `4848` (Payara administration) available.

Official references:

- [Payara 5.2022.5 supported platforms](https://docs.payara.fish/community/docs/5.2022.5/General%20Info/Supported%20Platforms.html)
- [Payara Server tools for Eclipse](https://docs.payara.fish/community/docs/5.2022.5/Technical%20Documentation/Ecosystem/IDE%20Integration/Eclipse%20Plugin/Payara%20Server.html)
- [Payara 5 getting started and WAR deployment](https://docs.payara.fish/community/docs/5.2022.5/General%20Info/Getting%20Started.html)

## Deploy the WAR with Payara 5 in Eclipse

### 1. Select Java 8 in Eclipse

1. Confirm that the JDK is Java 8:

   ```powershell
   java -version
   javac -version
   ```

   Both commands should report version `1.8.x`. A JRE alone is not sufficient.

2. In Eclipse, open **Window > Preferences > Java > Installed JREs**.
3. Select **Add > Standard VM**, choose the Java 8 JDK directory, and make it the default.
4. Under **Java > Compiler**, select compliance level `1.8`.

The supplied servlet classes use Java class-file version 50 (Java 6), so they are compatible with a Java 8 runtime.

### 2. Register Payara 5

1. Extract the Payara 5 ZIP to a stable directory such as `C:\payara5`. Avoid moving it after Eclipse is configured.
2. In Eclipse, install **Payara Tools** from **Help > Eclipse Marketplace**, then restart Eclipse.
3. Open **Window > Show View > Servers**.
4. In the Servers view, select **New > Server > Payara > Payara**.
5. Use `localhost` as the host and select the extracted Payara installation directory.
6. Select the Java 8 runtime configured above.
7. Select the default `domain1` domain and finish the wizard.
8. Double-click the new server and verify that its Runtime Environment still points to Java 8.

### 3. Import and publish the backend WAR

1. Select **File > Import > Web > WAR file**.
2. Choose `server/TicTacToeServer1.war` from this repository.
3. Name the Eclipse project `tictactoe-server` and select the Payara 5 target runtime.
4. Open **Project > Properties > Web Project Settings** and set the context root to exactly `tictactoe`.

   This context root is required because `js/api.js` calls `http://localhost:8080/tictactoe/tictactoeserver` by default. If Eclipse deploys the WAR as `/TicTacToeServer1`, the UI will report that the server is offline.

5. In the Servers view, right-click Payara and select **Add and Remove**.
6. Add `tictactoe-server`, finish, and start the server.
7. Wait for the Eclipse Console to report a successful deployment.

Verify the server in a browser:

```text
http://localhost:8080/tictactoe/tictactoeserver/check?key=TEST01
```

The response should initially be `false`.

### 4. Run the frontend with Live Server on port 5500

The supplied WAR hosts only the servlet backend. Run the current root-level `index.html`, `css`, `js`, and `assets` separately with Live Server:

1. Start Payara and confirm that the backend is available on port `8080`.
2. Open this repository as the Live Server workspace/root.
3. Set the Live Server port to `5500` if it is not already the default.
4. Start Live Server from `index.html`.
5. Open:

   ```text
   http://localhost:5500/
   ```

The frontend calls `http://localhost:8080/tictactoe/tictactoeserver` by default. The WAR supplies the required cross-origin response header, so the UI on port `5500` can call the Payara backend on port `8080`. The connection badge should change to **Server ready**.

### 5. Test with two application instances

1. Open the UI URL in two tabs or windows.
2. In the first instance, generate or enter a 4-6 character alphanumeric key and select **Create game**.
3. In the second instance, enter the same key and select **Join with key**.
4. Confirm that X moves first, occupied cells cannot be selected, turns alternate, and both boards synchronize.
5. Test horizontal, vertical, and diagonal wins; a full-board draw; rematch; and Exit.
6. Enter the active key in a third tab and select **Join with key** to test spectator mode.

### Testing on a physical phone

The default API URL uses `localhost`, which means the same computer as the browser. On a phone, `localhost` refers to the phone, not the development PC.

Before `js/app.js` is loaded in the deployed UI, set the API base to the development PC's LAN address:

```html
<script>
  window.TICTACTOE_API_BASE = "http://192.168.1.10:8080/tictactoe/tictactoeserver";
</script>
<script type="module" src="js/app.js"></script>
```

Replace `192.168.1.10` with the PC's current IPv4 address. Configure Live Server to accept LAN connections, allow inbound TCP ports `5500` and `8080` through the firewall, and connect both devices to the same network. Then open `http://192.168.1.10:5500/` on the phone.

## Test the endpoints with Postman

Start Payara before testing. These servlet endpoints use the `GET` method, query parameters, no authentication, and no request body.

### 1. Create a Postman environment

Add these variables:

| Variable | Initial/current value |
|---|---|
| `baseUrl` | `http://localhost:8080/tictactoe/tictactoeserver` |
| `gameKey` | `TEST01` |

Select the environment before sending requests. If Postman is running in a browser, enable the Postman Desktop Agent so it can reach `localhost`.

### 2. Create and run the requests in order

Create a collection and add the following requests. Parameters may be entered in Postman's **Params** tab instead of typing the full query string.

| Order | Request name | Method and URL | Expected response |
|---:|---|---|---|
| 1 | Check unused key | `GET {{baseUrl}}/check?key={{gameKey}}` | `false` |
| 2 | Create player X | `GET {{baseUrl}}/createGame?key={{gameKey}}` | `X` |
| 3 | Check waiting game | `GET {{baseUrl}}/check?key={{gameKey}}` | `false` |
| 4 | Join player O | `GET {{baseUrl}}/createGame?key={{gameKey}}` | `O` |
| 5 | Check started game | `GET {{baseUrl}}/check?key={{gameKey}}` | `true` |
| 6 | Read empty board | `GET {{baseUrl}}/board?key={{gameKey}}` | A colon-delimited empty board |
| 7 | Place X | `GET {{baseUrl}}/move?key={{gameKey}}&tile=X&y=0&x=0` | Board text with `X` in the first cell |
| 8 | Read updated board | `GET {{baseUrl}}/board?key={{gameKey}}` | The same updated board |
| 9 | Test occupied cell | `GET {{baseUrl}}/move?key={{gameKey}}&tile=O&y=0&x=0` | `[TAKEN]` |
| 10 | Remove game | `GET {{baseUrl}}/reset?key={{gameKey}}` | `[EXIT]` |
| 11 | Confirm removal | `GET {{baseUrl}}/check?key={{gameKey}}` | `false` |

Always send **Remove game** at the end of a test run so the in-memory room is cleared. If a previous run stopped early, send the reset request before starting again. A server error or unexpected HTML page usually means the WAR context root is not `tictactoe` or Payara is not running on port `8080`.

## Requirements audit

This audit compares the supplied project brief with the current frontend source and packaged WAR. **Existing** means the behavior is present in the normal application flow. **Partial** means the UI implements it but the server does not enforce it authoritatively.

| Project requirement | Status | Current implementation |
|---|---|---|
| 3x3 board and three-in-a-row objective | Existing | Nine grid cells and all eight winning lines are defined in `index.html` and `js/game.js`. |
| Exactly two players with different X/O marks | Existing | The WAR assigns X to the room creator and O to the second player; a third join opens spectator mode instead. |
| Do not start until two players are ready | Existing | Player X remains in the waiting view until `/check` reports two players. |
| First player/X moves first | Partial | `currentTurn()` and disabled cells enforce this in the UI, but the WAR accepts a direct O move first. |
| Alternate turns | Partial | The UI derives the next turn from X/O counts and only enables the active player; the WAR does not validate turn order. |
| Reject occupied or otherwise invalid moves | Partial | The UI disables occupied cells and the WAR rejects occupied coordinates, but the WAR does not validate tile values, coordinate bounds, or whether the round already ended. |
| Detect horizontal, vertical, and diagonal wins | Existing | `resultFor()` checks all eight winning lines and highlights the winning cells. |
| Detect a full-board draw and restart | Existing | Draws are detected and an automatic rematch countdown starts. |
| HTML5 layout | Existing | Semantic sections, forms, buttons, status regions, and dialogs are used. |
| CSS design | Existing | Component styles, flexible grids, animation, and responsive breakpoints are present. |
| JavaScript functions | Existing | API, rules, rendering, polling, and application state are split across modules. |
| Two synchronized application instances | Existing | Both players poll the shared servlet board and render updates independently. |
| Responsive mobile and desktop design | Existing | Mobile-first rules, desktop breakpoints, fluid sizing, and short-screen adjustments are present. |
| Overlays/pop-ups instead of alerts | Existing | Instructions, errors, exit confirmation, results, and rematches use the custom modal; no `alert()`, `confirm()`, or `prompt()` calls exist. |
| Join a game using a key | Existing | The Join flow validates the key and joins an existing waiting room. |
| User-generated or auto-generated key | Existing | Keys may be typed or generated with `crypto.randomUUID()`. |
| Start a new game with the same player | Existing | Win and draw flows support rematches under the same room key. |
| End the game when a player exits | Existing | Exit/reset removes the room; the other player is returned to the lobby on the next poll. `pagehide` also attempts a keepalive reset. |

## Optional features completed

| Optional feature | Status | Notes |
|---|---|---|
| Spectator view (+3) | Done | A third participant can watch the live board without placing tiles. |
| Score tracking (+3) | Done with scope limitation | Scores persist for the active room in browser `localStorage` and synchronize between same-origin tabs. They do not synchronize across different browsers or devices because the WAR has no score endpoint. |

## Additional features added

- Player names and selectable avatars.
- Copyable and cross-tab shared room keys.
- Animated game-start overlay and win highlighting.
- Connection status, retry polling, and offline feedback.
- Responsive scoreboard and player cards.
- Spectator/player call-out reactions between same-origin tabs.
- Instructions modal, custom toasts, and non-blocking error dialogs.
- ARIA labels/status regions, keyboard-native controls, and reduced-motion support.

## Missing required feature

### Authoritative server-side game-rule validation

This is the only strict required-feature gap found in the code audit.

The browser correctly prevents normal users from moving out of turn, selecting occupied cells, or continuing after a result. However, the WAR's move handler accepts the caller-provided `tile`, `x`, and `y`; its board method only checks whether the selected cell is empty. A manually constructed request can therefore:

- submit O as the first move;
- submit the same symbol repeatedly;
- submit a symbol other than X or O;
- attempt coordinates outside the 3x3 board; or
- continue submitting moves after a win or draw.

To fully satisfy the requirement that the **system enforce** correct turn order and valid moves, the Java server should own the current turn, validate the assigned player/token and coordinate range, reject moves after a result, and return explicit error responses. Frontend validation should remain for immediate feedback, but it should not be the only rules layer.

## Known operational limitations

- Rooms and boards are stored only in server memory. Restarting Payara clears every active game.
- Player profiles, reactions, and optional scores use browser `localStorage`; only board state is synchronized by the WAR across different devices.
- The frontend loads Lucide icons from a CDN. The game remains usable if the CDN is unavailable, but icons may not render.
- Payara 5.2022.5 Community is end-of-life. Keep this setup isolated for the Java 8 assignment rather than exposing it as an internet-facing production service.

## Game asset resources

Thank you to the following resources and communities for the Persona 5 Royal UI and game assets:

- [Game UI Database](https://www.gameuidatabase.com/gameData.php?id=72)
- [Persona 5 Rainmeter theme assets](https://www.reddit.com/r/Rainmeter/comments/c88qw8/persona_5_rainmeter_theme_assets_posted_in/?solution=e60418052a25e9bfe60418052a25e9bf&js_challenge=1&token=7afd7253fec22262ff1c52b1703fe9ecaa080a584e3b6087eb5769d73cd5bc42&jsc_orig_r=)
- [Persona 5 menu art assets](https://www.reddit.com/r/Persona5/comments/6uu246/persona_5s_menu_art_assets/)
- [Persona 5 Royal press screenshots](https://press.kochmedia.com/Persona-5-Royal#?tab=Screenshots-1&scrollto=)
- [Persona 5 UI assets on Pinterest](https://www.pinterest.com/ideas/persona-5-ui-assets/899969743337/)
- [Persona 5 Royal sprites](https://www.spriters-resource.com/playstation_4/persona5royal/)

And of course, thank you to Atlus and SEGA for creating Persona 5 Royal.