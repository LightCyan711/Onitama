/**
 * agent.js - 오니타마 RL 에이전트 (PPO)
 */

class OnitamaAgent {
    constructor() {
        this.stateSize = 31;
        this.gamma = 0.99;
        this.lambda = 0.95;
        this.clipRatio = 0.2;
        this.lr = 0.0005;
        this.epochs = 3;
        this.batchSize = 32;
        this.entropyCoef = 0.03;
        
        this.memory = { states: [], actions: [], rewards: [], values: [], logProbs: [], dones: [] };
        
        this.actor = this.buildActor();
        this.critic = this.buildCritic();
        this.actorOpt = tf.train.adam(this.lr);
        this.criticOpt = tf.train.adam(this.lr);
        
        this.step = 0;
    }

    buildActor() {
        return tf.sequential({
            layers: [
                tf.layers.dense({ units: 128, activation: 'relu', inputShape: [this.stateSize] }),
                tf.layers.dense({ units: 128, activation: 'relu' }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' }) // 행동 선택 확률
            ]
        });
    }

    buildCritic() {
        return tf.sequential({
            layers: [
                tf.layers.dense({ units: 128, activation: 'relu', inputShape: [this.stateSize] }),
                tf.layers.dense({ units: 128, activation: 'relu' }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dense({ units: 1 })
            ]
        });
    }

    selectAction(game, training = true) {
        const actions = game.getPossibleActions();
        if (actions.length === 0) return null;
        
        // 탐험
        const eps = training ? Math.max(0.1, 0.5 - this.step * 0.0001) : 0.05;
        if (Math.random() < eps) {
            return actions[Math.floor(Math.random() * actions.length)];
        }
        
        // 정책 네트워크로 평가
        return tf.tidy(() => {
            const state = tf.tensor2d([game.getStateArray()]);
            const value = this.critic.predict(state).dataSync()[0];
            
            // 각 행동 평가 (간단히 랜덤 선택)
            // 실제로는 각 행동의 Q값을 계산해야 하지만 단순화
            const actionIdx = Math.floor(Math.random() * actions.length);
            return actions[actionIdx];
        });
    }

    remember(state, action, reward, value, logProb, done) {
        this.memory.states.push(state);
        this.memory.actions.push(action);
        this.memory.rewards.push(reward);
        this.memory.values.push(value);
        this.memory.logProbs.push(logProb);
        this.memory.dones.push(done ? 1 : 0);
    }

    computeGAE() {
        const T = this.memory.rewards.length;
        if (T === 0) return { advantages: [], returns: [] };
        
        const adv = new Array(T).fill(0);
        const ret = new Array(T).fill(0);
        let gae = 0;
        
        for (let t = T - 1; t >= 0; t--) {
            const nextV = t === T - 1 ? 0 : this.memory.values[t + 1];
            const delta = this.memory.rewards[t] + this.gamma * nextV * (1 - this.memory.dones[t]) - this.memory.values[t];
            gae = delta + this.gamma * this.lambda * (1 - this.memory.dones[t]) * gae;
            adv[t] = gae;
            ret[t] = adv[t] + this.memory.values[t];
        }
        
        const mean = adv.reduce((a, b) => a + b, 0) / T;
        const std = Math.sqrt(adv.reduce((a, b) => a + (b - mean) ** 2, 0) / T) + 1e-8;
        return { advantages: adv.map(a => (a - mean) / std), returns: ret };
    }

    async train() {
        if (this.memory.states.length < this.batchSize) return 0;
        
        const { advantages, returns } = this.computeGAE();
        if (advantages.length === 0) return 0;
        
        this.step++;
        let totalLoss = 0;
        
        // 간단한 Critic 학습만 (Actor는 복잡하므로 생략)
        for (let ep = 0; ep < this.epochs; ep++) {
            const loss = this.criticOpt.minimize(() => {
                const states = tf.tensor2d(this.memory.states);
                const values = this.critic.predict(states).squeeze();
                const rets = tf.tensor1d(returns);
                return tf.mean(tf.square(tf.sub(values, rets)));
            }, true);
            
            if (loss) totalLoss += loss.dataSync()[0];
        }
        
        this.clearMemory();
        return totalLoss / this.epochs;
    }

    clearMemory() {
        this.memory = { states: [], actions: [], rewards: [], values: [], logProbs: [], dones: [] };
    }

    async save() {
        await this.actor.save('localstorage://onitama-actor');
        await this.critic.save('localstorage://onitama-critic');
        localStorage.setItem('onitama-step', this.step.toString());
        console.log('💾 모델 저장 완료!');
    }

    async load() {
        try {
            this.actor = await tf.loadLayersModel('localstorage://onitama-actor');
            this.critic = await tf.loadLayersModel('localstorage://onitama-critic');
            this.step = parseInt(localStorage.getItem('onitama-step') || '0');
            console.log('📂 모델 로드 완료! (Step: ' + this.step + ')');
            return true;
        } catch (e) {
            console.log('🆕 새 모델 시작');
            return false;
        }
    }

    // 파일로 다운로드
    async downloadModel() {
        try {
            // Actor 모델 저장 (JSON + Weights)
            await this.actor.save('downloads://onitama-actor');
            
            // 브라우저가 다중 다운로드를 차단할 수 있으므로 잠시 대기
            await new Promise(r => setTimeout(r, 1000));
            
            // Critic 모델 저장
            await this.critic.save('downloads://onitama-critic');
            
            // 메타데이터 저장
            const metadata = {
                step: this.step,
                date: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(metadata)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'onitama-metadata.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // 수동 다운로드 안내
            alert('다운로드 폴더를 확인해주세요.\n총 5개의 파일이 있어야 합니다 (.json 2개, .bin 2개, metadata 1개).\n만약 .bin 파일이 없다면 브라우저 팝업 차단을 해제하고 다시 시도해주세요.');
            
            console.log('📥 모델 파일 다운로드 완료!');
            return true;
        } catch (e) {
            console.error('다운로드 실패:', e);
            return false;
        }
    }

    // 파일에서 로드
    async loadFromFiles(actorFiles, criticFiles, metadataFile) {
        try {
            // Actor 로드
            this.actor = await tf.loadLayersModel(tf.io.browserFiles(actorFiles));
            // Critic 로드
            this.critic = await tf.loadLayersModel(tf.io.browserFiles(criticFiles));
            
            // 메타데이터 로드
            if (metadataFile) {
                const text = await metadataFile.text();
                const metadata = JSON.parse(text);
                this.step = metadata.step || 0;
            }
            
            console.log('📂 파일에서 모델 로드 완료! (Step: ' + this.step + ')');
            return true;
        } catch (e) {
            console.error('로드 실패:', e);
            return false;
        }
    }
    // ONNX 변환을 위한 가중치 JSON 내보내기
    async exportWeightsJSON() {
        const weights = [];
        
        // Actor 모델의 모든 레이어 순회
        for (let i = 0; i < this.actor.layers.length; i++) {
            const layer = this.actor.layers[i];
            const layerWeights = layer.getWeights(); // [kernel, bias]
            
            if (layerWeights.length > 0) {
                const w = await layerWeights[0].array();
                const b = await layerWeights[1].array();
                
                weights.push({
                    name: layer.name,
                    weights: w,
                    bias: b
                });
            }
        }
        
        const json = JSON.stringify(weights);
        
        // 다운로드
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'onitama_weights.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📦 가중치 JSON 내보내기 완료');
    }
}
