const ws = new WebSocket('https://compile-backend-2.onrender.com');
ws.onopen = () => ws.send(JSON.stringify({ type: 'join', room: 'room1' }));

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'player_id') {
        console.log('Your player number:', message.id);
    }
    if (message.type === 'game_action') {
        receiveFromServer(message);
    }
    if (message.type === 'status') {
        console.log(message.message);
    }
};

const deck = [
    { name: 'INFECT', type: 'Virus', effect: 'Opponent discards a card from hand.' },
    { name: 'FIREWALL', type: 'Program', effect: 'Block the next attack.' },
    { name: 'DDoS', type: 'Virus', effect: 'Opponent skips next turn.' },
    { name: 'ENCRYPT', type: 'Program', effect: 'Draw 2 extra cards.' },
    { name: 'FORMAT C:', type: 'Command', effect: 'Clear opponent\'s field.' },
];

const yourState = {
    hand: [],
    deck: [...deck],
    trash: [],
    protocols: [{ compiled: false }, { compiled: false }, { compiled: false }],
    lines: [[], [], []],
    control: false,
};

let isYourTurn = true;

function render() {
    renderHand();
    renderProtocols();
    renderLines();
    updateControlStatus();
    updateTurnIndicator();
}

function renderHand() {
    const handContainer = document.getElementById('hand-cards');
    handContainer.innerHTML = '';
    yourState.hand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.classList.add('card');
        cardEl.innerHTML = `<strong>${card.name}</strong><br>(${card.type})<br><small>${card.effect}</small>`;
        cardEl.addEventListener('click', () => selectCard(index));
        handContainer.appendChild(cardEl);
    });
}

function renderProtocols() {
    const playerProtocols = document.getElementById('player-protocols');
    playerProtocols.innerHTML = '';
    yourState.protocols.forEach(protocol => {
        const protocolEl = document.createElement('div');
        protocolEl.classList.add('card');
        protocolEl.textContent = protocol.compiled ? 'Compiled' : 'Loading...';
        playerProtocols.appendChild(protocolEl);
    });
}

function renderLines() {
    const playerLines = document.getElementById('player-lines');
    playerLines.innerHTML = '';
    yourState.lines.forEach(line => {
        const lineEl = document.createElement('div');
        lineEl.classList.add('card');
        if (line.length > 0) {
            const lastCard = line[line.length - 1];
            lineEl.innerHTML = `<strong>${lastCard.name}</strong><br>(${lastCard.type})<br><small>${lastCard.effect}</small>`;
        } else {
            lineEl.textContent = 'Empty';
        }
        playerLines.appendChild(lineEl);
    });
}

function updateControlStatus() {
    document.getElementById('control-status').textContent =
        `Control: ${yourState.control ? 'Yours' : 'Neutral'}`;
}

function updateTurnIndicator() {
    document.getElementById('turn-indicator').textContent =
        isYourTurn ? 'Your Turn' : "Opponent's Turn";
}

let selectedCardIndex = null;

function selectCard(index) {
    selectedCardIndex = index;
}

function playSelectedCard() {
    if (selectedCardIndex === null || !isYourTurn) return;
    yourState.lines[0].push(yourState.hand[selectedCardIndex]);
    yourState.hand.splice(selectedCardIndex, 1);
    selectedCardIndex = null;
    render();
    sendToServer('play_card', { line: 0 });
}

function flipCard() {
    alert('Card flipped (placeholder)');
}

function refreshHand() {
    while (yourState.hand.length < 5 && yourState.deck.length > 0) {
        yourState.hand.push(yourState.deck.pop());
    }
    render();
}

function endTurn() {
    isYourTurn = false;
    render();
    sendToServer('end_turn');
}

function checkControl() {
    yourState.control = yourState.lines.filter(line => line.length > 0).length >= 2;
    updateControlStatus();
}

function sendToServer(action, payload = {}) {
    ws.send(JSON.stringify({
        type: 'game_action',
        action: action,
        payload: payload,
    }));
}

function receiveFromServer(update) {
    console.log(`Received from server:`, update);
}

document.getElementById('play-card').addEventListener('click', () => {
    playSelectedCard();
    checkControl();
});

document.getElementById('flip-card').addEventListener('click', flipCard);
document.getElementById('refresh-hand').addEventListener('click', refreshHand);
document.getElementById('end-turn').addEventListener('click', endTurn);

refreshHand();
render();
