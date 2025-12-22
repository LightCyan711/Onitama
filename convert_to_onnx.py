import json
import numpy as np
import tensorflow as tf
import tf2onnx
import os

# Keras 3 호환성 설정을 시도 (동작하지 않을 수 있음, Functional API가 더 확실함)
os.environ["TF_USE_LEGACY_KERAS"] = "1"

def build_actor_model():
    """JavaScript와 동일한 구조의 Keras 모델 생성 (Functional API)"""
    # Functional API 사용 (Keras 3/ONNX 변환 호환성이 더 좋음)
    inputs = tf.keras.Input(shape=(31,), name="input")
    
    x = tf.keras.layers.Dense(128, activation='relu')(inputs)
    x = tf.keras.layers.Dense(128, activation='relu')(x)
    x = tf.keras.layers.Dense(64, activation='relu')(x)
    outputs = tf.keras.layers.Dense(1, activation='sigmoid')(x)
    
    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    return model

def load_weights_and_convert():
    json_path = 'onitama_weights.json'
    if not os.path.exists(json_path):
        print(f"오류: '{json_path}' 파일을 찾을 수 없습니다.")
        return

    print("1. 모델 구조 생성 중 (Functional API)...")
    model = build_actor_model()
    
    # 모델 빌드 확실히 하기 위해 더미 데이터 통과
    dummy_input = tf.zeros((1, 31))
    _ = model(dummy_input)

    print(f"2. 가중치 로드 중: {json_path}")
    with open(json_path, 'r') as f:
        weights_data = json.load(f)

    # Functional Model의 레이어들 (InputLayer 포함될 수 있음)
    # 가중치가 있는 레이어만 필터링
    weighted_layers = [l for l in model.layers if len(l.weights) > 0]
    
    for i, layer_data in enumerate(weights_data):
        if i >= len(weighted_layers):
            break
        
        target_layer = weighted_layers[i]
        print(f"  - LayerMatch: {target_layer.name} <- JSON ({layer_data['name']})")
        
        w = np.array(layer_data['weights'], dtype=np.float32)
        b = np.array(layer_data['bias'], dtype=np.float32)
        
        target_layer.set_weights([w, b])

    print("3. ONNX로 변환 중...")
    # opset=13이 웹 런타임 호환성이 좋음
    spec = (tf.TensorSpec((None, 31), tf.float32, name="input"),)
    
    output_path = 'onitama-actor.onnx'
    try:
        model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, opset=13)
        
        with open(output_path, "wb") as f:
            f.write(model_proto.SerializeToString())

        print("\n✅ 변환 완료!")
        print(f"생성된 파일: {output_path}")
        print("이제 이 파일을 로컬 컴퓨터의 프로젝트 폴더로 다운로드하세요.")
        
    except AttributeError as e:
        print("\n❌ 변환 오류 발생!")
        print(f"에러 메시지: {e}")
        print("\n[해결 방법]")
        print("Colab에서 Keras 버전 호환성 문제가 발생했습니다.")
        print("다음 명령어를 실행하여 tf-keras를 설치하고 다시 실행해보세요:")
        print("!pip install tf-keras")
        print("import os; os.environ['TF_USE_LEGACY_KERAS']='1'")

if __name__ == "__main__":
    load_weights_and_convert()
