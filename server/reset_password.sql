-- 重置admin用户密码
ALTER USER admin WITH PASSWORD 'admin123456';

-- 验证连接
SELECT 'Password reset successful!' as message;
