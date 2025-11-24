// 导入模态导航器
import modalNavigator from './modalNavigator.js';

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('moreFeaturesBtn');
  if (!button) return;

  const SNAP_MARGIN = 12;
  const MOVE_THRESHOLD = 5;
  const targetUrl = button.dataset.href || 'features.html';

  let pointerActive = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let moved = false;

  const ensureAbsolutePosition = () => {
    const rect = button.getBoundingClientRect();
    button.style.left = `${rect.left}px`;
    button.style.top = `${rect.top}px`;
    button.style.right = 'auto';
    button.style.bottom = 'auto';
  };

  const clampPosition = (left, top) => {
    const maxLeft = window.innerWidth - button.offsetWidth - SNAP_MARGIN;
    const maxTop = window.innerHeight - button.offsetHeight - SNAP_MARGIN;
    return {
      left: Math.min(Math.max(SNAP_MARGIN, left), maxLeft),
      top: Math.min(Math.max(SNAP_MARGIN, top), maxTop),
    };
  };

  const snapToEdge = () => {
    const rect = button.getBoundingClientRect();
    const distances = {
      left: rect.left,
      right: window.innerWidth - rect.right,
      top: rect.top,
      bottom: window.innerHeight - rect.bottom,
    };
    const closest = Object.entries(distances).sort((a, b) => a[1] - b[1])[0]?.[0];
    let finalLeft = rect.left;
    let finalTop = rect.top;

    switch (closest) {
      case 'left':
        finalLeft = SNAP_MARGIN;
        break;
      case 'right':
        finalLeft = window.innerWidth - button.offsetWidth - SNAP_MARGIN;
        break;
      case 'top':
        finalTop = SNAP_MARGIN;
        break;
      case 'bottom':
        finalTop = window.innerHeight - button.offsetHeight - SNAP_MARGIN;
        break;
    }

    button.style.transition = 'left 0.2s ease, top 0.2s ease';
    button.style.left = `${finalLeft}px`;
    button.style.top = `${finalTop}px`;
    window.setTimeout(() => {
      button.style.transition = 'transform 0.1s ease';
    }, 200);
  };

  button.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerActive = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    ensureAbsolutePosition();
    const rect = button.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    button.style.transition = 'transform 0.1s ease';
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener('pointermove', (event) => {
    if (!pointerActive) return;
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (!moved && Math.hypot(deltaX, deltaY) > MOVE_THRESHOLD) {
      moved = true;
    }
    if (!moved) return;
    const { left, top } = clampPosition(startLeft + deltaX, startTop + deltaY);
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
  });

  const handlePointerEnd = async (event) => {
    if (!pointerActive) return;
    pointerActive = false;
    button.releasePointerCapture(event.pointerId);
    if (moved) {
      snapToEdge();
    } else {
      // 跳转前断开蓝牙连接
      // if (window.bleSerial && typeof window.bleSerial.disconnect === 'function') {
      //   try {
      //     // 如果有 isConnected 方法则检查，否则直接尝试断开
      //     const shouldDisconnect = typeof window.bleSerial.isConnected === 'function' 
      //       ? window.bleSerial.isConnected() 
      //       : true;
            
      //     if (shouldDisconnect) {
      //       console.log('Disconnecting Bluetooth before navigation...');
      //       await window.bleSerial.disconnect();
      //     }
      //   } catch (e) {
      //     console.error('Error disconnecting Bluetooth:', e);
      //   }
      // }

      // 使用模态导航器而不是直接跳转
      // 这样可以保持主页面(index.html)继续运行
      if (typeof window.Capacitor !== 'undefined') {
        modalNavigator.open(targetUrl);
      } else {
        // Web 环境下仍使用普通导航
        window.location.href = targetUrl;
      }
    }
  };

  button.addEventListener('pointerup', handlePointerEnd);
  button.addEventListener('pointercancel', handlePointerEnd);

  window.addEventListener('resize', () => {
    const rect = button.getBoundingClientRect();
    const { left, top } = clampPosition(rect.left, rect.top);
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
  });
});