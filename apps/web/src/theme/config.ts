import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#2563EB',
    colorSuccess: '#22C55E',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#3B82F6',

    colorBgLayout: '#FAFAFA',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBorder: '#E5E7EB',
    colorBorderSecondary: '#F3F4F6',

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    fontSizeSM: 12,

    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 28,

    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.08)',

    lineHeight: 1.6,
    marginXS: 4,
    marginSM: 8,
    margin: 16,
    marginLG: 24,
    marginXL: 32,
  },
  components: {
    Card: {
      paddingLG: 20,
      borderRadiusLG: 12,
    },
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#6B7280',
      rowHoverBg: '#F9FAFB',
      headerSortActiveBg: '#F3F4F6',
      fontSize: 13,
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#4B5563',
      itemSelectedColor: '#2563EB',
      itemSelectedBg: '#EFF6FF',
      itemHoverColor: '#1F2937',
      itemHoverBg: '#F9FAFB',
      groupTitleColor: '#9CA3AF',
      groupTitleFontSize: 11,
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Input: {
      activeShadow: '0 0 0 2px rgba(37, 99, 235, 0.15)',
    },
    Select: {
      optionActiveBg: '#F3F4F6',
      optionSelectedBg: '#EFF6FF',
    },
    Drawer: {
      paddingLG: 24,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Badge: {
      dotSize: 8,
    },
    Tabs: {
      inkBarColor: '#2563EB',
      itemActiveColor: '#2563EB',
      itemSelectedColor: '#2563EB',
      itemHoverColor: '#4B5563',
    },
    Tooltip: {
      borderRadius: 6,
    },
  },
};
