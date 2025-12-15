// ===============================
// Three.js 模块导入
// ===============================
import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js";

// ===============================
// MediaPipe Pose 部分
// ===============================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");

canvas.width = 640;
canvas.height = 480;

const pose = new Pose({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

pose.onResults(onPoseResults);

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }
  });
  video.srcObject = stream;

  const camera = new Camera(video, {
    onFrame: async () => {
      await pose.send({ image: video });
    },
    width: 640,
    height: 480
  });

  camera.start();
}

startBtn.onclick = startCamera;

function onPoseResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    drawConnectors(
      ctx,
      results.poseLandmarks,
      POSE_CONNECTIONS,
      { color: "#00FF00", lineWidth: 4 }
    );

    drawLandmarks(
      ctx,
      results.poseLandmarks,
      { color: "#FF0000", lineWidth: 2 }
    );
  }
}

// ===============================
// Three.js 3D avatar 部分
// ===============================
const container = document.getElementById("three-container");

const scene = new THREE.Scene();

const camera3D = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);

camera3D.position.set(0, 1.2, 3);
camera3D.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// 灯光
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// 加载公开 avatar（Three.js 官方）
const loader = new GLTFLoader();
let mixer;

loader.load(
  "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
  gltf => {
    const model = gltf.scene;
    model.position.set(0, -1, 0);
    model.scale.set(1, 1, 1);
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
  },
  undefined,
  error => {
    console.error("GLTF load error:", error);
  }
);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (mixer) {
    mixer.update(clock.getDelta());
  }

  renderer.render(scene, camera3D);
}

animate();

// ===============================
// 响应窗口变化（手机旋转）
 // ===============================
window.addEventListener("resize", () => {
  const w = container.clientWidth;
  const h = container.clientHeight;

  renderer.setSize(w, h);
  camera3D.aspect = w / h;
  camera3D.updateProjectionMatrix();
});
