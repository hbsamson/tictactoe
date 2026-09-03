import { BaseComponent } from "./base-component.js";

export class LobbyView extends BaseComponent {
    initializeElements() {
        this.container = document.createElement("section");
        this.heroCopy = document.createElement("div");
        this.eyebrow = document.createElement("p");
        this.title = document.createElement("h1");
        this.titleSpan = document.createElement("span");
        this.howTo = document.createElement("div");
        this.howToLine1 = document.createElement("span");
        this.howToLine2 = document.createElement("span");
        this.howToLine3 = document.createElement("span");
        this.howToButton = document.createElement("button");
        this.howToIcon = document.createElement("i");
        this.howToButtonLabel = document.createElement("span");
        this.form = document.createElement("form");
        this.cardHeading = document.createElement("div");
        this.cardHeadingCopy = document.createElement("div");
        this.cardEyebrow = document.createElement("p");
        this.cardTitle = document.createElement("h2");
        this.cardGrid = document.createElement("span");
        this.label = document.createElement("label");
        this.keyField = document.createElement("div");
        this.keyInput = document.createElement("input");
        this.generateKey = document.createElement("button");
        this.generateKeyIcon = document.createElement("i");
        this.copyKey = document.createElement("button");
        this.copyKeyIcon = document.createElement("i");
        this.keyHint = document.createElement("p");
        this.identityFields = document.createElement("div");
        this.avatarPicker = document.createElement("div");
        this.previousAvatar = document.createElement("button");
        this.previousAvatarIcon = document.createElement("i");
        this.avatarStage = document.createElement("div");
        this.avatarPreview = document.createElement("img");
        this.nextAvatar = document.createElement("button");
        this.nextAvatarIcon = document.createElement("i");
        this.identityControls = document.createElement("div");
        this.playerNameLabel = document.createElement("label");
        this.playerName = document.createElement("input");
        this.nameHint = document.createElement("p");
        this.playerAvatar = document.createElement("input");
        this.actions = document.createElement("div");
        this.createButton = document.createElement("button");
        this.createIcon = document.createElement("i");
        this.joinButton = document.createElement("button");
    }

