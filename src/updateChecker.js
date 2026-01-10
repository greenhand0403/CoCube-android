// updateChecker.js
// 检查 CoCube 版本更新并弹窗提示

const VERSION_JSON_URL = 'https://wiki.cocube.fun/app/version.json';
const STORAGE_KEY = 'cocube-update-ignore';

function compareVersion(v1, v2) {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const n1 = a[i] || 0, n2 = b[i] || 0;
    if (n1 !== n2) return n1 - n2;
  }
  return 0;
}

function getIgnoredVersion() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) { return ''; }
}

function setIgnoredVersion(version) {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch (e) {}
}

function getLocale() {
  try {
    const prefs = JSON.parse(localStorage.getItem('user-prefs') || '{}');
    const locale = prefs.locale || 'en';
    // 将中文语言统一映射为 'cn'
    if (locale.startsWith('zh')) return 'cn';
    return locale;
  } catch (e) { return 'en'; }
}

function getI18nText(locale) {
  const texts = {
    cn: {
      forceTitle: '必须更新',
      updateTitle: '发现新版本',
      updateBtn: '立即更新',
      ignoreBtn: '不再提示'
    },
    en: {
      forceTitle: 'Update Required',
      updateTitle: 'New Version Available',
      updateBtn: 'Update Now',
      ignoreBtn: 'Don\'t Show Again'
    }
  };
  return texts[locale] || texts['en'];
}

function showUpdateDialog({ latestVersion, apkUrl, releaseNotes, forceUpdate }) {
  const locale = getLocale();
  const i18n = getI18nText(locale);
  const notes = releaseNotes[locale] || releaseNotes['en'] || releaseNotes['cn'] || [];

  // 创建遮罩和弹窗
  const overlay = document.createElement('div');
  overlay.style = `
    position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.35); z-index: 9999; display: flex; align-items: center; justify-content: center;`;
  const dialog = document.createElement('div');
  dialog.style = `
    background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0002;
    max-width: 90vw; min-width: 280px; padding: 24px 20px 16px 20px; font-family: arial; color: #222;
    text-align: center; position: relative;`
  ;
  // 标题
  const title = document.createElement('h2');
  title.textContent = forceUpdate ? i18n.forceTitle : i18n.updateTitle;
  title.style = 'margin: 0 0 12px 0; font-size: 1.3em; font-weight: bold;';
  dialog.appendChild(title);
  // 版本号
  const ver = document.createElement('div');
  ver.textContent = `v${latestVersion}`;
  ver.style = 'color: #4a9eff; font-size: 1.1em; margin-bottom: 8px;';
  dialog.appendChild(ver);
  // 更新内容
  if (notes && notes.length) {
    const notesList = document.createElement('ul');
    notesList.style = 'text-align:left; margin: 0 0 12px 0; padding-left: 1.2em; color: #444; font-size: 1em;';
    notes.forEach(note => {
      const li = document.createElement('li');
      li.textContent = note;
      notesList.appendChild(li);
    });
    dialog.appendChild(notesList);
  }
  // 按钮区
  const btns = document.createElement('div');
  btns.style = 'margin-top: 18px; display: flex; justify-content: center; gap: 16px;';
  // 立即更新
  const okBtn = document.createElement('button');
  okBtn.textContent = i18n.updateBtn;
  okBtn.style = 'background: #4a9eff; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-size: 1em; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);';
  okBtn.onmouseover = () => okBtn.style.background = '#3a8eef';
  okBtn.onmouseout = () => okBtn.style.background = '#4a9eff';
  okBtn.onclick = () => {
    document.body.removeChild(overlay);
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
      window.Capacitor.Plugins.Browser.open({ url: apkUrl });
    } else {
      window.open(apkUrl, '_blank');
    }
  };
  btns.appendChild(okBtn);
  // 稍后提醒/不再提示
  if (!forceUpdate) {
    const ignoreBtn = document.createElement('button');
    ignoreBtn.textContent = i18n.ignoreBtn;
    ignoreBtn.style = 'background: #eee; color: #666; border: none; border-radius: 6px; padding: 10px 24px; font-size: 1em; cursor: pointer;';
    ignoreBtn.onmouseover = () => ignoreBtn.style.background = '#ddd';
    ignoreBtn.onmouseout = () => ignoreBtn.style.background = '#eee';
    ignoreBtn.onclick = () => {
      setIgnoredVersion(latestVersion);
      document.body.removeChild(overlay);
    };
    btns.appendChild(ignoreBtn);
  }
  dialog.appendChild(btns);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

async function checkUpdate() {
  // 获取当前版本
  let currentVersion = '';
  try {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const info = await window.Capacitor.Plugins.App.getInfo();
      currentVersion = info.version;
    }
  } catch (e) {}
  if (!currentVersion) return;
  // 获取服务器版本
  let data;
  try {
    const res = await fetch(VERSION_JSON_URL + '?_=' + Date.now());
    data = await res.json();
  } catch (e) { return; }
  if (!data || !data.latestVersion || !data.apkUrl) return;
  // 检查是否忽略
  const ignored = getIgnoredVersion();
  if (ignored === data.latestVersion) return;
  // 版本比较
  if (compareVersion(currentVersion, data.latestVersion) < 0) {
    showUpdateDialog(data);
  }
}

export { checkUpdate };