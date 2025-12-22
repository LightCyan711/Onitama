/**
 * onnx_agent.js - ONNX Runtime Web을 사용하는 에이전트
 */

class OnitamaOnnxAgent {
    constructor() {
        this.session = null;
        this.isLoading = false;
        this.isReady = false;
    }

    async load(modelPath) {
        this.isLoading = true;
        try {
            // ONNX Runtime Web 세션 생성
            // wasm 백엔드를 사용하여 호환성 확보
            this.session = await ort.InferenceSession.create(modelPath, {
                executionProviders: ['wasm']
            });
            
            this.isReady = true;
            console.log('🤖 ONNX 모델 로드 완료:', modelPath);
            return true;
        } catch (e) {
            console.error('모델 로드 실패:', e);
            alert('ONNX 모델 로드에 실패했습니다. 콘솔을 확인해주세요.');
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    async selectAction(game) {
        if (!this.isReady || !this.session) return null;

        const actions = game.getPossibleActions();
        if (actions.length === 0) return null;

        // 상태 배열 가져오기 (31차원)
        const stateArray = game.getStateArray();
        
        // 최고의 행동을 찾기 위한 평가
        let bestAction = null;
        let bestScore = -Infinity;

        // 단순화를 위해 랜덤성 약간 부여 (너무 기계적이지 않게)
        if (Math.random() < 0.1) {
            return actions[Math.floor(Math.random() * actions.length)];
        }

        // 현재 Actor 모델은 '이 상태가 얼마나 좋은가'를 직접 평가하지 않고
        // '행동할 확률'을 출력하거나 
        // 혹은 Critic(가치) 모델을 써야 하는데, 
        // 여기서는 Actor 모델(Policy)을 사용하여 '어떤 행동을 할지' 결정합니다.
        
        // 하지만 PPO Actor 구조상 (Input->Scalar Probability) 혹은 (Input->Action Probabilities) 인데
        // 현재 구현된 Actor는 (Input->1 Scalar Sigmoid) 구조입니다 (agent.js 참고).
        // 이는 보통 '이 상태의 가치' 또는 '이 상태에서 행동할 확률'을 의미하는데,
        // PPO 구현에서는 보통 'value'는 critic이, 'action logit'은 actor가 담당합니다.
        
        // 기존 agent.js의 selectAction 로직을 보면:
        // Critic(Value Network)을 사용하여 다음 상태의 가치를 평가하여 행동을 결정하는 것이 아니라
        // "단순히 랜덤" + "Critic 값 확인(실제 선택엔 안쓰임)" 구조로 되어 있었습니다.
        // 따라서 ONNX 버전에서는 "가능한 행동 중 하나를 무작위로 선택" 하거나 
        // Actor 모델이 '승리 확률(Value)'을 나타낸다고 가정하고
        // "행동을 한 후의 상태"를 모델에 넣어 평가하는 방식을 쓰겠습니다.

        // 모든 가능한 행동에 대해 시뮬레이션
        for (const action of actions) {
            // 가상으로 행동 수행
            const gameClone = game.clone();
            gameClone.makeMove(action);
            
            // 그 상태를 평가 (이 상태는 '상대방 턴'의 상태임)
            // 따라서 값이 낮을수록(상대에게 불리할수록) 나에게 좋은 것일 수 있음.
            // 혹은 단순히 '내 승리 확률'이라면 높을수록 좋음.
            
            // 모델 추론
            const score = await this.evaluateState(gameClone.getStateArray());
            
            // 점수 비교 (약간의 랜덤성 추가하여 같은 상황에서 변화를 줌)
            const noisyScore = score + (Math.random() * 0.05);
            
            if (noisyScore > bestScore) {
                bestScore = noisyScore;
                bestAction = action;
            }
        }

        return bestAction || actions[0];
    }

    async evaluateState(stateArray) {
        try {
            // 입력 텐서 생성 (Float32Array, shape: [1, 31])
            const data = Float32Array.from(stateArray);
            const tensor = new ort.Tensor('float32', data, [1, 31]);
            
            // 추론 실행
            const feeds = { input: tensor }; // 'input' 이름은 convert_to_onnx.py에서 지정함
            const results = await this.session.run(feeds);
            
            // 결과 가져오기 (첫 번째 출력의 첫 번째 값)
            // 레이어 이름은 모델마다 다를 수 있으므로 Object.values로 첫번째 결과 가져옴
            const output = Object.values(results)[0];
            return output.data[0];
            
        } catch (e) {
            console.error('추론 에러:', e);
            return 0;
        }
    }
}
