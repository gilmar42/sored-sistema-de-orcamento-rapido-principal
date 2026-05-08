import { parseDimensionInput } from '../utils/parsers';

describe('parseDimensionInput', () => {
  it('should return null for empty string', () => {
    expect(parseDimensionInput('')).toBeNull();
  });

  it('should return null for string with only spaces', () => {
    expect(parseDimensionInput('   ')).toBeNull();
  });

  it('should parse integer numbers correctly', () => {
    expect(parseDimensionInput('10')).toBe(10);
    expect(parseDimensionInput('0')).toBe(0);
    expect(parseDimensionInput('12345')).toBe(12345);
  });

  it('should parse decimal numbers correctly', () => {
    expect(parseDimensionInput('10.5')).toBe(10.5);
    expect(parseDimensionInput('0.5')).toBe(0.5);
    expect(parseDimensionInput('.75')).toBe(0.75);
  });

  it('should parse simple fractions correctly', () => {
    expect(parseDimensionInput('1/2')).toBe(0.5);
    expect(parseDimensionInput('3/4')).toBe(0.75);
    expect(parseDimensionInput('1/1')).toBe(1);
  });

  it('should parse mixed fractions correctly', () => {
    expect(parseDimensionInput('1 1/2')).toBe(1.5);
    expect(parseDimensionInput('2 3/4')).toBe(2.75);
    expect(parseDimensionInput('10 1/10')).toBe(10.1);
  });

  it('should handle spaces around numbers and fractions', () => {
    expect(parseDimensionInput('  10  ')).toBe(10);
    expect(parseDimensionInput('  1/2  ')).toBe(0.5);
    expect(parseDimensionInput('  1   1/2  ')).toBe(1.5);
  });

  it('should return null for invalid fractions (denominator is zero)', () => {
    expect(parseDimensionInput('1/0')).toBeNull();
    expect(parseDimensionInput('1 1/0')).toBeNull();
  });

  it('should return null for non-numeric or unparseable strings', () => {
    expect(parseDimensionInput('abc')).toBeNull();
    expect(parseDimensionInput('10a')).toBeNull();
    expect(parseDimensionInput('1/2/3')).toBeNull();
    expect(parseDimensionInput('1-2')).toBeNull();
  });

  it('should return null for fractions with non-numeric parts', () => {
    expect(parseDimensionInput('a/b')).toBeNull();
    expect(parseDimensionInput('1 a/2')).toBeNull();
  });
});