import { describe, it, expect } from '@jest/globals';

// 简单的数学工具函数测试，用于验证测试环境
const add = (a: number, b: number): number => a + b;
const subtract = (a: number, b: number): number => a - b;
const multiply = (a: number, b: number): number => a * b;
const divide = (a: number, b: number): number => a / b;

describe('Math Utils', () => {
  describe('add', () => {
    it('should return the sum of two positive numbers', () => {
      expect(add(1, 2)).toBe(3);
    });

    it('should return the sum of a positive and negative number', () => {
      expect(add(5, -3)).toBe(2);
    });

    it('should return zero when adding two zeros', () => {
      expect(add(0, 0)).toBe(0);
    });
  });

  describe('subtract', () => {
    it('should return the difference of two positive numbers', () => {
      expect(subtract(5, 2)).toBe(3);
    });

    it('should return a negative number when subtracting a larger number from a smaller one', () => {
      expect(subtract(2, 5)).toBe(-3);
    });
  });

  describe('multiply', () => {
    it('should return the product of two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it('should return zero when multiplying by zero', () => {
      expect(multiply(5, 0)).toBe(0);
    });

    it('should return a positive number when multiplying two negative numbers', () => {
      expect(multiply(-2, -3)).toBe(6);
    });
  });

  describe('divide', () => {
    it('should return the quotient of two positive numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should return a decimal when dividing numbers that are not multiples', () => {
      expect(divide(7, 2)).toBe(3.5);
    });

    it('should return Infinity when dividing by zero', () => {
      expect(divide(5, 0)).toBe(Infinity);
    });
  });
});