    setAttributes() {
        this.container.id = "lobbyView";
        this.container.className = "lobby view";
        this.container.setAttribute("aria-labelledby", "lobbyTitle");

        this.heroCopy.className = "hero-copy";
        this.eyebrow.className = "eyebrow";
        this.eyebrow.textContent = "Two confidants | One board";
        this.title.id = "lobbyTitle";
        this.title.innerHTML = 'tic-tac-toe.<br><span>Steal the win.</span>';

        this.howTo.className = "how-to";
        this.howTo.setAttribute("aria-label", "How to play");
        this.howToLine1.innerHTML = "<b>01</b> Create a local room";
        this.howToLine2.innerHTML = "<b>02</b> Share the key";
        this.howToLine3.innerHTML = "<b>03</b> Take the grid";
        this.howToButton.id = "howToPlayButton";
        this.howToButton.className = "how-to-trigger";
        this.howToButton.type = "button";
        this.howToButton.setAttribute("aria-label", "Open detailed instructions");
        this.howToIcon.dataset.lucide = "circle-help";
        this.howToButtonLabel.textContent = "How?";

        this.form.id = "lobbyForm";
        this.form.className = "lobby-card";
        this.form.noValidate = true;

        this.cardHeading.className = "card-heading";
        this.cardEyebrow.className = "eyebrow";
        this.cardEyebrow.textContent = "Local match";
        this.cardTitle.textContent = "Start the showdown";
        this.cardGrid.className = "mini-grid";
        this.cardGrid.setAttribute("aria-hidden", "true");
        this.cardGrid.innerHTML = "xo<br>ox";

        this.label.setAttribute("for", "gameKey");
        this.label.innerHTML = 'Room ID <span class="required-mark" aria-hidden="true">*</span>';
        this.keyField.className = "key-field";
        this.keyInput.id = "gameKey";
        this.keyInput.name = "gameKey";
        this.keyInput.type = "text";
        this.keyInput.minLength = 36;
        this.keyInput.maxLength = 36;
        this.keyInput.autocomplete = "off";
        this.keyInput.spellcheck = false;
        this.keyInput.placeholder = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
        this.keyInput.pattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";
        this.keyInput.required = true;

        this.generateKey.id = "generateKeyButton";
        this.generateKey.className = "icon-button";
        this.generateKey.type = "button";
        this.generateKey.setAttribute("aria-label", "Generate a new room ID");
        this.generateKey.title = "Generate room ID";
        this.generateKeyIcon.dataset.lucide = "refresh-cw";

        this.copyKey.id = "copyLobbyKeyButton";
        this.copyKey.className = "icon-button";
        this.copyKey.type = "button";
        this.copyKey.setAttribute("aria-label", "Copy room ID");
        this.copyKey.title = "Copy room ID";
        this.copyKeyIcon.dataset.lucide = "copy";

        this.keyHint.id = "keyHint";
        this.keyHint.className = "field-hint";
        this.keyHint.textContent = "Use the generated room UUID, or paste one shared by another player.";

        this.identityFields.className = "identity-fields";
        this.avatarPicker.className = "avatar-picker";

        this.previousAvatar.id = "previousAvatarButton";
        this.previousAvatar.className = "avatar-step avatar-step-previous";
        this.previousAvatar.type = "button";
        this.previousAvatar.setAttribute("aria-label", "Previous icon");
        this.previousAvatarIcon.dataset.lucide = "chevron-left";

        this.avatarStage.className = "avatar-stage";
        this.avatarPreview.id = "playerAvatarPreview";
        this.avatarPreview.src = "assets/icons/ren.png";
        this.avatarPreview.alt = "Ren";

        this.nextAvatar.id = "nextAvatarButton";
        this.nextAvatar.className = "avatar-step avatar-step-next";
        this.nextAvatar.type = "button";
        this.nextAvatar.setAttribute("aria-label", "Next icon");
        this.nextAvatarIcon.dataset.lucide = "chevron-right";

        this.identityControls.className = "identity-controls";
        this.playerNameLabel.setAttribute("for", "playerName");
        this.playerNameLabel.textContent = "Player name";
        this.playerName.id = "playerName";
        this.playerName.name = "playerName";
        this.playerName.type = "text";
        this.playerName.maxLength = 10;
        this.playerName.autocomplete = "nickname";
        this.playerName.value = "Ren";
        this.nameHint.className = "field-hint name-hint";
        this.nameHint.textContent = "Maximum of 10 characters";
        this.playerAvatar.id = "playerAvatar";
        this.playerAvatar.name = "playerAvatar";
        this.playerAvatar.type = "hidden";
        this.playerAvatar.value = "ren";

        this.actions.className = "lobby-actions";
        this.createButton.id = "createButton";
        this.createButton.className = "button button-primary";
        this.createButton.type = "submit";
        this.createIcon.dataset.lucide = "arrow-right";
        this.joinButton.id = "joinButton";
        this.joinButton.className = "button button-secondary";
        this.joinButton.type = "button";
        this.joinButton.textContent = "Join with key";
    }

    appendElements() {
        this.container.append(this.heroCopy, this.form);

        this.heroCopy.append(this.eyebrow, this.title, this.howTo);
        this.howTo.append(this.howToLine1, this.howToLine2, this.howToLine3, this.howToButton);
        this.howToButton.append(this.howToIcon, this.howToButtonLabel);

        this.form.append(this.cardHeading, this.label, this.keyField, this.keyHint, this.identityFields, this.actions);
        this.cardHeading.append(this.cardHeadingCopy, this.cardGrid);
        this.cardHeadingCopy.append(this.cardEyebrow, this.cardTitle);
        this.keyField.append(this.keyInput, this.generateKey, this.copyKey);
        this.generateKey.append(this.generateKeyIcon);
        this.copyKey.append(this.copyKeyIcon);
        this.identityFields.append(this.avatarPicker, this.identityControls);
        this.avatarPicker.append(this.previousAvatar, this.avatarStage, this.nextAvatar);
        this.previousAvatar.append(this.previousAvatarIcon);
        this.avatarStage.append(this.avatarPreview);
        this.nextAvatar.append(this.nextAvatarIcon);
        this.identityControls.append(this.playerNameLabel, this.playerName, this.nameHint, this.playerAvatar);
        this.actions.append(this.createButton, this.joinButton);
        this.createButton.append(this.createIcon, document.createTextNode("Create game"));
    }
}
