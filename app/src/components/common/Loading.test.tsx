import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loading from './Loading';

describe('Loading Component', () => {
  it('should render with default props', () => {
    const { container } = render(<Loading />);
    
    // 验证加载容器和内容是否存在
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<Loading text="正在处理..." />);
    
    expect(screen.getByText('正在处理...')).toBeInTheDocument();
    expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
  });

  it('should render without text when text is empty string', () => {
    const { container } = render(<Loading text="" />);
    
    expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    // 验证没有loading-text元素
    expect(container.querySelector('.loading-text')).not.toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { container: smallContainer } = render(<Loading size="small" />);
    const { container: mediumContainer } = render(<Loading size="medium" />);
    const { container: largeContainer } = render(<Loading size="large" />);
    
    // 获取各个大小的spinner
    const smallSpinner = smallContainer.querySelector('.loading-spinner');
    const mediumSpinner = mediumContainer.querySelector('.loading-spinner');
    const largeSpinner = largeContainer.querySelector('.loading-spinner');
    
    // 验证spinner存在
    expect(smallSpinner).toBeInTheDocument();
    expect(mediumSpinner).toBeInTheDocument();
    expect(largeSpinner).toBeInTheDocument();
    
    // 验证大小样式
    expect(smallSpinner).toHaveStyle('width: 30px');
    expect(smallSpinner).toHaveStyle('height: 30px');
    
    expect(mediumSpinner).toHaveStyle('width: 50px');
    expect(mediumSpinner).toHaveStyle('height: 50px');
    
    expect(largeSpinner).toHaveStyle('width: 70px');
    expect(largeSpinner).toHaveStyle('height: 70px');
  });

  it('should render with custom color', () => {
    const customColor = '#ff5722';
    const { container } = render(<Loading color={customColor} />);
    
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle(`border-top-color: ${customColor}`);
  });

  it('should render in full screen mode', () => {
    const { container } = render(<Loading fullScreen={true} />);
    
    const loadingContainer = container.querySelector('.loading-container');
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer).toHaveClass('fullscreen');
  });

  it('should render in normal mode by default', () => {
    const { container } = render(<Loading />);
    
    const loadingContainer = container.querySelector('.loading-container');
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer).not.toHaveClass('fullscreen');
  });

  it('should have correct structure for accessibility', () => {
    const { container } = render(<Loading />);
    
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
    // 验证spinner是可访问的（没有role属性但结构清晰）
    expect(spinner).toBeVisible();
  });
});