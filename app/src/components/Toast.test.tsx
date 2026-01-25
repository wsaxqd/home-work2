import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider, useToast } from './Toast';

// Mock setTimeout
vi.useFakeTimers();

// 测试组件
const TestComponent = () => {
  const toast = useToast();
  
  const handleSuccess = () => toast.success('Success message');
  const handleError = () => toast.error('Error message');
  const handleInfo = () => toast.info('Info message');
  const handleWarning = () => toast.warning('Warning message');
  
  return (
    <div>
      <button onClick={handleSuccess} data-testid="success-btn">Success</button>
      <button onClick={handleError} data-testid="error-btn">Error</button>
      <button onClick={handleInfo} data-testid="info-btn">Info</button>
      <button onClick={handleWarning} data-testid="warning-btn">Warning</button>
    </div>
  );
};

describe('Toast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ToastProvider without errors', () => {
    const { container } = render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('should throw error when useToast is used outside ToastProvider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within ToastProvider');
  });

  it('should show success toast when success method is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // 点击按钮触发toast
    await act(async () => {
      screen.getByTestId('success-btn').click();
    });

    // 验证toast是否显示
    expect(screen.getByText('Success message')).toBeInTheDocument();
    // 找到父元素（toast容器）来验证类名
    const toastMessage = screen.getByText('Success message');
    const toastContainer = toastMessage.closest('.toast');
    expect(toastContainer).toHaveClass('toast-success');
  });

  it('should show error toast when error method is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByTestId('error-btn').click();
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();
    // 找到父元素（toast容器）来验证类名
    const toastMessage = screen.getByText('Error message');
    const toastContainer = toastMessage.closest('.toast');
    expect(toastContainer).toHaveClass('toast-error');
  });

  it('should show info toast when info method is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByTestId('info-btn').click();
    });

    expect(screen.getByText('Info message')).toBeInTheDocument();
    // 找到父元素（toast容器）来验证类名
    const toastMessage = screen.getByText('Info message');
    const toastContainer = toastMessage.closest('.toast');
    expect(toastContainer).toHaveClass('toast-info');
  });

  it('should show warning toast when warning method is called', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByTestId('warning-btn').click();
    });

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    // 找到父元素（toast容器）来验证类名
    const toastMessage = screen.getByText('Warning message');
    const toastContainer = toastMessage.closest('.toast');
    expect(toastContainer).toHaveClass('toast-warning');
  });

  it('should automatically remove toast after 3 seconds', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByTestId('success-btn').click();
    });

    // 验证toast是否显示
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // 快进3秒
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // 验证toast是否消失
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('should show multiple toasts simultaneously', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // 点击多个按钮触发多个toast
    await act(async () => {
      screen.getByTestId('success-btn').click();
      screen.getByTestId('error-btn').click();
      screen.getByTestId('info-btn').click();
    });

    // 验证所有toast是否显示
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });
});