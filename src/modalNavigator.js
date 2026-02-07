// modalNavigator.js - 模态窗口导航系统
// 实现不关闭主页面的页面导航

class ModalNavigator {
  constructor() {
    this.modal = null;
    this.iframe = null;
    this.isOpen = false;
    this.history = [];
    // 记录当前硬件运行的程序类型: 'editor', 'soccer', 'racing'
    this.currentProgram = 'editor';
  }

  init() {
    // 创建模态容器
    this.modal = document.createElement('div');
    this.modal.className = 'modal-navigator';
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 10000;
      display: none;
      flex-direction: column;
    `;

    // // 创建顶部导航栏
    // const navbar = document.createElement('div');
    // navbar.className = 'modal-navbar';
    // navbar.style.cssText = `
    //   display: flex;
    //   align-items: center;
    //   height: 50px;
    //   padding: 0 10px;
    //   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    //   box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    // `;

    // // 返回按钮
    // const backBtn = document.createElement('button');
    // backBtn.innerHTML = `
    //   <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
    //     <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    //   </svg>
    // `;
    // backBtn.style.cssText = `
    //   width: 40px;
    //   height: 40px;
    //   border-radius: 50%;
    //   background: rgba(255, 255, 255, 0.2);
    //   border: none;
    //   display: flex;
    //   align-items: center;
    //   justify-content: center;
    //   cursor: pointer;
    //   transition: all 0.3s ease;
    // `;
    // backBtn.onclick = () => this.close();

    // // 标题
    // const title = document.createElement('div');
    // title.className = 'modal-title';
    // title.style.cssText = `
    //   flex: 1;
    //   text-align: center;
    //   color: white;
    //   font-size: 18px;
    //   font-weight: 600;
    //   margin-right: 40px;
    // `;

    // navbar.appendChild(backBtn);
    // navbar.appendChild(title);

    // 创建 iframe 容器
    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = `
      flex: 1;
      border: none;
      width: 100%;
      height: 100%;
    `;

    // 监听 iframe 加载
    this.iframe.onload = () => {
      try {
        // 尝试获取 iframe 标题
        const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
        title.textContent = iframeDoc.title || '功能页面';

        // 注入返回监听器到 iframe
        this.injectBackListener(this.iframe.contentWindow);
      } catch (e) {
        // 跨域时无法访问
        console.log('Cannot access iframe content (CORS)');
      }
    };

    // this.modal.appendChild(navbar);
    this.modal.appendChild(this.iframe);
    document.body.appendChild(this.modal);

    // 禁用 beforeunload 警告（在模态窗口中导航时）
    this.setupBeforeUnloadHandler();
  }

  setupBeforeUnloadHandler() {
    // 保存原始的 beforeunload 处理器
    const originalBeforeUnload = window.onbeforeunload;

    window.onbeforeunload = (e) => {
      // 如果模态窗口打开中，不显示警告
      if (this.isOpen) {
        return undefined;
      }
      // 否则使用原始处理器
      return originalBeforeUnload ? originalBeforeUnload(e) : undefined;
    };
  }

  injectBackListener(iframeWindow) {
    try {
      // 在 iframe 中注入返回功能
      const iframeDoc = iframeWindow.document;

      // 拦截 iframe 中的 window.location.href 设置
      const originalLocationHref = iframeWindow.location.href;

      // 监听 iframe 中的返回按钮点击
      iframeDoc.addEventListener('click', (e) => {
        const target = e.target.closest('button, a');
        if (!target) return;

        // 检测返回操作
        const isBackButton =
          target.classList.contains('back-btn') ||
          target.getAttribute('onclick')?.includes('index.html');

        if (isBackButton) {
          e.preventDefault();
          e.stopPropagation();
          this.close();
        }
      }, true);
    } catch (e) {
      console.log('Cannot inject back listener:', e);
    }
  }

  open(url) {
    if (!this.modal) this.init();

    // 记录当前 iframe 的 URL 到历史（用于分级返回）
    if (this.isOpen && this.iframe.src && this.iframe.src !== 'about:blank') {
      // 提取相对路径
      const currentUrl = this.iframe.src;
      if (!this.urlHistory) this.urlHistory = [];
      this.urlHistory.push(currentUrl);
    }

    this.history.push(window.location.href);
    this.iframe.src = url;
    this.modal.style.display = 'flex';
    this.isOpen = true;

    // 隐藏主页面的滚动条
    document.body.style.overflow = 'hidden';
  }

  // 返回上一级页面（分级返回）
  goBack() {
    if (!this.modal) return false;

    // 如果有历史记录，返回上一级
    if (this.urlHistory && this.urlHistory.length > 0) {
      const previousUrl = this.urlHistory.pop();
      this.iframe.src = previousUrl;
      return true;
    }

    // 没有历史记录，关闭模态窗口
    this.close();
    return false;
  }

  close() {
    if (!this.modal) return;

    this.modal.style.display = 'none';
    this.isOpen = false;
    this.iframe.src = 'about:blank';

    // 恢复主页面的滚动
    document.body.style.overflow = '';

    // 清空历史
    this.history = [];

    // 只有当当前程序不是编辑器程序时，才强制刷新回编辑器程序
    if (this.currentProgram !== 'editor') {
      if (typeof window.forceFullDownload === 'function') {
        console.log('Current program is ' + this.currentProgram + ', forcing full download to restore editor...');
        window.forceFullDownload();
        // 重置状态为编辑器
        this.currentProgram = 'editor';
      }
    }
  }

  setProgram(type) {
    this.currentProgram = type;
    console.log('Program type set to:', type);
  }

  getProgram() {
    return this.currentProgram;
  }

  isModalOpen() {
    return this.isOpen;
  }
}

// 创建全局单例
window.modalNavigator = new ModalNavigator();

export default window.modalNavigator;
