/**
 * main.js - 오니타마 메인 로직 (카드 선택 시스템 개선)
 */

let trainUI, playUI, agent;
let trainGame, playGame;
let isTraining = false;
let stats = { ep: 0, wins: 0, recent: [], turns: [] };

// 플레이 모드 상태
let selectedPiece = null;
let selectedCard = null;
let possibleMoves = [];

// DOM
const tabTrain = document.getElementById('tab-train');
const tabPlay = document.getElementById('tab-play');
const panelTrain = document.getElementById('panel-train');
const panelPlay = document.getElementById('panel-play');
const btnStart = document.getElementById('btn-start-train');
const btnStop = document.getElementById('btn-stop-train');
const btnSave = document.getElementById('btn-save');
const btnReset = document.getElementById('btn-reset');
const btnNewGame = document.getElementById('btn-new-game');
const trainSpeed = document.getElementById('train-speed');
const speedVal = document.getElementById('speed-display');

// 통계
const statEp = document.getElementById('stat-ep');
const statWr = document.getElementById('stat-wr');
const statTurns = document.getElementById('stat-turns');
const statLoss = document.getElementById('stat-loss');

async function init() {
    trainUI = new OnitamaUI('canvas-train');
    playUI = new OnitamaUI('canvas-play');
    
    trainGame = new OnitamaGame();
    playGame = new OnitamaGame();
    
    agent = new OnitamaAgent();
    await agent.load();
    
    trainUI.drawBoard(trainGame);
    playUI.drawBoard(playGame);
    
    setupCardClickHandlers();
    
    console.log('🥋 오니타마 초기화 완료');
}

// 카드 클릭 핸들러 설정
function setupCardClickHandlers() {
    document.addEventListener('click', (e) => {
        if (panelPlay.classList.contains('hidden')) return;
        
        const cardEl = e.target.closest('.card');
        if (cardEl && cardEl.closest('#player-cards')) {
            const cards = Array.from(document.querySelectorAll('#player-cards .card'));
            const cardIdx = cards.indexOf(cardEl);
            
            if (cardIdx !== -1) {
                selectCard(cardIdx);
            }
        }
    });
}

// 카드 선택
function selectCard(cardIdx) {
    selectedCard = cardIdx;
    
    // 모든 카드 선택 해제
    document.querySelectorAll('#player-cards .card').forEach(c => c.classList.remove('selected'));
    
    // 선택한 카드 하이라이트
    const cards = document.querySelectorAll('#player-cards .card');
    if (cards[cardIdx]) {
        cards[cardIdx].classList.add('selected');
    }
    
    // 선택한 말이 있으면 이동 가능 범위 업데이트
    if (selectedPiece) {
        updatePossibleMoves();
    }
}

// 이동 가능한 위치 계산
function updatePossibleMoves() {
    possibleMoves = [];
    
    if (!selectedPiece || selectedCard === null) return;
    
    const [px, py] = selectedPiece;
    const cardId = playGame.redCards[selectedCard];
    const card = getCard(cardId);
    
    // 카드의 각 이동 패턴 확인
    card.moves.forEach(([dx, dy]) => {
        const newX = px + dx;
        const newY = py + dy;
        
        if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5) {
            const target = playGame.board[newY][newX];
            // 내 말이 아니면 이동 가능
            if (target <= 0) {
                possibleMoves.push([newX, newY]);
            }
        }
    });
    
    // 화면 다시 그리기
    playUI.drawBoard(playGame);
    playUI.drawHighlight(selectedPiece[0], selectedPiece[1]);
    possibleMoves.forEach(([x, y]) => {
        playUI.drawMoveIndicator(x, y);
    });
}

// 탭 전환
tabTrain.onclick = () => {
    tabTrain.classList.add('active');
    tabPlay.classList.remove('active');
    panelTrain.classList.remove('hidden');
    panelPlay.classList.add('hidden');
};

