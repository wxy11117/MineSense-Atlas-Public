/* Static release metadata only. No account, local device or experiment access. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const button = $('installer-download');
  const repo = 'https://github.com/wxy11117/MineSense-Atlas-V1.0';
  let checksum = '';
  button.addEventListener('click', event => {
    if (button.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  $('copy-checksum').addEventListener('click', async () => {
    if (!checksum) return;
    try {
      await navigator.clipboard.writeText(checksum);
      $('checksum-message').textContent = 'SHA-256 已复制。';
    } catch {
      $('checksum-message').textContent = '无法自动复制，请选中上方校验值手动复制。';
    }
  });
  document.querySelector('.local-guide-download').addEventListener('click', () => {
    $('local-dialog').close();
  });
  $('local-workspace-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const url = new URL($('local-workspace-url').value.trim());
      if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.username || url.password || !url.port || (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) throw new Error('invalid local address');
      $('local-url-message').textContent = '已打开本机地址。若无法连接，请先运行软件快捷方式。';
      window.open(url.origin + '/', '_blank', 'noopener,noreferrer');
    } catch {
      $('local-url-message').textContent = '请输入启动器提供的本机地址，如 http://127.0.0.1:59601/。';
      $('local-workspace-url').focus();
    }
  });
  async function loadRelease() {
    try {
      const response = await fetch('release.json', {cache:'no-cache'});
      if (!response.ok) throw new Error('metadata unavailable');
      const data = await response.json();
      if (data.schema_version !== 1 || !/^\d+\.\d+(?:\.\d+)?$/.test(data.version)) throw new Error('invalid metadata');
      $('release-version').textContent = `v${data.version}`;
      const asset = data.asset || {};
      const expectedName = `MineSense-Atlas-${data.version}-Setup-x64.exe`;
      const expectedRelease = `${repo}/releases/tag/v${data.version}`;
      const expectedDownload = `${repo}/releases/download/v${data.version}/${expectedName}`;
      const ready = data.status === 'published' && data.release_url === expectedRelease &&
        asset.filename === expectedName && asset.url === expectedDownload &&
        Number.isSafeInteger(asset.size_bytes) && asset.size_bytes > 0 && /^[a-f0-9]{64}$/i.test(asset.sha256 || '');
      if (!ready) {
        $('release-status').textContent = '安装包准备中';
        $('download-detail').textContent = '发布完成后提供安装包大小与 SHA-256 校验值。';
        return;
      }
      checksum = asset.sha256.toLowerCase();
      button.href = expectedDownload;
      button.removeAttribute('aria-disabled');
      button.removeAttribute('tabindex');
      $('download-label').textContent = '下载 Windows 安装包';
      $('release-notes').href = expectedRelease;
      $('release-status').textContent = '可下载安装';
      $('download-detail').textContent = `${expectedName} · ${(asset.size_bytes / 1048576).toLocaleString('zh-CN', {maximumFractionDigits:1, minimumFractionDigits:1})} MiB`;
      $('release-sha256').textContent = checksum;
      $('copy-checksum').disabled = false;
      if (data.repository_private === false) {
        $('download-access-text').textContent = '安装包由 GitHub Releases 分发，点击下载将前往 GitHub。';
      }
    } catch {
      $('release-status').textContent = '版本信息暂不可用';
      $('download-detail').textContent = '请刷新页面，或在 GitHub 发行页面查看可用安装包。';
    }
  }
  loadRelease();
})();
