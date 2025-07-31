// 3D游戏角色组件（基于Three.js）
(function() {
    // 仓库信息识别（同上）
    function detectRepoInfo() { /* 保持原有逻辑 */ }
    const repoInfo = detectRepoInfo();

    // 创建容器
    const container = document.createElement('div');
    container.id = '3d-character';
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 200px;
        height: 300px;
        cursor: move;
        z-index: 9999;
    `;
    document.body.appendChild(container);

    // 添加提示框
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #24292e;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
    `;
    tooltip.textContent = repoInfo ? `GitHub: ${repoInfo.username}/${repoInfo.repoName}` : 'GitHub 仓库';
    container.appendChild(tooltip);
    container.addEventListener('mouseover', () => tooltip.style.opacity = 1);
    container.addEventListener('mouseout', () => tooltip.style.opacity = 0);

    // 初始化Three.js场景
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 200/300, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true }); // 透明背景
    renderer.setSize(200, 300);
    container.appendChild(renderer.domElement);

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 加载3D模型（替换为你的模型URL）
    const loader = new THREE.GLTFLoader();
    // 示例模型（免费低多边形角色）
    loader.load('https://models.readyplayer.me/648c8a6f55552a0837d574e.glb', 
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.8, 0.8, 0.8);
            model.position.y = -1.5; // 调整位置
            scene.add(model);

            // 播放动画（如果模型有动画）
            if (gltf.animations && gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                
                // 动画循环
                function animate() {
                    requestAnimationFrame(animate);
                    mixer.update(0.01);
                    renderer.render(scene, camera);
                }
                animate();
            }
        },
        (xhr) => console.log(`加载中: ${(xhr.loaded / xhr.total * 100)}%`),
        (error) => console.error('模型加载错误:', error)
    );

    camera.position.z = 3;

    // 拖动功能（同上）
    let isDragging = false;
    let offsetX, offsetY;
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = container.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            container.style.left = `${e.clientX - offsetX + window.scrollX}px`;
            container.style.top = `${e.clientY - offsetY + window.scrollY}px`;
            container.style.bottom = 'auto';
            container.style.right = 'auto';
        }
    });
    document.addEventListener('mouseup', () => isDragging = false);

    // 点击跳转
    container.addEventListener('click', () => {
        if (repoInfo?.repoUrl) window.open(repoInfo.repoUrl, '_blank');
    });
})();