tabPlay.onclick = () => {
    tabPlay.classList.add('active');
    tabTrain.classList.remove('active');
    panelPlay.classList.remove('hidden');
    panelTrain.classList.add('hidden');
    playGame.reset();
    playUI.drawBoard(playGame);
    playUI.renderCards(playGame, true);
    selectedPiece = null;
    selectedCard = null;
    possibleMoves = [];
};

trainSpeed.oninput = () => {
    speedVal.textContent = trainSpeed.value + 'x';
};

btnStart.onclick = () => {
    isTraining = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    train();
};

btnStop.onclick = () => {
    isTraining = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
};

btnSave.onclick = async () => {
    await agent.save();
    alert('모델이 브라우저에 저장되었습니다!');
};

// 파일로 다운로드
document.getElementById('btn-download').onclick = async () => {
    const success = await agent.downloadModel();
    if (success) {
        alert('모델 파일이 다운로드되었습니다!\n다운로드 폴더를 확인하세요.');
    } else {
        alert('다운로드 실패!');
    }
};

// ONNX용 가중치 저장
document.getElementById('btn-save-onnx').onclick = async () => {
    await agent.exportWeightsJSON();
    alert('ONNX 변환용 가중치 파일(onitama_weights.json)이 다운로드되었습니다.\n이 파일을 Colab에 업로드하여 변환하세요.');
};

// 파일에서 로드
document.getElementById('btn-load').onclick = () => {
    document.getElementById('file-input').click();
};

document.getElementById('file-input').onchange = async (e) => {
    const files = Array.from(e.target.files);
    
    // 파일 분류
    const actorFiles = files.filter(f => f.name.includes('actor'));
    const criticFiles = files.filter(f => f.name.includes('critic'));
    const metadataFile = files.find(f => f.name.includes('metadata'));
    
    if (actorFiles.length === 0 || criticFiles.length === 0) {
        alert('모델 파일이 부족합니다!\nactor와 critic 파일을 모두 선택해주세요.');
        return;
    }
    
    const success = await agent.loadFromFiles(actorFiles, criticFiles, metadataFile);
    if (success) {
        alert('모델이 로드되었습니다!\n학습을 이어서 진행할 수 있습니다.');
        trainGame.reset();
        trainUI.drawBoard(trainGame);
    } else {
        alert('로드 실패!');
    }
    
    // 파일 입력 초기화
    e.target.value = '';
};

btnReset.onclick = async () => {
    if (!confirm('모든 학습 데이터를 초기화하시겠습니까?')) return;
    
    isTraining = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    
    stats = { ep: 0, wins: 0, recent: [], turns: [] };
    updateStats();
    
    try {
        await tf.io.removeModel('localstorage://onitama-actor');
        await tf.io.removeModel('localstorage://onitama-critic');
    } catch(e) {}
    localStorage.removeItem('onitama-step');
    
    agent = new OnitamaAgent();
    trainGame.reset();
    trainUI.drawBoard(trainGame);
    
    console.log('🗑️ 초기화 완료');
};

btnNewGame.onclick = () => {
    playGame.reset();
    playUI.drawBoard(playGame);
    playUI.renderCards(playGame, true);
    selectedPiece = null;
    selectedCard = null;
    possibleMoves = [];
};

// 학습 루프
async function train() {
    while (isTraining) {
        const sp = parseInt(trainSpeed.value);
        
        for (let i = 0; i < sp; i++) {
            await playEpisode();
        }
        
        if (agent.memory.states.length >= agent.batchSize) {
            const loss = await agent.train();
            statLoss.textContent = loss.toFixed(4);
        }
        
        updateStats();
        trainUI.drawBoard(trainGame);
        
        if (stats.ep % 50 === 0 && stats.ep > 0) {
            await agent.save();
        }
        
        await new Promise(r => setTimeout(r, 16));
    }
}

