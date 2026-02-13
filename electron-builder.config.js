/**
 * electron-builder 打包配置
 */
module.exports = {
  appId: 'com.agentboard.app',
  productName: 'AgentBoard',
  directories: {
    buildResources: 'resources',
    output: 'release'
  },
  files: [
    'out/**/*',
    'resources/**/*'
  ],
  extraResources: [
    {
      from: 'resources/agent-board-hook.sh',
      to: 'agent-board-hook.sh'
    },
    {
      from: 'resources/agent-board-report.sh',
      to: 'agent-board-report.sh'
    },
    {
      from: 'resources/agent-board-report.md',
      to: 'agent-board-report.md'
    },
    {
      from: 'resources/icons',
      to: 'icons'
    }
  ],
  mac: {
    category: 'public.app-category.developer-tools',
    icon: 'resources/icon.png',
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64']
      }
    ]
  },
  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' }
    ]
  }
}
