import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface InfoTooltipProps {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, placement = 'top' }) => (
  <Tooltip title={text} placement={placement}>
    <InfoCircleOutlined
      style={{ color: 'rgba(0,0,0,0.35)', marginLeft: 4, cursor: 'help', fontSize: 13 }}
    />
  </Tooltip>
);