// Self-Play 에피소드
async function playEpisode() {
    trainGame.reset();
    let turns = 0;
    
    while (!trainGame.gameOver && turns < 100) {
        const action = agent.selectAction(trainGame);
        if (!action) break;
        
        const state = trainGame.getStateArray();
        trainGame.makeMove(action);
        turns++;
        
        let reward = 0;
        if (trainGame.gameOver) {
            if (trainGame.winner === 1) reward = 1;
            else if (trainGame.winner === -1) reward = -1;
        }
        
        agent.remember(state, action, reward, 0, 0, trainGame.gameOver);
    }
    
    stats.ep++;
    if (trainGame.winner === 1) stats.wins++;
    stats.recent.push(trainGame.winner === 1 ? 1 : 0);
    stats.turns.push(turns);
    
    if (stats.recent.length > 100) {
        stats.recent.shift();
        stats.turns.shift();
    }
}

function updateStats() {
    statEp.textContent = stats.ep;
    
    const wr = stats.recent.length > 0 
        ? Math.round(stats.recent.reduce((a,b) => a+b, 0) / stats.recent.length * 100)
        : 0;
    statWr.textContent = wr + '%';
    
    const avgTurns = stats.turns.length > 0
        ? Math.round(stats.turns.reduce((a,b) => a+b, 0) / stats.turns.length)
        : 0;
    statTurns.textContent = avgTurns;
}

// 플레이 모드 - 보드 클릭
document.getElementById('canvas-play').onclick = (e) => {
    if (playGame.gameOver) return;
    if (playGame.currentPlayer !== 1) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = playUI.getBoardPosition(x, y);
    
    if (!pos) return;
    const [clickX, clickY] = pos;
    
    // 말 선택
    if (!selectedPiece) {
        const piece = playGame.board[clickY][clickX];
        if (piece > 0) {
            selectedPiece = [clickX, clickY];
            playUI.drawBoard(playGame);
            playUI.drawHighlight(clickX, clickY);
            
            // 카드가 선택되어 있으면 이동 범위 표시
            if (selectedCard !== null) {
                updatePossibleMoves();
            }
        }
    } else {
        // 이동
        if (selectedCard === null) {
            // 카드 선택 안 됨
            alert('먼저 카드를 선택하세요!');
            return;
        }
        
        // 이동 가능한 위치인지 확인
        const isValidMove = possibleMoves.some(([mx, my]) => mx === clickX && my === clickY);
        
        if (isValidMove) {
            // 이동 실행
            const action = {
                from: selectedPiece,
                to: [clickX, clickY],
                cardIdx: selectedCard
            };
            
            playGame.makeMove(action);
            selectedPiece = null;
            selectedCard = null;
            possibleMoves = [];
            
            playUI.drawBoard(playGame);
            playUI.renderCards(playGame, true);
            
            // 게임 종료 체크
            if (playGame.gameOver) {
                setTimeout(() => {
                    if (playGame.winner === 1) {
                        alert('🏆 축하합니다! 승리하셨습니다!');
                    } else if (playGame.winner === -1) {
                        alert('😢 패배했습니다. 다시 도전해보세요!');
                    } else {
                        alert('⚖️ 무승부입니다!');
                    }
                }, 100);
                return;
            }
            
            // AI 턴
            if (!playGame.gameOver) {
                setTimeout(() => {
                    const aiAction = agent.selectAction(playGame, false);
                    if (aiAction) {
                        playGame.makeMove(aiAction);
                        playUI.drawBoard(playGame);
                        playUI.renderCards(playGame, true);
                        
                        // AI 이동 후 게임 종료 체크
                        if (playGame.gameOver) {
                            setTimeout(() => {
                                if (playGame.winner === 1) {
                                    alert('🏆 축하합니다! 승리하셨습니다!');
                                } else if (playGame.winner === -1) {
                                    alert('😢 패배했습니다. 다시 도전해보세요!');
                                } else {
                                    alert('⚖️ 무승부입니다!');
                                }
                            }, 100);
                        }
                    }
                }, 500);
            }
        } else {
            // 다른 말 선택
            const piece = playGame.board[clickY][clickX];
            if (piece > 0) {
                selectedPiece = [clickX, clickY];
                updatePossibleMoves();
            } else {
                selectedPiece = null;
                selectedCard = null;
                possibleMoves = [];
                playUI.drawBoard(playGame);
                playUI.renderCards(playGame, true);
            }
        }
    }
};

init();
